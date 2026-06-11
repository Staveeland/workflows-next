"use client";

import "@/styles/verksted/kundecaser.css";
import { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent, type VerkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

/* Kundecaser — three illustrated case chapters along the thread.
   Each chapter is built around its linocut illustration: the Fraunces
   name overlaps the image's top edge, then one lead line + stamp +
   status + mono log carry the whole story (owner: short + visual).
   Anim model (poster law): resting DOM/CSS = fully composed.
   [data-anim="pre"] (set only after mount when motion is allowed)
   hides; [data-anim="in"] plays each entrance once in view — the
   image wipes in (clip-path inset), the name slides from offset. */

type CaseItem = VerkstedContent["cases"][number];

// Section spine weaving around the 38% line (viewBox 0 0 100 400).
const SPINE_D =
  "M 50 0 C 47 52, 30 80, 28 128 C 26 174, 58 198, 62 248 C 66 294, 42 332, 40 400";

// Case illustrations are 1536x1024; rendered ≤880px wide on desktop.
const ILL_SIZES = "(max-width: 768px) 92vw, (max-width: 1280px) 80vw, 880px";

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
          <CaseChapter key={c.slug} c={c} flip={i % 2 === 1} labels={t.kundecaser} />
        ))}
      </div>
    </section>
  );
}

function CaseChapter({
  c,
  flip,
  labels,
}: {
  c: CaseItem;
  flip: boolean;
  labels: VerkstedContent["kundecaser"];
}) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useThread();
  const mounted = useMounted();
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  const anim = mounted && !reduced ? (inView ? "in" : "pre") : undefined;

  // ElementLab: count scrubs 0→N as the chapter approaches mid-screen
  // (owner-loved). Reduced/no-JS renders the final value directly.
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
      <div className="vk-case-figure">
        <h3 className="vk-display vk-case-name">{c.name}</h3>
        <p className="vk-mono vk-case-dateline">{c.dateline}</p>
        <div className="vk-case-illwrap">
          <Image
            src={`/verksted/case-${c.slug}.webp`}
            alt={c.alt}
            width={1536}
            height={1024}
            sizes={ILL_SIZES}
            className="vk-ill vk-ill--feather vk-case-ill"
          />
        </div>
        {c.statValue && (
          <p className="vk-case-stat">
            <span className="vk-case-statvalue">
              {anim !== undefined ? (
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
      </div>
      <div className="vk-case-content">
        <p className="vk-case-lead">{c.lead}</p>
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
        <p className="vk-mono vk-case-monoline">{c.monoLine}</p>
        <a href={c.href} className="vk-case-link">
          {labels.readMore}
        </a>
      </div>
    </article>
  );
}
