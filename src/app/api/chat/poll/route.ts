import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyChatSession } from "@/lib/chatSession";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

// The client polls every 4s (≈15/min). 60/min per IP leaves room for a few
// open tabs without letting anyone hose the endpoint.
const RL_MAX = 60;
const RL_WINDOW_MS = 60_000;

// last_seen is the «customer is at the panel» signal the e-mail notifier in
// telegram-reply relies on. Touch it at most once a minute to keep the
// write volume sane at a 4s poll cadence.
const LAST_SEEN_TOUCH_MS = 60_000;

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: "chat:poll",
    identifier: ip,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  // Identity comes ONLY from the signed HttpOnly cookie (set by handover/
  // send) — never from query params. Closes the read-anyone's-thread IDOR.
  const email = verifyChatSession(req);
  if (!email) {
    return NextResponse.json({ error: "Ingen chat-sesjon" }, { status: 401 });
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  const sb = supabaseAdmin();
  let q = sb
    .from("chat_messages")
    .select("id, role, text, created_at")
    .eq("email", email)
    .eq("role", "petter")
    .order("created_at", { ascending: true });
  if (since) q = q.gt("created_at", since);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Polling counts as presence — conditional update (only when stale) so
  // 4s ticks don't turn into 4s writes. Fail-silent: presence is best-effort.
  try {
    const staleBefore = new Date(Date.now() - LAST_SEEN_TOUCH_MS).toISOString();
    await sb
      .from("chat_users")
      .update({ last_seen: new Date().toISOString() })
      .eq("email", email)
      .or(`last_seen.is.null,last_seen.lt.${staleBefore}`);
  } catch {
    /* presence only */
  }

  return NextResponse.json({ messages: data || [] });
}
