import { NextResponse } from "next/server";
import { generateAssessment, generateMockup } from "@/lib/portalAi";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockSubmit, portalMockEnabled } from "@/lib/portalMock";
import type { PortalSubmitBody, PortalSubmitResponse } from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";
// Text assessment + image generation in one request — needs headroom.
export const maxDuration = 60;

// Pre-auth junk filter ONLY — generous, so an unauthenticated griefer on a
// shared IP (CGNAT) can't burn the real budget for legitimate neighbours.
const RL_IP_MAX = 30;
// Generation is expensive (image model): 3 submissions / 10 min per USER.
const RL_USER_MAX = 3;
const RL_WINDOW_MS = 10 * 60_000;
// DB-backed quota — the in-memory limiter resets per isolate/cold start, so
// the budget that actually matters is enforced where RLS gives a trusted
// view of this user's rows.
const DB_HOURLY_MAX = 3;
const IN_FLIGHT_FRESH_MS = 2 * 60_000;

// Defensive cap — seven wizard steps never come near this.
const MAX_ANSWERS_JSON = 20_000;

const GENERATION_FAILED =
  "Genereringen feilet. Prøv igjen om litt — eller ta en prat med et menneske i stedet.";

function parseBody(raw: unknown): { answers: Record<string, unknown>; lang: "no" | "en" } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Partial<PortalSubmitBody>;
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
    const mocked = await mockSubmit(body.answers);
    return NextResponse.json<PortalSubmitResponse>(mocked);
  }

  const ipRl = rateLimit({
    key: "portal:submit:ip",
    identifier: getClientIp(req),
    max: RL_IP_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!ipRl.ok) return tooManyRequests(ipRl, RL_IP_MAX);

  // Auth BEFORE the strict limiter: unauthenticated junk must not consume
  // the expensive-generation budget of everyone behind the same NAT.
  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/submit] auth setup failed", err);
    return NextResponse.json({ error: GENERATION_FAILED }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const userRl = rateLimit({
    key: "portal:submit:user",
    identifier: user.id,
    max: RL_USER_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!userRl.ok) return tooManyRequests(userRl, RL_USER_MAX);

  // Server-side duplicate/quota guard (the client checks /me first, but
  // curl doesn't): look at this user's recent rows before paying OpenAI.
  const sinceHour = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from("kartlegginger")
    .select("id, status, created_at")
    .gte("created_at", sinceHour)
    .order("created_at", { ascending: false });
  if (recentError) {
    console.error("[portal/submit] quota select failed", recentError);
    return NextResponse.json({ error: GENERATION_FAILED }, { status: 500 });
  }
  const rows = recent ?? [];
  // A generation already in flight? Idempotent: hand back that row and let
  // the client's poll land it instead of paying for a second drawing.
  const inFlight = rows.find(
    (r) =>
      r.status === "genererer" &&
      Date.now() - Date.parse(r.created_at as string) < IN_FLIGHT_FRESH_MS
  );
  if (inFlight) {
    return NextResponse.json<PortalSubmitResponse>({ id: inFlight.id as string });
  }
  // feilet rows don't count against the quota — punishing retries after
  // our own generation failures would be hostile (and they barely cost).
  const paidRows = rows.filter((r) => r.status !== "feilet");
  if (paidRows.length >= DB_HOURLY_MAX) {
    return NextResponse.json(
      { error: "For mange genereringer på kort tid. Prøv igjen om en times tid — eller ta en prat med et menneske." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // 1) Row first — status «genererer» so /me can show progress. RLS
  //    (auth.uid() = user_id) authorizes the insert.
  const { data: row, error: insertError } = await supabase
    .from("kartlegginger")
    .insert({
      user_id: user.id,
      email: user.email ?? "",
      answers: body.answers,
      status: "genererer",
    })
    .select("id")
    .single();
  if (insertError || !row) {
    console.error("[portal/submit] insert failed", insertError);
    return NextResponse.json({ error: GENERATION_FAILED }, { status: 500 });
  }
  const rowId = row.id as string;

  try {
    // 2) Assessment first (text — cheap, and the image prompt needs it) …
    const assessment = await generateAssessment(body.answers, body.lang);

    // 3) … then the mockup image, uploaded with the user's own token so
    //    the owner-scoped storage policy (<uid>/ prefix) applies.
    //    NON-FATAL: the assessment is the product — if the drawing times
    //    out or fails, the forslag ships without it (the UI handles a
    //    missing mockupUrl) instead of burning the whole generation.
    let mockupPath: string | null = null;
    if (assessment.anbefaling !== "ikke_ai") {
      try {
        const webp = await generateMockup(body.answers, assessment);
        const candidatePath = `${user.id}/${rowId}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("mockups")
          .upload(candidatePath, webp, { contentType: "image/webp" });
        if (uploadError) {
          throw new Error(`mockup upload failed: ${uploadError.message}`);
        }
        mockupPath = candidatePath;
      } catch (mockupErr) {
        console.error("[portal/submit] mockup skipped (non-fatal)", mockupErr);
      }
    }

    // 4) Done — forslag_klart.
    const { error: updateError } = await supabase
      .from("kartlegginger")
      .update({
        assessment,
        mockup_path: mockupPath,
        status: "forslag_klart",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId);
    if (updateError) {
      throw new Error(`row update failed: ${updateError.message}`);
    }

    return NextResponse.json<PortalSubmitResponse>({ id: rowId });
  } catch (err) {
    console.error("[portal/submit] generation failed", err);
    // Best effort — mark the row feilet so /me reflects reality.
    await supabase
      .from("kartlegginger")
      .update({ status: "feilet", updated_at: new Date().toISOString() })
      .eq("id", rowId);
    return NextResponse.json({ error: GENERATION_FAILED }, { status: 500 });
  }
}
