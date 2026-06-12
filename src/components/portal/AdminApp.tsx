"use client";

import "@/styles/verksted/base.css";
import "@/styles/verksted/portal.css";
import "@/styles/verksted/admin.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lang } from "@/lib/translations";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";
import { WorkflowsLogo } from "@/components/verksted/WorkflowsLogo";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import {
  ADMIN_EMAIL,
  type AdminDetaljResponse,
  type AdminKartlegging,
  type AdminLeverResponse,
  type AdminListItem,
  type AdminListeResponse,
  type AdminSlettResponse,
  type PortalSluttrapport,
  type PortalStatus,
  type PortalTilbud,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { consumeAuthErrorFromUrl } from "@/components/portal/AuthGate";
import AdminBygg from "@/components/portal/AdminBygg";
import AdminDetalj, {
  adminChipClass,
  formatBelopOre,
  formatDato,
} from "@/components/portal/AdminDetalj";
import { useSesjonEpost } from "@/components/portal/useSesjonEpost";

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

/** «14:32» — clock for the sist hentet-line. */
function formatTid(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nb-NO", {
    timeStyle: "short",
  }).format(d);
}

/* ── The pipeline — status → column, the dashboard's working unit ── */

type PipelineGruppe =
  | "nye"
  | "forslagKlart"
  | "likt"
  | "tilbudSendt"
  | "bygges"
  | "levert"
  | "feilet";

const PIPELINE_REKKEFOLGE: readonly PipelineGruppe[] = [
  "nye",
  "forslagKlart",
  "likt",
  "tilbudSendt",
  "bygges",
  "levert",
  "feilet",
];

function gruppeAv(status: PortalStatus): PipelineGruppe {
  switch (status) {
    case "innsendt":
    case "genererer":
      return "nye";
    case "forslag_klart":
      return "forslagKlart";
    case "likt":
      return "likt";
    case "tilbud_sendt":
      return "tilbudSendt";
    case "videre":
      return "bygges";
    case "levert":
      return "levert";
    case "feilet":
      return "feilet";
  }
}

type Filter = "alle" | "venter" | PipelineGruppe;

/* ── SLA: «likt for 18 t siden» — counted in WORKING hours (08–16 Mon–Fri),
      since the quote promise is «innen én arbeidsdag». Day-by-day overlap,
      capped at 90 days (anything past that is loud regardless). ── */

const SLA_LIKT_ARBEIDSTIMER = 8;

