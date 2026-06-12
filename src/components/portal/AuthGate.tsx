"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import { MOCK_SESSION_LABEL } from "@/lib/portalMock";
import { PORTAL_LOGIN_INTENT_KEY } from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import "@/styles/verksted/authgate.css";

/**
 * The authgate — log in BEFORE the expensive generation. Honest copy from
 * portalContent; Supabase magic link (signInWithOtp), no passwords.
 *
 * On mount: getSession() + onAuthStateChange. The magic-link redirect lands
 * back on /start, supabaseBrowser() picks the session out of the URL, and
 * onAuthed fires exactly once (the parent auto-submits the stored draft).
 *
 * TWO DOORS, SAME EMAIL: the mail carries a one-time code (6–10 digits,
 * per the project's «Email OTP Length» setting) AND the
 * magic link (the Supabase template must render {{ .Token }} — see
 * docs/supabase-epostmaler.md). The code is the cross-browser fix: Gmail/
 * Outlook open magic links in THEIR in-app browser, stranding the draft in
 * the browser where the visitor typed it. Typing the code here
 * (verifyOtp type "email") creates the session in THIS tab — the draft and
 * the session finally meet. The link stays as the lazy path.
 *
 * LOGIN ONLY: the returning-user mode — different copy («skriv e-posten du
 * brukte sist»), and the parent wires onAuthed to a /me boot instead of a
 * submit. Sending the link also stamps the one-shot vk-portal-login flag so
 * the draft-less boot after the magic-link reload knows it was a login.
 * (The code path needs no flag — it never leaves this tab.)
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
// Supabase's «Email OTP Length» is project-config (6–10 digits) — Petters
// project says 8. Accept the whole legal range so a dashboard setting can
// never lock customers out of the code door again.
const OTP_MIN = 6;
const OTP_MAX = 10;

const ERROR_ID = "vk-portal-auth-feil";
const COOLDOWN_ID = "vk-portal-auth-cooldown";
const SENT_ID = "vk-portal-auth-sendt";

/** Which field an error belongs to — drives aria-invalid/describedby. */
type Feil = { tekst: string; felt: "epost" | "kode" };

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
  const [kode, setKode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<Feil | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const kodeRef = useRef<HTMLInputElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  // After send the action moves to the code field — focus it (the «sjekk
  // e-posten»-confirmation is a role=status live region AND the field's
  // aria-describedby, so the announcement isn't lost by the move). Fires
  // once: sent never flips back to false.
  useEffect(() => {
    if (sent) kodeRef.current?.focus();
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
      setError({ tekst: t.authgate.lenkeUtlopt, felt: "epost" });
    }

    let supabase: SupabaseClient;
    try {
      supabase = supabaseBrowser();
    } catch (err) {
      console.error("[portal/authgate] supabase init failed", err);
      setError({ tekst: t.authgate.feil, felt: "epost" });
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
      setError({ tekst: t.authgate.epostMangler, felt: "epost" });
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
      // A resend mints a FRESH code — stale digits must not linger.
      setKode("");
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      console.error("[portal/authgate] signInWithOtp failed", err);
      // Supabase email rate limit reads as status 429 / "rate limit" — that
      // is OUR ceiling, not a typo in their address. Say so honestly.
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "";
      const rateLimited = status === 429 || /rate limit/i.test(msg);
      setError({
        tekst: rateLimited ? t.authgate.forMangeLenker : t.authgate.feil,
        felt: "epost",
      });
    } finally {
      setSending(false);
    }
  }

  // The cross-browser door: the visitor types the one-time code from the
  // email INTO THIS TAB — verifyOtp sets the session right here, where the
  // draft lives. onAuthStateChange above fires onAuthed; the direct call is
  // belt and braces (fired guards the double).
  async function verifyKode(e: FormEvent) {
    e.preventDefault();
    if (verifying || devMock) return;
    if (kode.length < OTP_MIN || kode.length > OTP_MAX) {
      setError({ tekst: t.authgate.kodeMangler, felt: "kode" });
      kodeRef.current?.focus();
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: kode,
        type: "email",
      });
      if (otpError) throw otpError;
      const token = data.session?.access_token;
      if (token && !fired.current) {
        fired.current = true;
        onAuthed(token);
      }
    } catch (err) {
      console.error("[portal/authgate] verifyOtp failed", err);
      // GoTrue answers 400/401/403 («Token has expired or is invalid») for a
      // wrong or stale code — that deserves the precise message, not the
      // generic «sjekk adressen» one.
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : "";
      const ugyldig =
        status === 400 ||
        status === 401 ||
        status === 403 ||
        /invalid|expired/i.test(msg);
      setError({
        tekst: ugyldig ? t.authgate.kodeUgyldig : t.authgate.feil,
        felt: "kode",
      });
      kodeRef.current?.focus();
      kodeRef.current?.select();
    } finally {
      setVerifying(false);
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
        <>
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
                aria-invalid={error?.felt === "epost" ? true : undefined}
                aria-describedby={error?.felt === "epost" ? ERROR_ID : undefined}
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
            {sent && cooldown > 0 ? (
              <p className="vk-mono vk-portal-cooldown" id={COOLDOWN_ID}>
                {t.authgate.sendPaNyttOm.replace("{s}", String(cooldown))}
              </p>
            ) : null}
          </form>

          {sent ? (
            // Its own <form>: Enter in the code field must verify, not
            // re-send the email (forms can't nest — sibling it is).
            <form className="vk-portal-kodeform" onSubmit={verifyKode} noValidate>
              <p className="vk-portal-sent" role="status" id={SENT_ID}>
                {t.authgate.lenkeSendt}
              </p>
              <label className="vk-portal-label" htmlFor="vk-portal-kode">
                {t.authgate.kodeLabel}
              </label>
              <div className="vk-portal-kode-row">
                {/* No maxLength — browsers truncate BEFORE onChange, which
                    would mangle pasted «123 456». The digit-strip below is
                    the real gate. */}
                <input
                  id="vk-portal-kode"
                  ref={kodeRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="vk-portal-input vk-portal-input--kode"
                  placeholder={t.authgate.kodePlassholder}
                  value={kode}
                  aria-invalid={error?.felt === "kode" ? true : undefined}
                  aria-describedby={
                    error?.felt === "kode" ? `${SENT_ID} ${ERROR_ID}` : SENT_ID
                  }
                  onChange={(e) =>
                    setKode(e.target.value.replace(/\D/g, "").slice(0, OTP_MAX))
                  }
                />
                <button
                  type="submit"
                  className="vk-btn vk-btn--cta vk-portal-kodeknapp"
                  disabled={verifying}
                >
                  {t.authgate.loggInnMedKode}
                </button>
              </div>
              <p className="vk-mono vk-portal-ellerlenke">{t.authgate.ellerLenke}</p>
            </form>
          ) : null}

          {error ? (
            <p className="vk-portal-feilmelding" role="alert" id={ERROR_ID}>
              {error.tekst}
            </p>
          ) : null}
        </>
      )}

      <button type="button" className="vk-portal-back" onClick={onBack}>
        <span aria-hidden="true">←</span> {t.wizard.tilbake}
      </button>
    </section>
  );
}
