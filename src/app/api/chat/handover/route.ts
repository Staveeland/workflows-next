import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { escapeMarkdown, sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";

type Body = {
  email?: string;
  name?: string;
  initialRequest?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
};

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const initialRequest = (body.initialRequest || "").trim();

  if (!email || !EMAIL_RX.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-post" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Mangler navn" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Upsert user
  const { error: upsertErr } = await sb
    .from("chat_users")
    .upsert(
      {
        email,
        name,
        last_seen: new Date().toISOString(),
        initial_request: initialRequest || null,
      },
      { onConflict: "email" }
    );
  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  // Persist any AI history we have so the conversation is intact
  if (Array.isArray(body.history) && body.history.length) {
    const rows = body.history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.text)
      .map((m) => ({ email, role: m.role, text: m.text }));
    if (rows.length) {
      // Avoid duplicating on retries — only insert if no messages exist yet
      const { count } = await sb
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("email", email);
      if (!count) {
        await sb.from("chat_messages").insert(rows);
      }
    }
  }

  // Notify Petter on Telegram. The message_id we send is the "anchor" he replies to.
  const safeName = escapeMarkdown(name);
  const safeEmail = escapeMarkdown(email);
  const safeReq = initialRequest
    ? "\n\n_" + escapeMarkdown(initialRequest) + "_"
    : "";
  const text =
    `🟢 *Ny direkte-chat fra workflows.no*\n` +
    `👤 ${safeName}\n` +
    `📧 ${safeEmail}` +
    safeReq +
    `\n\n_Svar med Telegram «Reply» på denne meldingen — eller på en hvilken som helst melding fra denne kunden — så havner svaret direkte i chatten på siden._`;

  const tg = await sendTelegramToPetter({ text });
  // Save a system message that anchors the Telegram conversation
  if (tg.ok && tg.messageId) {
    await sb.from("chat_messages").insert({
      email,
      role: "system",
      text: `Direktechat startet`,
      telegram_message_id: tg.messageId,
    });
  }

  return NextResponse.json({
    ok: true,
    email,
    name,
    telegramSent: tg.ok,
  });
}
