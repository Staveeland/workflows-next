"use client";

import "@/styles/verksted/pages/agenter.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";
import { Reveal } from "@/components/verksted/page/Reveal";

/* ── Nattevakten — the star interaction on /ai-agenter.
   A mono agent-log that types itself when it scrolls into view.
   Facts mirror the Festiviteten case: the agent watches ticket sales and
   ads on Meta, Google and radio, and alerts when sales dip. ── */

const LOG_LINES: ReadonlyArray<{ time: string; text: string; kind?: "avvik" | "varsel" }> = [
  { time: "02:58", text: "overvåker billettsalg — alt normalt" },
  { time: "03:04", text: "sjekker annonser: meta · google · radio" },
  { time: "03:11", text: "overvåker billettsalg …" },
  { time: "03:12", text: "avvik: svakt salg oppdaget", kind: "avvik" },
  { time: "03:12", text: "varsel sendt → deg", kind: "varsel" },
  { time: "03:13", text: "tilbake på vakt" },
];

// The thread drops in from the hero hand-off and runs behind the log panel
// along the ~38% spine.
const NATT_THREAD_D =
  "M 50 0 C 46 36 40 72 44 112 C 48 152 58 192 53 232 C 50 256 46 268 47 280";

/* Poster law: SSR / no-JS / reduced motion render the complete log.
   The empty state exists only after mount with motion allowed; typing
   starts once the panel is in view and plays exactly once. */
// Pure derivation of LOG_LINES — module scope, computed once.
const lines = LOG_LINES.map((line, i) => ({
  ...line,
  start: LOG_LINES.slice(0, i).reduce((sum, l) => sum + l.text.length, 0),
  len: line.text.length,
}));
const total = LOG_LINES.reduce((sum, l) => sum + l.text.length, 0);

function NattevaktLogg({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });

  // armed = cleared, waiting for view; derived so SSR/no-JS/reduced stays
  // composed and a reduced-motion flip mid-typing composes instantly.
  const mounted = useMounted();
  const [typedCount, setTypedCount] = useState(0);
  const armed = mounted && !reduced;
  const shown = armed ? typedCount : total;

  useEffect(() => {
    if (!armed || !inView || typedCount >= total) return;
    // 22ms per character; a longer beat before each new log line.
    const atBoundary = lines.some((l) => l.start === typedCount);
    const delay = typedCount === 0 ? 420 : atBoundary ? 640 : 22;
    const id = window.setTimeout(() => setTypedCount((s) => s + 1), delay);
    return () => window.clearTimeout(id);
  }, [armed, inView, typedCount]);

  const typing = armed && shown < total;
  const activeIdx = typing
    ? lines.findIndex((l) => shown >= l.start && shown < l.start + l.len)
    : lines.length - 1;

  return (
    <div className="vk-agenter-lograam">
      <div ref={ref} className="vk-agenter-log" aria-hidden="true">
        <div className="vk-agenter-loghead">
          <span className="vk-stamp">På nattevakt</span>
          <span className="vk-agenter-logstatus">
            <span className="vk-agenter-logdot" />
            system: våken
          </span>
        </div>
        {lines.map((line, i) => {
          const typedCount = armed ? Math.min(Math.max(shown - line.start, 0), line.len) : line.len;
          const on = !armed || shown >= line.start;
          return (
            <p
              key={`${line.time}-${line.text}`}
              className="vk-agenter-logline"
              data-kind={line.kind ?? "vakt"}
              data-on={on ? "true" : "false"}
            >
              <span className="vk-agenter-logtime">{line.time}</span>
              <span className="vk-agenter-logtext">
                {/* ghost reserves the final size so typing never reflows the panel */}
                <span className="vk-agenter-ghost">{line.text}</span>
                <span className="vk-agenter-typed">
                  {line.text.slice(0, typedCount)}
                  {armed && i === activeIdx ? <span className="vk-agenter-caret" /> : null}
                </span>
              </span>
            </p>
          );
        })}
        <span className="vk-agenter-whisper vk-chalk">den blunker aldri</span>
      </div>
      <p className="vk-sr">
        Eksempel fra agentloggen:{" "}
        {LOG_LINES.map((l) => `${l.time} ${l.text}`).join(". ")}.
      </p>
    </div>
  );
}

export function AgenterClient() {
  const { reduced } = useThread();

  return (
    <section id="nattevakt" className="vk-pg-s vk-agenter-natt" aria-labelledby="agenter-natt-h">
      <ThreadSegment
        d={NATT_THREAD_D}
        viewBox="0 0 100 280"
        className="vk-agenter-natt-thread"
        offset={["start 0.95", "end 0.4"]}
      />
      <div className="vk-wrap">
        <div className="vk-agenter-natt-grid">
          <div className="vk-agenter-natt-copy">
            <Reveal as="p" className="vk-kicker">
              Ekte vakt · Festiviteten
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="agenter-natt-h" className="vk-display vk-pg-h2">
                På nattevakt for Festiviteten
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.12}>
              Festiviteten er et historisk teater i Haugesund. Agenten deres følger billettsalg
              og annonser på Meta, Google og radio — i sanntid, hele natten. Svikter salget for
              en forestilling, kommer varselet med en gang. Scenen får oppmerksomheten —
              systemet tar tallene.
            </Reveal>
            <Reveal delay={0.18}>
              <Link href="/kunder/festiviteten" className="vk-pg-link">
                Les hele caset <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          </div>
          <div className="vk-agenter-natt-panel">
            <NattevaktLogg reduced={reduced} />
            <p className="vk-chalk vk-agenter-natt-chalk">teateret sover — agenten gjør ikke</p>
          </div>
        </div>
      </div>
    </section>
  );
}
