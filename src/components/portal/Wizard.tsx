"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import {
  portalContent,
  type PortalContent,
  type PortalStep,
  type PortalStepId,
} from "@/lib/portalContent";
import {
  SAMTALE_MAKS_SPORSMAL,
  SAMTALE_SVAR_MAX,
  type PortalBedriftAnswer,
  type PortalInnsiktResponse,
  type PortalIntent,
  type PortalResearchResponse,
  type PortalSamtaleExchange,
  type PortalSamtaleResponse,
  type ResearchFunn,
} from "@/lib/portalTypes";

/**
 * The kartlegging wizard — a guided diagnose-SAMTALE, not a static form.
 *
 * Phases (answers._fase carries the current one across the magic-link reload):
 *   1) bedrift   — name + website → /api/portal/research (BRREG + their site).
 *   2) veivalg   — a reflection («Vi la merke til …», from /api/portal/innsikt)
 *                  above the four-card intent fork (nettside/tid/verktoy/usikker).
 *   3) samtale   — the adaptive loop: /api/portal/samtale returns ONE question
 *                  at a time + a live «dette hører vi»-understanding; answered
 *                  with a chip (forslag) or free text. Fable 5 decides when it
 *                  has enough (ferdig) — capped at SAMTALE_MAKS_SPORSMAL.
 *   4) budsjett  — the ONE retained static chip step (the AI never asks money).
 *   5) oppsummering — the review screen; everything editable, then «Send inn».
 *
 * Answers shape (consumed by portalAi.answersToFacts):
 *   answers.bedrift   = { navn, nettside? }
 *   answers.research  = ResearchFunn | null
 *   answers.samtale   = { intent, utvekslinger: [{sporsmal, svar, …}], ferdig }
 *   answers.budsjett  = chipId (string)
 *   answers._fase / answers._innsikt — transient wizard state (server ignores).
 *
 * Both AI calls are non-blocking and fail-graceful: the reflection is skipped
 * silently and the conversation always gets a usable step (the route returns a
 * static fallback), so the flow never stalls. Every change is persisted upward
 * (→ localStorage) so the draft survives the magic-link round trip.
 */

export type PortalAnswers = Record<string, unknown>;

interface WizardProps {
  initialAnswers: PortalAnswers;
  initialStep: number;
  /** Focus the question heading on mount (arriving via interaction). */
  autoFocus?: boolean;
  /** Quiet mono note over the first screen (returning-user, no rows). */
  notice?: string | null;
  onPersist: (answers: PortalAnswers, step: number) => void;
  onComplete: (answers: PortalAnswers) => void;
}

type Fase = "bedrift" | "veivalg" | "samtale" | "budsjett" | "oppsummering";
const FASE_REKKE: Fase[] = ["bedrift", "veivalg", "samtale", "budsjett", "oppsummering"];

// The lookup gives the research at most 10s, then continues silently; a
// second status line lands mid-wait so the longer crawl reads as work.
const LOOKUP_MAX_MS = 10_000;
const LOOKUP_MIN_MS = 600;
const LOOKUP_LINE2_MS = 3_500;

// The AI moments — the routes self-time-out around 25s and return a fallback,
// so the client waits a touch longer and never blocks beyond it.
const INNSIKT_MAX_MS = 28_000;
const SAMTALE_MAX_MS = 28_000;
const SAMTALE_MIN_MS = 500;

const NAVN_MIN = 2;
const NAVN_MAX = 80;
const NETTSIDE_MAX = 200;

const INTENTS: PortalIntent[] = ["nettside", "tid", "verktoy", "usikker"];
function erIntent(v: unknown): v is PortalIntent {
  return typeof v === "string" && (INTENTS as string[]).includes(v);
}

/** One conversation turn — richer than the API shape (carries its own chips
 *  + understanding) so a step-back restores the card exactly. The server only
 *  ever reads sporsmal/svar. */
type RikUtveksling = PortalSamtaleExchange & {
  hint?: string;
  forslag?: string[];
  forstaelse?: string[];
};

/** The pending (unanswered) question + the visitor's in-progress answer. */
type AktivtSteg = {
  sporsmal: string;
  hint: string;
  forslag: string[];
  forstaelse: string[];
  svar: string;
};

type SamtaleState = {
  intent: PortalIntent;
  utvekslinger: RikUtveksling[];
  aktivt: AktivtSteg | null;
  ferdig: boolean;
};

type LookupState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "confirm"; funn: ResearchFunn };

