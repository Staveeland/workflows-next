"use client";

import "@/styles/verksted/pages/elementlab.css";
import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";

/* ════════════════════════════════════════════════════════════════════
   /kunder/elementlab — the star plate.
   One scroll progress (p) drives everything: the amber flow-line draws,
   the three nodes light as the line passes them, and «80» scrubs 0→80.
   Poster law: SSR / no-JS / reduced motion render p = 1 (line drawn,
   nodes lit, 80 % composed). The scrubbed state exists only after mount
   with motion allowed — and it scrubs BOTH ways with the scroll.
   ════════════════════════════════════════════════════════════════════ */

const FLOW_D = "M 24 64 C 120 30 200 88 320 60 C 432 36 522 76 616 56";

const FLOW_NODES = [
  { x: 24, y: 64, t: 0.04, label: "tallene hentes", anchor: "start" as const, lx: 16 },
  { x: 320, y: 60, t: 0.52, label: "rapporten bygges", anchor: "middle" as const, lx: 320 },
  { x: 616, y: 56, t: 0.96, label: "lagt klar", anchor: "end" as const, lx: 624 },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function ElementlabCaseClient() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.3"],
  });
  const eased = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });

  // Composed by default (poster law) — armed only after mount w/ motion.
  const [p, setP] = useState(1);

  useEffect(() => {
    if (reduced) return;
    // seed after paint (mid-page loads) — async so the effect stays pure
    const raf = requestAnimationFrame(() => setP(clamp01(scrollYProgress.get())));
    return () => cancelAnimationFrame(raf);
  }, [reduced, scrollYProgress]);

  useMotionValueEvent(eased, "change", (v) => {
    if (reduced) return;
    setP(Math.round(clamp01(v) * 400) / 400);
  });

  const value = Math.round(p * 80);

  return (
    <div ref={ref} className="vk-elementlab-plate">
      <div className="vk-elementlab-platehead">
        <span className="vk-stamp">Timer frigjort</span>
        <p className="vk-kicker vk-elementlab-platekicker">flyten i drift</p>
      </div>

      <div className="vk-elementlab-flow" aria-hidden="true">
        <svg viewBox="0 0 640 122" aria-hidden="true" focusable="false">
          <path className="vk-elementlab-flowbase" d={FLOW_D} pathLength={1} />
          <path
            className="vk-elementlab-flowline"
            d={FLOW_D}
            pathLength={1}
            style={{ strokeDashoffset: 1 - p }}
          />
          {FLOW_NODES.map((node) => (
            <g key={node.label}>
              <circle
                className="vk-elementlab-flownode"
                data-lit={p >= node.t ? "true" : "false"}
                cx={node.x}
                cy={node.y}
                r={6}
              />
              <text className="vk-elementlab-flowtag" x={node.lx} y={102} textAnchor={node.anchor}>
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="vk-elementlab-stat">
        <p className="vk-elementlab-statvalue">
          <span className="vk-sr">80 %</span>
          <span className="vk-elementlab-statdigits" aria-hidden="true">
            {value}
          </span>
          <span className="vk-elementlab-statpct" aria-hidden="true">
            %
          </span>
        </p>
        <p className="vk-elementlab-statlabel">raskere rapporter</p>
      </div>

      <p className="vk-elementlab-stataside">
        …og <strong>hundrevis av timer frigjort</strong> — hvert år.
      </p>

      <p className="vk-mono vk-elementlab-monoline">rapport bygget → levert · neste i kø</p>
      <p className="vk-mono vk-elementlab-whisper" aria-hidden="true">
        tallet er målt — ikke pyntet
      </p>
    </div>
  );
}
