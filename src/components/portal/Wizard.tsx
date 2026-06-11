"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent, type PortalStep } from "@/lib/portalContent";
import type {
  PortalBedriftAnswer,
  PortalResearchResponse,
  ResearchFunn,
} from "@/lib/portalTypes";

/**
 * The kartlegging wizard — ONE question per screen, eight screens.
 *
 * Answers shape (consumed verbatim by portalAi.answersToFacts):
 *   - bedrift (first step):  answers.bedrift = { navn, nettside? } and
 *     answers.research = ResearchFunn | null (set after the lookup moment)
 *   - single-select chips:  answers[step.id] = chipId (string)
 *   - multi-select chips:   answers[step.id] = chipId[] (string[])
 *   - pure fritekst (dromen): answers[step.id] = text (string)
 *   - chips + fritekst:     text lives under answers[`${step.id}_tekst`]
 *
 * The bedrift step never asks the obvious follow-ups: on continue it POSTs
 * /api/portal/research (BRREG + company website, max 4.5s), shows a quiet
 * confirmation card on a hit, and continues silently on timeout/null. When
 * the research found their bransje, the "bransje" step is auto-skipped —
 * steps/stegLabel are derived from the filtered list so the count stays
 * coherent.
 *
 * Every answer and step change is persisted upward (→ localStorage, key
 * vk-portal-draft) so the draft survives the magic-link round trip.
 */

export type PortalAnswers = Record<string, unknown>;

interface WizardProps {
  initialAnswers: PortalAnswers;
  initialStep: number;
  /** Focus the question heading on mount (arriving via interaction). */
  autoFocus?: boolean;
  onPersist: (answers: PortalAnswers, step: number) => void;
  onComplete: (answers: PortalAnswers) => void;
}

// The client gives the lookup at most 4.5s, then continues silently; the
// short floor keeps a cache-fast answer from flashing past unread.
const LOOKUP_MAX_MS = 4500;
const LOOKUP_MIN_MS = 600;

const NAVN_MIN = 2;
const NAVN_MAX = 80;
const NETTSIDE_MAX = 200;

type LookupState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "confirm"; funn: ResearchFunn };

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

/** Map a BRREG employee count onto the same buckets as the størrelse chips. */
export function ansatteBucket(n: number): string {
  if (n <= 5) return "1-5";
  if (n <= 20) return "6-20";
  if (n <= 50) return "21-50";
  return "50+";
}

/** Auto-skip steps the research already answered (bransje + størrelse). */
function stepsFor(all: PortalStep[], answers: PortalAnswers): PortalStep[] {
  let steps = all;
  if (researchBransje(answers)) steps = steps.filter((s) => s.id !== "bransje");
  if (researchAnsatte(answers) > 0) steps = steps.filter((s) => s.id !== "storrelse");
  return steps;
}

function textKeyFor(step: PortalStep): string {
  return step.chips ? `${step.id}_tekst` : step.id;
}

function answered(step: PortalStep, answers: PortalAnswers): boolean {
  if (step.id === "bedrift") {
    return bedriftOf(answers).navn.trim().length >= NAVN_MIN;
  }
  const text = answers[textKeyFor(step)];
  const hasText = typeof text === "string" && text.trim().length > 0;
  if (!step.chips) return hasText;
  const v = answers[step.id];
  const hasChip = step.multi
    ? Array.isArray(v) && v.length > 0
    : typeof v === "string" && v.length > 0;
  return hasChip || (step.fritekst === true && hasText);
}

export default function Wizard({
  initialAnswers,
  initialStep,
  autoFocus = false,
  onPersist,
  onComplete,
}: WizardProps) {
  const { lang } = useLang();
  const t = portalContent[lang];

  const [answers, setAnswers] = useState<PortalAnswers>(initialAnswers);
  const steps = stepsFor(t.steps, answers);

  const [idx, setIdx] = useState(() =>
    Math.min(
      Math.max(initialStep, 0),
      stepsFor(portalContent[lang].steps, initialAnswers).length - 1
    )
  );
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [lookup, setLookup] = useState<LookupState>({ phase: "idle" });
  const [lookupMsg, setLookupMsg] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const funnTitleRef = useRef<HTMLParagraphElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const mounted = useRef(false);
  const alive = useRef(true);
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

  // The lookup moment unmounts the wizrow (the pressed button included) —
  // park focus on the status view, then on the confirmation card.
  useEffect(() => {
    if (lookup.phase === "searching") searchRef.current?.focus();
    else if (lookup.phase === "confirm") funnTitleRef.current?.focus();
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

  /** The lookup moment — max 4.5s, then continue (silently on null). */
  async function startLookup(a: PortalAnswers) {
    const bedrift = bedriftOf(a);
    const navn = bedrift.navn.trim().slice(0, NAVN_MAX);
    const nettside = (bedrift.nettside ?? "").trim().slice(0, NETTSIDE_MAX);
    setLookup({ phase: "searching" });
    setLookupMsg(t.research.slaarOpp);
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
    if (!alive.current) return;
    lookedUpFor.current = navn;
    if (funn && typeof funn.navn === "string" && funn.navn) {
      setLookup({ phase: "confirm", funn });
      setLookupMsg(`${t.research.fantDere} ${funn.navn}`);
    } else {
      finishLookup(a, null);
    }
  }

  function advance(a: PortalAnswers) {
    if (!answered(steps[safeIdx], a)) return;
    if (steps[safeIdx].id === "bedrift") {
      const navn = bedriftOf(a).navn.trim();
      if (a.research === undefined || lookedUpFor.current !== navn) {
        void startLookup(a);
        return;
      }
    }
    if (safeIdx === steps.length - 1) {
      onPersist(a, safeIdx);
      onComplete(a);
      return;
    }
    goTo(safeIdx + 1, "fwd", a);
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
    const a = { ...answers, [textKeyFor(step)]: value };
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
    typeof answers[textKeyFor(step)] === "string"
      ? (answers[textKeyFor(step)] as string)
      : "";
  const headingId = "vk-portal-q";
  const hintId = step.hint ? "vk-portal-q-hint" : undefined;
  const dromen = step.id === "dromen";
  const bedrift = step.id === "bedrift" ? bedriftOf(answers) : null;

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
      {lookup.phase === "idle" && bransjeSkipped && safeIdx === 1 ? (
        <p className="vk-mono vk-portal-skipnote">{t.research.fantBransjen}</p>
      ) : null}

      {lookup.phase === "searching" ? (
        <div
          className="vk-portal-step vk-portal-lookup"
          data-dir="fwd"
          tabIndex={-1}
          ref={searchRef}
        >
          <p className="vk-mono vk-portal-lookupline" aria-hidden="true">
            {t.research.slaarOpp}
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
              {step.chips.map((chip) => {
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

          {step.fritekst && !dromen ? (
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
            <textarea
              className="vk-portal-textarea"
              value={textValue}
              placeholder={step.plassholder}
              aria-labelledby={headingId}
              aria-describedby={hintId}
              rows={5}
              onChange={(e) => setText(e.target.value)}
            />
          ) : null}
        </div>
      ) : null}

      {lookup.phase === "idle" ? (
        <div className="vk-portal-wizrow">
          {safeIdx > 0 ? (
            <button
              type="button"
              className="vk-portal-back"
              onClick={() => goTo(safeIdx - 1, "back", answers)}
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
    </section>
  );
}
