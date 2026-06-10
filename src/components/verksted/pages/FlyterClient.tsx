"use client";

import "@/styles/verksted/pages/flyter.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Reveal } from "@/components/verksted/page/Reveal";

/* ════════════════════════════════════════════════════════════════════
   /automatiserte-flyter — interactive sections.
   FlyterPipeline: the page's star — an SVG pipeline measured from the
   real station positions, where an amber light-dot travels from stasjon
   til stasjon pinned to scroll. Poster law: SSR/no-JS/reduced motion see
   the composed state (line lit end to end, alle stasjoner tent, dot
   resting at «levert»).
   FlyterProof: ElementLab-stat that counts up to 80 once in view.
   ════════════════════════════════════════════════════════════════════ */

interface Station {
  id: string;
  step: string;
  label: string;
  title: string;
  body: string;
  whisper?: string;
}

const STATIONS: Station[] = [
  {
    id: "innboks",
    step: "01",
    label: "innboks",
    title: "Noe skjer",
    body:
      "En e-post lander. Et skjema sendes inn. En fil dukker opp i en mappe — eller klokka slår åtte mandag morgen. Flyten våkner av seg selv.",
  },
  {
    id: "hentet",
    step: "02",
    label: "hentet",
    title: "Dataene hentes der de ligger",
    body:
      "Flyten plukker ut det den trenger — fra e-posten, regnearket, CRM-et eller butikksystemet. Ingen kopiering. Ingen leting.",
  },
  {
    id: "behandlet",
    step: "03",
    label: "behandlet",
    title: "Stegene kjører i fast rekkefølge",
    body:
      "Data behandles, systemer oppdateres, varsler sendes. AI brukes bare der reglene er uklare og det trengs forståelse.",
  },
  {
    id: "levert",
    step: "04",
    label: "levert",
    title: "Resultatet ligger klart",
    body:
      "Fakturaen er bokført. Kunden er fulgt opp. Rapporten er sendt. Samme vei hver gang — det er det som gjør en flyt til å stole på.",
    whisper: "kl. 03:12 — flyten merker ikke forskjellen",
  },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r1 = (v: number) => Math.round(v * 10) / 10;

// Hydration probe (same pattern as Reveal): false on the server/hydration
// pass, true after mount — lets «armed» be derived without effect setState.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

interface Geo {
  w: number;
  h: number;
  d: string;
  /** Normalized arc position of each station node along the path. */
  ts: number[];
}

export function FlyterPipeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  // Armed only after mount with motion allowed (poster law). While unarmed
  // — SSR, no-JS, reduced motion — every station rests lit (composed).
  const armed = mounted && !reduced;

  const [active, setActive] = useState(-1);
  const [geo, setGeo] = useState<Geo | null>(null);
  const litTo = armed ? active : STATIONS.length - 1;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.72", "end 0.5"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });
  const dotDistance = useTransform(progress, (v) => `${clamp01(v) * 100}%`);

  // Measure the real node positions and lay the pipeline through them.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const nodes = nodeRefs.current.filter((n): n is HTMLSpanElement => n !== null);
      if (nodes.length < 2) return;
      const tr = track.getBoundingClientRect();
      if (tr.width < 1 || tr.height < 1) return;
      const pts = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return {
          x: r1(r.left - tr.left + r.width / 2),
          y: r1(r.top - tr.top + r.height / 2),
        };
      });
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        // Gentle alternating sway — same hand as tråden on the homepage.
        const sway = (i % 2 ? 1 : -1) * Math.min(26, (b.y - a.y) * 0.16);
        const c1y = r1(a.y + (b.y - a.y) * 0.45);
        const c2y = r1(b.y - (b.y - a.y) * 0.45);
        d += ` C ${r1(a.x + sway)} ${c1y}, ${r1(b.x - sway)} ${c2y}, ${b.x} ${b.y}`;
      }
      const y0 = pts[0].y;
      const yN = pts[pts.length - 1].y;
      const ts = pts.map((p) => (p.y - y0) / Math.max(1, yN - y0));
      setGeo({ w: Math.round(tr.width), h: Math.round(tr.height), d, ts });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // useMotionValueEvent re-subscribes with the latest closure every render
  // (the callback sits in its dep list), so armed/geo are always fresh here.
  useMotionValueEvent(progress, "change", (v) => {
    if (!armed || !geo) return;
    let idx = -1;
    for (let i = 0; i < geo.ts.length; i++) {
      if (v + 0.02 >= geo.ts[i]) idx = i;
    }
    setActive((prev) => (prev === idx ? prev : idx));
  });

  // Sync once armed + measured — covers loads that land mid-page (back-nav,
  // #kontakt anchor) where the spring settles before geometry exists and no
  // further change events would fire. Keeps stations agreeing with the rail.
  useEffect(() => {
    if (!armed || !geo) return;
    const raf = requestAnimationFrame(() => {
      const v = progress.get();
      let idx = -1;
      for (let i = 0; i < geo.ts.length; i++) {
        if (v + 0.02 >= geo.ts[i]) idx = i;
      }
      setActive((prev) => (prev === idx ? prev : idx));
    });
    return () => cancelAnimationFrame(raf);
  }, [armed, geo, progress]);

  const drawn = armed && geo !== null;

  return (
    <section className="vk-pg-s vk-flyter-anatomi" aria-labelledby="vk-flyter-anatomi-h">
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker" y={14}>
          Anatomien
        </Reveal>
        <Reveal delay={0.06}>
          <h2 id="vk-flyter-anatomi-h" className="vk-display vk-pg-h2">
            Slik kjører en automatisert flyt
          </h2>
        </Reveal>
        <Reveal as="p" className="vk-pg-sub" delay={0.12}>
          Fire stasjoner, samme vei hver gang. Det er det som gjør flyten forutsigbar — og
          til å stole på.
        </Reveal>
        <Reveal as="p" className="vk-chalk vk-flyter-hint" delay={0.18} y={10}>
          rull — du driver flyten
        </Reveal>

        <div
          ref={trackRef}
          className="vk-flyter-track"
          data-measured={geo ? "true" : "false"}
        >
          {geo ? (
            <svg
              className="vk-flyter-rail"
              viewBox={`0 0 ${geo.w} ${geo.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path className="vk-flyter-rail-bg" d={geo.d} vectorEffect="non-scaling-stroke" />
              <motion.path
                className="vk-flyter-rail-halo"
                d={geo.d}
                vectorEffect="non-scaling-stroke"
                style={drawn ? { pathLength: progress } : undefined}
              />
              <motion.path
                className="vk-flyter-rail-lit"
                d={geo.d}
                vectorEffect="non-scaling-stroke"
                style={drawn ? { pathLength: progress } : undefined}
              />
            </svg>
          ) : null}
          {geo ? (
            <motion.span
              className="vk-flyter-dot"
              aria-hidden="true"
              style={{
                offsetPath: `path("${geo.d}")`,
                offsetRotate: "0deg",
                offsetDistance: drawn ? dotDistance : "100%",
              }}
            />
          ) : null}
          <ol className="vk-flyter-stations">
            {STATIONS.map((s, i) => (
              <li
                key={s.id}
                className="vk-flyter-station"
                data-lit={litTo >= i ? "true" : "false"}
              >
                <span
                  className="vk-flyter-node"
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                />
                <p className="vk-mono vk-flyter-step">
                  {s.step} · {s.label}
                </p>
                <h3 className="vk-flyter-title">{s.title}</h3>
                <p className="vk-flyter-body">{s.body}</p>
                {s.whisper ? <p className="vk-mono vk-flyter-whisper">{s.whisper}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   FlyterProof — ElementLab count-up + CSUB case.
   Resting/no-JS/reduced state shows the finished «80».
   ════════════════════════════════════════════ */

const STAT_TARGET = 80;

function StatNumber({ armed, play }: { armed: boolean; play: boolean }) {
  // Keyed remount on arming applies the hidden 0 only after mount with
  // motion allowed — SSR/no-JS/reduced motion rest at the composed «80».
  const [val, setVal] = useState(armed ? 0 : STAT_TARGET);

  useEffect(() => {
    if (!armed || !play) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 1200);
      setVal(Math.round(STAT_TARGET * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, play]);

  return (
    <p className="vk-flyter-statnum" aria-hidden="true">
      {val}
      <span className="vk-flyter-statpct">&nbsp;%</span>
    </p>
  );
}

export function FlyterProof() {
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  const armed = mounted && !reduced;
  const statRef = useRef<HTMLDivElement>(null);
  const inView = useInView(statRef, { once: true, amount: 0.4 });

  return (
    <section className="vk-pg-s vk-flyter-proof" aria-labelledby="vk-flyter-proof-h">
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker" y={14}>
          Bevis
        </Reveal>
        <Reveal delay={0.06}>
          <h2 id="vk-flyter-proof-h" className="vk-display vk-pg-h2">
            Flyter i drift hos kundene
          </h2>
        </Reveal>
        <div className="vk-pg-grid vk-flyter-proofgrid">
          <Reveal className="vk-pg-card vk-flyter-statcard" delay={0.1}>
            <div ref={statRef} className="vk-flyter-statinner">
              <span className="vk-stamp">Timer frigjort</span>
              <p className="vk-mono vk-flyter-dateline">norsk bedrift, rapporttung hverdag</p>
              <h3 className="vk-pg-card-title vk-flyter-casename">ElementLab</h3>
              <StatNumber key={`stat-${armed}`} armed={armed} play={inView} />
              <p className="vk-mono vk-flyter-statlabel" aria-hidden="true">
                raskere rapporter
              </p>
              <p className="vk-sr">80 % raskere rapporter</p>
              <p className="vk-pg-card-body">
                Flyten henter tallene, bygger rapporten og legger den klar. Timene går
                tilbake til arbeid som trenger et menneske — hundrevis av dem i året.
              </p>
              <p className="vk-chalk vk-flyter-statchalk">ekte tall — vi har målt</p>
              <Link href="/kunder/elementlab" className="vk-pg-link">
                Les caset: ElementLab →
              </Link>
            </div>
          </Reveal>
          <Reveal className="vk-pg-card vk-flyter-casecard" delay={0.18}>
            <p className="vk-mono vk-flyter-dateline">subsea-engineering</p>
            <h3 className="vk-pg-card-title vk-flyter-casename">CSUB</h3>
            <p className="vk-pg-card-body">
              Flyter samler data fra Excel-filer og eksisterende systemer i ett
              sentralisert dashbord. Det som før krevde manuelt arbeid fra
              prosjektledere, skjer nå av seg selv.
            </p>
            <p className="vk-mono vk-pg-card-mono">excel inn → dashbord ut</p>
            <Link href="/kunder/csub" className="vk-pg-link">
              Les caset: CSUB →
            </Link>
          </Reveal>
        </div>
        <Reveal as="p" className="vk-flyter-proof-more" delay={0.1}>
          <Link href="/kunder" className="vk-pg-link">
            Alle kundecasene →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
