"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent, type PortalContent, type PortalStep } from "@/lib/portalContent";
import {
  DROMEN_MAX,
  OPPFOLGING_SPORSMAL_MAX,
  OPPFOLGING_SVAR_MAX,
  type PortalBedriftAnswer,
  type PortalOppfolgingAnswer,
  type PortalOppfolgingResponse,
  type PortalResearchResponse,
  type ResearchFunn,
} from "@/lib/portalTypes";

/**
 * The kartlegging wizard — ONE question per screen.
 *
 * Answers shape (consumed verbatim by portalAi.answersToFacts):
 *   - bedrift (first step):  answers.bedrift = { navn, nettside? } and
 *     answers.research = ResearchFunn | null (set after the lookup moment)
 *   - single-select chips:  answers[step.id] = chipId (string)
 *   - multi-select chips:   answers[step.id] = chipId[] (string[])
 *   - pure fritekst (dromen): answers[step.id] = text (string)
 *   - chips + fritekst:     text lives under answers[`${step.id}_tekst`]
 *   - oppfolging (dynamic): answers.oppfolging = { sporsmal, svar } | null
 *     (null = the question generation was tried and skipped — never retried)
 *
 * The bedrift step never asks the obvious follow-ups: on continue it POSTs
 * /api/portal/research (BRREG + company website incl. subpages, max ~10s
 * with a second status line), shows a quiet confirmation card on a hit, and
 * continues silently on timeout/null. When the research found their bransje,
 * the "bransje" step is auto-skipped — steps/stegLabel are derived from the
 * filtered list so the count stays coherent.
 *
 * After «drømmen» the wizard asks /api/portal/oppfolging for ONE adaptive
 * follow-up question (quiet «tenker» moment, ~6.5s budget) — on a hit the
 * question is injected as its own step; on anything else the flow continues
 * silently. The LAST step is the oppsummering: every answer with an
 * «Endre»-link that jumps back to its step and returns here on the next
 * continue.
 *
 * Every answer and step change is persisted upward (→ localStorage, key
 * vk-portal-draft) so the draft survives the magic-link round trip. Old
 * drafts (pre-oppsummering format) restore fine: unknown answers keep their
 * keys, missing ones are simply asked.
 */

export type PortalAnswers = Record<string, unknown>;

interface WizardProps {
  initialAnswers: PortalAnswers;
  initialStep: number;
  /** Focus the question heading on mount (arriving via interaction). */
  autoFocus?: boolean;
  /** Quiet mono note over step 1 (e.g. «fant ingen kartlegging …» after a
      returning-user login that found no rows). Same voice as the skipnote. */
  notice?: string | null;
  onPersist: (answers: PortalAnswers, step: number) => void;
  onComplete: (answers: PortalAnswers) => void;
}

// The client gives the lookup at most 10s (the research now also reads
// subpages from their website), then continues silently; a second status
// line lands after a few seconds so the wait reads as work, not a hang.
// The short floor keeps a cache-fast answer from flashing past unread.
const LOOKUP_MAX_MS = 10_000;
const LOOKUP_MIN_MS = 600;
const LOOKUP_LINE2_MS = 3_500;

// The adaptive follow-up moment — server timeout is ~5s; never block longer.
const OPPFOLGING_MAX_MS = 6_500;
const OPPFOLGING_MIN_MS = 600;

// The dromen character counter appears when this few characters remain.
const TEGN_VARSEL = 200;

const NAVN_MIN = 2;
const NAVN_MAX = 80;
const NETTSIDE_MAX = 200;

type LookupState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "confirm"; funn: ResearchFunn }
  /** The oppfolging «tenker» moment — same quiet treatment as searching. */
  | { phase: "tenker" };

function bedriftOf(answers: PortalAnswers): PortalBedriftAnswer {
  const raw = answers.bedrift;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { navn: "" };
  }
  const b = raw as Record<string, unknown>;
  return {
    navn: typeof b.navn === "string" ? b.navn : "",
    nettside: typeof b.nettside === "string" ? b.nettside : undefined,
  };
}

function researchBransje(answers: PortalAnswers): string {
  const r = answers.research;
  if (typeof r !== "object" || r === null || Array.isArray(r)) return "";
  const bransje = (r as Record<string, unknown>).bransje;
  return typeof bransje === "string" ? bransje.trim() : "";
}

