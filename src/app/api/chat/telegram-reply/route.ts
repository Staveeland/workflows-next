import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPetterHarSvart } from "@/lib/chatEpost";

export const runtime = "nodejs";

// E-mail the customer when Petter replies and they are not at the panel:
// «away» = no poll/send the last 3 minutes (poll touches last_seen).
const AWAY_MS = 3 * 60_000;
// Max one notification e-mail per 30 minutes per customer. Proxy check:
// a previous petter-reply inside the window means we either mailed already
// or the exchange was live — both mean «don't mail again now».
const EMAIL_DEDUP_MS = 30 * 60_000;

type InboundReply = {
  text?: string;
  fromChatId?: string | number;
  replyToMessageId?: number;
};

export async function POST(req: Request) {
  // Shared secret so only our n8n trigger can post here (timing-safe)
  const gitt = Buffer.from(req.headers.get("x-inbound-secret") ?? "");
  const ventet = Buffer.from(process.env.INBOUND_REPLY_SECRET ?? "");
  if (
    ventet.length === 0 ||
    gitt.length !== ventet.length ||
    !timingSafeEqual(gitt, ventet)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: InboundReply;
  try {
    body = (await req.json()) as InboundReply;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  const replyToMessageId = body.replyToMessageId;
  const fromChatId = String(body.fromChatId || "");

  if (!text) return NextResponse.json({ error: "Tom melding" }, { status: 400 });
  if (!replyToMessageId) {
    return NextResponse.json(
      { error: "Mangler reply_to_message_id — Petter må bruke Reply-funksjonen" },
      { status: 200 }
    );
  }
  if (
    process.env.TELEGRAM_PETTER_CHAT_ID &&
    fromChatId &&
    fromChatId !== String(process.env.TELEGRAM_PETTER_CHAT_ID)
  ) {
    return NextResponse.json({ error: "Forbidden sender" }, { status: 403 });
  }

  const sb = supabaseAdmin();

  // Look up the email by the message that was replied to
  const { data: anchor, error: anchorErr } = await sb
    .from("chat_messages")
    .select("email")
    .eq("telegram_message_id", replyToMessageId)
    .maybeSingle();

  if (anchorErr) {
    return NextResponse.json({ error: anchorErr.message }, { status: 500 });
  }
  if (!anchor) {
    return NextResponse.json(
      { error: "Fant ikke kunden for denne tråden" },
      { status: 404 }
    );
  }

  // Was there already a petter-reply inside the dedup window BEFORE this
  // one? Checked before inserting so the new row never matches itself.
  let recentPetterReply = false;
  try {
    const dedupAfter = new Date(Date.now() - EMAIL_DEDUP_MS).toISOString();
    const { count } = await sb
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", anchor.email)
      .eq("role", "petter")
      .gt("created_at", dedupAfter);
    recentPetterReply = (count ?? 0) > 0;
  } catch {
    recentPetterReply = true; // unknown → err on the quiet side, skip mail
  }

  const { error: insErr } = await sb.from("chat_messages").insert({
    email: anchor.email,
    role: "petter",
    text,
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // «Petter har svart deg»-e-post — ONLY when the customer is away from the
  // panel, max one per 30 min. Fail-silent like every other notification:
  // a mail hiccup must never break the Telegram → chat pipe.
  try {
    if (!recentPetterReply) {
      const { data: chatUser } = await sb
        .from("chat_users")
        .select("name, last_seen")
        .eq("email", anchor.email)
        .maybeSingle();
      const lastSeen = chatUser?.last_seen
        ? new Date(chatUser.last_seen).getTime()
        : 0;
      const away =
        !Number.isFinite(lastSeen) || Date.now() - lastSeen > AWAY_MS;
      if (away) {
        await sendPetterHarSvart({ to: anchor.email, name: chatUser?.name });
      }
    }
  } catch {
    /* fail-silent — the reply itself is already stored */
  }

  return NextResponse.json({ ok: true, email: anchor.email });
}