function bedriftOf(answers: PortalAnswers): PortalBedriftAnswer {
  const raw = answers.bedrift;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { navn: "" };
  const b = raw as Record<string, unknown>;
  return {
    navn: typeof b.navn === "string" ? b.navn : "",
    nettside: typeof b.nettside === "string" ? b.nettside : undefined,
  };
}

function strenger(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

function samtaleOf(answers: PortalAnswers): SamtaleState | null {
  const raw = answers.samtale;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!erIntent(o.intent)) return null;
  const utvekslinger: RikUtveksling[] = Array.isArray(o.utvekslinger)
    ? o.utvekslinger
        .filter(
          (u): u is Record<string, unknown> =>
            typeof u === "object" && u !== null && !Array.isArray(u)
        )
        .filter((u) => typeof u.sporsmal === "string" && typeof u.svar === "string")
        .map((u) => ({
          sporsmal: u.sporsmal as string,
          svar: u.svar as string,
          hint: typeof u.hint === "string" ? u.hint : undefined,
          forslag: strenger(u.forslag),
          forstaelse: strenger(u.forstaelse),
        }))
    : [];
  let aktivt: AktivtSteg | null = null;
  const ar = o.aktivt;
  if (typeof ar === "object" && ar !== null && !Array.isArray(ar)) {
    const a = ar as Record<string, unknown>;
    if (typeof a.sporsmal === "string" && a.sporsmal.trim()) {
      aktivt = {
        sporsmal: a.sporsmal,
        hint: typeof a.hint === "string" ? a.hint : "",
        forslag: strenger(a.forslag),
        forstaelse: strenger(a.forstaelse),
        svar: typeof a.svar === "string" ? a.svar : "",
      };
    }
  }
  return { intent: o.intent, utvekslinger, aktivt, ferdig: o.ferdig === true };
}

function innsiktOf(answers: PortalAnswers): PortalInnsiktResponse | null {
  const raw = answers._innsikt;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return { observasjoner: strenger(o.observasjoner), harNettside: o.harNettside !== false };
}

function stepById(t: PortalContent, id: PortalStepId): PortalStep | undefined {
  return t.steps.find((s) => s.id === id);
}

function chipLabel(step: PortalStep | undefined, id: string): string {
  return step?.chips?.find((c) => c.id === id)?.label ?? id;
}

/** Where a restored/partial draft belongs when answers._fase is absent. */
function deriveFase(answers: PortalAnswers): Fase {
  const f = answers._fase;
  if (typeof f === "string" && (FASE_REKKE as string[]).includes(f)) return f as Fase;
  if (bedriftOf(answers).navn.trim().length < NAVN_MIN) return "bedrift";
  if (answers.research === undefined) return "bedrift";
  const s = samtaleOf(answers);
  if (!s) return "veivalg";
  if (!s.ferdig) return "samtale";
  if (typeof answers.budsjett !== "string") return "budsjett";
  return "oppsummering";
}