function researchAnsatte(answers: PortalAnswers): number {
  const r = answers.research;
  if (typeof r !== "object" || r === null || Array.isArray(r)) return 0;
  const ansatte = (r as Record<string, unknown>).ansatte;
  return typeof ansatte === "number" && ansatte > 0 ? ansatte : 0;
}

/**
 * Map a BRREG employee count onto the SAME ids as the størrelse chips —
 * labelFor/oppslag then resolves the auto-filled value exactly like a
 * pressed chip. (Older rows carry the legacy "1-5"-style strings; lookups
 * fall back to the raw value, which stays readable.)
 */
export function ansatteBucket(n: number): string {
  if (n <= 5) return "1_5";
  if (n <= 20) return "6_20";
  if (n <= 50) return "21_50";
  return "50_pluss";
}

/** answers.oppfolging when it carries a generated question — else null. */
function oppfolgingOf(answers: PortalAnswers): PortalOppfolgingAnswer | null {
  const raw = answers.oppfolging;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.sporsmal !== "string" || !o.sporsmal.trim()) return null;
  return {
    sporsmal: o.sporsmal.trim().slice(0, OPPFOLGING_SPORSMAL_MAX),
    svar: typeof o.svar === "string" ? o.svar : "",
  };
}

/**
 * The visible step list: auto-skip steps the research already answered
 * (bransje + størrelse), and inject the dynamic oppfolging step right after
 * «drømmen» once a generated question exists in the answers.
 */
function buildSteps(t: PortalContent, answers: PortalAnswers): PortalStep[] {
  let steps = t.steps;
  if (researchBransje(answers)) steps = steps.filter((s) => s.id !== "bransje");
  if (researchAnsatte(answers) > 0) steps = steps.filter((s) => s.id !== "storrelse");
  const opp = oppfolgingOf(answers);
  if (opp) {
    const i = steps.findIndex((s) => s.id === "dromen");
    const oppStep: PortalStep = {
      id: "oppfolging",
      sporsmal: opp.sporsmal,
      hint: t.oppfolging.hint,
      fritekst: true,
      plassholder: t.oppfolging.plassholder,
    };
    // dromen is never skipped, but stay safe: fall back to before the
    // oppsummering (always last) if it ever went missing.
    const at = i >= 0 ? i + 1 : steps.length - 1;
    steps = [...steps.slice(0, at), oppStep, ...steps.slice(at)];
  }
  return steps;
}

function textKeyFor(step: PortalStep): string {
  return step.chips ? `${step.id}_tekst` : step.id;
}

function answered(step: PortalStep, answers: PortalAnswers): boolean {
  if (step.id === "bedrift") {
    return bedriftOf(answers).navn.trim().length >= NAVN_MIN;
  }
  // The oppsummering carries no answer, and the oppfolging is honestly
  // skippable — continue is always available on both.
  if (step.id === "oppsummering" || step.id === "oppfolging") return true;
  const text = answers[textKeyFor(step)];
  const hasText = typeof text === "string" && text.trim().length > 0;
  if (!step.chips) return hasText;
  const v = answers[step.id];
  const hasChip = step.multi
    ? Array.isArray(v) && v.length > 0
    : typeof v === "string" && v.length > 0;
  return hasChip || (step.fritekst === true && hasText);
}

/** Chip id → label via the step definition (incl. hidden legacy chips). */
function chipLabel(step: PortalStep, id: string): string {
  return step.chips?.find((c) => c.id === id)?.label ?? id;
}

/** One oppsummering row: the answer as readable text — "" when empty. */
function describeAnswer(step: PortalStep, answers: PortalAnswers): string {
  if (step.id === "bedrift") {
    const b = bedriftOf(answers);
    return [b.navn.trim(), (b.nettside ?? "").trim()].filter(Boolean).join(" — ");
  }
  if (step.id === "oppfolging") {
    return oppfolgingOf(answers)?.svar.trim() ?? "";
  }
  const parts: string[] = [];
  const raw = answers[step.id];
  if (typeof raw === "string" && raw.trim()) {
    parts.push(chipLabel(step, raw));
  } else if (Array.isArray(raw)) {
    const labels = raw
      .filter((v): v is string => typeof v === "string")
      .map((v) => chipLabel(step, v));
    if (labels.length > 0) parts.push(labels.join(", "));
  }
  if (step.chips) {
    const text = answers[`${step.id}_tekst`];
    if (typeof text === "string" && text.trim()) parts.push(text.trim());
  }
  return parts.join(" — ");
}

