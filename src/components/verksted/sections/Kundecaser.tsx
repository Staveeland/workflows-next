"use client";

import "@/styles/verksted/kundecaser.css";
import { useRef, useSyncExternalStore, type CSSProperties } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent, type VerkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

/* Kundecaser — three case chapters along the thread (contract §6, brief §6).
   Anim model (poster law): resting DOM/CSS = fully composed. [data-anim="pre"]
   (set only after mount when motion is allowed) hides; [data-anim="in"] plays
   each entrance once when the chapter scrolls into view. */

type CaseItem = VerkstedContent["cases"][number];

const SEATS = Array.from({ length: 54 }, (_, i) => i); // 9 x 6 seat map
const BAR_DELAYS = ["0ms", "80ms", "160ms", "240ms"];

// Section spine weaving around the 38% line (viewBox 0 0 100 400).
const SPINE_D =
  "M 50 0 C 47 52, 30 80, 28 128 C 26 174, 58 198, 62 248 C 66 294, 42 332, 40 400";
// Short feed running into the seat plate (viewBox 0 0 100 140).
const FEED_D = "M 84 0 C 74 30, 30 38, 26 66 C 23 90, 36 112, 44 138";

const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function Kundecaser() {
  const { lang } = useLang();
  const t = verkstedContent[lang];

  return (
    <section id="kundecaser" className="vk-s vk-case">
      <ThreadSegment d={SPINE_D} viewBox="0 0 100 400" className="vk-case-spine" />
      <div className="vk-wrap">
        <header className="vk-case-head">
          <p className="vk-kicker">{t.kundecaser.kicker}</p>
          <h2 className="vk-display vk-case-h2">{t.kundecaser.heading}</h2>
        </header>
        {t.cases.map((c, i) => (
          <CaseChapter
            key={c.slug}
            c={c}
            flip={i % 2 === 1}
            labels={t.kundecaser}
            scraps={t.hero.scraps}
          />
        ))}
      </div>
    </section>
  );
}

function CaseChapter({
  c,
  flip,
  labels,
  scraps,
}: {
  c: CaseItem;
  flip: boolean;
  labels: VerkstedContent["kundecaser"];
  scraps: VerkstedContent["hero"]["scraps"];
}) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useThread();
  const mounted = useMounted();
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  const anim = mounted && !reduced ? (inView ? "in" : "pre") : undefined;

  // ElementLab: count scrubs 0→N as the chapter approaches mid-screen.
  const statNum = c.statValue ? Number.parseInt(c.statValue, 10) : 0;
  const statSuffix = c.statValue ? c.statValue.replace(/^[\d\s.,]+/, "") : "";
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });
  const statCount = useTransform(scrollYProgress, (v) => Math.round(v * statNum));

  return (
    <article
      ref={ref}
      data-anim={anim}
      className={`vk-case-chapter vk-case-chapter--${c.slug}${flip ? " vk-case-chapter--flip" : ""}`}
    >
      {c.slug === "festiviteten" && (
        <div className="vk-grain vk-grain--heavy vk-case-grain" aria-hidden="true" />
      )}
      <h3 className="vk-display vk-case-name">{c.name}</h3>
      <div className="vk-case-status">
        <span className="vk-case-stampwrap">
          <span
            className="vk-stamp vk-case-stamp"
            data-slam={anim === "in" ? "in" : undefined}
          >
            {c.stamp}
          </span>
        </span>
        <span className="vk-mono vk-case-inuse">{labels.statusLabel}</span>
      </div>
      <div className="vk-case-grid">
        <div className="vk-case-content">
          <p className="vk-mono vk-case-dateline">{c.dateline}</p>
          <p className="vk-case-lead">{c.lead}</p>
          <p className="vk-case-body">{c.body}</p>
          <a href={c.href} className="vk-case-link">
            {labels.readMore}
          </a>
        </div>
        <div className="vk-case-visual">
          {c.slug === "csub" && <DashboardVisual />}
          {c.slug === "festiviteten" && <SeatsVisual />}
          {c.slug === "elementlab" && (
            <ElementlabVisual
              c={c}
              scraps={scraps}
              animated={anim !== undefined}
              statCount={statCount}
              statSuffix={statSuffix}
            />
          )}
          <p className="vk-chalk vk-case-chalk">{c.chalk}</p>
        </div>
      </div>
      <p className="vk-mono vk-case-monoline">{c.monoLine}</p>
    </article>
  );
}

