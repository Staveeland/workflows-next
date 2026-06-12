import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import {
  FIKEN_INNTEKTSKONTO,
  mvaSatsTilVatType,
  type FakturaStatus,
  type FikenCompany,
  type FikenContact,
  type FikenDraftRequest,
  type FikenDraftResult,
  type FikenInvoice,
  type FikenSendRequest,
  type FikenTokenResponse,
  type FakturaLinjeInput,
} from "@/lib/fikenTypes";

/**
 * Fiken-klienten (https://api.fiken.no/api/v2) — KUN server-side.
 *
 * ══ ABSOLUTT SIKKERHETSREGEL (eierens egen Fiken-konto) ══
 * Integrasjonen endrer eller sletter ALDRI eksisterende data i Fiken.
 * Strukturelt håndhevet i fikenFetch():
 *   - kun GET og POST slipper gjennom — PUT/PATCH/DELETE kaster FØR nettverk
 *   - POST kun mot en eksplisitt allowlist: ny kontakt, nytt fakturautkast,
 *     utkast→faktura (createInvoice) og send — de to siste kalles KUN fra
 *     ruter bak eksplisitte admin-knapper.
 * Fakturanummer-counteren POSTes aldri (det er en endring i Petters Fiken)
 * — mangler den, sier vi tydelig fra om å opprette serien i Fiken-UI.
 *
 * ══ RATE LIMIT (brudd kan gi ban!) ══
 * Maks ÉN samtidig request og maks 4 req/s. Alle API-kall går gjennom en
 * modul-global serialiserende kø (promise-chain) med minsteavstand mellom
 * kall + backoff på 429. Synk kjører sekvensielt av samme grunn.
 *
 * ══ AUTH — to veier, env-styrt ══
 *   1) FIKEN_PERSONAL_TOKEN (personlig API-nøkkel, utløper aldri) — PRIMÆR.
 *   2) OAuth2-fallback når (1) mangler: tokens bor i public.fiken_tokens
 *      (deny-all RLS — KUN service role; all lesing/skriving er isolert i
 *      token-funksjonene her). Refresh-svar kan inneholde ROTERT
 *      refresh_token — vi lagrer alltid det returnerte, med optimistisk
 *      samtidighetsvern (UPDATE ... WHERE refresh_token = <den vi brukte>;
 *      0 rader = en annen instans rakk det først → les på nytt).
 *
 * Beløp er i ØRE overalt (feltnavn xxxOre). 201-svar har TOM body +
 * Location-header — id parses derfra (med uuid-søk som fallback).
 */

const API_BASE = "https://api.fiken.no/api/v2";
const OAUTH_AUTHORIZE_URL = "https://fiken.no/oauth/authorize";
const OAUTH_TOKEN_URL = "https://fiken.no/oauth/token";

/** Registrert hos Fiken (www 308-er til apex med path+query bevart). */
const DEFAULT_REDIRECT_URI = "https://www.workflows.no/api/fiken/callback";

/** ≥300 ms mellom kallstart → ~3,3 req/s, godt under Fikens 4 req/s. */
const MIN_AVSTAND_MS = 300;
/** Backoff-forsøk på 429 (innenfor køplassen, så serialiseringen holder). */
const MAKS_429_FORSOK = 3;
/** Refresh når access_token har < 60 s igjen. */
const TOKEN_MARGIN_MS = 60_000;

export class FikenConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FikenConfigError";
  }
}

export class FikenApiError extends Error {
  readonly status: number;
  readonly body: string;
  readonly requestId: string;
  constructor(opts: {
    status: number;
    body: string;
    requestId: string;
    metode: string;
    sti: string;
  }) {
    // Rå body i meldingen — 400-validering fra Fiken skal kunne leses i
    // loggen seks måneder etter (kortet til 600 tegn).
    super(
      `Fiken ${opts.metode} ${opts.sti} → ${opts.status} ` +
        `(X-Request-ID ${opts.requestId}): ${opts.body.slice(0, 600)}`
    );
    this.name = "FikenApiError";
    this.status = opts.status;
    this.body = opts.body;
    this.requestId = opts.requestId;
  }
}

