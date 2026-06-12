import { NextResponse } from "next/server";
import { generateInnsikt } from "@/lib/portalAi";
import { mockInnsikt, portalMockEnabled } from "@/lib/portalMock";
import type { PortalInnsiktBody, PortalInnsiktResponse } from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/portal/innsikt — UNAUTHENTICATED opening reflection.
 *
 * Takes the company research (Brønnøysund + their own website) and asks
 * Fable 5 for 2–3 short observations («Vi la merke til …») that open the
 * diagnose-samtale, so the visitor feels seen before the first question.
 *
 * Contract — mirrors /research: only bad input (400) and rate limiting (429)
 * are errors. EVERYTHING else, including model failure and timeout, answers
 * 200 { observasjoner: [] } and the wizard silently skips the reflection.
 * The flow is never blocked by this route.
 *
 * Unauthenticated LLM call ⇒ a strict per-IP limiter: the design is one call
 * per wizard run, so the window only absorbs honest retries.
 */

export const runtime = "nodejs";
// One Fable 5 call inside the wizard's patience (~25s budget) + headroom.
export const maxDuration = 35;

const RL_IP_MAX = 8;
const RL_WINDOW_MS = 10 * 60_000;

// Defensive cap — research with subpages is the only thing in this body.
const MAX_RESEARCH_JSON = 30_000;

function parseBody(raw: unknown): { research: unknown; lang: "no" | "en" } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Partial<PortalInnsiktBody>;
  // research may be null/absent (no match) — a valid «nothing to reflect on».
  if (body.research != null && typeof body.research !== "object") return null;
  const research = body.research ?? null;
  if (JSON.stringify(research).length > MAX_RESEARCH_JSON) return null;
  const lang = body.lang === "en" ? "en" : "no";
  return { research, lang };
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

  // The «skip the reflection» answer — harNettside defaults true so we never
  // wrongly tell a customer they lack a website on a mere technical hiccup.
  const tom: PortalInnsiktResponse = { observasjoner: [], harNettside: true };

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalInnsiktResponse>(
      await mockInnsikt(body.research, body.lang)
    );
  }

  const ipRl = rateLimit({
    key: "portal:innsikt:ip",
    identifier: getClientIp(req),
    max: RL_IP_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!ipRl.ok) return tooManyRequests(ipRl, RL_IP_MAX);

  try {
    const innsikt = await generateInnsikt(body.research, body.lang);
    return NextResponse.json<PortalInnsiktResponse>(innsikt ?? tom);
  } catch (err) {
    console.error("[portal/innsikt] generation failed (reflection skipped)", err);
    return NextResponse.json<PortalInnsiktResponse>(tom);
  }
}
