"use client";

import "@/styles/verksted/base.css";
import "@/styles/verksted/portal.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";
import { WorkflowsLogo } from "@/components/verksted/WorkflowsLogo";
import { useLang } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import {
  PORTAL_DRAFT_KEY,
  type PortalGodkjennResponse,
  type PortalKartlegging,
  type PortalLikeResponse,
  type PortalMeResponse,
  type PortalSubmitResponse,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import AuthGate from "@/components/portal/AuthGate";
import Forslag, { FORSLAG_HEADING_ID } from "@/components/portal/Forslag";
import LevelRail from "@/components/portal/LevelRail";
import Tilbud, { Godkjent, TILBUD_VURDERING_ID } from "@/components/portal/Tilbud";
import Wizard, { type PortalAnswers } from "@/components/portal/Wizard";

/**
 * «Programmet» on /start — the portal state machine:
 *
 *   intro → wizard (8 steps) → authgate → generating → forslag → likt
 *                                              ↘ error (feilet / submit died)
 *   … then out-of-session: Petter sends the quote (status «tilbud_sendt»)
 *   → phase tilbud (level 3) → godkjenn → phase videre (level 4, BYGGES).
 *
 * Draft answers persist to localStorage (vk-portal-draft) on every answer so
 * they survive the magic-link round trip; AuthGate auto-submits when a
 * session and a completed draft meet. Generating polls GET /api/portal/me
 * every 5s until forslag_klart. All strings come from portalContent[lang].
 */

type Phase =
  | "intro"
  | "wizard"
  | "authgate"
  | "generating"
  | "forslag"
  | "tilbud"
  | "videre"
  | "error";

interface Draft {
  answers: PortalAnswers;
  step: number;
  done?: boolean;
  /** Survives the magic-link reload — restores the UI + assessment language. */
  lang?: Lang;
  /** Stamped on every write; drafts beyond the TTL are discarded (PII). */
  savedAt?: number;
}

const POLL_MS = 5000;

// Abandoned drafts can hold free-text business details — don't keep them
// around forever on shared machines.
const DRAFT_TTL_MS = 14 * 24 * 60 * 60_000;

function readDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(PORTAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<Draft>;
    if (typeof candidate.answers !== "object" || candidate.answers === null) return null;
    if (
      typeof candidate.savedAt !== "number" ||
      Date.now() - candidate.savedAt > DRAFT_TTL_MS
    ) {
      window.localStorage.removeItem(PORTAL_DRAFT_KEY);
      return null;
    }
    return {
      answers: candidate.answers as PortalAnswers,
      step: typeof candidate.step === "number" ? candidate.step : 0,
      done: candidate.done === true,
      lang: candidate.lang === "en" ? "en" : candidate.lang === "no" ? "no" : undefined,
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  try {
    window.localStorage.setItem(
      PORTAL_DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: Date.now() })
    );
  } catch {
    // localStorage unavailable (private mode) — the flow still works in-tab.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(PORTAL_DRAFT_KEY);
  } catch {
    // ignore
  }
}

class PortalApiError extends Error {
  status: number;
  constructor(path: string, status: number) {
    super(`${path} → ${status}`);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new PortalApiError(path, res.status);
  return (await res.json()) as T;
}

function isReady(k: PortalKartlegging): boolean {
  return (
    k.status === "forslag_klart" ||
    k.status === "likt" ||
    k.status === "tilbud_sendt" ||
    k.status === "videre"
  );
}

function isWorking(k: PortalKartlegging): boolean {
  return k.status === "genererer" || k.status === "innsendt";
}

/** Which phase a landable row belongs to — the status owns the screen. */
function landingPhase(k: PortalKartlegging): Phase {
  if (k.status === "videre") return "videre";
  if (k.status === "tilbud_sendt" && k.tilbud) return "tilbud";
  return "forslag";
}

/* ── Generating — the lantern moment ── */

const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotionPref(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_MQ).matches,
    () => false
  );
}

