"use client";

import "@/styles/verksted/tjenester.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

type Bench = (typeof verkstedContent)["no"]["tjenester"]["benches"][number];
type ChatSpec = NonNullable<Bench["vignette"]["chat"]>;
type CodeSpec = NonNullable<Bench["vignette"]["code"]>;

// Tråden weaving the 38% spine between the benches — enters and exits on
// the spine (x=50 in a container centered on it), peeking through the gaps
// while the opaque benches sit above it (z>=1).
const SPINE_D =
  "M 50 0 C 42 60 64 120 56 190 C 50 235 38 270 36 330 " +
  "C 34 380 58 430 56 480 C 54 530 46 565 47 600";

export function Tjenester() {
  const { lang } = useLang();
  const { reduced } = useThread();
  const t = verkstedContent[lang];
  const tj = t.tjenester;

  return (
    <section id="tjenester" className="vk-s vk-tj">
      <ThreadSegment d={SPINE_D} viewBox="0 0 100 600" className="vk-tj-thread" />
      <div className="vk-wrap">
        <div className="vk-tj-grid">
          <header className="vk-tj-head">
            <p className="vk-kicker">{tj.kicker}</p>
            <h2 className="vk-display vk-tj-heading">{tj.heading}</h2>
          </header>
          {tj.benches.map((bench) => (
            <BenchCard key={bench.id} bench={bench} reduced={reduced} />
          ))}
          <ChalkNote text={tj.chalk} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}

function BenchCard({ bench, reduced }: { bench: Bench; reduced: boolean }) {
  return (
    <article className={`vk-tj-bench vk-tj-bench--${bench.id}`}>
      <span className="vk-stamp vk-tj-label">{bench.stamp}</span>
      <h3 className="vk-tj-title">
        {bench.href ? (
          <Link href={bench.href} className="vk-tj-titlelink">
            {bench.title}
          </Link>
        ) : (
          bench.title
        )}
      </h3>
      <p className="vk-tj-benefit">{bench.benefit}</p>
      <div className="vk-tj-vignette">
        {bench.vignette.chat && <ChatVignette chat={bench.vignette.chat} reduced={reduced} />}
        {bench.vignette.pipeline && (
          <FlowVignette labels={bench.vignette.pipeline} reduced={reduced} />
        )}
        {bench.vignette.agentLog && (
          <LogVignette lines={bench.vignette.agentLog} reduced={reduced} />
        )}
        {bench.vignette.code && <CodeVignette code={bench.vignette.code} reduced={reduced} />}
      </div>
      <p className="vk-tj-proof">
        <span aria-hidden="true">→ </span>
        {bench.proof}
      </p>
    </article>
  );
}

/* ── Chatboter: q/a bubbles type in word-by-word once in view.
   SSR/reduced/no-JS resting state = both bubbles fully composed. ── */
function ChatVignette({ chat, reduced }: { chat: ChatSpec; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const qWords = useMemo(() => chat.q.split(" "), [chat.q]);
  const aWords = useMemo(() => chat.a.split(" "), [chat.a]);
  const total = qWords.length + aWords.length;
  const [armed, setArmed] = useState(false); // armed = hidden, waiting for view
  const [shown, setShown] = useState(total); // composed by default (poster law)
  const played = useRef(false);

  useEffect(() => {
    if (reduced || played.current) return;
    setArmed(true);
    setShown(0);
  }, [reduced]);

  useEffect(() => {
    if (!armed || !inView) return;
    if (shown >= total) {
      played.current = true;
      return;
    }
    // 24ms per word; a longer beat before each bubble starts.
    const delay = shown === 0 ? 160 : shown === qWords.length ? 520 : 24;
    const id = window.setTimeout(() => setShown((s) => s + 1), delay);
    return () => window.clearTimeout(id);
  }, [armed, inView, shown, total, qWords.length]);

  const typing = armed && shown < total;
  const qShown = Math.min(shown, qWords.length);
  const aShown = Math.max(0, shown - qWords.length);

  return (
    <div ref={ref} className="vk-tj-chat">
      <ChatBubble
        role="q"
        full={chat.q}
        typed={qWords.slice(0, qShown).join(" ")}
        on={!typing || shown > 0}
      />
      <ChatBubble
        role="a"
        full={chat.a}
        typed={aWords.slice(0, aShown).join(" ")}
        on={!typing || shown > qWords.length}
      />
    </div>
  );
}

function ChatBubble({
  role,
  full,
  typed,
  on,
}: {
  role: "q" | "a";
  full: string;
  typed: string;
  on: boolean;
}) {
  return (
    <p className="vk-tj-bubble" data-role={role} data-on={on ? "true" : "false"}>
      {/* ghost reserves the final size so typing never reflows the bench */}
      <span className="vk-tj-ghost" aria-hidden="true">
        {full}
      </span>
      <span className="vk-tj-typed" aria-hidden="true">
        {typed}
      </span>
      <span className="vk-tj-sr">{full}</span>
    </p>
  );
}

/* ── Flyter: mini-pipeline. The amber dot travels the path on a 4s CSS
   offset-path loop, only while in view; it rests at the last node. ── */
const FLOW_D =
  "M14 36C47 22 78 20 111 28C144 36 175 52 208 44C241 36 273 24 306 32";
const FLOW_NODES: ReadonlyArray<readonly [number, number]> = [
  [14, 36],
  [111, 28],
  [208, 44],
  [306, 32],
];

function FlowVignette({ labels, reduced }: { labels: string[]; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const live = !reduced && inView;
  const shown = labels.slice(0, FLOW_NODES.length);

  return (
    <div
      ref={ref}
      className="vk-tj-flow"
      data-live={live ? "true" : "false"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 92" aria-hidden="true" focusable="false">
        <path className="vk-tj-flow-path" d={FLOW_D} />
        {shown.map((label, i) => {
          const node = FLOW_NODES[i];
          if (!node) return null;
          const [x, y] = node;
          const last = i === shown.length - 1;
          return (
            <g key={label}>
              <circle className="vk-tj-flow-node" cx={x} cy={y} r={5} />
              <text
                className="vk-tj-flow-tag"
                x={i === 0 ? x - 6 : last ? x + 6 : x}
                y={76}
                textAnchor={i === 0 ? "start" : last ? "end" : "middle"}
              >
                {label}
              </text>
            </g>
          );
        })}
        <g className="vk-tj-flow-dotg" style={{ offsetPath: `path("${FLOW_D}")` }}>
          <circle className="vk-tj-flow-halo" r={7} />
          <circle className="vk-tj-flow-dot" r={3.5} />
        </g>
      </svg>
    </div>
  );
}

/* ── Agenter: mono log. All three lines are always in the DOM (stable
   layout, composed resting state); while live the active line cycles
   every 4s with a blinking caret, the rest dim. ── */
function LogVignette({ lines, reduced }: { lines: string[]; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const live = !reduced && inView;
  const [active, setActive] = useState(lines.length - 1);
  const started = useRef(false);

  useEffect(() => {
    if (!live) return;
    if (!started.current) {
      started.current = true;
      setActive(0);
    }
    const id = window.setInterval(() => setActive((a) => (a + 1) % lines.length), 4000);
    return () => window.clearInterval(id);
  }, [live, lines.length]);

  return (
    <div
      ref={ref}
      className="vk-tj-log"
      data-live={live ? "true" : "false"}
      aria-hidden="true"
    >
      {lines.map((line, i) => (
        <p key={line} className="vk-tj-logline" data-active={i === active ? "true" : "false"}>
          <span>{line}</span>
          <span className="vk-tj-caret" />
        </p>
      ))}
    </div>
  );
}

/* ── Software: the spreadsheet formula crossfades into a small UI chip
   once in view. Resting/reduced/no-JS state = chip shown. ── */
function CodeVignette({ code, reduced }: { code: CodeSpec; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!reduced) setArmed(true);
  }, [reduced]);

  useEffect(() => {
    if (!armed || !inView || done) return;
    const id = window.setTimeout(() => setDone(true), 900); // beat to read the formula
    return () => window.clearTimeout(id);
  }, [armed, inView, done]);

  const compiled = !armed || done;
  return (
    <div ref={ref} className="vk-tj-code" data-compiled={compiled ? "true" : "false"}>
      <code className="vk-tj-code-before" aria-hidden="true">
        {code.before}
      </code>
      <span className="vk-tj-chip">{code.after}</span>
    </div>
  );
}

/* ── Chalk note, bottom-right, with a hand-drawn circle-arrow that
   strokes itself in on view. Rest/no-JS/reduced = fully drawn. ── */
function ChalkNote({ text, reduced }: { text: string; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!reduced) setArmed(true);
  }, [reduced]);

  const state = !armed ? "rest" : inView ? "draw" : "armed";
  return (
    <div ref={ref} className="vk-tj-chalknote" data-chalk={state}>
      <span className="vk-chalk vk-tj-chalktext">{text}</span>
      <svg
        className="vk-tj-chalkarrow"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path pathLength={1} d="M33 9C21 2 7 8 4 20c-3 12 6 24 19 24 11 0 20-8 21-19" />
        <path pathLength={1} className="vk-tj-chalkhead" d="M38 29l6-4-1-8" />
      </svg>
    </div>
  );
}
