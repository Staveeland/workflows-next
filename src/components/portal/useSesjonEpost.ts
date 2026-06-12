"use client";

import { useEffect, useState } from "react";
import { MOCK_SESSION_LABEL } from "@/lib/portalMock";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * The signed-in address — for the quiet topbar span on /start and
 * /start/admin («who am I in as?»). getSession() answers first paint;
 * onAuthStateChange keeps it honest across sign-in/sign-out without a
 * reload. Dev mock has no Supabase session — show the mock label so the
 * chrome still demonstrates itself.
 *
 * Returns null while unknown or signed out — callers render nothing then.
 */
export function useSesjonEpost(devMock: boolean): string | null {
  // devMock is fixed for the lifetime of the page (server prop) — the mock
  // label can be the initial state; no Supabase call ever happens then.
  const [epost, setEpost] = useState<string | null>(
    devMock ? MOCK_SESSION_LABEL : null
  );

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    try {
      const supabase = supabaseBrowser();
      void supabase.auth.getSession().then(({ data }) => {
        if (!cancelled) setEpost(data.session?.user.email ?? null);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setEpost(session?.user.email ?? null);
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    } catch {
      // Supabase init failed (missing env) — the span simply stays away.
      return;
    }
  }, [devMock]);

  return epost;
}