export default function Wizard({
  initialAnswers,
  autoFocus = false,
  notice = null,
  onPersist,
  onComplete,
}: WizardProps) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [answers, setAnswers] = useState<PortalAnswers>(initialAnswers);
  const [fase, setFase] = useState<Fase>(() => deriveFase(initialAnswers));
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [lookup, setLookup] = useState<LookupState>({ phase: "idle" });
  const [lookupLine, setLookupLine] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [innsiktLaster, setInnsiktLaster] = useState(false);
  const [samtaleLaster, setSamtaleLaster] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const funnTitleRef = useRef<HTMLParagraphElement>(null);
  const lineTimer = useRef<number | null>(null);
  const mounted = useRef(false);
  const alive = useRef(true);
  // Mirrors used by async callbacks so they always read/write the latest.
  const answersRef = useRef(answers);
  const faseRef = useRef(fase);
  // Endre-jump bookkeeping (return straight to the summary after one edit).
  const returnToOppsum = useRef(false);
  // The navn the research/innsikt last ran for — re-arms on a company change.
  const lookedUpFor = useRef<string | null>(
    initialAnswers.research !== undefined ? bedriftOf(initialAnswers).navn.trim() : null
  );
  const innsiktFor = useRef<string | null>(null);
  // The (intent:length) signature the conversation last fetched a step for —
  // idempotent against React re-runs (incl. StrictMode's double-invoke).
  const samtaleSig = useRef<string>("");

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (lineTimer.current !== null) window.clearTimeout(lineTimer.current);
    };
  }, []);

  /** The one writer: update refs + state + persist (optionally change fase). */
  const commit = useCallback(
    (a: PortalAnswers, nyFase?: Fase, direction: "fwd" | "back" = "fwd") => {
      const f = nyFase ?? faseRef.current;
      const neste: PortalAnswers = { ...a, _fase: f };
      answersRef.current = neste;
      faseRef.current = f;
      setAnswers(neste);
      if (nyFase) {
        setDir(direction);
        setFase(nyFase);
      }
      onPersist(neste, FASE_REKKE.indexOf(f));
    },
    [onPersist]
  );

  // Focus moves to the question on every step; to the status view during a
  // lookup/think; to the confirmation card when there is one.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!autoFocus) return;
    }
    if (lookup.phase === "searching") {
      statusRef.current?.focus();
    } else if (lookup.phase === "confirm") {
      funnTitleRef.current?.focus();
    } else if (fase === "samtale" && !samtaleOf(answersRef.current)?.aktivt) {
      statusRef.current?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [fase, lookup.phase, samtaleLaster, autoFocus]);

  /* ── bedrift: company name + the BRREG/website lookup ── */

  function setBedrift(field: "navn" | "nettside", value: string) {
    commit({ ...answersRef.current, bedrift: { ...bedriftOf(answersRef.current), [field]: value } });
  }

  function finishLookup(a: PortalAnswers, funn: ResearchFunn | null) {
    setLookup({ phase: "idle" });
    setStatusMsg("");
    const next: PortalAnswers = { ...a, research: funn, _innsikt: undefined };
    if (returnToOppsum.current) {
      returnToOppsum.current = false;
      commit(next, "oppsummering");
      return;
    }
    commit(next, "veivalg");
  }

  async function startLookup() {
    const a = answersRef.current;
    const bedrift = bedriftOf(a);
    const navn = bedrift.navn.trim().slice(0, NAVN_MAX);
    const nettside = (bedrift.nettside ?? "").trim().slice(0, NETTSIDE_MAX);
    setLookup({ phase: "searching" });
    setLookupLine(t.research.slaarOpp);
    setStatusMsg(t.research.slaarOpp);
    lineTimer.current = window.setTimeout(() => {
      lineTimer.current = null;
      if (!alive.current) return;
      setLookupLine(t.research.leserNettsiden);
      setStatusMsg(t.research.leserNettsiden);
    }, LOOKUP_LINE2_MS);
    let funn: ResearchFunn | null = null;
    try {
      const [res] = await Promise.all([
        fetch("/api/portal/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nettside ? { navn, nettside } : { navn }),
          signal: AbortSignal.timeout(LOOKUP_MAX_MS),
        }),
        new Promise((resolve) => window.setTimeout(resolve, LOOKUP_MIN_MS)),
      ]);
      if (res.ok) {
        const json = (await res.json()) as PortalResearchResponse;
        funn = json.funn ?? null;
      }
    } catch {
      funn = null;
    }
    if (lineTimer.current !== null) {
      window.clearTimeout(lineTimer.current);
      lineTimer.current = null;
    }
    if (!alive.current) return;
    lookedUpFor.current = navn;
    if (funn && typeof funn.navn === "string" && funn.navn) {
      setLookup({ phase: "confirm", funn });
      setStatusMsg(`${t.research.fantDere} ${funn.navn}`);
    } else {
      finishLookup(answersRef.current, null);
    }
  }

  function bedriftNeste() {
    const navn = bedriftOf(answersRef.current).navn.trim();
    if (navn.length < NAVN_MIN) return;
    // Re-run the lookup only when the company is new (or the navn changed).
    if (answersRef.current.research === undefined || lookedUpFor.current !== navn) {
      void startLookup();
      return;
    }
    finishLookup(answersRef.current, (answersRef.current.research as ResearchFunn | null) ?? null);
  }

  /* ── veivalg: the reflection (innsikt) + the four-card fork ── */

  useEffect(() => {
    if (fase !== "veivalg") return;
    if (answersRef.current._innsikt !== undefined) return;
    const navn = bedriftOf(answersRef.current).navn.trim();
    if (innsiktFor.current === navn) return;
    innsiktFor.current = navn;
    const research = answersRef.current.research;
    if (research == null) {
      commit({ ...answersRef.current, _innsikt: { observasjoner: [], harNettside: true } });
      return;
    }
    let avbrutt = false;
    setInnsiktLaster(true);
    setStatusMsg(t.veivalg.laster);
    void (async () => {
      let res: PortalInnsiktResponse = { observasjoner: [], harNettside: true };
      try {
        const [r] = await Promise.all([
          fetch("/api/portal/innsikt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ research, lang }),
            signal: AbortSignal.timeout(INNSIKT_MAX_MS),
          }),
          new Promise((resolve) => window.setTimeout(resolve, SAMTALE_MIN_MS)),
        ]);
        if (r.ok) res = (await r.json()) as PortalInnsiktResponse;
      } catch {
        // Reflection is a nicety — a hiccup just means no observations.
      }
      if (avbrutt || !alive.current) return;
      setInnsiktLaster(false);
      commit({ ...answersRef.current, _innsikt: res });
    })();
    return () => {
      avbrutt = true;
    };
    // commit is stable; answers excluded on purpose (the ref + guards drive it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, commit, lang, t.veivalg.laster]);

  function velgIntent(intent: PortalIntent) {
    const prev = samtaleOf(answersRef.current);
    if (returnToOppsum.current && prev && prev.intent === intent && prev.utvekslinger.length > 0) {
      returnToOppsum.current = false;
      commit(answersRef.current, "oppsummering");
      return;
    }
    returnToOppsum.current = false;
    samtaleSig.current = "";
    const samtale: SamtaleState = { intent, utvekslinger: [], aktivt: null, ferdig: false };
    commit({ ...answersRef.current, samtale }, "samtale");
  }

  /* ── samtale: the adaptive loop ── */

  const lokaltSteg = useCallback(
    (): AktivtSteg => ({
      sporsmal:
        lang === "en"
          ? "In a sentence or two — what would the ideal outcome look like for you?"
          : "I én–to setninger — hvordan ser det ideelle resultatet ut for dere?",
      hint:
        lang === "en"
          ? "Whatever comes to mind first is usually the right answer."
          : "Det første som faller dere inn er som regel det riktige.",
      forslag: [],
      forstaelse: [],
      svar: "",
    }),
    [lang]
  );

  useEffect(() => {
    if (fase !== "samtale") return;
    const s = samtaleOf(answers);
    if (!s || s.ferdig || s.aktivt || samtaleLaster) return;
    const sig = `${s.intent}:${s.utvekslinger.length}`;
    if (samtaleSig.current === sig) return;
    samtaleSig.current = sig;
    let avbrutt = false;
    setSamtaleLaster(true);
    setStatusMsg(t.samtale.laster);
    void (async () => {
      let steg: PortalSamtaleResponse | null = null;
      try {
        const [r] = await Promise.all([
          fetch("/api/portal/samtale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: s.intent,
              research: answersRef.current.research ?? null,
              historie: s.utvekslinger.map((u) => ({ sporsmal: u.sporsmal, svar: u.svar })),
              lang,
            }),
            signal: AbortSignal.timeout(SAMTALE_MAX_MS),
          }),
          new Promise((resolve) => window.setTimeout(resolve, SAMTALE_MIN_MS)),
        ]);
        if (r.ok) steg = (await r.json()) as PortalSamtaleResponse;
      } catch {
        steg = null;
      }
      if (avbrutt || !alive.current) return;
      setSamtaleLaster(false);
      const cur = samtaleOf(answersRef.current);
      if (!cur) return;
      const capped = cur.utvekslinger.length >= SAMTALE_MAKS_SPORSMAL;
      // Done = the model says so, we hit the cap, or it produced nothing
      // usable AND we already have something to work with.
      const ingenSporsmal = !steg || steg.ferdig || !steg.sporsmal.trim();
      if (capped || (ingenSporsmal && cur.utvekslinger.length > 0)) {
        commit({ ...answersRef.current, samtale: { ...cur, aktivt: null, ferdig: true } }, "budsjett");
        return;
      }
      const aktivt: AktivtSteg =
        steg && steg.sporsmal.trim()
          ? {
              sporsmal: steg.sporsmal,
              hint: steg.hint,
              forslag: steg.forslag,
              forstaelse: steg.forstaelse,
              svar: "",
            }
          : lokaltSteg(); // total failure on the very first step
      commit({ ...answersRef.current, samtale: { ...cur, aktivt, ferdig: false } });
    })();
    return () => {
      avbrutt = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, answers, samtaleLaster, commit, lang, lokaltSteg, t.samtale.laster]);

  function setSamtaleSvar(value: string) {
    const s = samtaleOf(answersRef.current);
    if (!s || !s.aktivt) return;
    commit({ ...answersRef.current, samtale: { ...s, aktivt: { ...s.aktivt, svar: value } } });
  }

  function svarPaaSamtale(svar: string) {
    const s = samtaleOf(answersRef.current);
    if (!s || !s.aktivt) return;
    const tekst = svar.trim().slice(0, SAMTALE_SVAR_MAX);
    if (!tekst) return;
    const ny: RikUtveksling = {
      sporsmal: s.aktivt.sporsmal,
      svar: tekst,
      hint: s.aktivt.hint,
      forslag: s.aktivt.forslag,
      forstaelse: s.aktivt.forstaelse,
    };
    // aktivt → null lets the loop effect fetch the next step.
    commit({
      ...answersRef.current,
      samtale: { ...s, utvekslinger: [...s.utvekslinger, ny], aktivt: null },
    });
  }

  function samtaleTilbake() {
    const s = samtaleOf(answersRef.current);
    if (s && s.utvekslinger.length > 0) {
      const siste = s.utvekslinger[s.utvekslinger.length - 1];
      const aktivt: AktivtSteg = {
        sporsmal: siste.sporsmal,
        hint: siste.hint ?? "",
        forslag: siste.forslag ?? [],
        forstaelse: siste.forstaelse ?? [],
        svar: siste.svar,
      };
      // Restore the previous card exactly — no refetch (aktivt is set).
      samtaleSig.current = `${s.intent}:${s.utvekslinger.length - 1}`;
      commit(
        { ...answersRef.current, samtale: { ...s, utvekslinger: s.utvekslinger.slice(0, -1), aktivt, ferdig: false } },
        "samtale",
        "back"
      );
    } else {
      commit(answersRef.current, "veivalg", "back");
    }
  }

  /* ── budsjett: the one retained static chip step ── */

  function velgBudsjett(chipId: string) {
    commit({ ...answersRef.current, budsjett: chipId }, "oppsummering");
  }

  /* ── oppsummering: review + edit ── */

  function endre(target: Fase) {
    returnToOppsum.current = true;
    commit(answersRef.current, target, "back");
  }

  function setUtvekslingSvar(i: number, value: string) {
    const s = samtaleOf(answersRef.current);
    if (!s) return;
    const utvekslinger = s.utvekslinger.map((u, j) =>
      j === i ? { ...u, svar: value.slice(0, SAMTALE_SVAR_MAX) } : u
    );
    commit({ ...answersRef.current, samtale: { ...s, utvekslinger } });
  }

  function taSamtalenPaaNytt() {
    const s = samtaleOf(answersRef.current);
    if (!s) {
      commit(answersRef.current, "veivalg", "back");
      return;
    }
    returnToOppsum.current = false;
    samtaleSig.current = "";
    commit(
      { ...answersRef.current, samtale: { ...s, utvekslinger: [], aktivt: null, ferdig: false } },
      "samtale",
      "back"
    );
  }

  function sendInn() {
    const a: PortalAnswers = { ...answersRef.current };
    delete a._fase;
    delete a._innsikt;
    const s = samtaleOf(a);
    if (s) {
      a.samtale = {
        intent: s.intent,
        utvekslinger: s.utvekslinger.map((u) => ({ sporsmal: u.sporsmal, svar: u.svar })),
        ferdig: true,
      };
    }
    onComplete(a);
  }

  /* ── derived view state ── */

  const bedrift = bedriftOf(answers);
  const samtale = samtaleOf(answers);
  const innsikt = innsiktOf(answers);
  const budsjettStep = stepById(t, "budsjett");
  const oppsumStep = stepById(t, "oppsummering");
  const bedriftStep = stepById(t, "bedrift");

  const headingId = "vk-portal-q";
  const hintId = "vk-portal-q-hint";

  const framdrift =
    fase === "samtale"
      ? t.samtale.framdriftTemplate.replace("{n}", String((samtale?.utvekslinger.length ?? 0) + 1))
      : t.levels[0].navn;

  const funnMeta =
    lookup.phase === "confirm"
      ? [
          lookup.funn.bransje,
          lookup.funn.sted,
          typeof lookup.funn.ansatte === "number" && lookup.funn.ansatte > 0
            ? t.research.ansatteTemplate.replace("{n}", String(lookup.funn.ansatte))
            : undefined,
        ]
          .filter((p): p is string => typeof p === "string" && p.length > 0)
          .join(" · ")
      : "";

  // The conversation's «tenker»-overlay covers any samtale frame without an
  // active question (loading, or the beat between answering and the next
  // fetch). The reflection (innsikt) is non-blocking — it loads inline in the
  // veivalg screen, so the fork is usable immediately.
  const visStatus =
    lookup.phase === "searching" || (fase === "samtale" && !samtale?.aktivt);

  return (
    <section className="vk-portal-wiz">
      <p className="vk-mono vk-portal-stepcount">{framdrift}</p>

      {fase === "bedrift" && lookup.phase === "idle" && notice ? (
        <p className="vk-mono vk-portal-skipnote" role="status">
          {notice}
        </p>
      ) : null}

      {/* ── status overlay: lookup / think ── */}
      {visStatus ? (
        <div className="vk-portal-step vk-portal-lookup" data-dir="fwd" tabIndex={-1} ref={statusRef}>
          <p className="vk-mono vk-portal-lookupline" aria-hidden="true">
            {lookup.phase === "searching"
              ? lookupLine
              : fase === "veivalg"
                ? t.veivalg.laster
                : t.samtale.laster}
          </p>
        </div>
      ) : null}

      {/* ── bedrift confirmation card ── */}
      {lookup.phase === "confirm" ? (
        <div className="vk-portal-step" data-dir="fwd">
          <div className="vk-portal-funn">
            <p ref={funnTitleRef} tabIndex={-1} className="vk-mono vk-portal-funn-tittel">
              {t.research.fantDere}
            </p>
            <p className="vk-display vk-portal-funn-navn">{lookup.funn.navn}</p>
            {funnMeta ? <p className="vk-portal-funn-meta">{funnMeta}</p> : null}
            <div className="vk-portal-chips">
              <button
                type="button"
                className="vk-portal-chip"
                onClick={() => finishLookup(answers, lookup.funn)}
              >
                {t.research.stemmer}
              </button>
              <button
                type="button"
                className="vk-portal-chip"
                onClick={() => finishLookup(answers, null)}
              >
                {t.research.ikkeOss}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── bedrift inputs ── */}
      {fase === "bedrift" && lookup.phase === "idle" ? (
        <div className="vk-portal-step" key="bedrift" data-dir={dir}>
          <h1 id={headingId} ref={headingRef} tabIndex={-1} className="vk-display vk-portal-q">
            {bedriftStep?.sporsmal}
          </h1>
          {bedriftStep?.hint ? (
            <p className="vk-portal-hint" id={hintId}>
              {bedriftStep.hint}
            </p>
          ) : null}
          <div className="vk-portal-bedrift">
            <div className="vk-portal-felt">
              <label className="vk-portal-label" htmlFor="vk-portal-bnavn">
                {t.research.navnLabel}
              </label>
              <input
                id="vk-portal-bnavn"
                type="text"
                className="vk-portal-input"
                autoComplete="organization"
                maxLength={NAVN_MAX}
                value={bedrift.navn}
                placeholder={t.research.navnPlassholder}
                aria-describedby={hintId}
                onChange={(e) => setBedrift("navn", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    bedriftNeste();
                  }
                }}
              />
            </div>
            <div className="vk-portal-felt">
              <label className="vk-portal-label" htmlFor="vk-portal-bnett">
                {t.research.nettsideLabel}{" "}
                <span className="vk-portal-label-hint">{t.research.nettsideHint}</span>
              </label>
              <input
                id="vk-portal-bnett"
                type="text"
                className="vk-portal-input"
                autoComplete="url"
                inputMode="url"
                maxLength={NETTSIDE_MAX}
                value={bedrift.nettside ?? ""}
                placeholder={t.research.nettsidePlassholder}
                onChange={(e) => setBedrift("nettside", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    bedriftNeste();
                  }
                }}
              />
            </div>
          </div>
          <div className="vk-portal-wizrow">
            <button
              type="button"
              className="vk-btn vk-portal-next"
              disabled={bedrift.navn.trim().length < NAVN_MIN}
              onClick={bedriftNeste}
            >
              {t.wizard.neste}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── veivalg: reflection + the four-card fork ── */}
      {fase === "veivalg" && !visStatus ? (
        <div className="vk-portal-step" key="veivalg" data-dir={dir}>
          {innsiktLaster && (!innsikt || innsikt.observasjoner.length === 0) ? (
            <p className="vk-mono vk-portal-reflekt-laster" role="status">
              {t.veivalg.laster}
            </p>
          ) : innsikt && innsikt.observasjoner.length > 0 ? (
            <div className="vk-portal-reflekt">
              <p className="vk-mono vk-portal-reflekt-tittel">{t.veivalg.reflektTittel}</p>
              <ul className="vk-portal-reflekt-liste">
                {innsikt.observasjoner.map((o, i) => (
                  <li key={i} className="vk-chalk vk-portal-reflekt-punkt">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <h1 id={headingId} ref={headingRef} tabIndex={-1} className="vk-display vk-portal-q">
            {t.veivalg.sporsmal}
          </h1>
          <p className="vk-portal-hint" id={hintId}>
            {t.veivalg.hint}
          </p>
          <div className="vk-portal-fork" role="group" aria-labelledby={headingId}>
            {INTENTS.map((intent) => (
              <button
                key={intent}
                type="button"
                className="vk-portal-forkkort"
                aria-pressed={samtale?.intent === intent}
                onClick={() => velgIntent(intent)}
              >
                <span className="vk-portal-forkkort-tittel">{t.veivalg.kort[intent].tittel}</span>
                <span className="vk-portal-forkkort-tekst">{t.veivalg.kort[intent].tekst}</span>
              </button>
            ))}
          </div>
          <div className="vk-portal-wizrow">
            <button
              type="button"
              className="vk-portal-back"
              onClick={() => commit(answers, "bedrift", "back")}
            >
              <span aria-hidden="true">←</span> {t.wizard.tilbake}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── samtale: one adaptive question + the live understanding panel ── */}
      {fase === "samtale" && samtale?.aktivt && !visStatus ? (
        <div className="vk-portal-step vk-portal-samtale" key={`s-${samtale.utvekslinger.length}`} data-dir={dir}>
          <div className="vk-portal-samtale-q">
            <h1 id={headingId} ref={headingRef} tabIndex={-1} className="vk-display vk-portal-q">
              {samtale.aktivt.sporsmal}
            </h1>
            {samtale.aktivt.hint ? (
              <p className="vk-portal-hint" id={hintId}>
                {samtale.aktivt.hint}
              </p>
            ) : null}
            {samtale.aktivt.forslag.length > 0 ? (
              <div className="vk-portal-chips" role="group" aria-labelledby={headingId}>
                {samtale.aktivt.forslag.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="vk-portal-chip"
                    onClick={() => svarPaaSamtale(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : null}
            <textarea
              className="vk-portal-textarea"
              value={samtale.aktivt.svar}
              placeholder={t.samtale.plassholder}
              aria-label={t.samtale.egneOrd}
              aria-describedby={samtale.aktivt.hint ? hintId : undefined}
              rows={3}
              maxLength={SAMTALE_SVAR_MAX}
              onChange={(e) => setSamtaleSvar(e.target.value)}
            />
            <div className="vk-portal-wizrow">
              <button
                type="button"
                className="vk-portal-back"
                onClick={samtaleTilbake}
              >
                <span aria-hidden="true">←</span> {t.wizard.tilbake}
              </button>
              <button
                type="button"
                className="vk-portal-quietlink vk-mono vk-portal-hopp"
                onClick={() => svarPaaSamtale(lang === "en" ? "(not sure)" : "(vet ikke)")}
              >
                {t.samtale.hopp}
              </button>
              <button
                type="button"
                className="vk-btn vk-portal-next"
                disabled={!samtale.aktivt.svar.trim()}
                onClick={() => svarPaaSamtale(samtale.aktivt?.svar ?? "")}
              >
                {t.samtale.neste}
              </button>
            </div>
          </div>
          {samtale.aktivt.forstaelse.length > 0 ? (
            <aside className="vk-portal-panel" aria-label={t.samtale.panelTittel}>
              <p className="vk-mono vk-portal-panel-tittel">{t.samtale.panelTittel}</p>
              <ul className="vk-portal-panel-liste">
                {samtale.aktivt.forstaelse.map((p, i) => (
                  <li key={i} className="vk-portal-panel-punkt">
                    {p}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      ) : null}

      {/* ── budsjett: the one static chip step ── */}
      {fase === "budsjett" ? (
        <div className="vk-portal-step" key="budsjett" data-dir={dir}>
          <h1 id={headingId} ref={headingRef} tabIndex={-1} className="vk-display vk-portal-q">
            {budsjettStep?.sporsmal}
          </h1>
          {budsjettStep?.hint ? (
            <p className="vk-portal-hint" id={hintId}>
              {budsjettStep.hint}
            </p>
          ) : null}
          <div className="vk-portal-chips" role="group" aria-labelledby={headingId}>
            {budsjettStep?.chips
              ?.filter((c) => !c.skjult)
              .map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className="vk-portal-chip"
                  aria-pressed={answers.budsjett === chip.id}
                  onClick={() => velgBudsjett(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
          </div>
          <div className="vk-portal-wizrow">
            <button type="button" className="vk-portal-back" onClick={samtaleTilbake}>
              <span aria-hidden="true">←</span> {t.wizard.tilbake}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── oppsummering ── */}
      {fase === "oppsummering" ? (
        <div className="vk-portal-step" key="oppsummering" data-dir={dir}>
          <h1 id={headingId} ref={headingRef} tabIndex={-1} className="vk-display vk-portal-q">
            {oppsumStep?.sporsmal}
          </h1>
          {oppsumStep?.hint ? (
            <p className="vk-portal-hint" id={hintId}>
              {oppsumStep.hint}
            </p>
          ) : null}
          <div className="vk-portal-funn vk-portal-oppsum">
            {/* bedrift */}
            <div className="vk-portal-felt">
              <p className="vk-portal-label">{bedriftStep?.sporsmal}</p>
              <p className="vk-portal-avsnitt">
                {[bedrift.navn.trim(), (bedrift.nettside ?? "").trim()].filter(Boolean).join(" — ") ||
                  t.wizard.ikkeBesvart}
              </p>
              <button
                type="button"
                className="vk-portal-quietlink vk-mono"
                onClick={() => endre("bedrift")}
              >
                {t.wizard.endre}
              </button>
            </div>

            {/* veivalg / intent */}
            {samtale ? (
              <div className="vk-portal-felt">
                <p className="vk-portal-label">{t.samtale.veivalgLabel}</p>
                <p className="vk-portal-avsnitt">{t.veivalg.kort[samtale.intent].tittel}</p>
                <button
                  type="button"
                  className="vk-portal-quietlink vk-mono"
                  onClick={() => endre("veivalg")}
                >
                  {t.wizard.endre}
                </button>
              </div>
            ) : null}

            {/* conversation — editable answers */}
            {samtale && samtale.utvekslinger.length > 0 ? (
              <div className="vk-portal-felt vk-portal-oppsum-samtale">
                <p className="vk-portal-label">{t.samtale.samtaleLabel}</p>
                {samtale.utvekslinger.map((u, i) => (
                  <div key={i} className="vk-portal-oppsum-utveksling">
                    <p className="vk-portal-oppsum-sporsmal">{u.sporsmal}</p>
                    <textarea
                      className="vk-portal-textarea vk-portal-oppsum-svar"
                      value={u.svar}
                      aria-label={u.sporsmal}
                      rows={2}
                      maxLength={SAMTALE_SVAR_MAX}
                      onChange={(e) => setUtvekslingSvar(i, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="vk-portal-quietlink vk-mono"
                  onClick={taSamtalenPaaNytt}
                >
                  {t.samtale.taPaaNytt}
                </button>
              </div>
            ) : null}

            {/* budsjett */}
            <div className="vk-portal-felt">
              <p className="vk-portal-label">{budsjettStep?.sporsmal}</p>
              <p className="vk-portal-avsnitt">
                {typeof answers.budsjett === "string"
                  ? chipLabel(budsjettStep, answers.budsjett)
                  : t.wizard.ikkeBesvart}
              </p>
              <button
                type="button"
                className="vk-portal-quietlink vk-mono"
                onClick={() => endre("budsjett")}
              >
                {t.wizard.endre}
              </button>
            </div>
          </div>
          <div className="vk-portal-wizrow">
            <button
              type="button"
              className="vk-portal-back"
              onClick={() => commit(answers, "budsjett", "back")}
            >
              <span aria-hidden="true">←</span> {t.wizard.tilbake}
            </button>
            <button type="button" className="vk-btn vk-btn--cta vk-portal-next" onClick={sendInn}>
              {t.wizard.sendInn}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── assistive-tech live regions ── */}
      <p className="vk-sr" aria-live="polite">
        {framdrift}
      </p>
      <p className="vk-sr" role="status">
        {statusMsg}
      </p>
    </section>
  );
}
