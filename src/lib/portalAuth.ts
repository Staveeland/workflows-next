import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Kundeportalen — server-side auth helper for the /api/portal/* routes.
 *
 * Reads the Authorization: Bearer <supabase access_token> header and builds
 * a Supabase client with the ANON key + the user's token as a global header.
 * Every PostgREST/Storage call from that client then runs AS the user, so
 * RLS enforces ownership. The service key is NEVER used in portal code.
 */

export type PortalAuth = {
  /** Client scoped to the calling user — RLS does authorization. */
  supabase: SupabaseClient;
  user: User;
};

function readBearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  return token || null;
}

/**
 * Validates the bearer token via auth.getUser(). Returns null on a missing
 * or invalid token (routes answer 401). Throws only on missing server env.
 */
export async function portalAuth(req: Request): Promise<PortalAuth | null> {
  const token = readBearer(req);
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { supabase, user: data.user };
}

/** Standard 401 body shared by the portal routes. */
export function unauthorized(): Response {
  return new Response(
    JSON.stringify({ error: "Ikke innlogget. Logg inn og prøv igjen." }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
