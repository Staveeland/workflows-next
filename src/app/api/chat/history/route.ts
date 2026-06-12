import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyChatSession } from "@/lib/chatSession";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

// 20 restores per minute per IP — a visitor loads history once per panel
// session; anything past this is scripted.
const RL_MAX = 20;
const RL_WINDOW_MS = 60_000;

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: "chat:history",
    identifier: ip,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  // Identity comes ONLY from the signed HttpOnly cookie (set by handover/
  // send) — never from query params. NOTE: the cookie is still issued on a
  // self-claimed e-mail (handover/send verify nothing), so this raises the
  // bar (forces a noisy write + Telegram ping) without proving ownership.
  // Real fix when chat identity matters more: OTP-verify the e-mail first.
  const email = verifyChatSession(req);
  if (!email) {
    return NextResponse.json({ error: "Ingen chat-sesjon" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("chat_users")
    .select("email, name")
    .eq("email", email)
    .maybeSingle();
  if (!user) return NextResponse.json({ messages: [], user: null });

  const { data, error } = await sb
    .from("chat_messages")
    .select("id, role, text, created_at")
    .eq("email", email)
    .in("role", ["user", "assistant", "petter"])
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user, messages: data || [] });
}