function sov(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ════════════════════════════════════════════
   Den serialiserende køen — én request om
   gangen, minsteavstand, modul-global.
   ════════════════════════════════════════════ */

let koHale: Promise<void> = Promise.resolve();
let sisteKallStart = 0;

function iKo<T>(jobb: () => Promise<T>): Promise<T> {
  const resultat = koHale.then(async () => {
    const vent = sisteKallStart + MIN_AVSTAND_MS - Date.now();
    if (vent > 0) await sov(vent);
    sisteKallStart = Date.now();
    return jobb();
  });
  // Kjeden må overleve feil — neste jobb venter bare på at forrige er ferdig.
  koHale = resultat.then(
    () => undefined,
    () => undefined
  );
  return resultat;
}

/* ════════════════════════════════════════════
   Metodevernet — GET fritt, POST kun mot
   allowlista. Alt annet kaster FØR nettverk.
   ════════════════════════════════════════════ */

const POST_ALLOWLIST: readonly RegExp[] = [
  // Ny kontakt — KUN etter at søk (e-post, så orgnr) ikke fant match.
  /^\/companies\/[^/]+\/contacts$/,
  // Nytt fakturautkast.
  /^\/companies\/[^/]+\/invoices\/drafts$/,
  // Utkast → ekte faktura — KUN bak eksplisitt admin-knapp.
  /^\/companies\/[^/]+\/invoices\/drafts\/\d+\/createInvoice$/,
  // Send faktura — KUN bak eksplisitt admin-knapp med bekreftelse.
  /^\/companies\/[^/]+\/invoices\/send$/,
];

// DELETE er tillatt KUN mot et fakturaUTKAST (drafts/{id}) — aldri mot en
// ekte/sendt faktura (de finnes ikke på denne stien og kan uansett ikke
// slettes i Fiken). Utkast er ikke et regnskapsbilag, så dette bryter ikke
// «aldri slett ekte data»-regelen.
const DELETE_ALLOWLIST: readonly RegExp[] = [
  /^\/companies\/[^/]+\/invoices\/drafts\/\d+$/,
];

function kontrollerMetode(metode: string, sti: string): void {
  if (metode === "GET") return;
  if (metode === "POST" && POST_ALLOWLIST.some((re) => re.test(sti))) return;
  if (metode === "DELETE" && DELETE_ALLOWLIST.some((re) => re.test(sti))) return;
  // Strukturell håndheving av eierens regel — når hit er det en kodefeil.
  throw new Error(
    `[fiken] BLOKKERT: ${metode} ${sti} er ikke på allowlista. ` +
      "Integrasjonen skal aldri endre/slette ekte Fiken-data (kun utkast)."
  );
}

/* ════════════════════════════════════════════
   Auth — personal token primært, OAuth-tokens
   fra fiken_tokens (service role) som fallback.
   ════════════════════════════════════════════ */

type FikenAuthVia = "token" | "oauth";

type TokenRad = {
  access_token: string;
  refresh_token: string;
  expires_at: string | null;
  company_slug: string | null;
};

/** Varm-lambda-cache — kalde starter leser bare DB på nytt. */
let tokenCache: { accessToken: string; utloperMs: number } | null = null;
/** Dedupliserer refresh innen samme instans. */
let refreshPagar: Promise<string> | null = null;

function oauthKlient(): { id: string; secret: string } {
  const id = process.env.FIKEN_CLIENT_ID;
  const secret = process.env.FIKEN_CLIENT_SECRET;
  if (!id || !secret) {
    throw new FikenConfigError(
      "Fiken-OAuth mangler FIKEN_CLIENT_ID/FIKEN_CLIENT_SECRET i env."
    );
  }
  return { id, secret };
}

export function fikenRedirectUri(): string {
  return process.env.FIKEN_REDIRECT_URI || DEFAULT_REDIRECT_URI;
}

/** Hvilken auth-vei er KONFIGURERT (uten nettverkskall)? */
export async function fikenAuthVia(): Promise<FikenAuthVia | null> {
  if (process.env.FIKEN_PERSONAL_TOKEN) return "token";
  const rad = await lesTokenRad();
  return rad ? "oauth" : null;
}

/** fiken_tokens id=1 — KUN her (og i lagreTokens) rører vi service role. */
async function lesTokenRad(): Promise<TokenRad | null> {
  const { data, error } = await supabaseAdmin()
    .from("fiken_tokens")
    .select("access_token, refresh_token, expires_at, company_slug")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("[fiken] fiken_tokens select feilet", error);
    throw new Error("Kunne ikke lese Fiken-tokens fra databasen.");
  }
  return (data as TokenRad | null) ?? null;
}

/** Lagrer (upsert) tokens etter code-exchange — callbacken eier dette. */
export async function lagreNyeTokens(tokens: FikenTokenResponse): Promise<void> {
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Fiken-token-svaret manglet access_token/refresh_token.");
  }
  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 86_400) * 1000
  ).toISOString();
  const { error } = await supabaseAdmin().from("fiken_tokens").upsert({
    id: 1,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[fiken] fiken_tokens upsert feilet", error);
    throw new Error("Kunne ikke lagre Fiken-tokens.");
  }
  tokenCache = {
    accessToken: tokens.access_token,
    utloperMs: Date.now() + (tokens.expires_in ?? 86_400) * 1000,
  };
}

/**
 * Refresh med rotasjonslagring + optimistisk samtidighetsvern:
 * UPDATE ... WHERE refresh_token = <den vi brukte>. 0 rader betyr at en
 * annen instans rakk å rotere først — da leser vi raden på nytt og bruker
 * dens ferske access_token i stedet for å feile.
 */
