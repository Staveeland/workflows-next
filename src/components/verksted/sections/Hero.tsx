"use client";

import "@/styles/verksted/hero.css";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Variants,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import {
  HeroCanvas,
  ThreadSegment,
  type ThreadSegmentProps,
} from "@/components/verksted/ThreadContext";

/* Letterpress char assembly. The y/rotate keyframes + linear segment easing
   replicate --ease-stamp (linear(0, .6 18%, 1.08 38%, .985 60%, 1)) exactly,
   since linear() interpolates linearly between the same stops. */
const ROT_DEG = [-2, -1, 1.5, 2.5]; // the fixed rotation token set
const STAMP_TIMES = [0, 0.18, 0.38, 0.6, 1];
const STAMP_Y = ["0.4em", "0.16em", "-0.032em", "0.006em", "0em"];

/* SVG hand-off (brief §4 Phase C): traces the canvas line's lower stretch
   (y 0.6H→H of the section, x around the 38% spine of the container) and
   draws in over the exact scroll window where the canvas fades, so the
   pulled thread persists below the hero. Coordinates reproduce the canvas
   formula x = x38 + amp·sin(2πt)·sin(πt) sampled at y-steps of 0.05H. */
const TAIL_D =
  "M 410 0 C 400 25 390 50 380 75 C 370 100 358 125 350 150 " +
  "C 342 175 334 200 330 225 C 326 250 325 275 326 300 " +
  "C 327 325 332 350 337 375 C 342 400 350 425 356 450 " +
  "C 362 475 369 500 373 525 C 377 550 378 575 380 600";
// Tail top sits at 1.56·viewH; canvas Phase C runs scrollY 1.28→1.6·viewH.
const TAIL_OFFSET: ThreadSegmentProps["offset"] = ["start 0.28", "start 0"];

const charVariants: Variants = {
  laid: (c: [number, number]) => ({ y: "0.4em", rotate: c[1] }),
  set: (c: [number, number]) => ({
    y: STAMP_Y,
    rotate: [c[1], c[1] * 0.4, c[1] * -0.08, c[1] * 0.015, 0],
    transition: {
      delay: c[0] * 0.022,
      duration: 0.38,
      times: STAMP_TIMES,
      ease: "linear",
    },
  }),
};

