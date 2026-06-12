import { NextResponse } from "next/server";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockLike, portalMockEnabled } from "@/lib/portalMock";
import type { PortalAssessment, PortalLikeBody, PortalLikeResponse } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { bedriftFraAnswers, epostAdminVarsel, lagPortalLenke, sendPortalEpost } from "@/lib/epost";
import { sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";

// Likes are cheap for us but each one pings Petter's phone — keyed on the
// authenticated user (not IP), since only logged-in users reach this far.
const RL_MAX = 5;
const RL_WINDOW_MS = 10 * 60_000;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const id =
    typeof raw === "object" && raw !== null ? (raw as Partial<PortalLikeBody>).id : undefined;
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalLikeResponse>(await mockLike(id));
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/like] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:like",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  // Ownership EXPLICITLY on user_id (the admin's RLS sees every row — the
  // filter keeps an admin-in-the-customer-portal out of other journeys),
  // and the row names the proposal for the Telegram ping.
  const { data: row, error: selectError } = await supabase
    .from("kartlegginger")
    .select("id, assessment, answers")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (selectError) {
    console.error("[portal/like] select failed", selectError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  // Idempotent: only a row sitting in «forslag_klart» can flip to «likt».
  // Re-likes (already likt/videre) and premature likes (genererer/feilet)
  // change nothing and send no Telegram — a loop can't flood Petter, and a
  // row he has moved to «videre» can't be regressed by a second like.
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("kartlegginger")
    .update({ status: "likt", liked_at: now, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "forslag_klart")
    .select("id");
  if (updateError) {
    console.error("[portal/like] update failed", updateError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    // Nothing transitioned — the like is already registered (or premature).
    return NextResponse.json<PortalLikeResponse>({ ok: true });
  }

  // Notify Petter. Missing Telegram env (or a Telegram hiccup) must never
  // fail the like — log and continue.
  const assessment = row.assessment as PortalAssessment | null;
  const text = `🟠 Portal: ${user.email ?? "ukjent e-post"} liker forslaget (${
    assessment?.anbefaling ?? "ukjent"
  } — ${assessment?.tittel ?? "uten tittel"}). Svar med pristilbud innen én arbeidsdag.`;
  const tg = await sendTelegramToPetter({ text });
  if (!tg.ok) {
    console.log(`[portal/like] Telegram not sent (${tg.error}): ${text}`);
  }
  // …and the same ping to the inbox (fail-silent).
  const adminEp = await sendPortalEpost({
    to: "petter@workflows.no",
    ...epostAdminVarsel("likt", {
      email: user.email ?? "ukjent e-post",
      bedrift: bedriftFraAnswers(row.answers),
      lenke: await lagPortalLenke("petter@workflows.no", "admin"),
    }),
  });
  if (!adminEp.ok) {
    console.log(`[portal/like] admin-e-post ikke sendt: ${adminEp.error}`);
  }

  return NextResponse.json<PortalLikeResponse>({ ok: true });
}