export default function Wizard({
  initialAnswers,
  initialStep,
  autoFocus = false,
  notice = null,
  onPersist,
  onComplete,
}: WizardProps) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [answers, setAnswers] = useState<PortalAnswers>(initialAnswers);
  const steps = buildSteps(t, answers);

  const [idx, setIdx] = useState(() =>
    Math.min(
      Math.max(initialStep, 0),
      buildSteps(portalContent[lang], initialAnswers).length - 1
    )
  );
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [lookup, setLookup] = useState<LookupState>({ phase: "idle" });
  const [lookupMsg, setLookupMsg] = useState("");
  // The visible mono line during the lookup — swaps to «titter på
  // nettsiden …» mid-wait so the longer research reads as work.
  const [lookupLine, setLookupLine] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const funnTitleRef = useRef<HTMLParagraphElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const lineTimer = useRef<number | null>(null);
  const mounted = useRef(false);
  const alive = useRef(true);
  // Set when an «Endre»-link on the oppsummering jumped back to a step —
  // the NEXT continue returns straight to the oppsummering instead of
  // walking the whole row again. Cleared by the explicit Tilbake-button.
  const returnToOppsum = useRef(false);
  // The navn the research was run for — a restored draft with research
  // already set was looked up for the navn it carries; editing the navn
  // re-arms the lookup on the next continue.
  const lookedUpFor = useRef<string | null>(
    initialAnswers.research !== undefined ? bedriftOf(initialAnswers).navn.trim() : null
  );

  // Focus moves to the new question on every step change; on mount only
  // when the visitor arrived here by interacting (not on page load).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!autoFocus) return;
    }
    headingRef.current?.focus();
  }, [idx, autoFocus]);

  // The lookup/tenker moments unmount the wizrow (the pressed button
  // included) — park focus on the status view, then on the confirmation
  // card when there is one.
  useEffect(() => {
    if (lookup.phase === "searching" || lookup.phase === "tenker") {
      searchRef.current?.focus();
    } else if (lookup.phase === "confirm") {
      funnTitleRef.current?.focus();
    }
  }, [lookup.phase]);

  useEffect(() => {
    // Arm on every mount — StrictMode's simulated unmount in dev runs the
    // cleanup below and would otherwise leave the ref false forever.
    alive.current = true;
    return () => {
      alive.current = false;
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
      if (lineTimer.current !== null) {
        window.clearTimeout(lineTimer.current);
      }
    };
  }, []);

  const safeIdx = Math.min(idx, steps.length - 1);
  const step = steps[safeIdx];
  const last = safeIdx === steps.length - 1;
  const canAdvance = answered(step, answers);
  const bransjeSkipped = researchBransje(answers).length > 0 || researchAnsatte(answers) > 0;
  const stegLabel = t.a11y.stegTemplate
    .replace("{n}", String(safeIdx + 1))
    .replace("{total}", String(steps.length));

  function goTo(next: number, direction: "fwd" | "back", a: PortalAnswers) {
    // Any explicit navigation cancels a pending chip auto-advance —
    // otherwise a fast «Tilbake» press could be overridden 160ms later by
    // the stale timer throwing the visitor forward again.
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setDir(direction);
    setIdx(next);
    onPersist(a, next);
  }

  /** Land the lookup (funn or null), store it, and move past bedrift. */
  function finishLookup(a: PortalAnswers, funn: ResearchFunn | null) {
    setLookup({ phase: "idle" });
    setLookupMsg("");
    const next: PortalAnswers = { ...a, research: funn };
    // BRREG already answered størrelse — store the same bucket the chips
    // would have produced, so the skipped step leaves no hole in answers.
    if (funn && typeof funn.ansatte === "number" && funn.ansatte > 0) {
      next.storrelse = ansatteBucket(funn.ansatte);
    }
    setAnswers(next);
    goTo(1, "fwd", next);
  }

  /** The lookup moment — max ~10s, then continue (silently on null). */
  async function startLookup(a: PortalAnswers) {
    const bedrift = bedriftOf(a);
    const navn = bedrift.navn.trim().slice(0, NAVN_MAX);
    const nettside = (bedrift.nettside ?? "").trim().slice(0, NETTSIDE_MAX);
    setLookup({ phase: "searching" });
    setLookupLine(t.research.slaarOpp);
    setLookupMsg(t.research.slaarOpp);
    // The research reads their website too now — say so mid-wait, both on
    // screen and in the live region, so the longer lookup never feels hung.
    lineTimer.current = window.setTimeout(() => {
      lineTimer.current = null;
      if (!alive.current) return;
      setLookupLine(t.research.leserNettsiden);
      setLookupMsg(t.research.leserNettsiden);
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
      // Timeout or network hiccup — never the visitor's problem.
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
      setLookupMsg(`${t.research.fantDere} ${funn.navn}`);
    } else {
      finishLookup(a, null);
    }
  }

  /** Land the follow-up (question or null) and move past dromen. */
  function finishOppfolging(a: PortalAnswers, sporsmal: string | null) {
    setLookup({ phase: "idle" });
    setLookupMsg("");
    const next: PortalAnswers = {
      ...a,
      // null = tried and skipped — advance() never re-fires for this draft.
      oppfolging: sporsmal ? { sporsmal, svar: "" } : null,
    };
    setAnswers(next);
    const list = buildSteps(t, next);
    const dromenIdx = list.findIndex((s) => s.id === "dromen");
    const after = dromenIdx >= 0 ? dromenIdx + 1 : safeIdx + 1;
    if (!sporsmal && returnToOppsum.current) {
      // Mid-edit from the oppsummering and no question landed — go back to
      // the overview directly instead of stranding them on the next step.
      returnToOppsum.current = false;
      goTo(list.length - 1, "fwd", next);
      return;
    }
    // With a question the injected step sits right after dromen — land on
    // it (the returnToOppsum flag survives, so answering returns to the
    // oppsummering as expected).
    goTo(after, "fwd", next);
  }

  /** The «tenker» moment — ONE adaptive question, never blocking on fail. */
  async function startOppfolging(a: PortalAnswers) {
    setLookup({ phase: "tenker" });
    setLookupMsg(t.oppfolging.tenker);
    let sporsmal: string | null = null;
    try {
      const [res] = await Promise.all([
        fetch("/api/portal/oppfolging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: a, lang }),
          signal: AbortSignal.timeout(OPPFOLGING_MAX_MS),
        }),
        new Promise((resolve) => window.setTimeout(resolve, OPPFOLGING_MIN_MS)),
      ]);
      if (res.ok) {
        const json = (await res.json()) as PortalOppfolgingResponse;
        sporsmal =
          typeof json.sporsmal === "string" && json.sporsmal.trim()
            ? json.sporsmal.trim().slice(0, OPPFOLGING_SPORSMAL_MAX)
            : null;
      }
    } catch {
      // Timeout, rate limit, network — the step is silently skipped.
      sporsmal = null;
    }
    if (!alive.current) return;
    finishOppfolging(a, sporsmal);
  }

  function advance(a: PortalAnswers) {
    if (!answered(steps[safeIdx], a)) return;
    const current = steps[safeIdx];
    if (current.id === "bedrift") {
      const navn = bedriftOf(a).navn.trim();
      if (a.research === undefined || lookedUpFor.current !== navn) {
        void startLookup(a);
        return;
      }
    }
    // Leaving dromen for the first time: ask for the ONE follow-up.
    // undefined = never tried; null/object = already settled, never again.
    if (current.id === "dromen" && a.oppfolging === undefined) {
      void startOppfolging(a);
      return;
    }
    // An «Endre»-jump goes straight back to the oppsummering once the
    // edited step is re-answered — nobody walks the whole row twice.
    if (returnToOppsum.current && current.id !== "oppsummering") {
      returnToOppsum.current = false;
      goTo(steps.length - 1, "fwd", a);
      return;
    }
    if (safeIdx === steps.length - 1) {
      onPersist(a, safeIdx);
      onComplete(a);
      return;
    }
    goTo(safeIdx + 1, "fwd", a);
  }

  /** «Endre» on an oppsummering row — jump to the step, return on continue. */
  function editStep(target: number) {
    goTo(target, "back", answers);
    returnToOppsum.current = true;
  }

  function selectChip(chipId: string) {
    if (step.multi) {
      const current = Array.isArray(answers[step.id])
        ? (answers[step.id] as unknown[]).filter(
            (v): v is string => typeof v === "string"
          )
        : [];
      const next = current.includes(chipId)
        ? current.filter((v) => v !== chipId)
        : [...current, chipId];
      const a = { ...answers, [step.id]: next };
      setAnswers(a);
      onPersist(a, safeIdx);
      return;
    }
    const a = { ...answers, [step.id]: chipId };
    setAnswers(a);
    onPersist(a, safeIdx);
    // Single-select without fritekst: the click IS the answer — advance
    // after a short press-settle beat. Never on the last step: handing
    // over to the authgate deserves an explicit «Send inn»-press.
    if (!step.fritekst && safeIdx < steps.length - 1) {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => advance(a), 160);
    }
  }

  function setText(value: string) {
    // The oppfolging answer lives INSIDE the {sporsmal, svar}-object so the
    // question always rides along with what it asked about.
    const a: PortalAnswers =
      step.id === "oppfolging"
        ? {
            ...answers,
            oppfolging: {
              sporsmal: oppfolgingOf(answers)?.sporsmal ?? step.sporsmal,
              svar: value,
            },
          }
        : { ...answers, [textKeyFor(step)]: value };
    setAnswers(a);
    onPersist(a, safeIdx);
  }

  function setBedrift(field: "navn" | "nettside", value: string) {
    const bedrift = { ...bedriftOf(answers), [field]: value };
    const a = { ...answers, bedrift };
    setAnswers(a);
    onPersist(a, safeIdx);
  }

  const chipValue = answers[step.id];
  const textValue =
    step.id === "oppfolging"
      ? (oppfolgingOf(answers)?.svar ?? "")
      : typeof answers[textKeyFor(step)] === "string"
        ? (answers[textKeyFor(step)] as string)
        : "";
  const headingId = "vk-portal-q";
  const hintId = step.hint ? "vk-portal-q-hint" : undefined;
  const dromen = step.id === "dromen";
  const oppfolgingStep = step.id === "oppfolging";
  const oppsummering = step.id === "oppsummering";
  const bedrift = step.id === "bedrift" ? bedriftOf(answers) : null;

  // The dromen character counter — visible near the cap; the live region
  // announces only at coarse thresholds so typing never chatters.
  const tegnIgjen = DROMEN_MAX - textValue.length;
  const tegnId = "vk-portal-tegn";
  const tegnSrTrinn =
    tegnIgjen <= 0 ? 0 : tegnIgjen <= 50 ? 50 : tegnIgjen <= 100 ? 100 : tegnIgjen <= TEGN_VARSEL ? TEGN_VARSEL : null;

  const funnMeta =
    lookup.phase === "confirm"
      ? [
          lookup.funn.bransje,
          lookup.funn.sted,
          typeof lookup.funn.ansatte === "number" && lookup.funn.ansatte > 0
            ? t.research.ansatteTemplate.replace("{n}", String(lookup.funn.ansatte))
            : undefined,
        ]
          .filter((part): part is string => typeof part === "string" && part.length > 0)
          .join(" · ")
      : "";

  return (
    <section className="vk-portal-wiz">
      <p className="vk-mono vk-portal-stepcount">{stegLabel}</p>
      {/* The returning-user notice — only over the first question, where
          the loginOnly boot lands. Same margin-annotation voice as the
          skipnote below. */}
      {lookup.phase === "idle" && notice && safeIdx === 0 ? (
        <p className="vk-mono vk-portal-skipnote" role="status">
          {notice}
        </p>
      ) : null}
      {lookup.phase === "idle" && bransjeSkipped && safeIdx === 1 ? (
        <p className="vk-mono vk-portal-skipnote">{t.research.fantBransjen}</p>
      ) : null}

      {lookup.phase === "searching" || lookup.phase === "tenker" ? (
        <div
          className="vk-portal-step vk-portal-lookup"
          data-dir="fwd"
          tabIndex={-1}
          ref={searchRef}
        >
          <p className="vk-mono vk-portal-lookupline" aria-hidden="true">
            {lookup.phase === "tenker" ? t.oppfolging.tenker : lookupLine}
          </p>
        </div>
      ) : null}

      {lookup.phase === "confirm" ? (
        <div className="vk-portal-step" data-dir="fwd">
          <div className="vk-portal-funn">
            <p
              ref={funnTitleRef}
              tabIndex={-1}
              className="vk-mono vk-portal-funn-tittel"
            >
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

      {lookup.phase === "idle" ? (
        <div className="vk-portal-step" key={step.id} data-dir={dir}>
          <h1
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="vk-display vk-portal-q"
          >
            {step.sporsmal}
          </h1>
          {step.hint ? (
            dromen ? (
              <p className="vk-chalk vk-portal-hint--chalk" id={hintId}>
                {step.hint}
              </p>
            ) : (
              <p className="vk-portal-hint" id={hintId}>
                {step.hint}
              </p>
            )
          ) : null}

          {bedrift ? (
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
                      advance(answers);
                    }
                  }}
                />
              </div>
              <div className="vk-portal-felt">
                <label className="vk-portal-label" htmlFor="vk-portal-bnett">
                  {t.research.nettsideLabel}{" "}
                  <span className="vk-portal-label-hint">
                    {t.research.nettsideHint}
                  </span>
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
                      advance(answers);
                    }
                  }}
                />
              </div>
            </div>
          ) : null}

          {step.chips ? (
            <div
              className="vk-portal-chips"
              role="group"
              aria-labelledby={headingId}
              aria-describedby={hintId}
            >
              {/* skjulte chips are legacy label-lookups only — never pressable. */}
              {step.chips.filter((chip) => !chip.skjult).map((chip) => {
                const selected = step.multi
                  ? Array.isArray(chipValue) && chipValue.includes(chip.id)
                  : chipValue === chip.id;
                return (
                  <button
                    type="button"
                    key={chip.id}
                    className="vk-portal-chip"
                    aria-pressed={selected}
                    onClick={() => selectChip(chip.id)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {step.fritekst && !dromen && !oppfolgingStep ? (
            <input
              type="text"
              className="vk-portal-input"
              value={textValue}
              placeholder={step.plassholder}
              // Chips+fritekst: a distinct name — the heading already labels
              // the chip group, and the placeholder vanishes once typed in.
              aria-label={t.a11y.egneOrd}
              aria-describedby={hintId}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  advance(answers);
                }
              }}
            />
          ) : null}

          {dromen ? (
            <>
              <textarea
                className="vk-portal-textarea"
                value={textValue}
                placeholder={step.plassholder}
                aria-labelledby={headingId}
                aria-describedby={
                  [hintId, tegnIgjen <= TEGN_VARSEL ? tegnId : null]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                rows={5}
                maxLength={DROMEN_MAX}
                onChange={(e) => setText(e.target.value)}
              />
              {tegnIgjen <= TEGN_VARSEL ? (
                <p id={tegnId} className="vk-mono vk-portal-hint" aria-hidden="true">
                  {t.wizard.tegnIgjenTemplate.replace("{n}", String(tegnIgjen))}
                </p>
              ) : null}
            </>
          ) : null}

          {oppfolgingStep ? (
            <textarea
              className="vk-portal-textarea"
              value={textValue}
              placeholder={step.plassholder}
              aria-labelledby={headingId}
              aria-describedby={hintId}
              rows={3}
              maxLength={OPPFOLGING_SVAR_MAX}
              onChange={(e) => setText(e.target.value)}
            />
          ) : null}

          {oppsummering ? (
            <div className="vk-portal-funn vk-portal-oppsum">
              {steps.slice(0, -1).map((s, i) => {
                const verdi = describeAnswer(s, answers);
                return (
                  <div key={s.id} className="vk-portal-felt">
                    <p className="vk-portal-label">{s.sporsmal}</p>
                    <p className="vk-portal-avsnitt">
                      {verdi || t.wizard.ikkeBesvart}
                    </p>
                    <button
                      type="button"
                      className="vk-portal-quietlink vk-mono"
                      aria-label={t.wizard.endreTemplate.replace(
                        "{sporsmal}",
                        s.sporsmal
                      )}
                      onClick={() => editStep(i)}
                    >
                      {t.wizard.endre}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {lookup.phase === "idle" ? (
        <div className="vk-portal-wizrow">
          {safeIdx > 0 ? (
            <button
              type="button"
              className="vk-portal-back"
              onClick={() => {
                // An explicit step-back means «walk from here» — the
                // Endre-jump shortcut back to the oppsummering is off.
                returnToOppsum.current = false;
                goTo(safeIdx - 1, "back", answers);
              }}
            >
              <span aria-hidden="true">←</span> {t.wizard.tilbake}
            </button>
          ) : null}
          <button
            type="button"
            className={`vk-btn${last ? " vk-btn--cta" : ""} vk-portal-next`}
            disabled={!canAdvance}
            onClick={() => advance(answers)}
          >
            {last ? t.wizard.sendInn : t.wizard.neste}
          </button>
        </div>
      ) : null}

      <p className="vk-sr" aria-live="polite">
        {stegLabel}
      </p>
      <p className="vk-sr" role="status">
        {lookupMsg}
      </p>
      {/* The dromen counter for assistive tech — coarse thresholds only
          (200/100/50/0 left), so typing never floods the live region. */}
      <p className="vk-sr" role="status">
        {dromen && tegnSrTrinn !== null
          ? t.wizard.tegnIgjenTemplate.replace("{n}", String(tegnSrTrinn))
          : ""}
      </p>
    </section>
  );
}