export function Hero() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;

  /* H1 assembly — once per session (vk-intro guard); reduced ⇒ settled.
     SSR/first paint keeps the plain string in the DOM (LCP-safe); the
     per-char wrap only attaches after hydration. */
  const [assemble, setAssemble] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("vk-intro") !== null;
      if (!seen) sessionStorage.setItem("vk-intro", "1");
    } catch {
      // storage blocked — play the intro; it simply may repeat next visit
    }
    if (!seen) setAssemble(true);
  }, [reduced]);

  /* «Kaos inn.» / «Flyt ut.» on separate lines, language-agnostically:
     split on the first sentence boundary; char stagger runs across lines. */
  const heading = useMemo(() => {
    const h1 = t.hero.h1;
    const cut = h1.indexOf(". ");
    const parts = cut === -1 ? [h1] : [h1.slice(0, cut + 1), h1.slice(cut + 2)];
    let i = 0;
    return parts.map((line) => ({
      line,
      words: line.split(" ").map((word) => ({
        word,
        chars: Array.from(word).map((ch) => ({ ch, i: i++ })),
      })),
    }));
  }, [t.hero.h1]);

  /* Live HH:MM for the ticker, re-formatted on the minute. */
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000) + 50);
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  /* Ticker types itself char-by-char once on mount, then stays static. */
  const ticker = time ? t.hero.tickerTemplate.replace("{time}", time) : "";
  const [typedDone, setTypedDone] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  useEffect(() => {
    if (typedDone || !ticker) return;
    if (reduced || typedCount >= ticker.length) {
      setTypedDone(true);
      return;
    }
    const id = setTimeout(() => setTypedCount((c) => c + 1), 34);
    return () => clearTimeout(id);
  }, [typedDone, ticker, typedCount, reduced]);

  /* The sub/CTA/proof block — the canvas steers scraps around it. */
  const footRef = useRef<HTMLDivElement>(null);

  /* Scroll hint hides at the first scroll (one-shot). */
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    if (!scrolled && y > 8) setScrolled(true);
  });

  return (
    <section className={`vk-hero${assemble ? " vk-hero--intro" : ""}`}>
      <HeroCanvas words={t.hero.scraps} label={t.a11y.threadLabel} avoid={footRef} />
      <div className="vk-hero-tail" aria-hidden="true">
        <ThreadSegment
          d={TAIL_D}
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          offset={TAIL_OFFSET}
          className="vk-hero-thread"
        />
      </div>

      <div className="vk-hero-sticky">
        <div className="vk-wrap vk-hero-grid">
          <h1 className="vk-display vk-hero-h1" aria-label={t.hero.h1}>
            {assemble ? (
              <motion.span aria-hidden="true" initial="laid" animate="set">
                {heading.map(({ line, words }, li) => (
                  <span key={`${li}-${line}`} className="vk-hero-line">
                    {words.map(({ word, chars }, wi) => (
                      <Fragment key={`${wi}-${word}`}>
                        <span className="vk-hero-word">
                          {chars.map(({ ch, i }) => (
                            <motion.span
                              key={i}
                              className="vk-hero-char"
                              variants={charVariants}
                              custom={[i, ROT_DEG[i % 4]]}
                            >
                              {ch}
                            </motion.span>
                          ))}
                        </span>
                        {wi < words.length - 1 ? " " : null}
                      </Fragment>
                    ))}
                  </span>
                ))}
              </motion.span>
            ) : (
              heading.map(({ line }, li) => (
                <span key={`${li}-${line}`} className="vk-hero-line">
                  {line}
                </span>
              ))
            )}
          </h1>

          {/* Chalk annotation aims at the (aria-hidden) scrap drift — the
              canvas already carries an sr-only description. */}
          <div className="vk-hero-annot" aria-hidden="true">
            <svg
              className="vk-hero-arrow"
              viewBox="0 0 64 64"
              width="56"
              height="56"
              fill="none"
              focusable="false"
            >
              <path
                className="vk-hero-arrow-shaft"
                pathLength={1}
                d="M8 56 C 18 52, 21 40, 27 30 S 44 13, 53 9"
              />
              <path
                className="vk-hero-arrow-head"
                pathLength={1}
                d="M41 9.5 L 53 9 L 49.5 20.5"
              />
            </svg>
            <span className="vk-chalk vk-hero-chalk">{t.hero.chalk}</span>
          </div>

          <div className="vk-hero-foot" ref={footRef}>
            <p className="vk-hero-sub">{t.hero.sub}</p>
            <div className="vk-hero-actions">
              <a className="vk-btn vk-btn--cta vk-hero-cta" href="#kontakt">
                {t.hero.cta}
              </a>
              <p className="vk-mono vk-hero-proof">{t.hero.proof}</p>
            </div>
          </div>

          <div className="vk-mono vk-hero-ticker" aria-hidden="true">
            {ticker ? (
              <>
                <span
                  className={`vk-hero-ticker-typed${
                    typedDone ? "" : " vk-hero-ticker-typed--caret"
                  }`}
                >
                  {typedDone ? ticker : ticker.slice(0, typedCount)}
                </span>
                {!typedDone && (
                  <span className="vk-hero-ticker-rest">
                    {ticker.slice(typedCount)}
                  </span>
                )}
              </>
            ) : null}
          </div>

          <div
            className={`vk-hero-hint${scrolled ? " vk-hero-hint--hidden" : ""}`}
          >
            <span className="vk-mono vk-hero-hint-label">
              {t.hero.scrollHint}
            </span>
            <span className="vk-hero-hint-line" aria-hidden="true">
              <span className="vk-hero-hint-dot" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
