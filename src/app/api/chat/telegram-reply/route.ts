import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type InboundReply = {
  text?: string;
  fromChatId?: string | number;
  replyToMessageId?: number;
};

export async function POST(req: Request) {
  // Shared secret so only our n8n trigger can post here
  const secret = req.headers.get("x-inbound-secret");
  if (!process.env.INBOUND_REPLY_SECRET || secret !== process.env.INBOUND_REPLY_SECRET) {
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

  const { error: insErr } = await sb.from("chat_messages").insert({
    email: anchor.email,
    role: "petter",
    text,
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, email: anchor.email });
}
