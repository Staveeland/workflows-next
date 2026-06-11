"use client";

import "@/styles/verksted/tjenester.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

type Bench = (typeof verkstedContent)["no"]["tjenester"]["benches"][number];
type ChatSpec = NonNullable<Bench["vignette"]["chat"]>;

// Stamps are the only rotated elements on the benches (containers stay level).
const STAMP_ROT = ["vk-rot-a", "vk-rot-c", "vk-rot-b", "vk-rot-d"];

// Tråden weaving the 38% spine between the benches — enters and exits on
// the spine (x=50 in a container centered on it), peeking through the gaps
// while the opaque benches sit above it (z>=1).
const SPINE_D =
  "M 50 0 C 42 60 64 120 56 190 C 50 235 38 270 36 330 " +
  "C 34 380 58 430 56 480 C 54 530 46 565 47 600";

const ILL_SIZES = "(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 520px";

// Fine-pointer probe — SSR/coarse default false, so the parallax style is
// simply absent at rest (poster law: resting CSS = composed state).
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

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
          {tj.benches.map((bench, i) => (
            <BenchCard
              key={bench.id}
              bench={bench}
              reduced={reduced}
              rot={STAMP_ROT[i % STAMP_ROT.length] ?? "vk-rot-a"}
            />
          ))}
          <ChalkNote text={tj.chalk} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}

/* ── Bench: the linocut illustration leads, text recedes to
   stamp + title + benefit + proof. The chatboter chat vignette overlaps
   the artwork's feathered foot; the agenter log ticks one line under it. ── */
function BenchCard({ bench, reduced, rot }: { bench: Bench; reduced: boolean; rot: string }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <article ref={ref} className={`vk-tj-bench vk-tj-bench--${bench.id}`}>
      <span className={`vk-stamp ${rot} vk-tj-label`}>{bench.stamp}</span>
      <h3 className="vk-tj-title">
        {bench.href ? (
          <Link href={bench.href} className="vk-tj-titlelink">
            {bench.title}
          </Link>
        ) : (
          bench.title
        )}
      </h3>
      <div className="vk-tj-fig">
        <BenchArt id={bench.id} alt={bench.alt} target={ref} reduced={reduced} />
        {bench.vignette.chat && <ChatVignette chat={bench.vignette.chat} reduced={reduced} />}
      </div>
      {bench.vignette.agentLog && (
        <LogVignette lines={bench.vignette.agentLog} reduced={reduced} />
      )}
      <p className="vk-tj-benefit">{bench.benefit}</p>
      <p className="vk-tj-proof">
        <span aria-hidden="true">→ </span>
        {bench.proof}
      </p>
    </article>
  );
}

/* ── The illustration. Parallax-light: ±12px y-drift scrubbed off the
   bench's scroll window — fine pointers only, never under reduced motion.
   Resting state (SSR/coarse/reduced) carries no transform at all. ── */
function BenchArt({
  id,
  alt,
  target,
  reduced,
}: {
  id: Bench["id"];
  alt: string;
  target: React.RefObject<HTMLElement | null>;
  reduced: boolean;
}) {
  const fine = useFinePointer();
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [12, -12]);
  const drift = fine && !reduced;

  return (
    <motion.div className="vk-tj-illwrap" style={drift ? { y } : undefined}>
      <Image
        src={`/verksted/tj-${id}.webp`}
        alt={alt}
        width={1024}
        height={1024}
        sizes={ILL_SIZES}
        className="vk-ill vk-ill--feather vk-tj-ill"
      />
    </motion.div>
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

/* ── Agenter: ONE ticking mono log line under the artwork. All lines are
   stacked in the same grid cell (stable layout); only the active one is
   visible, cycling every 4s while live. Resting/no-JS/reduced state =
   the final line ("varsel sendt"), the composed end of the story. ── */
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
          <span className="vk-tj-caret" />
          <span>{line}</span>
        </p>
      ))}
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
