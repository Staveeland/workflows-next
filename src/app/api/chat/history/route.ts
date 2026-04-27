import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !EMAIL_RX.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-post" }, { status: 400 });
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
