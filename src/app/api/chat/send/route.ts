import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramToPetter } from "@/lib/telegram";
import { chatCookieOptions, signChatSession } from "@/lib/chatSession";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Body = { email?: string; text?: string };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 4000;

// 30 requests / minute per IP — generous enough for an engaged conversation,
// strict enough to make spam-flood unattractive.
const RL_MAX = 30;
const RL_WINDOW_MS = 60_000;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: "chat:send",
    identifier: ip,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const text = (body.text || "").trim().slice(0, MAX_LEN);
  if (!email || !EMAIL_RX.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-post" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Tom melding" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("chat_users")
    .select("email, name")
    .eq("email", email)
    .maybeSingle();
  if (!user) {
    return NextResponse.json({ error: "Ukjent bruker" }, { status: 404 });
  }

  // Get the anchor telegram_message_id (most recent we have)
  const { data: anchor } = await sb
    .from("chat_messages")
    .select("telegram_message_id")
    .eq("email", email)
    .not("telegram_message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const namePart = user.name || email;
  const tgText = `💬 ${namePart}:\n${text}`;
  let tg = await sendTelegramToPetter({
    text: tgText,
    replyToMessageId: anchor?.telegram_message_id ?? undefined,
  });
  if (!tg.ok) {
    // One quiet retry — Telegram hiccups are usually transient. If the
    // anchor reply was the problem (deleted message etc.), drop the
    // threading rather than the message.
    tg = await sendTelegramToPetter({ text: tgText });
  }

  const { data: inserted, error: insErr } = await sb
    .from("chat_messages")
    .insert({
      email,
      role: "user",
      text,
      telegram_message_id: tg.messageId,
    })
    .select("id, created_at")
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  await sb
    .from("chat_users")
    .update({ last_seen: new Date().toISOString() })
    .eq("email", email);

  // The client surfaces this as «Levert» / «kom ikke fram» on the note —
  // the message IS stored either way, but Petter's Telegram ping may have
  // failed and the visitor deserves to know.
  const res = NextResponse.json({
    ok: true,
    id: inserted.id,
    created_at: inserted.created_at,
    delivered: tg.ok,
  });

  // (Re)issue the signed session cookie — this is also the backwards-compat
  // path: existing localStorage-identity users get their cookie on the next
  // send, and history/poll start working again.
  const session = signChatSession(email);
  if (session) {
    const { name, ...opts } = chatCookieOptions;
    res.cookies.set(name, session, opts);
  }
  return res;
}
