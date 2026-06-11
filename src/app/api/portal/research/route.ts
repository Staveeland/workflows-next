import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import { NextResponse } from "next/server";
import { mockResearch, portalMockEnabled } from "@/lib/portalMock";
import type {
  PortalResearchBody,
  PortalResearchResponse,
  ResearchFunn,
} from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/portal/research — UNAUTHENTICATED company lookup.
 *
 * Public data only, near-zero cost: Brønnøysundregistrene (free public API,
 * no key) + a capped fetch of the company's own website for <title> and
 * meta description. The client calls this the moment the visitor names
 * their company, so the workshop never has to ask the obvious questions.
 *
 * Contract: lookup failures NEVER error to the client — funn: null and a
 * server-side log. Only bad input (400) and rate limiting (429) are errors.
 */

export const runtime = "nodejs";
// BRREG (5s) + website (5s) + headroom.
export const maxDuration = 15;

// Cheap public-data endpoint, but still not a free proxy: 10 / 10 min / IP.
const RL_IP_MAX = 10;
const RL_WINDOW_MS = 10 * 60_000;

const NAVN_MIN = 2;
const NAVN_MAX = 80;
const NETTSIDE_MAX = 200;

const BRREG_TIMEOUT_MS = 5_000;
const WEB_TIMEOUT_MS = 5_000;
const WEB_MAX_REDIRECTS = 4;
const WEB_MAX_BYTES = 200 * 1024;

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 300;

function parseBody(raw: unknown): { navn: string; nettside?: string } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Partial<PortalResearchBody>;
  if (typeof body.navn !== "string") return null;
  const navn = body.navn.trim();
  if (navn.length < NAVN_MIN || navn.length > NAVN_MAX) return null;
  let nettside: string | undefined;
  if (body.nettside !== undefined) {
    if (typeof body.nettside !== "string") return null;
    const trimmed = body.nettside.trim();
    if (trimmed.length > NETTSIDE_MAX) return null;
    if (trimmed) nettside = trimmed;
  }
  return { navn, nettside };
}

/* ------------------------------------------------------------------ */
/* BRREG — Brønnøysundregistrene                                       */
/* ------------------------------------------------------------------ */