function Generating({ t, autoFocus }: { t: PortalContent; autoFocus: boolean }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [srMsg, setSrMsg] = useState("");
  const reduced = useReducedMotionPref();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lines = t.generating.statuslinjer;

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  // Live regions announce *changes*, not initial content — mount empty and
  // fill on the next beat so the start of the wait is announced on every
  // path (incl. the magic-link page load, where nothing gets focused).
  // One reassurance mid-wait — once, to avoid chatter.
  useEffect(() => {
    const start = window.setTimeout(() => setSrMsg(t.generating.tittel), 300);
    const mid = window.setTimeout(() => setSrMsg(lines[2] ?? lines[0]), 20_000);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(mid);
    };
  }, [t, lines]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(
      () => setLineIdx((i) => (i + 1) % lines.length),
      4000
    );
    return () => window.clearInterval(id);
  }, [reduced, lines.length]);

  // Reduced motion: one static line — «verkstedet tegner …».
  const line = reduced ? lines[2] ?? lines[0] : lines[lineIdx];

  return (
    <section className="vk-portal-gen">
      <div className="vk-portal-lantern" aria-hidden="true" />
      <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-gentittel">
        {t.generating.tittel}
      </h1>
      <p className="vk-mono vk-portal-genline" aria-hidden="true">
        {line}
      </p>
      <p className="vk-sr" role="status">
        {srMsg}
      </p>
    </section>
  );
}

/* ── Error — «Det stoppet opp.» ── */

function ErrorScreen({
  t,
  onRetry,
  rateLimited = false,
}: {
  t: PortalContent;
  onRetry: () => void;
  rateLimited?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Same pattern as every other phase: the Generating subtree just
  // unmounted — without this, keyboard focus drops to <body>.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="vk-portal-err">
      <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
        {rateLimited ? t.feil.forMangeTittel : t.feil.tittel}
      </h1>
      <p className="vk-portal-lead" role="alert">
        {rateLimited ? t.feil.forMangeTekst : t.feil.tekst}
      </p>
      <div className="vk-portal-introrow">
        {/* Retrying a quota stop would just 429 again — offer the human. */}
        {!rateLimited ? (
          <button type="button" className="vk-btn vk-btn--cta" onClick={onRetry}>
            {t.feil.provIgjen}
          </button>
        ) : null}
        <Link href="/#kontakt" className="vk-portal-quietlink vk-mono">
          {t.forslag.taPrat}
        </Link>
      </div>
    </section>
  );
}

/* ── The app shell ── */