function arbeidstimerSiden(iso: string): number {
  const startMs = Date.parse(iso);
  const nowMs = Date.now();
  if (!Number.isFinite(startMs) || startMs >= nowMs) return 0;
  let timer = 0;
  const d = new Date(startMs);
  for (let i = 0; i < 90 && d.getTime() < nowMs; i += 1) {
    const dag = d.getDay();
    if (dag !== 0 && dag !== 6) {
      const dagStart = new Date(d);
      dagStart.setHours(8, 0, 0, 0);
      const dagSlutt = new Date(d);
      dagSlutt.setHours(16, 0, 0, 0);
      const fra = Math.max(d.getTime(), dagStart.getTime());
      const til = Math.min(nowMs, dagSlutt.getTime());
      if (til > fra) timer += (til - fra) / 3_600_000;
    }
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  return timer;
}

/** «18 t» / «3 d» — compact duration for the SLA line. */
function kortVarighet(iso: string, lang: Lang): string {
  const diffMs = Date.now() - Date.parse(iso);
  const timer = Math.floor(diffMs / 3_600_000);
  if (timer < 48) return lang === "en" ? `${timer} h` : `${timer} t`;
  return `${Math.floor(timer / 24)} d`;
}

/** Rows that wait on PETTER: liked past the working-hours promise, failed
    generations, or open requests that may need a nudge. */
function venterPaDeg(row: AdminListItem): boolean {
  if (row.slettetAt) return false;
  if (row.status === "feilet") return true;
  if (
    row.status === "likt" &&
    row.liktAt &&
    arbeidstimerSiden(row.liktAt) > SLA_LIKT_ARBEIDSTIMER
  ) {
    return true;
  }
  return row.apneForesporsler > 0;
}

/** The one-line WHY for a venter-på-deg row (priority: likt > feilet > forespørsler). */
function slaTekst(
  row: AdminListItem,
  t: (typeof portalContent)["no"],
  lang: Lang
): string | null {
  if (
    row.status === "likt" &&
    row.liktAt &&
    arbeidstimerSiden(row.liktAt) > SLA_LIKT_ARBEIDSTIMER
  ) {
    return t.admin.liste.slaLiktTemplate.replace("{t}", kortVarighet(row.liktAt, lang));
  }
  if (row.status === "feilet") return t.admin.liste.slaFeilet;
  if (row.apneForesporsler > 0) {
    return t.admin.liste.slaForesporslerTemplate.replace(
      "{n}",
      String(row.apneForesporsler)
    );
  }
  return null;
}

/** «2 t siden» — relative last-activity stamp for the list rows. */
function relativTid(iso: string, t: (typeof portalContent)["no"]): string {
  const diffMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return t.admin.liste.relNaa;
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return t.admin.liste.relMinTemplate.replace("{n}", String(min));
  const timer = Math.floor(min / 60);
  if (timer < 48) return t.admin.liste.relTimeTemplate.replace("{n}", String(timer));
  return t.admin.liste.relDagTemplate.replace("{n}", String(Math.floor(timer / 24)));
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
      // Supabase email rate limit reads as status 429 / "rate limit" — that
      // is OUR ceiling, not a typo in the address. Same mapping as AuthGate.
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
  const sesjonEpost = useSesjonEpost(devMock);

  const [phase, setPhase] = useState<Phase>("auth");
  const [rows, setRows] = useState<AdminListItem[]>([]);
  const [listeState, setListeState] = useState<Lasting>("laster");
  const [valgt, setValgt] = useState<AdminKartlegging | null>(null);
  const [detaljState, setDetaljState] = useState<Lasting>("laster");
  const [sistHentet, setSistHentet] = useState<Date | null>(null);
  // The dashboard controls — pipeline filter, free-text search, deleted.
  const [filter, setFilter] = useState<Filter>("alle");
  const [sok, setSok] = useState("");
  const [visSlettede, setVisSlettede] = useState(false);
  const sisteIdRef = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  // Guards against overlapping quiet refreshes (focus + visibilitychange
  // both fire when a tab returns).
  const oppdatererRef = useRef(false);

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

  /** Clear the session and reopen the gate — the way out of a cached
      wrong-address session (and the polite exit for the right one). */
  const byttKonto = useCallback(async () => {
    if (!devMock) {
      try {
        await supabaseBrowser().auth.signOut();
      } catch (err) {
        console.error("[portal/admin] signOut failed", err);
      }
    }
    setRows([]);
    setValgt(null);
    setPhase("auth");
  }, [devMock]);

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
      setSistHentet(new Date());
    } catch (err) {
      handleApiError(err, setListeState);
    }
  }, [getToken, apiFetch, handleApiError]);

  /**
   * Quiet list refresh — keeps the rows on screen while fetching (no
   * «henter …» blank). A transient failure keeps the stale list; 401/403
   * still route through handleApiError.
   */
  const oppdaterListe = useCallback(async () => {
    if (oppdatererRef.current) return;
    oppdatererRef.current = true;
    try {
      const token = await getToken();
      if (!token) {
        setPhase("auth");
        return;
      }
      const json = await apiFetch<AdminListeResponse>("/api/portal/admin/liste", token);
      setRows(json.kartlegginger);
      setListeState("klar");
      setSistHentet(new Date());
    } catch (err) {
      // Stale-but-visible beats blanked — only auth errors change phase.
      handleApiError(err, () => {});
    } finally {
      oppdatererRef.current = false;
    }
  }, [getToken, apiFetch, handleApiError]);

  /**
   * Quiet detail refresh — updates the open kartlegging in place WITHOUT
   * unmounting AdminDetalj (form drafts and focus stay put).
   */
  const oppdaterDetalj = useCallback(
    async (id: string) => {
      if (oppdatererRef.current) return;
      oppdatererRef.current = true;
      try {
        const token = await getToken();
        if (!token) {
          setPhase("auth");
          return;
        }
        const json = await apiFetch<AdminDetaljResponse>(
          `/api/portal/admin/liste?id=${encodeURIComponent(id)}`,
          token
        );
        if (json.kartlegging) {
          setValgt(json.kartlegging);
          setDetaljState("klar");
        }
      } catch (err) {
        handleApiError(err, () => {});
      } finally {
        oppdatererRef.current = false;
      }
    },
    [getToken, apiFetch, handleApiError]
  );

  // The admin tab stays open for days — refetch when it comes back into
  // view (focus/visibilitychange) instead of polling. Customers approving
  // quotes show up without Petter touching anything.
  useEffect(() => {
    function onTilbake() {
      if (document.visibilityState === "hidden") return;
      if (phase === "liste") {
        void oppdaterListe();
      } else if (phase === "detalj" && sisteIdRef.current) {
        void oppdaterDetalj(sisteIdRef.current);
      }
    }
    window.addEventListener("focus", onTilbake);
    document.addEventListener("visibilitychange", onTilbake);
    return () => {
      window.removeEventListener("focus", onTilbake);
      document.removeEventListener("visibilitychange", onTilbake);
    };
  }, [phase, oppdaterListe, oppdaterDetalj]);

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
    // Coming back from a detail where the status may just have changed —
    // quiet refetch keeps the rows visible while the fresh ones land.
    void oppdaterListe();
  }, [oppdaterListe]);

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

  /** PATCH the lever-flow: videre → levert (+ sluttrapport). Optimistic
      flip on the open detail + the list row; nothing reverts on failure
      since nothing flipped before the request resolved. */
  const markerLevert = useCallback(
    async (sluttrapport: PortalSluttrapport): Promise<boolean> => {
      const k = valgt;
      if (!k) return false;
      const token = await getToken();
      if (!token) {
        setPhase("auth");
        return false;
      }
      try {
        await apiFetch<AdminLeverResponse>("/api/portal/admin/prosjekt", token, {
          method: "PATCH",
          body: JSON.stringify({ id: k.id, handling: "lever", sluttrapport }),
        });
        const levertAt = new Date().toISOString();
        setValgt({ ...k, status: "levert", levertAt, sluttrapport });
        setRows((rs) =>
          rs.map((r) =>
            r.id === k.id ? { ...r, status: "levert", sistAktivitet: levertAt } : r
          )
        );
        return true;
      } catch (err) {
        console.error("[portal/admin] lever failed", err);
        handleApiError(err, () => {});
        return false;
      }
    },
    [valgt, getToken, apiFetch, handleApiError]
  );

  /** PATCH the undo: levert → videre (the sluttrapport stays as a draft). */
  const angreLevert = useCallback(async (): Promise<boolean> => {
    const k = valgt;
    if (!k) return false;
    const token = await getToken();
    if (!token) {
      setPhase("auth");
      return false;
    }
    try {
      await apiFetch<AdminLeverResponse>("/api/portal/admin/prosjekt", token, {
        method: "PATCH",
        body: JSON.stringify({ id: k.id, handling: "angre" }),
      });
      setValgt({ ...k, status: "videre", levertAt: null });
      setRows((rs) =>
        rs.map((r) => (r.id === k.id ? { ...r, status: "videre" } : r))
      );
      return true;
    } catch (err) {
      console.error("[portal/admin] angre lever failed", err);
      handleApiError(err, () => {});
      return false;
    }
  }, [valgt, getToken, apiFetch, handleApiError]);

  /** Soft-DELETE the open kartlegging; on success → back to the list. */
  const slettKartlegging = useCallback(async (): Promise<boolean> => {
    const k = valgt;
    if (!k) return false;
    const token = await getToken();
    if (!token) {
      setPhase("auth");
      return false;
    }
    try {
      await apiFetch<AdminSlettResponse>(
        `/api/portal/admin/liste?id=${encodeURIComponent(k.id)}`,
        token,
        { method: "DELETE" }
      );
      // Drop the row locally right away — a deleted kartlegging must not
      // linger in the list while the quiet refetch is in flight.
      setRows((rs) => rs.filter((r) => r.id !== k.id));
      sisteIdRef.current = null;
      tilListe();
      return true;
    } catch (err) {
      console.error("[portal/admin] slett failed", err);
      // 401/403 still route through the gate/denied screens.
      handleApiError(err, () => {});
      return false;
    }
  }, [valgt, getToken, apiFetch, tilListe, handleApiError]);

  /* ── Dashboard derivations — cheap, recomputed per render ── */
  const aktiveRader = rows.filter((r) => !r.slettetAt);
  const slettedeAntall = rows.length - aktiveRader.length;
  const venterAntall = aktiveRader.filter(venterPaDeg).length;
  const gruppeAntall = new Map<PipelineGruppe, number>();
  for (const r of aktiveRader) {
    const g = gruppeAv(r.status);
    gruppeAntall.set(g, (gruppeAntall.get(g) ?? 0) + 1);
  }
  const sokTrim = sok.trim().toLowerCase();
  const synligeRader = (visSlettede ? rows : aktiveRader).filter((r) => {
    if (filter === "venter" && !venterPaDeg(r)) return false;
    if (filter !== "alle" && filter !== "venter" && gruppeAv(r.status) !== filter)
      return false;
    if (sokTrim) {
      const navn = (r.bedriftNavn ?? "").toLowerCase();
      if (!navn.includes(sokTrim) && !r.email.toLowerCase().includes(sokTrim))
        return false;
    }
    return true;
  });
  // The open detail's matching list row — feeds the Meldinger-fane badge
  // (NYTT FRA KUNDE) and the Oversikt tab's venter-på-deg/SLA line.
  const valgtRad = valgt ? (rows.find((r) => r.id === valgt.id) ?? null) : null;
  const valgtVenter =
    valgtRad && !valgtRad.slettetAt && venterPaDeg(valgtRad)
      ? slaTekst(valgtRad, t, lang)
      : null;

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
        <span className="vk-portal-topplenker">
          {/* The quiet mono address says WHO is in — truncated, full on
              title. Especially load-bearing on «ikke din dør». */}
          {phase !== "auth" ? (
            <>
              {sesjonEpost ? (
                <span
                  className="vk-mono vk-portal-sesjonepost"
                  title={sesjonEpost}
                >
                  {sesjonEpost}
                </span>
              ) : null}
              <button
                type="button"
                className="vk-portal-avbryt vk-mono"
                onClick={byttKonto}
              >
                {t.header.loggUt}
              </button>
            </>
          ) : null}
          <span className="vk-mono vk-adm-merke">{t.admin.kicker}</span>
        </span>
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
              {/* The cached-wrong-address dead end: clear the session and
                  reopen the gate so the right address can knock. */}
              <button type="button" className="vk-btn vk-btn--cta" onClick={byttKonto}>
                {t.admin.ikkeDinDor.byttKonto}
              </button>
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
              <>
                <div className="vk-adm-oppdaterrad">
                  <button
                    type="button"
                    className="vk-mono vk-adm-oppdater"
                    onClick={() => void oppdaterListe()}
                  >
                    {t.admin.liste.oppdater}
                  </button>
                  {sistHentet ? (
                    <span className="vk-mono vk-adm-sisthentet" role="status">
                      {t.admin.liste.sistHentetTemplate.replace(
                        "{tid}",
                        formatTid(sistHentet, lang)
                      )}
                    </span>
                  ) : null}
                </div>
                {rows.length === 0 ? (
                  <p className="vk-adm-tomt">{t.admin.liste.tom}</p>
                ) : (
                  <>
                    {/* ── The dashboard toolbar: search + pipeline chips ── */}
                    <div className="vk-adm-verktoy">
                      <div className="vk-portal-felt vk-adm-sokfelt">
                        <label className="vk-portal-label" htmlFor="vk-adm-sok">
                          {t.admin.liste.sokLabel}
                        </label>
                        <input
                          id="vk-adm-sok"
                          type="search"
                          className="vk-portal-input"
                          placeholder={t.admin.liste.sokPlassholder}
                          value={sok}
                          onChange={(e) => setSok(e.target.value)}
                        />
                      </div>
                      <div
                        className="vk-adm-filterchips"
                        role="group"
                        aria-label={t.admin.liste.tittel}
                      >
                        <button
                          type="button"
                          className="vk-portal-chip vk-adm-filterchip"
                          aria-pressed={filter === "alle"}
                          onClick={() => setFilter("alle")}
                        >
                          {t.admin.liste.filterAlle} ({aktiveRader.length})
                        </button>
                        {/* Kept visible while ACTIVE even at zero — the
                            escape route must never disappear under you. */}
                        {venterAntall > 0 || filter === "venter" ? (
                          <button
                            type="button"
                            className="vk-portal-chip vk-adm-filterchip vk-adm-filterchip--sla"
                            aria-pressed={filter === "venter"}
                            onClick={() => setFilter("venter")}
                          >
                            {t.admin.liste.venterPaDeg} ({venterAntall})
                          </button>
                        ) : null}
                        {PIPELINE_REKKEFOLGE.map((gruppe) => (
                          <button
                            key={gruppe}
                            type="button"
                            className="vk-portal-chip vk-adm-filterchip"
                            aria-pressed={filter === gruppe}
                            onClick={() => setFilter(gruppe)}
                          >
                            {t.admin.liste.pipeline[gruppe]} ({gruppeAntall.get(gruppe) ?? 0})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* The SLA pulse — one quiet line, only when it matters. */}
                    {venterAntall > 0 ? (
                      <p className="vk-mono vk-adm-slapuls" role="status">
                        {t.admin.liste.venterAntallTemplate.replace(
                          "{n}",
                          String(venterAntall)
                        )}
                      </p>
                    ) : null}

                    <div className="vk-adm-antallrad">
                      <p className="vk-mono vk-adm-antall">
                        {t.admin.liste.antallTemplate.replace(
                          "{n}",
                          String(synligeRader.length)
                        )}
                      </p>
                      {slettedeAntall > 0 ? (
                        <button
                          type="button"
                          className="vk-mono vk-adm-vissslettede"
                          aria-pressed={visSlettede}
                          onClick={() => setVisSlettede((v) => !v)}
                        >
                          {visSlettede
                            ? t.admin.liste.skjulSlettede
                            : t.admin.liste.visSlettedeTemplate.replace(
                                "{n}",
                                String(slettedeAntall)
                              )}
                        </button>
                      ) : null}
                    </div>

                    {synligeRader.length === 0 ? (
                      <p className="vk-adm-tomt">{t.admin.liste.ingenTreff}</p>
                    ) : (
                      <ol className="vk-adm-liste">
                        {synligeRader.map((row) => {
                          const sla = slaTekst(row, t, lang);
                          return (
                            <li key={row.id}>
                              <button
                                type="button"
                                className="vk-adm-rad vk-adm-rad--kort"
                                data-sla={
                                  !row.slettetAt && venterPaDeg(row) ? "true" : undefined
                                }
                                data-slettet={row.slettetAt ? "true" : undefined}
                                onClick={() => void apneDetalj(row.id)}
                              >
                                <span className="vk-adm-radtopp">
                                  <span className="vk-adm-bedrift">
                                    {row.bedriftNavn ?? t.admin.liste.ukjentBedrift}
                                  </span>
                                  <span className="vk-adm-epost">{row.email}</span>
                                  <span className="vk-adm-radchips">
                                    {row.slettetAt ? (
                                      <span className="vk-adm-chip vk-adm-chip--slettet">
                                        {t.admin.liste.slettetChip}
                                      </span>
                                    ) : null}
                                    {row.nyttFraKunde ? (
                                      <span className="vk-stamp vk-adm-nyttchip">
                                        {row.nyttAntall > 0
                                          ? t.admin.liste.nyttFraKundeAntallTemplate.replace(
                                              "{n}",
                                              String(row.nyttAntall)
                                            )
                                          : t.admin.liste.nyttFraKunde}
                                      </span>
                                    ) : null}
                                    <span className={adminChipClass(row.status)}>
                                      {t.admin.status[row.status]}
                                    </span>
                                  </span>
                                </span>
                                <span className="vk-adm-radbunn">
                                  <span className="vk-mono vk-adm-dato">
                                    {formatDato(row.createdAt, lang)}
                                  </span>
                                  <span className="vk-mono vk-adm-aktivitet">
                                    {relativTid(row.sistAktivitet, t)}
                                  </span>
                                  <span className="vk-mono vk-adm-anbefaling">
                                    {row.anbefaling
                                      ? t.admin.anbefaling[row.anbefaling]
                                      : "—"}
                                  </span>
                                  {typeof row.prisBelopOre === "number" ? (
                                    <span className="vk-mono vk-adm-radpris">
                                      {formatBelopOre(row.prisBelopOre)}{" "}
                                      {t.tilbud.belopEksMva}
                                    </span>
                                  ) : null}
                                  {sla ? (
                                    <span className="vk-mono vk-adm-slalinje">{sla}</span>
                                  ) : null}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </>
                )}
              </>
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
            <AdminDetalj
              kartlegging={valgt}
              listeRad={valgtRad}
              venterTekst={valgtVenter}
              onBack={tilListe}
              onSendTilbud={sendTilbud}
              onLever={markerLevert}
              onAngreLever={angreLevert}
              onSlett={slettKartlegging}
              bygging={
                <AdminBygg kartleggingId={valgt.id} kartStatus={valgt.status} />
              }
            />
          ) : null
        ) : null}
      </main>

      <div className="vk-grain" aria-hidden="true" />
    </div>
  );
}
