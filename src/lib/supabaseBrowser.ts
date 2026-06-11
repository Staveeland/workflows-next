"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client for the customer portal (/start).
 *
 * Singleton — created once per tab. persistSession + detectSessionInUrl so
 * the magic-link round trip works: signInWithOtp({ emailRedirectTo:
 * window.location.origin + "/start" }) sends the visitor to their inbox;
 * when they land back on /start the client picks the session out of the URL
 * and getSession() resolves.
 *
 * Anon key ONLY — RLS owns authorization. The service key never appears in
 * portal code (see src/lib/supabase.ts for the unrelated chat admin client).
 */

let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  cached = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}