export default function PortalApp({ devMock = false }: { devMock?: boolean }) {
  const { lang, setLang } = useLang();
  const t = portalContent[lang];

  const [phase, setPhase] = useState<Phase>("intro");
  const [draft, setDraft] = useState<Draft>({ answers: {}, step: 0 });
  const [kart, setKart] = useState<PortalKartlegging | null>(null);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [godkjenner, setGodkjenner] = useState(false);
  const [godkjennError, setGodkjennError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const draftRef = useRef(draft);
  const langRef = useRef(lang);
  const prevPhaseRef = useRef<Phase>("intro");
  const interactedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Snapshot BEFORE the post-render sync below — at the first render of a
  // new phase this still holds the previous phase (the reveal needs it).
  const cameFromGenerating = prevPhaseRef.current === "generating";
  useEffect(() => {
    prevPhaseRef.current = phase;
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

  /** Land a finished row on its phase — the draft has served its purpose. */
  const land = useCallback((k: PortalKartlegging) => {
    setKart(k);
    clearDraft();
    setPhase(landingPhase(k));
  }, []);

  /* ── Boot: restore draft, or restore server state for a known session ── */
  useEffect(() => {
    const saved = readDraft();
    if (saved) {
      // The magic-link redirect is a full reload and LanguageProvider is
      // in-memory — restore the language the wizard was answered in, so the
      // UI and the auto-submitted assessment stay in the visitor's language.
      if (saved.lang && saved.lang !== langRef.current) setLang(saved.lang);
      setDraft(saved);
      setPhase(saved.done ? "authgate" : "wizard");
      return;
    }
    // Dev-mock boots like production: /me short-circuits to mockMe(), which
    // also seeds the canned «tilbud_sendt» row when PORTAL_DEV_MOCK_STATE
    // says so — that's how level 3 is reachable in dev without a real quote.
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      try {
        const me = await apiFetch<PortalMeResponse>("/api/portal/me", token);
        if (cancelled || interactedRef.current) return;
        const k = me.kartlegging;
        if (!k) return;
        if (isWorking(k)) {
          setKart(k);
          setPhase("generating");
        } else if (isReady(k)) {
          setKart(k);
          setPhase(landingPhase(k));
        }
      } catch {
        // Stay on the intro — the visitor can simply start.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, setLang]);

  /* ── Submit: the expensive moment. Guarded against double-fire and
        against re-submitting while the server is already drawing. ── */
  const submit = useCallback(
    async (token: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setRateLimited(false);
      setPhase("generating");
      try {
        // If a generation is already in flight (tab closed mid-draw, magic
        // link clicked twice), don't start a second one — let the poll land it.
        const before = await apiFetch<PortalMeResponse>("/api/portal/me", token).catch(
          () => null
        );
        if (before?.kartlegging && isWorking(before.kartlegging)) {
          setKart(before.kartlegging);
          return;
        }

        await apiFetch<PortalSubmitResponse>("/api/portal/submit", token, {
          method: "POST",
          body: JSON.stringify({
            answers: draftRef.current.answers,
            // The draft language is authoritative — it's the language the
            // answers were written in, restored across the magic-link reload.
            lang: draftRef.current.lang ?? langRef.current,
          }),
        });
        // submit resolves only when the row is forslag_klart — fetch it whole.
        const me = await apiFetch<PortalMeResponse>("/api/portal/me", token);
        const k = me.kartlegging;
        if (k && isReady(k)) land(k);
        else if (k && isWorking(k)) setKart(k); // poll takes over
        else setPhase("error");
      } catch (err) {
        // Quota hit (429): say so honestly. The old fallback would fetch
        // /me and «land» the PREVIOUS forslag — which read as «the wizard
        // ignores my new answers». Never mask a quota stop as a result.
        if (err instanceof PortalApiError && err.status === 429) {
          setRateLimited(true);
          setPhase("error");
          return;
        }
        // The request died — but the server may still be drawing. One check
        // decides: keep polling, land it, or admit failure.
        try {
          const me = await apiFetch<PortalMeResponse>("/api/portal/me", token);
          const k = me.kartlegging;
          if (k && isWorking(k)) setKart(k);
          else if (k && isReady(k)) land(k);
          else setPhase("error");
        } catch {
          setPhase("error");
        }
      } finally {
        submittingRef.current = false;
      }
    },
    [land]
  );

  const onAuthed = useCallback(
    (token: string) => {
      void submit(token);
    },
    [submit]
  );

  /* ── Generating: poll /me every 5s until forslag_klart (or feilet) ── */
  useEffect(() => {
    if (phase !== "generating") return;
    let stopped = false;
    const tick = async () => {
      const token = await getToken();
      if (!token || stopped) return;
      try {
        const me = await apiFetch<PortalMeResponse>("/api/portal/me", token);
        if (stopped) return;
        const k = me.kartlegging;
        if (!k) return;
        if (isReady(k)) land(k);
        else if (k.status === "feilet") setPhase("error");
      } catch {
        // Transient — keep polling.
      }
    };
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [phase, getToken, land]);

  /* ── Actions ── */

  const startWizard = () => {
    interactedRef.current = true;
    setPhase("wizard");
  };

  const persistDraft = useCallback((answers: PortalAnswers, step: number) => {
    interactedRef.current = true;
    const next: Draft = { answers, step, lang: langRef.current };
    setDraft(next);
    writeDraft(next);
  }, []);

  const completeWizard = useCallback((answers: PortalAnswers) => {
    interactedRef.current = true;
    // The last step index of the FULL list — when the bransje step was
    // auto-skipped (research found it), the Wizard clamps this down to the
    // last index of its filtered list on restore.
    const lastStep = portalContent[langRef.current].steps.length - 1;
    const next: Draft = { answers, step: lastStep, done: true, lang: langRef.current };
    setDraft(next);
    writeDraft(next);
    setPhase("authgate");
  }, []);

  const backToWizard = useCallback(() => {
    interactedRef.current = true;
    setDraft((d) => {
      const next: Draft = { ...d, done: false, lang: langRef.current };
      writeDraft(next);
      return next;
    });
    setPhase("wizard");
  }, []);

  const restart = useCallback((seed?: PortalAnswers) => {
    interactedRef.current = true;
    const next: Draft = { answers: seed ?? {}, step: 0, lang: langRef.current };
    setDraft(next);
    writeDraft(next);
    setKart(null);
    setLikeError(false);
    setPhase("wizard");
  }, []);

  const retry = () => {
    interactedRef.current = true;
    // The draft is still here (cleared only on success) — back through the
    // gate, which auto-submits against the existing session.
    setPhase("authgate");
  };

  const onLike = async () => {
    if (!kart || liking) return;
    interactedRef.current = true;
    setLiking(true);
    setLikeError(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("no session");
      await apiFetch<PortalLikeResponse>("/api/portal/like", token, {
        method: "POST",
        body: JSON.stringify({ id: kart.id }),
      });
      setKart({ ...kart, status: "likt" });
    } catch (err) {
      console.error("[portal] like failed", err);
      setLikeError(true);
    } finally {
      setLiking(false);
    }
  };

  const onGodkjenn = async () => {
    if (!kart || godkjenner) return;
    interactedRef.current = true;
    setGodkjenner(true);
    setGodkjennError(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("no session");
      await apiFetch<PortalGodkjennResponse>("/api/portal/godkjenn", token, {
        method: "POST",
        body: JSON.stringify({ id: kart.id }),
      });
      setKart({ ...kart, status: "videre", godkjentAt: new Date().toISOString() });
      setPhase("videre");
    } catch (err) {
      console.error("[portal] godkjenn failed", err);
      setGodkjennError(true);
    } finally {
      setGodkjenner(false);
    }
  };

  /* ── Rail ── */

  const level =
    phase === "videre"
      ? 4
      : phase === "tilbud" || (phase === "forslag" && kart?.status === "likt")
        ? 3
        : phase === "forslag" || phase === "generating" || phase === "error"
          ? 2
          : 1;

  const onRailBack = (n: number) => {
    if (n === 1) {
      restart(kart?.answers ?? draftRef.current.answers);
    } else if (n === 2) {
      if (phase === "tilbud") {
        // The level 2 assessment is on this screen, collapsed — open it
        // and hand focus to its toggle.
        const det = document.getElementById(
          TILBUD_VURDERING_ID
        ) as HTMLDetailsElement | null;
        if (det) {
          det.open = true;
          det.querySelector("summary")?.focus();
        }
        return;
      }
      // From level 3 the forslag is already on screen — return focus to it.
      document.getElementById(FORSLAG_HEADING_ID)?.focus();
    }
  };

  /* ── Render ── */

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
        <Link href="/#kontakt" className="vk-portal-avbryt vk-mono">
          {t.header.avbryt}
        </Link>
      </header>

      <LevelRail
        current={level}
        // No backward navigation once the quote is approved (phase videre) —
        // there is nothing meaningful to go back TO; the bench is rigged.
        onBack={
          level > 1 && phase !== "generating" && phase !== "videre"
            ? onRailBack
            : undefined
        }
        disabled={phase === "generating"}
      />

      <main
        id="main"
        className={`vk-portal-stage${phase === "forslag" ? " vk-portal-stage--wide" : ""}`}
      >
        {phase === "intro" ? (
          <section className="vk-portal-intro">
            <p className="vk-kicker">{t.levels[0].navn}</p>
            <h1 className="vk-display vk-portal-h1">{t.intro.tittel}</h1>
            <p className="vk-portal-lead">{t.intro.undertekst}</p>
            <div className="vk-portal-introrow">
              <button type="button" className="vk-btn vk-btn--cta" onClick={startWizard}>
                {t.intro.startKnapp}
              </button>
              <Link href="/#kontakt" className="vk-portal-quietlink vk-mono">
                {t.intro.taPratHeller}
              </Link>
            </div>
          </section>
        ) : null}

        {phase === "wizard" ? (
          <Wizard
            initialAnswers={draft.answers}
            initialStep={draft.step}
            autoFocus={interactedRef.current}
            onPersist={persistDraft}
            onComplete={completeWizard}
          />
        ) : null}

        {phase === "authgate" ? (
          <AuthGate
            devMock={devMock}
            autoFocus={interactedRef.current}
            onAuthed={onAuthed}
            onBack={backToWizard}
          />
        ) : null}

        {phase === "generating" ? (
          <Generating t={t} autoFocus={interactedRef.current} />
        ) : null}

        {phase === "forslag" && kart ? (
          <Forslag
            kartlegging={kart}
            liking={liking}
            likeError={likeError}
            autoFocus={cameFromGenerating || interactedRef.current}
            onLike={() => void onLike()}
            onRestart={() => restart(kart.answers)}
          />
        ) : null}

        {phase === "tilbud" && kart ? (
          <Tilbud
            kartlegging={kart}
            godkjenner={godkjenner}
            godkjennError={godkjennError}
            autoFocus={interactedRef.current}
            onGodkjenn={() => void onGodkjenn()}
          />
        ) : null}

        {phase === "videre" ? <Godkjent autoFocus={interactedRef.current} /> : null}

        {phase === "error" ? (
          <ErrorScreen t={t} onRetry={retry} rateLimited={rateLimited} />
        ) : null}
      </main>

      <div className="vk-grain" aria-hidden="true" />
    </div>
  );
}