/* CSUB — dashboard fragment self-assembling on a benk plate. */
function DashboardVisual() {
  return (
    <div className="vk-case-plate vk-case-plate--dash" aria-hidden="true">
      <svg viewBox="0 0 320 200" className="vk-case-dashsvg" focusable="false">
        <line className="vk-case-dashgrid" x1="34" y1="72" x2="296" y2="72" />
        <line className="vk-case-dashgrid" x1="34" y1="120" x2="296" y2="120" />
        <line className="vk-case-dashbase" x1="34" y1="168" x2="296" y2="168" />
        <text className="vk-case-dashlabel" x="28" y="75" textAnchor="end">
          100
        </text>
        <text className="vk-case-dashlabel" x="28" y="171" textAnchor="end">
          0
        </text>
        <rect
          className="vk-case-bar"
          x="48"
          y="132"
          width="38"
          height="36"
          style={{ "--d": BAR_DELAYS[0] } as CSSProperties}
        />
        <rect
          className="vk-case-bar"
          x="106"
          y="96"
          width="38"
          height="72"
          style={{ "--d": BAR_DELAYS[1] } as CSSProperties}
        />
        <rect
          className="vk-case-bar"
          x="164"
          y="110"
          width="38"
          height="58"
          style={{ "--d": BAR_DELAYS[2] } as CSSProperties}
        />
        <rect
          className="vk-case-bar vk-case-bar--lit"
          x="222"
          y="72"
          width="38"
          height="96"
          style={{ "--d": BAR_DELAYS[3] } as CSSProperties}
        />
        <path
          className="vk-case-spark"
          d="M 48 118 L 96 124 L 144 94 L 192 102 L 240 60 L 288 68"
          pathLength={1}
        />
      </svg>
    </div>
  );
}

/* Festiviteten — dots stream along the thread into a seat map that fills. */
function SeatsVisual() {
  return (
    <>
      <ThreadSegment d={FEED_D} viewBox="0 0 100 140" className="vk-case-feed" />
      <div className="vk-case-plate vk-case-plate--seats" aria-hidden="true">
        <span className="vk-case-streamdot vk-case-streamdot--1" />
        <span className="vk-case-streamdot vk-case-streamdot--2" />
        <span className="vk-case-streamdot vk-case-streamdot--3" />
        <span className="vk-case-stage" />
        <div className="vk-case-seatgrid">
          {SEATS.map((i) => (
            <span
              key={i}
              className="vk-case-seat"
              style={{ "--d": `${i * 12}ms` } as CSSProperties}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ElementLab — the proof: scrubbed stat + before/after split. */
function ElementlabVisual({
  c,
  scraps,
  animated,
  statCount,
  statSuffix,
}: {
  c: CaseItem;
  scraps: VerkstedContent["hero"]["scraps"];
  animated: boolean;
  statCount: MotionValue<number>;
  statSuffix: string;
}) {
  return (
    <>
      {c.statValue && (
        <p className="vk-case-stat">
          <span className="vk-case-statvalue">
            {animated ? (
              <>
                <span className="vk-sr">{c.statValue}</span>
                <motion.span aria-hidden="true">{statCount}</motion.span>
                <span aria-hidden="true">{statSuffix}</span>
              </>
            ) : (
              c.statValue
            )}
          </span>
          {c.statLabel && <span className="vk-case-statlabel">{c.statLabel}</span>}
        </p>
      )}
      <div className="vk-case-split" aria-hidden="true">
        <div className="vk-case-pile">
          {scraps.slice(0, 6).map((w, i) => (
            <span key={w} className={`vk-case-scrap vk-case-scrap--${i}`}>
              {w}
            </span>
          ))}
        </div>
        <svg viewBox="0 0 240 140" className="vk-case-flowsvg" focusable="false">
          <path
            className="vk-case-flowline"
            d="M 4 110 C 60 110, 88 72, 126 64 L 148 62"
            pathLength={1}
          />
          <g className="vk-case-doc">
            <path className="vk-case-docbody" d="M 158 28 H 202 L 220 46 V 118 H 158 Z" />
            <path className="vk-case-docfold" d="M 202 28 V 46 H 220" />
            <line className="vk-case-docline" x1="170" y1="66" x2="208" y2="66" />
            <line className="vk-case-docline" x1="170" y1="82" x2="208" y2="82" />
            <line className="vk-case-docline" x1="170" y1="98" x2="196" y2="98" />
          </g>
        </svg>
      </div>
    </>
  );
}
