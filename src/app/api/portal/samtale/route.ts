import { NextResponse } from "next/server";
import { erSamtaleIntent, generateSamtaleSteg } from "@/lib/portalAi";
import { mockSamtale, portalMockEnabled } from "@/lib/portalMock";
import {
  SAMTALE_MAKS_SPORSMAL,
  SAMTALE_SVAR_MAX,
  type PortalSamtaleBody,
  type PortalSamtaleExchange,
  type PortalSamtaleResponse,
} from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/portal/samtale — UNAUTHENTICATED adaptive diagnose-step.
 *
 * Takes the intent (veivalg), the company research and the conversation so
 * far, and asks Fable 5 for THE NEXT question (or ferdig=true) plus a live
 * «dette hører vi»-understanding. One step at a time — the wizard shows it
 * as a single card and loops back with the answer.
 *
 * Contract: bad input (400) and rate limiting (429) are the only errors.
 * Model failure/timeout returns a STATIC fallback step (200) so the flow
 * never stalls — the conversation always moves forward or wraps up.
 *
 * The history round-trips through the client, so it is attacker-shaped:
 * every exchange is length-capped and the count is bounded here.
 */

export const runtime = "nodejs";
// One Fable 5 call per turn inside the wizard's patience (~25s) + headroom.
export const maxDuration = 35;

// ~5–6 full diagnose-runs per 10 min per IP (a run is 3–6 questions).
const RL_IP_MAX = 30;
const RL_WINDOW_MS = 10 * 60_000;

const MAX_RESEARCH_JSON = 30_000;
const SPORSMAL_MAX = 240;

/** Whitelist + cap the client-carried history. */
function reinHistorie(raw: unknown): PortalSamtaleExchange[] {
  if (!Array.isArray(raw)) return [];
  const ut: PortalSamtaleExchange[] = [];
  for (const item of raw.slice(0, SAMTALE_MAKS_SPORSMAL)) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const sporsmal =
      typeof o.sporsmal === "string" ? o.sporsmal.trim().slice(0, SPORSMAL_MAX) : "";
    const svar = typeof o.svar === "string" ? o.svar.trim().slice(0, SAMTALE_SVAR_MAX) : "";
    if (sporsmal && svar) ut.push({ sporsmal, svar });
  }
  return ut;
}

function parseBody(raw: unknown): PortalSamtaleBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Partial<PortalSamtaleBody>;
  if (!erSamtaleIntent(body.intent)) return null;
  if (body.research != null && typeof body.research !== "object") return null;
  const research = body.research ?? null;
  if (JSON.stringify(research).length > MAX_RESEARCH_JSON) return null;
  const lang = body.lang === "en" ? "en" : "no";
  return { intent: body.intent, research, historie: reinHistorie(body.historie), lang };
}

/**
 * Static fallback when Fable 5 times out or misbehaves — keeps the flow
 * moving. After enough turns it wraps up; otherwise one open question that
 * works regardless of intent.
 */
function statiskSteg(body: PortalSamtaleBody): PortalSamtaleResponse {
  if (body.historie.length >= 3) {
    return { ferdig: true, sporsmal: "", hint: "", forslag: [], forstaelse: [] };
  }
  return {
    ferdig: false,
    sporsmal:
      body.lang === "en"
        ? "In a sentence or two — what would the ideal outcome look like for you?"
        : "I én–to setninger — hvordan ser det ideelle resultatet ut for dere?",
    hint:
      body.lang === "en"
        ? "Whatever comes to mind first is usually the right answer."
        : "Det første som faller dere inn er som regel det riktige.",
    forslag: [],
    forstaelse: [],
  };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json({ error: "Ugyldige data" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalSamtaleResponse>(
      await mockSamtale({ intent: body.intent, historie: body.historie, lang: body.lang })
    );
  }

  const ipRl = rateLimit({
    key: "portal:samtale:ip",
    identifier: getClientIp(req),
    max: RL_IP_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!ipRl.ok) return tooManyRequests(ipRl, RL_IP_MAX);

  try {
    const steg = await generateSamtaleSteg({
      intent: body.intent,
      research: body.research,
      historie: body.historie,
      lang: body.lang,
    });
    // Usable = done, or a real next question. A «not done but empty question»
    // would strand the wizard — fall back to the static step instead.
    if (steg && (steg.ferdig || steg.sporsmal.trim())) {
      return NextResponse.json<PortalSamtaleResponse>(steg);
    }
    return NextResponse.json<PortalSamtaleResponse>(statiskSteg(body));
  } catch (err) {
    console.error("[portal/samtale] generation failed (static fallback)", err);
    return NextResponse.json<PortalSamtaleResponse>(statiskSteg(body));
  }
}