async function refreshOAuthToken(brukt: TokenRad): Promise<string> {
  const { id, secret } = oauthKlient();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: brukt.refresh_token,
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // invalid_grant kan bety at en ANNEN instans roterte tokenet i mellom-
    // tiden — sjekk om raden har et nytt, friskt token før vi gir opp.
    const fersk = await lesTokenRad();
    if (
      fersk &&
      fersk.refresh_token !== brukt.refresh_token &&
      fersk.expires_at &&
      Date.parse(fersk.expires_at) > Date.now() + TOKEN_MARGIN_MS
    ) {
      console.log("[fiken] refresh tapte kappløpet — bruker rotert token");
      tokenCache = {
        accessToken: fersk.access_token,
        utloperMs: Date.parse(fersk.expires_at),
      };
      return fersk.access_token;
    }
    console.error(
      `[fiken] token-refresh feilet → ${res.status}: ${body.slice(0, 300)}`
    );
    throw new Error(
      "Fiken-OAuth-refresh feilet. Koble til Fiken på nytt fra /start/admin."
    );
  }

  const tokens = (await res.json()) as FikenTokenResponse;
  if (!tokens.access_token) {
    throw new Error("Fiken-refresh-svaret manglet access_token.");
  }
  // Rotert refresh_token? Lagre ALLTID det returnerte (fallback: det gamle).
  const nyttRefresh = tokens.refresh_token || brukt.refresh_token;
  const utloperMs = Date.now() + (tokens.expires_in ?? 86_400) * 1000;

  const { data: oppdatert, error } = await supabaseAdmin()
    .from("fiken_tokens")
    .update({
      access_token: tokens.access_token,
      refresh_token: nyttRefresh,
      expires_at: new Date(utloperMs).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .eq("refresh_token", brukt.refresh_token)
    .select("id");
  if (error) {
    console.error("[fiken] fiken_tokens update feilet", error);
    // Tokenet ER gyldig — bruk det denne gangen selv om lagringen haltet.
  } else if (!oppdatert || oppdatert.length === 0) {
    console.log("[fiken] samtidig refresh oppdaget — raden var alt rotert");
  }

  tokenCache = { accessToken: tokens.access_token, utloperMs };
  return tokens.access_token;
}

/**
 * Access-token for API-kall. Kjører UTENFOR køen (ellers ville et kall i
 * køen som trenger refresh vente på seg selv).
 */
async function hentAccessToken(): Promise<{ token: string; via: FikenAuthVia }> {
  const personal = process.env.FIKEN_PERSONAL_TOKEN;
  if (personal) return { token: personal, via: "token" };

  if (tokenCache && tokenCache.utloperMs > Date.now() + TOKEN_MARGIN_MS) {
    return { token: tokenCache.accessToken, via: "oauth" };
  }

  const rad = await lesTokenRad();
  if (!rad) {
    throw new FikenConfigError(
      "Fiken er ikke koblet til: sett FIKEN_PERSONAL_TOKEN i env, eller " +
        "fullfør OAuth-tilkoblingen fra /start/admin."
    );
  }
  const utloperMs = rad.expires_at ? Date.parse(rad.expires_at) : 0;
  if (Number.isFinite(utloperMs) && utloperMs > Date.now() + TOKEN_MARGIN_MS) {
    tokenCache = { accessToken: rad.access_token, utloperMs };
    return { token: rad.access_token, via: "oauth" };
  }

  if (!refreshPagar) {
    refreshPagar = refreshOAuthToken(rad).finally(() => {
      refreshPagar = null;
    });
  }
  return { token: await refreshPagar, via: "oauth" };
}

/* ════════════════════════════════════════════
   OAuth-flyten — authorize-URL + signert
   state (HMAC m/ FIKEN_CLIENT_SECRET).
   ════════════════════════════════════════════ */

/** Cookienavnet status-ruta setter og callbacken leser. */
export const FIKEN_STATE_COOKIE = "fiken_oauth_state";
/** State-cookien lever i 10 minutter — nok til en innloggingsrunde. */
export const FIKEN_STATE_MAX_AGE_S = 600;

function signerState(state: string): string {
  const { secret } = oauthKlient();
  return createHmac("sha256", secret).update(state).digest("hex");
}

function likeSikkert(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Ny OAuth-runde: state-parameteren til Fiken + cookieverdien som binder
 * runden til nettleseren («state.hmac» — verifiseres i callbacken).
 */
export function lagOAuthState(): { state: string; cookieVerdi: string } {
  const state = randomUUID();
  return { state, cookieVerdi: `${state}.${signerState(state)}` };
}

/** Callbackens vern: cookie-signaturen OG state-parameteren må stemme. */
export function verifiserOAuthState(
  cookieVerdi: string | undefined | null,
  stateParam: string | null
): boolean {
  if (!cookieVerdi || !stateParam) return false;
  const skille = cookieVerdi.lastIndexOf(".");
  if (skille <= 0 || skille === cookieVerdi.length - 1) return false;
  const state = cookieVerdi.slice(0, skille);
  const signatur = cookieVerdi.slice(skille + 1);
  let forventet: string;
  try {
    forventet = signerState(state);
  } catch {
    return false; // FIKEN_CLIENT_SECRET borte midt i runden — avvis.
  }
  if (!likeSikkert(signatur, forventet)) return false;
  return likeSikkert(state, stateParam);
}

/** Fikens authorize-URL (ingen scopes finnes; state er PÅKREVD). */
export function byggAuthorizeUrl(state: string): string {
  const { id } = oauthKlient();
  const url = new URL(OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", fikenRedirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

/** code → tokens (HTTP Basic, x-www-form-urlencoded, state følger med). */
export async function byttKodeMotTokens(
  code: string,
  state: string
): Promise<FikenTokenResponse> {
  const { id, secret } = oauthKlient();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: fikenRedirectUri(),
      state,
    }).toString(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[fiken] code-exchange feilet → ${res.status}: ${body.slice(0, 300)}`
    );
    throw new Error("Fiken godtok ikke autorisasjonskoden.");
  }
  return (await res.json()) as FikenTokenResponse;
}

/**
 * Best-effort etter OAuth-tilkobling: slå opp selskapet og noter sluggen
 * på token-raden (informativt — env FIKEN_COMPANY_SLUG vinner alltid).
 * Feiler stille; tilkoblingen er allerede i boks.
 */
export async function oppdaterLagretCompanySlug(): Promise<void> {
  try {
    const slug = await hentCompanySlug();
    const { error } = await supabaseAdmin()
      .from("fiken_tokens")
      .update({ company_slug: slug, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) console.error("[fiken] company_slug-lagring feilet", error);
  } catch (err) {
    console.log(
      "[fiken] company_slug ikke avklart etter tilkobling:",
      err instanceof Error ? err.message : err
    );
  }
}

/* ════════════════════════════════════════════
   Kjernen — fikenFetch: kø, auth, X-Request-ID,
   429-backoff, 201-Location, rå feillogging.
   ════════════════════════════════════════════ */

type FikenSvar = {
  status: number;
  /** Parset JSON-body — null ved tom body (201-er). */
  json: unknown;
  /** Location-headeren — id-kilden for 201-svar. */
  location: string | null;
};

async function fikenFetch(
  metode: "GET" | "POST" | "DELETE",
  sti: string,
  body?: unknown
): Promise<FikenSvar> {
  kontrollerMetode(metode, sti);
  const { token } = await hentAccessToken();

  return iKo(async () => {
    for (let forsok = 0; ; forsok += 1) {
      const requestId = randomUUID();
      const res = await fetch(`${API_BASE}${sti}`, {
        method: metode,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Request-ID": requestId,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429 && forsok < MAKS_429_FORSOK) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const ventMs = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, 15_000)
          : 1000 * 2 ** forsok;
        console.log(
          `[fiken] 429 på ${metode} ${sti} — venter ${ventMs} ms (forsøk ${forsok + 1})`
        );
        await sov(ventMs);
        continue;
      }

      if (!res.ok) {
        // 400-validering: logg RÅ body — det er hele feilsøkingsgrunnlaget.
        const tekst = await res.text().catch(() => "");
        const feil = new FikenApiError({
          status: res.status,
          body: tekst,
          requestId,
          metode,
          sti,
        });
        console.error(`[fiken] ${feil.message}`);
        throw feil;
      }

      const location = res.headers.get("location");
      const tekst = await res.text().catch(() => "");
      let json: unknown = null;
      if (tekst) {
        try {
          json = JSON.parse(tekst);
        } catch {
          json = null; // 201-er har tom body; alt annet uparselig → null.
        }
      }
      return { status: res.status, json, location };
    }
  });
}

/**
 * Kort, lesbar utdrag av en Fiken-feilkropp — til admin-UI-et (admin-only,
 * så detaljene er trygge å vise og sparer en tur i serverloggen). Plukker
 * «message»/«validationErrors» ut av JSON-kroppen når den er JSON.
 */
export function fikenFeilKort(err: FikenApiError): string {
  const body = err.body?.trim() ?? "";
  if (body) {
    try {
      const j = JSON.parse(body) as {
        message?: unknown;
        validationErrors?: Array<{ message?: unknown } | string>;
        error?: unknown;
      };
      const fra =
        (typeof j.message === "string" && j.message) ||
        (Array.isArray(j.validationErrors) &&
          j.validationErrors
            .map((v) => (typeof v === "string" ? v : (v?.message ?? "")))
            .filter(Boolean)
            .join("; ")) ||
        (typeof j.error === "string" && j.error) ||
        "";
      if (fra) return String(fra).slice(0, 240);
    } catch {
      // ikke JSON — bruk rå tekst
    }
    return body.slice(0, 240);
  }
  return `Fiken svarte ${err.status} uten detaljer.`;
}

/** Bakerste tallsegment i en Location-URL («…/drafts/123» → 123). */
function idFraLocation(location: string | null): number | null {
  if (!location) return null;
  const m = /\/(\d+)\/?$/.exec(location);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) ? id : null;
}

/* ════════════════════════════════════════════
   companySlug — env-overstyring, ellers
   GET /companies (krev entydighet).
   ════════════════════════════════════════════ */

let slugCache: string | null = null;

export async function hentCompanies(): Promise<FikenCompany[]> {
  const svar = await fikenFetch("GET", "/companies");
  return Array.isArray(svar.json) ? (svar.json as FikenCompany[]) : [];
}

export async function hentCompanySlug(): Promise<string> {
  const env = process.env.FIKEN_COMPANY_SLUG;
  if (env) return env;
  if (slugCache) return slugCache;

  const companies = await hentCompanies();
  if (companies.length === 0) {
    throw new FikenConfigError(
      "Fiken-kontoen har ingen selskaper med API-tilgang."
    );
  }
  if (companies.length > 1) {
    const slugs = companies.map((c) => c.slug).join(", ");
    throw new FikenConfigError(
      `Fiken-kontoen har flere selskaper — sett FIKEN_COMPANY_SLUG i env. Slugs: ${slugs}`
    );
  }
  slugCache = companies[0].slug;
  return slugCache;
}

/* ════════════════════════════════════════════
   Tilkoblingsstatus — ETT GET /companies-kall.
   ════════════════════════════════════════════ */

export type FikenTilkobling = {
  koblet: boolean;
  via: FikenAuthVia | null;
  selskap?: string;
  selskapSlug?: string;
  testCompany?: boolean;
  feil?: string;
};

export async function hentFikenStatus(): Promise<FikenTilkobling> {
  let via: FikenAuthVia | null;
  try {
    via = await fikenAuthVia();
  } catch (err) {
    console.error("[fiken] status: auth-oppslag feilet", err);
    return { koblet: false, via: null, feil: "Kunne ikke lese token-lageret." };
  }
  if (!via) return { koblet: false, via: null };

  try {
    const companies = await hentCompanies();
    const envSlug = process.env.FIKEN_COMPANY_SLUG;
    const valgt = envSlug
      ? companies.find((c) => c.slug === envSlug)
      : companies.length === 1
        ? companies[0]
        : undefined;
    if (!valgt) {
      const slugs = companies.map((c) => c.slug).join(", ") || "(ingen)";
      return {
        koblet: false,
        via,
        feil: envSlug
          ? `FIKEN_COMPANY_SLUG «${envSlug}» finnes ikke på kontoen. Slugs: ${slugs}`
          : `Flere/ingen selskaper på kontoen — sett FIKEN_COMPANY_SLUG. Slugs: ${slugs}`,
      };
    }
    return {
      koblet: true,
      via,
      selskap: valgt.name,
      selskapSlug: valgt.slug,
      testCompany: valgt.testCompany === true,
    };
  } catch (err) {
    const melding =
      err instanceof FikenApiError && err.status === 401
        ? "Fiken avviste tilgangen (401) — nøkkelen/tilkoblingen må fornyes."
        : err instanceof Error
          ? err.message
          : "Ukjent feil mot Fiken.";
    return { koblet: false, via, feil: melding };
  }
}

/* ════════════════════════════════════════════
   Kontakter — ALLTID søk (e-post, så orgnr)
   før opprettelse; Fiken har ingen duplikat-
   beskyttelse. Eksisterende kontakter røres
   aldri (ingen PUT finnes i denne fila).
   ════════════════════════════════════════════ */

async function sokKontakt(
  slug: string,
  felt: "email" | "organizationNumber",
  verdi: string
): Promise<FikenContact | null> {
  const svar = await fikenFetch(
    "GET",
    `/companies/${slug}/contacts?${felt}=${encodeURIComponent(verdi)}&pageSize=100`
  );
  const liste = Array.isArray(svar.json) ? (svar.json as FikenContact[]) : [];
  // Foretrekk aktiv kontakt; ellers første treff (vi oppretter ikke duplikat
  // av en deaktivert kontakt — det ville vært «ny data» Petter ikke ba om).
  return liste.find((k) => k.inactive !== true) ?? liste[0] ?? null;
}

/**
 * Finn-eller-opprett kunde i Fiken. POST KUN når verken e-post- eller
 * orgnr-søket traff. 201 har tom body — id parses fra Location, med
 * re-søk som fallback.
 */
export async function ensureContact(opts: {
  navn: string;
  epost?: string | null;
  orgnr?: string | null;
}): Promise<number> {
  const slug = await hentCompanySlug();
  const epost = opts.epost?.trim() || null;
  const orgnr = opts.orgnr?.replace(/\s/g, "") || null;

  if (epost) {
    const treff = await sokKontakt(slug, "email", epost);
    if (treff?.contactId) return treff.contactId;
  }
  if (orgnr) {
    const treff = await sokKontakt(slug, "organizationNumber", orgnr);
    if (treff?.contactId) return treff.contactId;
  }

  const svar = await fikenFetch("POST", `/companies/${slug}/contacts`, {
    name: opts.navn,
    ...(epost ? { email: epost } : {}),
    ...(orgnr ? { organizationNumber: orgnr } : {}),
    customer: true,
    language: "NORWEGIAN",
  });
  const id = idFraLocation(svar.location);
  if (id !== null) return id;

  // Location lot seg ikke parse — kontakten finnes nå, re-søk etter den.
  console.log("[fiken] kontakt-Location uparselig — re-søker");
  if (epost) {
    const treff = await sokKontakt(slug, "email", epost);
    if (treff?.contactId) return treff.contactId;
  }
  if (orgnr) {
    const treff = await sokKontakt(slug, "organizationNumber", orgnr);
    if (treff?.contactId) return treff.contactId;
  }
  throw new Error("Fant ikke kontakten etter opprettelse (Location manglet).");
}

/* ════════════════════════════════════════════
   Fakturautkast → faktura → send → status.
   ════════════════════════════════════════════ */

/**
 * Nytt fakturautkast (utkast trenger IKKE bankkonto). uuid er vår
 * idempotensnøkkel (fakturaer.fiken_uuid) — finn igjen utkastet/fakturaen
 * med finnUtkastMedUuid/finnFakturaMedUuid før et nytt POST.
 */
export async function createDraftInvoice(opts: {
  customerId: number;
  uuid: string;
  dagerTilForfall: number;
  fakturatekst?: string | null;
  varReferanse?: string | null;
  deresReferanse?: string | null;
  linjer: FakturaLinjeInput[];
}): Promise<number> {
  const slug = await hentCompanySlug();
  const body: FikenDraftRequest = {
    type: "invoice",
    uuid: opts.uuid,
    customerId: opts.customerId,
    daysUntilDueDate: opts.dagerTilForfall,
    ...(opts.fakturatekst ? { invoiceText: opts.fakturatekst } : {}),
    ...(opts.varReferanse ? { ourReference: opts.varReferanse } : {}),
    ...(opts.deresReferanse ? { yourReference: opts.deresReferanse } : {}),
    lines: opts.linjer.map((l) => ({
      description: l.beskrivelse,
      quantity: l.antall,
      unitPrice: l.enhetsprisOre,
      vatType: mvaSatsTilVatType(l.mvaSats),
      incomeAccount: FIKEN_INNTEKTSKONTO,
    })),
  };
  const svar = await fikenFetch(
    "POST",
    `/companies/${slug}/invoices/drafts`,
    body
  );
  const draftId = idFraLocation(svar.location);
  if (draftId === null) {
    // Utkastet finnes nå — let det opp via uuid før vi erklærer feil.
    const igjen = await finnUtkastMedUuid(opts.uuid);
    if (igjen) return igjen.draftId;
    throw new Error("Fiken-utkastet ble opprettet, men id-en lot seg ikke lese.");
  }
  return draftId;
}

/**
 * Slett et fakturaUTKAST i Fiken (DELETE /drafts/{id}). KUN utkast —
 * metodevernet (DELETE_ALLOWLIST) tillater ingen annen sti. Idempotent:
 * et utkast som alt er borte (404) regnes som vellykket slettet.
 */
export async function deleteDraftInvoice(draftId: number): Promise<void> {
  const slug = await hentCompanySlug();
  try {
    await fikenFetch("DELETE", `/companies/${slug}/invoices/drafts/${draftId}`);
  } catch (err) {
    if (err instanceof FikenApiError && err.status === 404) return; // alt borte
    throw err;
  }
}

/**
 * Finnes utkastet fortsatt i Fiken? Brukes av synken til å fjerne rader for
 * utkast Petter har slettet i Fiken-UI. 404 → false (borte), ellers true.
 */
export async function draftEksisterer(draftId: number): Promise<boolean> {
  const slug = await hentCompanySlug();
  try {
    await fikenFetch("GET", `/companies/${slug}/invoices/drafts/${draftId}`);
    return true;
  } catch (err) {
    if (err instanceof FikenApiError && err.status === 404) return false;
    throw err;
  }
}

/**
 * Finn et eksisterende UTKAST med vår uuid (idempotenssjekk før nytt POST).
 * Leser én side à 100 — flere utkast enn det gir i verste fall et duplikat-
 * UTKAST (aldri datatap; Petter rydder i Fiken-UI).
 */
export async function finnUtkastMedUuid(
  uuid: string
): Promise<FikenDraftResult | null> {
  const slug = await hentCompanySlug();
  const svar = await fikenFetch(
    "GET",
    `/companies/${slug}/invoices/drafts?pageSize=100`
  );
  const liste = Array.isArray(svar.json)
    ? (svar.json as FikenDraftResult[])
    : [];
  return liste.find((d) => d.uuid === uuid && d.draftId) ?? null;
}

/** Ble utkastet allerede til faktura? (GET ?invoiceDraftUuid=…). */
export async function finnFakturaMedUuid(
  uuid: string
): Promise<FikenInvoice | null> {
  const slug = await hentCompanySlug();
  const svar = await fikenFetch(
    "GET",
    `/companies/${slug}/invoices?invoiceDraftUuid=${encodeURIComponent(uuid)}`
  );
  const liste = Array.isArray(svar.json) ? (svar.json as FikenInvoice[]) : [];
  return liste.find((f) => f.invoiceId) ?? null;
}

/**
 * Finnes fakturanummer-serien? Vi POSTer ALDRI counter selv (det er en
 * endring i Petters Fiken) — mangler den, må serien opprettes manuelt i
 * Fiken-UI (eller ved at første faktura lages der).
 */
export async function fakturaCounterFinnes(): Promise<boolean> {
  const slug = await hentCompanySlug();
  try {
    await fikenFetch("GET", `/companies/${slug}/invoices/counter`);
    return true;
  } catch (err) {
    if (err instanceof FikenApiError && err.status === 404) return false;
    throw err;
  }
}

/**
 * Utkast → EKTE faktura. KUN bak eksplisitt admin-knapp.
 * createInvoice gjør den IKKE sendt — send er et eget, bevisst steg.
 */
export async function createInvoiceFromDraft(draftId: number): Promise<number | null> {
  const slug = await hentCompanySlug();
  const svar = await fikenFetch(
    "POST",
    `/companies/${slug}/invoices/drafts/${draftId}/createInvoice`
  );
  // null = Location uparselig; kalleren faller tilbake til uuid-oppslag.
  return idFraLocation(svar.location);
}

/** Send faktura via Fiken. KUN bak eksplisitt admin-knapp m/ bekreftelse. */
export async function sendInvoice(opts: {
  invoiceId: number;
  metode: "auto" | "email";
  mottakerEpost?: string | null;
}): Promise<void> {
  const slug = await hentCompanySlug();
  const body: FikenSendRequest = {
    invoiceId: opts.invoiceId,
    method: [opts.metode],
    includeDocumentAttachments: false,
    ...(opts.mottakerEpost ? { recipientEmail: opts.mottakerEpost } : {}),
    ...(opts.metode === "email" || opts.mottakerEpost
      ? { emailSendOption: "document_link" as const }
      : {}),
  };
  await fikenFetch("POST", `/companies/${slug}/invoices/send`, body);
}

export async function getInvoiceStatus(invoiceId: number): Promise<FikenInvoice> {
  const slug = await hentCompanySlug();
  const svar = await fikenFetch(
    "GET",
    `/companies/${slug}/invoices/${invoiceId}`
  );
  if (!svar.json || typeof svar.json !== "object") {
    throw new Error(`Fiken-faktura ${invoiceId} kom uten body.`);
  }
  return svar.json as FikenInvoice;
}

/** Åpne (usettlede) fakturaer — én side à 100 holder for verkstedet. */
export async function listOpenInvoices(): Promise<FikenInvoice[]> {
  const slug = await hentCompanySlug();
  const svar = await fikenFetch(
    "GET",
    `/companies/${slug}/invoices?settled=false&pageSize=100`
  );
  return Array.isArray(svar.json) ? (svar.json as FikenInvoice[]) : [];
}

/* ════════════════════════════════════════════
   Statusavledning — én kilde til sannhet for
   både synken og opprett/send-rutene.
   ════════════════════════════════════════════ */

/** I dag som «YYYY-MM-DD» — dueDate sammenlignes leksikografisk. */
function isoIdag(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fiken-faktura + nåværende radstatus → ny radstatus.
 * Presedens: betalt > forfalt > delbetalt > sendt > behold. Nedgraderer
 * aldri ('kansellert' og 'betalt' er terminale; 'sendt' faller ikke
 * tilbake til 'utkast').
 */
export function avledFakturaStatus(
  faktura: FikenInvoice,
  navarende: FakturaStatus
): FakturaStatus {
  if (navarende === "kansellert") return "kansellert";
  if (faktura.sale?.settled === true) return "betalt";
  const forfalt =
    typeof faktura.dueDate === "string" && faktura.dueDate < isoIdag();
  if (forfalt) return "forfalt";
  if ((faktura.sale?.totalPaid ?? 0) > 0) return "delbetalt";
  const sendt =
    (Array.isArray(faktura.dispatches) && faktura.dispatches.length > 0) ||
    navarende === "sendt" ||
    navarende === "delbetalt" ||
    navarende === "forfalt";
  return sendt ? "sendt" : navarende;
}

/* ════════════════════════════════════════════
   Synken — sekvensiell (rate limit!), service
   role (samme kode bak admin-knapp og cron).
   ════════════════════════════════════════════ */

type SyncRad = {
  id: string;
  kartlegging_id: string;
  fiken_invoice_id: number;
  invoice_number: number | null;
  status: FakturaStatus;
};

export type FikenSyncResultat = {
  totalt: number;
  oppdatert: number;
  nyBetalte: number;
  fjernet: number;
  feil: string[];
};

/**
 * Synker alle fakturaer-rader med fiken_invoice_id mot Fiken — sekvensielt.
 * 'betalt' og 'kansellert' er terminale og hoppes over. Når en rad GÅR til
 * 'betalt' i denne kjøringen postes et prosjekt_innlegg (type 'faktura')
 * i Benken-feeden. Idempotent mot replays: statusoppdateringen er gardet
 * med WHERE status = <gammel> — taper vi kappløpet mot en parallell synk,
 * postes ikke innlegget en gang til.
 */
export async function syncAlleFakturaer(): Promise<FikenSyncResultat> {
  const db = supabaseAdmin();
  const resultat: FikenSyncResultat = {
    totalt: 0,
    oppdatert: 0,
    nyBetalte: 0,
    fjernet: 0,
    feil: [],
  };

  const { data, error } = await db
    .from("fakturaer")
    .select("id, kartlegging_id, fiken_invoice_id, invoice_number, status")
    .not("fiken_invoice_id", "is", null)
    .not("status", "in", "(betalt,kansellert)")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[fiken/sync] fakturaer select feilet", error);
    throw new Error("Kunne ikke lese fakturaer fra databasen.");
  }

  const rader = (data ?? []) as SyncRad[];
  resultat.totalt = rader.length;

  for (const rad of rader) {
    try {
      const faktura = await getInvoiceStatus(rad.fiken_invoice_id);
      const nyStatus = avledFakturaStatus(faktura, rad.status);
      const naIso = new Date().toISOString();

      // Feltene skrives alltid (Fiken er fasit); status-skiftet er gardet
      // med WHERE status=<gammel> så et parallelt løp ikke dobler innlegg.
      const { data: traff, error: oppdaterFeil } = await db
        .from("fakturaer")
        .update({
          status: nyStatus,
          invoice_number: faktura.invoiceNumber ?? rad.invoice_number,
          kid: faktura.kid ?? null,
          belop_ore: faktura.gross ?? null,
          netto_ore: faktura.net ?? null,
          mva_ore: faktura.vat ?? null,
          issue_date: faktura.issueDate ?? null,
          due_date: faktura.dueDate ?? null,
          settled_at: faktura.sale?.settledDate ?? null,
          sist_synket_at: naIso,
          updated_at: naIso,
        })
        .eq("id", rad.id)
        .eq("status", rad.status)
        .select("id");
      if (oppdaterFeil) throw oppdaterFeil;
      const vantSkiftet = (traff?.length ?? 0) > 0;

      if (nyStatus !== rad.status && vantSkiftet) {
        resultat.oppdatert += 1;

        if (nyStatus === "betalt") {
          resultat.nyBetalte += 1;
          const nr = faktura.invoiceNumber ?? rad.invoice_number;
          const { error: innleggFeil } = await db
            .from("prosjekt_innlegg")
            .insert({
              kartlegging_id: rad.kartlegging_id,
              fra: "workflows",
              type: "faktura",
              tekst: nr
                ? `Faktura nr. ${nr} er betalt — takk!`
                : "Fakturaen er betalt — takk!",
            });
          if (innleggFeil) {
            // Ikke fatalt — statusen ER riktig; feeden mangler bare notisen.
            console.error("[fiken/sync] innlegg-insert feilet", innleggFeil);
            resultat.feil.push(
              `faktura ${rad.id}: betalt, men innlegget feilet`
            );
          }
        }
      }
    } catch (err) {
      const melding = err instanceof Error ? err.message : String(err);
      console.error(`[fiken/sync] faktura ${rad.id} feilet: ${melding}`);
      resultat.feil.push(`faktura ${rad.id}: ${melding.slice(0, 200)}`);
    }
  }

  // ── Utkast-avstemming: fjern rader for utkast Petter har slettet i Fiken.
  // Kun rene utkast (fiken_draft_id satt, ingen faktura ennå). Sekvensielt.
  const { data: utkastData, error: utkastFeil } = await db
    .from("fakturaer")
    .select("id, fiken_draft_id")
    .eq("status", "utkast")
    .not("fiken_draft_id", "is", null)
    .is("fiken_invoice_id", null);
  if (utkastFeil) {
    console.error("[fiken/sync] utkast select feilet", utkastFeil);
  } else {
    for (const u of (utkastData ?? []) as Array<{ id: string; fiken_draft_id: number }>) {
      try {
        if (await draftEksisterer(u.fiken_draft_id)) continue; // finnes ennå
        const { error: slettFeil } = await db.from("fakturaer").delete().eq("id", u.id);
        if (slettFeil) throw slettFeil;
        resultat.fjernet += 1;
        console.log(`[fiken/sync] utkast ${u.id} fjernet — slettet i Fiken`);
      } catch (err) {
        const melding = err instanceof Error ? err.message : String(err);
        console.error(`[fiken/sync] utkast ${u.id} avstemming feilet: ${melding}`);
        resultat.feil.push(`utkast ${u.id}: ${melding.slice(0, 200)}`);
      }
    }
  }

  return resultat;
}
