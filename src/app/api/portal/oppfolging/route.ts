import { NextResponse } from "next/server";
import { generateOppfolgingSporsmal } from "@/lib/portalAi";
import { mockOppfolging, portalMockEnabled } from "@/lib/portalMock";
import type { PortalOppfolgingBody, PortalOppfolgingResponse } from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/portal/oppfolging — UNAUTHENTICATED adaptive follow-up.
 *
 * Takes the wizard answers so far and asks a cheap model for ONE sharp
 * consultant question in the answer language (e.g. «Dere nevnte Fiken —
 * hvilke oppgaver i Fiken tar mest tid?»). The wizard shows it as its own
 * step after «drømmen».
 *
 * Contract — mirrors /research: only bad input (400) and rate limiting
 * (429) are errors. EVERYTHING else, including model failure and timeout,
 * answers 200 { sporsmal: null } and the wizard silently skips the step.
 * The flow is never blocked by this route.
 *
 * Unauthenticated LLM call ⇒ the strictest limiter in the portal: the
 * design is one call per wizard run, so the window only absorbs honest
 * retries (re-runs after «start på nytt», a dropped connection).
 */

export const runtime = "nodejs";
// Model probe (first call per isolate, 6s) + one small chat (5s) + headroom.
export const maxDuration = 15;

const RL_IP_MAX = 5;
const RL_WINDOW_MS = 10 * 60_000;

// Defensive cap — matches the submit route's view of a plausible answers
// payload (long drømmen + research with subpages included).
const MAX_ANSWERS_JSON = 30_000;

function parseBody(
  raw: unknown
): { answers: Record<string, unknown>; lang: "no" | "en" } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Partial<PortalOppfolgingBody>;
  const answers = body.answers;
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return null;
  if (JSON.stringify(answers).length > MAX_ANSWERS_JSON) return null;
  const lang = body.lang === "en" ? "en" : "no";
  return { answers: answers as Record<string, unknown>, lang };
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
    return NextResponse.json({ error: "Ugyldige svar" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalOppfolgingResponse>(await mockOppfolging(body.lang));
  }

  const ipRl = rateLimit({
    key: "portal:oppfolging:ip",
    identifier: getClientIp(req),
    max: RL_IP_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!ipRl.ok) return tooManyRequests(ipRl, RL_IP_MAX);

  let sporsmal: string | null = null;
  try {
    sporsmal = await generateOppfolgingSporsmal(body.answers, body.lang);
  } catch (err) {
    // Timeout, upstream trouble, bad output — log it, skip the step.
    console.error("[portal/oppfolging] generation failed (step skipped)", err);
    sporsmal = null;
  }

  return NextResponse.json<PortalOppfolgingResponse>({ sporsmal });
}
