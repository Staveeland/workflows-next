import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { escapeMarkdown, sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";

type Body = { email?: string; text?: string };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 4000;

export async function POST(req: Request) {
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

  const namePart = escapeMarkdown(user.name || email);
  const tgText = `💬 *${namePart}:*\n${escapeMarkdown(text)}`;
  const tg = await sendTelegramToPetter({
    text: tgText,
    replyToMessageId: anchor?.telegram_message_id ?? undefined,
  });

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

  return NextResponse.json({
    ok: true,
    id: inserted.id,
    created_at: inserted.created_at,
  });
}
