"use client";

import "@/styles/verksted/pages/kunder.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useInView } from "framer-motion";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

/* Arkivveggen — the case plates pinned to the workshop job board.
   Poster law: resting DOM = composed plates, all log lines lit in --stov.
   After mount with motion allowed: stamps slam in once on view, and the
   "shift log" cycles — one plate's mono line glows amber at a time. */

export interface KunderCase {
  slug: string;
  name: string;
  jobNo: string;
  /** Display industry, mirrored in the CollectionPage JSON-LD. */
  industry: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  /** Rendered logo height in px (width auto). */
  logoDisplayHeight: number;
  summary: string;
  results: string[];
  weeks: string;
  whisper: string;
}

const SPINE_D =
  "M 50 0 C 44 56 62 118 54 188 C 48 238 40 272 42 320";

export function KunderClient({
  kicker,
  heading,
  sub,
  statusLabel,
  readMore,
  cases,
}: {
  kicker: string;
  heading: string;
  sub: string;
  statusLabel: string;
  readMore: string;
  cases: KunderCase[];
}) {
  const { reduced } = useThread();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.18 });
  const live = !reduced && inView;

  // Stamps slam once, the first time the board scrolls into view.
  // useInView is false on SSR/hydration, so the slam only arms post-mount.
  const seen = useInView(ref, { once: true, amount: 0.18 });
  const slammed = seen && !reduced;

  // Shift log: -1 = composed rest (no highlight); cycles 0..n-1 while live.
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!live) return;
    const first = window.setTimeout(
      () => setActive((a) => (a === -1 ? 0 : a)),
      60,
    );
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % cases.length),
      4000,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [live, cases.length]);

  return (
    <section ref={ref} aria-labelledby="vk-kunder-arkiv-h" className="vk-pg-s vk-kunder-arkiv">
      <ThreadSegment d={SPINE_D} viewBox="0 0 100 320" className="vk-kunder-spine" />
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker" y={14}>
          {kicker}
        </Reveal>
        <Reveal delay={0.06}>
          <h2 id="vk-kunder-arkiv-h" className="vk-display vk-pg-h2">
            {heading}
          </h2>
        </Reveal>
        <Reveal as="p" className="vk-pg-sub" delay={0.12}>
          {sub}
        </Reveal>
        <div className="vk-kunder-board">
          {cases.map((c, i) => (
            <Reveal
              key={c.slug}
              className={`vk-kunder-platewrap vk-kunder-platewrap--${i}`}
              delay={0.08 * i}
            >
              <article
                className="vk-kunder-plate"
                data-live={active === i ? "true" : "false"}
              >
                <span className="vk-kunder-pin" aria-hidden="true" />
                <header className="vk-kunder-platehead">
                  <p className="vk-mono vk-kunder-meta">
                    {c.jobNo} · {c.industry}
                  </p>
                  <span
                    className="vk-stamp vk-kunder-stamp"
                    data-slam={slammed ? "in" : undefined}
                    style={{ "--d": `${i * 120}ms` } as CSSProperties}
                  >
                    {statusLabel}
                  </span>
                </header>
                <div className="vk-kunder-logo">
                  <Image
                    src={c.logo}
                    alt=""
                    width={c.logoWidth}
                    height={c.logoHeight}
                    style={{ height: c.logoDisplayHeight, width: "auto" }}
                  />
                </div>
                <h3 className="vk-kunder-name">
                  <Link href={`/kunder/${c.slug}`} className="vk-kunder-platelink">
                    {c.name}
                  </Link>
                </h3>
                <p className="vk-kunder-sum">{c.summary}</p>
                <ul className="vk-kunder-results">
                  {c.results.map((r) => (
                    <li key={r}>
                      <span aria-hidden="true">→ </span>
                      {r}
                    </li>
                  ))}
                </ul>
                <footer className="vk-kunder-platefoot">
                  <p className="vk-mono vk-kunder-whisper">
                    <span>{c.whisper}</span>
                    <span className="vk-kunder-caret" aria-hidden="true" />
                  </p>
                  <p className="vk-mono vk-kunder-weeks">
                    <span>{c.weeks}</span>
                    <span className="vk-kunder-readmore" aria-hidden="true">
                      {readMore} →
                    </span>
                  </p>
                </footer>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
