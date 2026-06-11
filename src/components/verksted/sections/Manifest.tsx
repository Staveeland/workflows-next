"use client";

import "@/styles/verksted/manifest.css";
import { useRef, useSyncExternalStore } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment } from "@/components/verksted/ThreadContext";

/* Manifest — «Vi snakker norsk, ikke data-norsk» (brief §6).
   Jargon lines struck by hand-drawn SVG strokes; resting state is
   pre-struck (poster law), the draw happens only on capable clients. */

// Three distinct strike paths (viewBox 0 0 100 14) — irregular two-anchor
// wobbles, so no two impressions look identical.
const STRIKES = [
  "M2 8.4 C18 4.6 38 11.2 58 7.6 S86 4.8 98.5 8.2",
  "M1.5 6.2 C22 9.8 40 4.4 62 8.6 S88 9.4 98 5.6",
  "M2 7.8 C16 10.6 36 4.2 55 8.4 S84 10.8 98.5 6.4",
];

const EASE_WORK: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Hydration probe: false on the server/first client render, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function Manifest() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  const drawn = mounted && !reduced;

  // ONE observer on the whole jargon block: when it enters, all three
  // strikes draw with their stagger. Per-line whileInView with a tight
  // margin could skip the last line on fast scrolls.
  const jargonRef = useRef<HTMLDivElement>(null);
  const jargonInView = useInView(jargonRef, { once: true, amount: 0.3 });

  return (
    <section className="vk-s vk-man">
      <ThreadSegment
        className="vk-man-thread"
        viewBox="0 0 100 2400"
        d="M50 0 C28 380 72 760 50 1180 C30 1580 68 1990 50 2400"
      />
      <div className="vk-wrap vk-man-inner">
        <h2 className="vk-kicker vk-man-kicker">{t.manifest.kicker}</h2>
        <div className="vk-man-jargon" ref={jargonRef}>
          {t.manifest.jargon.map((line, i) => (
            <p className="vk-man-line" key={line}>
              <del className="vk-man-del">
                {line}
                <svg
                  className="vk-man-strike"
                  viewBox="0 0 100 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {drawn ? (
                    <motion.path
                      key="anim"
                      d={STRIKES[i % STRIKES.length]}
                      fill="none"
                      stroke="var(--stempel)"
                      strokeWidth={5}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: jargonInView ? 1 : 0 }}
                      transition={{ duration: 0.55, delay: i * 0.25, ease: EASE_WORK }}
                    />
                  ) : (
                    <path
                      key="static"
                      d={STRIKES[i % STRIKES.length]}
                      fill="none"
                      stroke="var(--stempel)"
                      strokeWidth={5}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
              </del>
            </p>
          ))}
        </div>
        <div className="vk-man-payoff-block">
          <p className="vk-mono vk-man-lead">{t.manifest.payoffLead}</p>
          <p className="vk-man-payoff">{t.manifest.payoff}</p>
        </div>
      </div>
    </section>
  );
}
