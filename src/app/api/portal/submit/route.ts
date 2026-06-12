import { NextResponse, after } from "next/server";
import { bedriftFraAnswers, epostAdminVarsel, epostForslagKlart, lagPortalLenke, sendPortalEpost } from "@/lib/epost";
import { generateAssessment, generateMockup } from "@/lib/portalAi";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockSubmit, portalMockEnabled } from "@/lib/portalMock";
import type { PortalSubmitBody, PortalSubmitResponse } from "@/lib/portalTypes";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";
// The route itself answers fast (validate + INSERT). The generation (text +
// image) runs via after() in the SAME invocation, so maxDuration must cover
// it: probe 6s + chat 20s (+ one HTTP retry 20s) + image 40s + storage/
// e-post overhead ≈ 90s worst case — 120 gives honest headroom. The client
// polls GET /me, whose 3-minute staleness backstop still outlives this.
export const maxDuration = 120;

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

// Defensive cap — the wizard steps never come near this, even with the
// 2000-char drømmen, the follow-up answer and research incl. subpages.
const MAX_ANSWERS_JSON = 30_000;

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
      lang: body.lang,
      status: "genererer",
    })
    .select("id")
    .single();
  if (insertError || !row) {
    console.error("[portal/submit] insert failed", insertError);
    return NextResponse.json({ error: GENERATION_FAILED }, { status: 500 });
  }
  const rowId = row.id as string;

  // 2) The expensive work runs AFTER the response (next/server after(), same
  //    invocation — maxDuration covers it). The user-scoped supabase client
  //    lives on in this closure, so every update still runs AS the user and
  //    the DB status machine (genererer → forslag_klart/feilet with the
  //    customer token) authorizes exactly what happens here. The client gets
  //    {id} immediately and the GET /me poll lands the result.
  after(async () => {
    try {
      // 2a) Assessment first (text — cheap, and the image prompt needs it) …
      const assessment = await generateAssessment(body.answers, body.lang);

      // 2b) … then the mockup image, uploaded with the user's own token so
      //     the owner-scoped storage policy (<uid>/ prefix) applies.
      //     NON-FATAL: the assessment is the product — if the drawing times
      //     out or fails, the forslag ships without it (the UI handles a
      //     missing mockupUrl) instead of burning the whole generation.
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

      // 2c) Done — forslag_klart.
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

      // 2d) Tell the customer the drawing is up. sendPortalEpost is fail-
      //     silent by contract — a mail hiccup never fails a generation.
      if (user.email) {
        const ep = await sendPortalEpost({
          to: user.email,
          // One-time login deep link — falls back to the plain gate link
          // inside lagPortalLenke (fail-graceful by contract).
          ...epostForslagKlart(body.lang, { lenke: await lagPortalLenke(user.email) }),
        });
        if (!ep.ok) {
          console.log(`[portal/submit] e-post (forslag klart) ikke sendt: ${ep.error}`);
        }
      }

      // …and tell Petter a new kartlegging landed (inbox is enough here;
      // Telegram pings on likes/approvals/failures to keep the noise down).
      const adminEp = await sendPortalEpost({
        to: "petter@workflows.no",
        ...epostAdminVarsel("ny", {
          email: user.email ?? "ukjent e-post",
          bedrift: bedriftFraAnswers(body.answers),
          lenke: await lagPortalLenke("petter@workflows.no", "admin"),
        }),
      });
      if (!adminEp.ok) {
        console.log(`[portal/submit] admin-e-post ikke sendt: ${adminEp.error}`);
      }
    } catch (err) {
      console.error("[portal/submit] generation failed", err);
      // Best effort — mark the row feilet so /me reflects reality.
      const { error: feiletError } = await supabase
        .from("kartlegginger")
        .update({ status: "feilet", updated_at: new Date().toISOString() })
        .eq("id", rowId);
      if (feiletError) {
        console.error("[portal/submit] feilet-markering feilet også", feiletError);
      }
      // A failed generation is a lead about to walk — ping Petter so it
      // never dies silently. Plain text by telegram.ts contract.
      const tg = await sendTelegramToPetter({
        text:
          `Verkstedet: generering FEILET for ` +
          `${bedriftFraAnswers(body.answers) ?? "ukjent bedrift"} ` +
          `(${user.email ?? "ukjent e-post"}). ` +
          `Kartlegging ${rowId}. Svarene ligger trygt — kunden ser feilskjermen med prøv igjen-knapp.`,
      });
      if (!tg.ok) {
        console.error(`[portal/submit] telegram-varsel ikke sendt: ${tg.error}`);
      }
    }
  });

  // 3) Answer fast — status «genererer» is already visible via GET /me.
  return NextResponse.json<PortalSubmitResponse>({ id: rowId });
}
