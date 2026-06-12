import { NextResponse } from "next/server";
import { bedriftFraAnswers, epostAdminVarsel, epostGodkjent, sendPortalEpost } from "@/lib/epost";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
// Plain data — the locked vilkår text the customer ticked. The SERVER picks
// the canonical string by the row's language; a client string is never trusted.
import { portalContent } from "@/lib/portalContent";
import { mockGodkjenn, portalMockEnabled } from "@/lib/portalMock";
import type {
  PortalGodkjennBody,
  PortalGodkjennResponse,
  PortalTilbud,
} from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";

// Approvals are rare and cheap, but each one pings Petter's phone — keyed
// on the authenticated user (not IP), same posture as /like.
const RL_MAX = 5;
const RL_WINDOW_MS = 10 * 60_000;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<PortalGodkjennBody>)
      : {};
  const id = body.id;
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }
  // The terms checkbox is a binding step — no consent, no transition.
  if (body.vilkarGodtatt !== true) {
    return NextResponse.json({ error: "Vilkårene må godtas" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalGodkjennResponse>(
      await mockGodkjenn(id, body.vilkarGodtatt === true)
    );
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/godkjenn] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:godkjenn",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  // Fetch the row first (RLS hides other users' rows → acts as the
  // ownership check) so the Telegram message and the receipt e-post can
  // quote the price — and the e-post can speak the row's language.
  const { data: row, error: selectError } = await supabase
    .from("kartlegginger")
    .select("id, tilbud, email, lang, answers")
    .eq("id", id)
    .maybeSingle();
  if (selectError) {
    console.error("[portal/godkjenn] select failed", selectError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  // Idempotent: only a row sitting in «tilbud_sendt» can flip to «videre».
  // Re-approvals (already videre) and premature calls (no quote sent yet)
  // change nothing and send no Telegram — a loop can't flood Petter, and a
  // row can't be approved before the quote exists.
  // The transition also stamps godkjent_vilkar with the SERVER's canonical
  // vilkår text in the row's language — the exact wording the customer saw.
  const lang = row.lang === "en" ? "en" : "no";
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("kartlegginger")
    .update({
      status: "videre",
      godkjent_at: now,
      godkjent_vilkar: portalContent[lang].tilbud.vilkar,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "tilbud_sendt")
    .select("id");
  if (updateError) {
    console.error("[portal/godkjenn] update failed", updateError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    // Nothing transitioned — already approved (or no quote sent yet).
    return NextResponse.json<PortalGodkjennResponse>({ ok: true });
  }

  // Notify Petter. Missing Telegram env (or a Telegram hiccup) must never
  // fail the approval — log and continue.
  const tilbud = row.tilbud as PortalTilbud | null;
  const text = `✅ Portal: ${user.email ?? "ukjent e-post"} godkjente tilbudet (${
    tilbud?.pris ?? "ukjent pris"
  }). På tide å rigge benken.`;
  const tg = await sendTelegramToPetter({ text });
  if (!tg.ok) {
    console.log(`[portal/godkjenn] Telegram not sent (${tg.error}): ${text}`);
  }

  // Receipt to the customer — same fail-silent posture as the Telegram ping.
  const kundeEpost = (row.email as string | null) || user.email || null;
  if (kundeEpost) {
    const ep = await sendPortalEpost({
      to: kundeEpost,
      ...epostGodkjent(lang, { pris: tilbud?.pris ?? null }),
    });
    if (!ep.ok) {
      console.log(`[portal/godkjenn] e-post (godkjent) ikke sendt: ${ep.error}`);
    }
  }

  // Same event to Petter's inbox (Telegram already pinged above).
  const adminEp = await sendPortalEpost({
    to: "petter@workflows.no",
    ...epostAdminVarsel("godkjent", {
      email: kundeEpost ?? "ukjent e-post",
      bedrift: bedriftFraAnswers(row.answers),
      pris: tilbud?.pris ?? null,
    }),
  });
  if (!adminEp.ok) {
    console.log(`[portal/godkjenn] admin-e-post ikke sendt: ${adminEp.error}`);
  }

  return NextResponse.json<PortalGodkjennResponse>({ ok: true });
}