interface BrregEnhet {
  navn?: string;
  organisasjonsnummer?: string;
  organisasjonsform?: { kode?: string };
  naeringskode1?: { beskrivelse?: string };
  antallAnsatte?: number;
  forretningsadresse?: { poststed?: string };
  hjemmeside?: string;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Name without a trailing org-form suffix — «håland rør as» → «håland rør». */
function bareName(s: string): string {
  return normalizeName(s)
    .replace(/\b(?:as|asa|ans|ba|da|enk|nuf|sa)\.?$/i, "")
    .trim();
}

/**
 * Pick the best of (up to) three BRREG hits, in result order (BRREG ranks
 * by relevance): exact name first, then org-form-stripped equality, then
 * containment. No reasonable match → null.
 */
function pickBestMatch(query: string, enheter: BrregEnhet[]): BrregEnhet | null {
  const q = normalizeName(query);
  const qBare = bareName(query);
  const named = enheter.filter((e) => typeof e.navn === "string" && e.navn);
  const exact = named.find((e) => normalizeName(e.navn as string) === q);
  if (exact) return exact;
  const bare = named.find((e) => bareName(e.navn as string) === qBare);
  if (bare) return bare;
  if (qBare.length >= 3) {
    const partial = named.find((e) => {
      const candidate = bareName(e.navn as string);
      return candidate.includes(qBare) || qBare.includes(candidate);
    });
    if (partial) return partial;
  }
  return null;
}

async function brregLookup(navn: string): Promise<BrregEnhet | null> {
  const url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(navn)}&size=3`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(BRREG_TIMEOUT_MS),
  });
  if (!res.ok) {
    console.error(`[portal/research] BRREG responded ${res.status}`);
    return null;
  }
  const json = (await res.json()) as {
    _embedded?: { enheter?: BrregEnhet[] };
  };
  const enheter = json._embedded?.enheter ?? [];
  if (!Array.isArray(enheter) || enheter.length === 0) return null;
  return pickBestMatch(navn, enheter);
}

/* ------------------------------------------------------------------ */
/* Website — title + description, capped and tag-stripped               */
/* ------------------------------------------------------------------ */

/**
 * Only plain public http(s) URLs on default ports. The hostname guard is a
 * cheap SSRF hygiene layer (loopback/link-local/RFC1918/IP literals) — the
 * route runs on serverless egress, but we still don't fetch what a company
 * website could never legitimately be.
 */
function toPublicHttpUrl(raw: string): URL | null {
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  if (url.username || url.password) return null;
  // Normalize away a trailing dot so "127.0.0.1." can't dodge the regexes.
  url.hostname = url.hostname.replace(/\.+$/, "");
  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) return null; // bare intranet names
  if (host.includes(":") || host.startsWith("[")) return null; // IPv6 literals
  if (/\.(?:local|localhost|internal|home\.arpa)$/.test(host)) return null;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return null;
    }
  }
  return url;
}

/** Strip tags + collapse whitespace + decode the everyday entities. */
function cleanText(raw: string, max: number): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

function extractDescription(html: string): string {
  const metas = html.match(/<meta\s[^>]*>/gi) ?? [];
  let ogFallback = "";
  for (const tag of metas) {
    const content = tag.match(/content\s*=\s*("([^"]*)"|'([^']*)')/i);
    const value = content?.[2] ?? content?.[3] ?? "";
    if (!value) continue;
    if (/(?:name)\s*=\s*["']description["']/i.test(tag)) {
      return cleanText(value, DESCRIPTION_MAX);
    }
    if (!ogFallback && /(?:property|name)\s*=\s*["']og:description["']/i.test(tag)) {
      ogFallback = cleanText(value, DESCRIPTION_MAX);
    }
  }
  return ogFallback;
}

/**
 * SSRF: the hostname guard above only filters LITERALS — a public domain can
 * still RESOLVE to a private/metadata address (DNS-based bypass). So before
 * connecting we resolve the host ourselves, reject if ANY returned address is
 * private/reserved, and PIN the vetted address into the actual socket via the
 * `lookup` option (node:https keeps TLS/SNI on the hostname), so a rebinding
 * race can't swap the address between validation and connection.
 */
function isPrivateV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) || // 192.0.0.0/24 + 192.0.2.0/24 (doc)
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast + reserved + broadcast
  );
}

function isPrivateAddr(address: string, family: number): boolean {
  if (family === 4) return isPrivateV4(address);
  const ip = address.toLowerCase().replace(/%.*$/, "");
  if (ip === "::" || ip === "::1") return true;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  if (ip.startsWith("64:ff9b:")) return true; // NAT64 — don't bother decoding
  const head = parseInt(ip.split(":")[0] || "0", 16);
  if (head >= 0xfc00 && head <= 0xfdff) return true; // ULA fc00::/7
  if (head >= 0xfe80 && head <= 0xfebf) return true; // link-local
  if (head >= 0xff00) return true; // multicast
  if (ip.startsWith("2001:db8:")) return true; // documentation
  return false;
}

async function resolvePublicAddrs(
  host: string
): Promise<Array<{ address: string; family: number }> | null> {
  try {
    const addrs = await Promise.race([
      dns.lookup(host, { all: true, verbatim: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("dns timeout")), 3000)
      ),
    ]);
    if (!addrs.length) return null;
    // One poisoned record disqualifies the whole host.
    if (addrs.some((a) => isPrivateAddr(a.address, a.family))) return null;
    return addrs;
  } catch {
    return null;
  }
}

type PinnedResponse = {
  status: number;
  location: string | null;
  contentType: string;
  body: string;
};

/** GET over node:http(s) with the vetted address pinned into the socket. */
function fetchHtmlPinned(
  url: URL,
  addrs: Array<{ address: string; family: number }>,
  timeoutMs: number
): Promise<PinnedResponse> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const pinned = addrs[0];
    const req = mod.request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "WorkflowsResearch/1.0 (+https://workflows.no)",
        },
        // Pin DNS: every connection in this request uses the vetted address.
        lookup: (_host, options, cb) => {
          if (options.all) {
            (cb as unknown as (e: null, a: typeof addrs) => void)(null, addrs);
          } else {
            cb(null, pinned.address, pinned.family);
          }
        },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location ?? null;
        const contentType = (res.headers["content-type"] ?? "").toLowerCase();
        if (status >= 300 || !contentType.includes("text/html")) {
          res.resume();
          resolve({ status, location, contentType, body: "" });
          return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          total += chunk.byteLength;
          if (total >= WEB_MAX_BYTES) res.destroy(); // cap: take what we have
        });
        res.on("close", () => {
          resolve({
            status,
            location,
            contentType,
            body: Buffer.concat(chunks)
              .subarray(0, WEB_MAX_BYTES)
              .toString("utf-8"),
          });
        });
        res.on("error", () => {
          resolve({ status, location, contentType, body: "" });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/**
 * Fetch the company website (text/html only, ≤200KB, ≤5s shared across
 * redirect hops — each hop re-validated: URL guard + DNS resolution check,
 * with the vetted address pinned into the connection).
 */
async function fetchSiteMeta(
  rawUrl: string
): Promise<{ nettside?: string; sideTittel?: string; sideBeskrivelse?: string }> {
  let url = toPublicHttpUrl(rawUrl);
  if (!url) return {};
  const deadline = Date.now() + WEB_TIMEOUT_MS;

  for (let hop = 0; hop <= WEB_MAX_REDIRECTS; hop++) {
    const budget = deadline - Date.now();
    if (budget <= 0) return {};
    const addrs = await resolvePublicAddrs(url.hostname);
    if (!addrs) return {};

    let res: PinnedResponse;
    try {
      res = await fetchHtmlPinned(url, addrs, budget);
    } catch {
      return {};
    }

    if (res.status >= 300 && res.status < 400) {
      if (!res.location) return {};
      let next: URL;
      try {
        next = new URL(res.location, url);
      } catch {
        return {};
      }
      url = toPublicHttpUrl(next.toString());
      if (!url) return {};
      continue;
    }

    if (res.status < 200 || res.status >= 300 || !res.body) return {};

    const html = res.body;
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const sideTittel = titleMatch ? cleanText(titleMatch[1], TITLE_MAX) : "";
    const sideBeskrivelse = extractDescription(html);
    return {
      nettside: url.toString(),
      ...(sideTittel ? { sideTittel } : {}),
      ...(sideBeskrivelse ? { sideBeskrivelse } : {}),
    };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* The route                                                           */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json({ error: "Ugyldig bedriftsnavn" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalResearchResponse>(await mockResearch());
  }

  const ipRl = rateLimit({
    key: "portal:research:ip",
    identifier: getClientIp(req),
    max: RL_IP_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!ipRl.ok) return tooManyRequests(ipRl, RL_IP_MAX);

  let funn: ResearchFunn | null = null;
  try {
    const enhet = await brregLookup(body.navn);
    if (enhet && typeof enhet.navn === "string" && enhet.navn) {
      funn = { navn: enhet.navn.slice(0, 120) };
      if (typeof enhet.organisasjonsnummer === "string" && /^\d{9}$/.test(enhet.organisasjonsnummer)) {
        funn.orgnr = enhet.organisasjonsnummer;
      }
      if (typeof enhet.organisasjonsform?.kode === "string" && enhet.organisasjonsform.kode) {
        funn.orgform = enhet.organisasjonsform.kode.slice(0, 20);
      }
      if (typeof enhet.naeringskode1?.beskrivelse === "string" && enhet.naeringskode1.beskrivelse) {
        funn.bransje = enhet.naeringskode1.beskrivelse.slice(0, 120);
      }
      if (
        typeof enhet.antallAnsatte === "number" &&
        Number.isFinite(enhet.antallAnsatte) &&
        enhet.antallAnsatte > 0
      ) {
        funn.ansatte = Math.floor(enhet.antallAnsatte);
      }
      if (typeof enhet.forretningsadresse?.poststed === "string" && enhet.forretningsadresse.poststed) {
        funn.sted = enhet.forretningsadresse.poststed.slice(0, 80);
      }

      // Website: the visitor's own URL wins; BRREG's hjemmeside is plan B.
      const site =
        body.nettside ??
        (typeof enhet.hjemmeside === "string" && enhet.hjemmeside.trim()
          ? enhet.hjemmeside.trim().slice(0, NETTSIDE_MAX)
          : undefined);
      if (site) {
        try {
          Object.assign(funn, await fetchSiteMeta(site));
        } catch (err) {
          // Slow or broken website — the registry facts still stand.
          console.error("[portal/research] website fetch failed", err);
        }
      }
    }
  } catch (err) {
    // Lookup failure is never the visitor's problem — log it, return null.
    console.error("[portal/research] lookup failed", err);
    funn = null;
  }

  return NextResponse.json<PortalResearchResponse>({ funn });
}
