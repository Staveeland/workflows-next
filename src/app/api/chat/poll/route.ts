import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const since = url.searchParams.get("since");
  if (!email || !EMAIL_RX.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-post" }, { status: 400 });
  }
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
  return NextResponse.json({ messages: data || [] });
}
