"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import { MOCK_SESSION_LABEL } from "@/lib/portalMock";
import { PORTAL_LOGIN_INTENT_KEY } from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * The authgate — log in BEFORE the expensive generation. Honest copy from
 * portalContent; Supabase magic link (signInWithOtp), no passwords.
 *
 * On mount: getSession() + onAuthStateChange. The magic-link redirect lands
 * back on /start, supabaseBrowser() picks the session out of the URL, and
 * onAuthed fires exactly once (the parent auto-submits the stored draft).
 *
 * LOGIN ONLY: the returning-user mode — different copy («skriv e-posten du
 * brukte sist»), and the parent wires onAuthed to a /me boot instead of a
 * submit. Sending the link also stamps the one-shot vk-portal-login flag so
 * the draft-less boot after the magic-link reload knows it was a login.
 *
 * DEV MOCK: auto-passes with the fake session label after a short beat —
 * no Supabase call ever happens.
 */
interface AuthGateProps {
  devMock: boolean;
  /** Focus the heading on mount (arriving via interaction). */
  autoFocus?: boolean;
  /** Returning-user mode — login copy; the parent never auto-submits. */
  loginOnly?: boolean;
  /** Fires once with a usable access token — parent submits the draft
      (or, in loginOnly, boots via /me). */
  onAuthed: (accessToken: string) => void;
  /** Back to the last wizard step (or, in loginOnly, to the intro). */
  onBack: () => void;
}

const RESEND_COOLDOWN_S = 30;

const ERROR_ID = "vk-portal-auth-feil";
const COOLDOWN_ID = "vk-portal-auth-cooldown";

/**
 * An expired/used magic link sends the visitor back to /start with the
 * failure in the URL fragment (#error=access_denied&error_code=otp_expired&…)
 * or query string. Detect it, then clean the URL so a reload doesn't
 * re-trigger the message. Returns true when an auth error was present.
 * Exported for the slim admin gate (/start/admin) — same round trip.
 */
export function consumeAuthErrorFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const sources = [
    window.location.hash.replace(/^#/, ""),
    window.location.search.replace(/^\?/, ""),
  ];
  for (const src of sources) {
    if (!src) continue;
    const params = new URLSearchParams(src);
    if (params.get("error") || params.get("error_code")) {
      window.history.replaceState(null, "", window.location.pathname);
      return true;
    }
  }
  return false;
}

export default function AuthGate({
  devMock,
  autoFocus = false,
  loginOnly = false,
  onAuthed,
  onBack,
}: AuthGateProps) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  // The confirmation carries the key information («sjekk innboksen») — move
  // focus there so the label/disable swap on the submit button isn't the
  // only signal. Fires once: sent never flips back to false.
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  // Session detection — fires onAuthed exactly once.
  useEffect(() => {
    if (devMock) {
      const id = window.setTimeout(() => {
        if (!fired.current) {
          fired.current = true;
          onAuthed("dev-mock");
        }
      }, 400);
      return () => window.clearTimeout(id);
    }

    // Expired/used magic link? Say so — the visitor clicked the email link
    // and must not land on a silent, unexplained email form.
    if (consumeAuthErrorFromUrl()) {
      setError(t.authgate.lenkeUtlopt);
    }

    let supabase: SupabaseClient;
    try {
      supabase = supabaseBrowser();
    } catch (err) {
      console.error("[portal/authgate] supabase init failed", err);
      setError(t.authgate.feil);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!cancelled && token && !fired.current) {
        fired.current = true;
        onAuthed(token);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token;
      if (token && !fired.current) {
        fired.current = true;
        onAuthed(token);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [devMock, onAuthed, t.authgate.feil, t.authgate.lenkeUtlopt]);

  // Resend cooldown — one tick per second while armed.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sending || cooldown > 0 || devMock) return;
    const address = email.trim();
    // noValidate kills the native required-bubble — never fail silently.
    if (!address || !address.includes("@")) {
      setError(t.authgate.epostMangler);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const supabase = supabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: window.location.origin + "/start" },
      });
      if (otpError) throw otpError;
      // Returning user: stamp the one-shot login flag — the magic-link
      // reload boots draft-less, and this is how it knows to land row-less
      // addresses on the wizard with the «benken er ledig»-notice.
      if (loginOnly) {
        try {
          window.localStorage.setItem(PORTAL_LOGIN_INTENT_KEY, String(Date.now()));
        } catch {
          // localStorage unavailable — the in-tab path still works.
        }
      }
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      console.error("[portal/authgate] signInWithOtp failed", err);
      // Supabase email rate limit reads as status 429 / "rate limit" — that
      // is OUR ceiling, not a typo in their address. Say so honestly.
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "";
      const rateLimited = status === 429 || /rate limit/i.test(msg);
      setError(rateLimited ? t.authgate.forMangeLenker : t.authgate.feil);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="vk-portal-auth">
      <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
        {loginOnly ? t.authgate.loginTittel : t.authgate.tittel}
      </h1>
      <p className="vk-portal-lead">
        {loginOnly ? t.authgate.loginForklaring : t.authgate.forklaring}
      </p>

      {devMock ? (
        <p className="vk-mono vk-portal-mocksession" role="status">
          {MOCK_SESSION_LABEL}
        </p>
      ) : (
        <form className="vk-portal-auth-form" onSubmit={send} noValidate>
          <label className="vk-portal-label" htmlFor="vk-portal-epost">
            {t.authgate.epostLabel}
          </label>
          <div className="vk-portal-auth-row">
            <input
              id="vk-portal-epost"
              type="email"
              autoComplete="email"
              required
              className="vk-portal-input vk-portal-input--epost"
              placeholder={t.authgate.epostPlassholder}
              value={email}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ERROR_ID : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="vk-btn vk-btn--cta vk-portal-sendlenke"
              disabled={sending || cooldown > 0}
              aria-describedby={sent && cooldown > 0 ? COOLDOWN_ID : undefined}
            >
              {sent ? t.authgate.sendPaNytt : t.authgate.sendLenke}
            </button>
          </div>
          {sent ? (
            <p className="vk-portal-sent" role="status" tabIndex={-1} ref={sentRef}>
              {t.authgate.lenkeSendt}
            </p>
          ) : null}
          {sent && cooldown > 0 ? (
            <p className="vk-mono vk-portal-cooldown" id={COOLDOWN_ID}>
              {t.authgate.sendPaNyttOm.replace("{s}", String(cooldown))}
            </p>
          ) : null}
          {error ? (
            <p className="vk-portal-feilmelding" role="alert" id={ERROR_ID}>
              {error}
            </p>
          ) : null}
        </form>
      )}

      <button type="button" className="vk-portal-back" onClick={onBack}>
        <span aria-hidden="true">←</span> {t.wizard.tilbake}
      </button>
    </section>
  );
}
