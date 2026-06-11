"use client";

import "@/styles/verksted/base.css";
import "@/styles/verksted/portal.css";
import "@/styles/verksted/admin.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";
import { WorkflowsLogo } from "@/components/verksted/WorkflowsLogo";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import {
  ADMIN_EMAIL,
  type AdminDetaljResponse,
  type AdminKartlegging,
  type AdminListItem,
  type AdminListeResponse,
  type PortalTilbud,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { consumeAuthErrorFromUrl } from "@/components/portal/AuthGate";
import AdminDetalj, { formatDato } from "@/components/portal/AdminDetalj";

/**
 * Verkstedkontoret (/start/admin) — Petters bakrom. Same bare chrome and
 * state-machine shape as PortalApp, but quiet and dense: no rail, no
 * ceremony, mono labels.
 *
 *   auth → (feil dør? denied) → liste → detalj → liste …
 *
 * Auth is the SAME magic-link pattern as /start; the server routes verify
 * ADMIN_EMAIL + admin RLS does authorization. The client-side email check
 * here only picks WHICH SCREEN to show — never trusted for access.
 *
 * DEV MOCK: auto-admin, three canned kartlegginger from portalMock.ts.
 */

type Phase = "auth" | "denied" | "liste" | "detalj";
type Lasting = "laster" | "klar" | "feil";

class AdminApiError extends Error {
  status: number;
  constructor(path: string, status: number) {
    super(`${path} → ${status}`);
    this.status = status;
  }
}

/* ── Slim admin gate — AuthGate's pattern, /start/admin's redirect ── */

const RESEND_COOLDOWN_S = 30;
const GATE_FEIL_ID = "vk-adm-auth-feil";

function AdminAuthGate({
  devMock,
  onAuthed,
}: {
  devMock: boolean;
  /** Fires once with a usable token + the session email. */
  onAuthed: (token: string, email: string | null) => void;
}) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  // Session detection — fires onAuthed exactly once (AuthGate's pattern).
  useEffect(() => {
    if (devMock) {
      const id = window.setTimeout(() => {
        if (!fired.current) {
          fired.current = true;
          onAuthed("dev-mock", ADMIN_EMAIL);
        }
      }, 400);
      return () => window.clearTimeout(id);
    }

    if (consumeAuthErrorFromUrl()) {
      setError(t.authgate.lenkeUtlopt);
    }

    let supabase: SupabaseClient;
    try {
      supabase = supabaseBrowser();
    } catch (err) {
      console.error("[portal/admin] supabase init failed", err);
      setError(t.authgate.feil);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!cancelled && session?.access_token && !fired.current) {
        fired.current = true;
        onAuthed(session.access_token, session.user.email ?? null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && !fired.current) {
        fired.current = true;
        onAuthed(session.access_token, session.user.email ?? null);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [devMock, onAuthed, t.authgate.feil, t.authgate.lenkeUtlopt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sending || cooldown > 0 || devMock) return;
    const address = email.trim();
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
        options: { emailRedirectTo: window.location.origin + "/start/admin" },
      });
      if (otpError) throw otpError;
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      console.error("[portal/admin] signInWithOtp failed", err);
      setError(t.authgate.feil);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="vk-portal-auth">
      <h1 className="vk-display vk-portal-h1">{t.admin.login.tittel}</h1>
      <p className="vk-portal-lead">{t.admin.login.forklaring}</p>
      <form className="vk-portal-auth-form" onSubmit={send} noValidate>
        <label className="vk-portal-label" htmlFor="vk-adm-epost">
          {t.authgate.epostLabel}
        </label>
        <div className="vk-portal-auth-row">
          <input
            id="vk-adm-epost"
            type="email"
            autoComplete="email"
            required
            className="vk-portal-input vk-portal-input--epost"
            placeholder={t.authgate.epostPlassholder}
            value={email}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? GATE_FEIL_ID : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="vk-btn vk-btn--cta vk-portal-sendlenke"
            disabled={sending || cooldown > 0}
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
          <p className="vk-mono vk-portal-cooldown">
            {t.authgate.sendPaNyttOm.replace("{s}", String(cooldown))}
          </p>
        ) : null}
        {error ? (
          <p className="vk-portal-feilmelding" role="alert" id={GATE_FEIL_ID}>
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}

/* ── The office shell ── */

export default function AdminApp({ devMock = false }: { devMock?: boolean }) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [phase, setPhase] = useState<Phase>("auth");
  const [rows, setRows] = useState<AdminListItem[]>([]);
  const [listeState, setListeState] = useState<Lasting>("laster");
  const [valgt, setValgt] = useState<AdminKartlegging | null>(null);
  const [detaljState, setDetaljState] = useState<Lasting>("laster");
  const sisteIdRef = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Phase changes unmount whatever held focus — land on the new heading.
  // (Not on first render: page load must not steal focus from the URL bar.)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [phase]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (devMock) return "dev-mock";
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }, [devMock]);

  const apiFetch = useCallback(
    async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
      const res = await fetch(path, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
      });
      if (!res.ok) throw new AdminApiError(path, res.status);
      return (await res.json()) as T;
    },
    []
  );

  /** 401 → back through the gate; 403 → ikke din dør. Else: local feil. */
  const handleApiError = useCallback((err: unknown, setState: (s: Lasting) => void) => {
    if (err instanceof AdminApiError && err.status === 401) {
      setPhase("auth");
      return;
    }
    if (err instanceof AdminApiError && err.status === 403) {
      setPhase("denied");
      return;
    }
    console.error("[portal/admin] fetch failed", err);
    setState("feil");
  }, []);

  const lastListe = useCallback(async () => {
    setListeState("laster");
    setPhase("liste");
    const token = await getToken();
    if (!token) {
      setPhase("auth");
      return;
    }
    try {
      const json = await apiFetch<AdminListeResponse>("/api/portal/admin/liste", token);
      setRows(json.kartlegginger);
      setListeState("klar");
    } catch (err) {
      handleApiError(err, setListeState);
    }
  }, [getToken, apiFetch, handleApiError]);

  const onAuthed = useCallback(
    (token: string, email: string | null) => {
      // Screen routing only — the SERVER decides access (403 → denied).
      if (email !== ADMIN_EMAIL) {
        setPhase("denied");
        return;
      }
      void lastListe();
    },
    [lastListe]
  );

  const apneDetalj = useCallback(
    async (id: string) => {
      sisteIdRef.current = id;
      setValgt(null);
      setDetaljState("laster");
      setPhase("detalj");
      const token = await getToken();
      if (!token) {
        setPhase("auth");
        return;
      }
      try {
        const json = await apiFetch<AdminDetaljResponse>(
          `/api/portal/admin/liste?id=${encodeURIComponent(id)}`,
          token
        );
        if (!json.kartlegging) throw new AdminApiError("admin/liste?id", 404);
        setValgt(json.kartlegging);
        setDetaljState("klar");
      } catch (err) {
        handleApiError(err, setDetaljState);
      }
    },
    [getToken, apiFetch, handleApiError]
  );

  const tilListe = useCallback(() => {
    setValgt(null);
    setPhase("liste");
  }, []);

  /** POST the quote; flip status optimistically, revert on failure. */
  const sendTilbud = useCallback(
    async (tilbud: PortalTilbud): Promise<boolean> => {
      const k = valgt;
      if (!k) return false;
      const token = await getToken();
      if (!token) {
        setPhase("auth");
        return false;
      }
      const prevValgt = k;
      const prevRows = rows;
      setValgt({
        ...k,
        status: "tilbud_sendt",
        tilbud,
        tilbudSendtAt: new Date().toISOString(),
      });
      setRows((rs) =>
        rs.map((r) => (r.id === k.id ? { ...r, status: "tilbud_sendt" } : r))
      );
      try {
        await apiFetch("/api/portal/admin/tilbud", token, {
          method: "POST",
          body: JSON.stringify({ id: k.id, tilbud }),
        });
        return true;
      } catch (err) {
        console.error("[portal/admin] tilbud failed", err);
        setValgt(prevValgt);
        setRows(prevRows);
        return false;
      }
    },
    [valgt, rows, getToken, apiFetch]
  );

  return (
    <div
      className={`vk vk-portal-root ${fraunces.variable} ${schibsted.variable} ${spline.variable}`}
    >
      <header className="vk-portal-topbar">
        <Link href="/" className="vk-portal-wordmark">
          <WorkflowsLogo className="vk-portal-logosvg" />
          <span className="vk-sr">{t.header.hjemLabel}</span>
        </Link>
        {devMock ? (
          <span className="vk-mono vk-portal-mockbadge">dev-mock</span>
        ) : null}
        <span className="vk-mono vk-adm-merke">{t.admin.kicker}</span>
      </header>

      <main id="main" className="vk-adm-stage">
        {phase === "auth" ? (
          <AdminAuthGate devMock={devMock} onAuthed={onAuthed} />
        ) : null}

        {phase === "denied" ? (
          <section className="vk-portal-intro">
            <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
              {t.admin.ikkeDinDor.tittel}
            </h1>
            <p className="vk-portal-lead">{t.admin.ikkeDinDor.tekst}</p>
            <div className="vk-portal-introrow">
              <Link href="/" className="vk-btn">
                {t.admin.ikkeDinDor.hjem}
              </Link>
            </div>
          </section>
        ) : null}

        {phase === "liste" ? (
          <section className="vk-adm-listevisning">
            <p className="vk-kicker">{t.admin.kicker}</p>
            <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-adm-h1">
              {t.admin.liste.tittel}
            </h1>

            {listeState === "laster" ? (
              <p className="vk-mono vk-adm-tomt" role="status">
                {t.admin.felles.henter}
              </p>
            ) : null}

            {listeState === "feil" ? (
              <>
                <p className="vk-portal-feilmelding" role="alert">
                  {t.admin.felles.feil}
                </p>
                <div>
                  <button type="button" className="vk-btn" onClick={() => void lastListe()}>
                    {t.admin.felles.provIgjen}
                  </button>
                </div>
              </>
            ) : null}

            {listeState === "klar" ? (
              rows.length === 0 ? (
                <p className="vk-adm-tomt">{t.admin.liste.tom}</p>
              ) : (
                <>
                  <p className="vk-mono vk-adm-antall">
                    {t.admin.liste.antallTemplate.replace("{n}", String(rows.length))}
                  </p>
                  <ol className="vk-adm-liste">
                    {rows.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="vk-adm-rad"
                          onClick={() => void apneDetalj(row.id)}
                        >
                          <span className="vk-mono vk-adm-dato">
                            {formatDato(row.createdAt, lang)}
                          </span>
                          <span className="vk-adm-bedrift">
                            {row.bedriftNavn ?? t.admin.liste.ukjentBedrift}
                          </span>
                          <span className="vk-adm-epost">{row.email}</span>
                          <span className="vk-mono vk-adm-anbefaling">
                            {row.anbefaling ? t.admin.anbefaling[row.anbefaling] : "—"}
                          </span>
                          <span className="vk-adm-chip">{t.admin.status[row.status]}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </>
              )
            ) : null}
          </section>
        ) : null}

        {phase === "detalj" ? (
          detaljState === "laster" ? (
            <p className="vk-mono vk-adm-tomt" role="status">
              {t.admin.felles.henter}
            </p>
          ) : detaljState === "feil" ? (
            <section className="vk-adm-listevisning">
              <button type="button" className="vk-portal-back" onClick={tilListe}>
                <span aria-hidden="true">←</span> {t.admin.detalj.tilbake}
              </button>
              <p className="vk-portal-feilmelding" role="alert">
                {t.admin.felles.feil}
              </p>
              <div>
                <button
                  type="button"
                  className="vk-btn"
                  onClick={() => {
                    if (sisteIdRef.current) void apneDetalj(sisteIdRef.current);
                  }}
                >
                  {t.admin.felles.provIgjen}
                </button>
              </div>
            </section>
          ) : valgt ? (
            <AdminDetalj kartlegging={valgt} onBack={tilListe} onSendTilbud={sendTilbud} />
          ) : null
        ) : null}
      </main>

      <div className="vk-grain" aria-hidden="true" />
    </div>
  );
}
