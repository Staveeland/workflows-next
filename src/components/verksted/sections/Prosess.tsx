"use client";

import "@/styles/verksted/prosess.css";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent, type VerkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

type ProsessContent = VerkstedContent["prosess"];

// Sine wave weaving through the six rail markers (zero-crossings every 144u).
const RAIL_D =
  "M 0 40 C 48 4 96 4 144 40 C 192 76 240 76 288 40 C 336 4 384 4 432 40 " +
  "C 480 76 528 76 576 40 C 624 4 672 4 720 40";

// Hand-drawn chalk ellipse — open start/end overlap, slightly lopsided.
const CHALK_D =
  "M 198 6 C 92 2 12 14 10 37 C 8 59 86 69 176 67 C 270 65 332 54 332 34 " +
  "C 332 14 246 2 168 7";

const EASE_WORK: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ROTS = ["var(--rot-a)", "var(--rot-c)", "var(--rot-b)", "var(--rot-d)"];

const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function Prosess() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const { reduced } = useThread();

  // Pinned scrub only on >=1024px fine pointers (SSR default: stacked).
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pinned = desktop && !reduced;

  // The Stacked→Pinned swap adds ~1000px, so the browser's initial anchor
  // scroll (done against the SSR layout) strands deep links to targets
  // below this section. Re-run the anchor jump once after the swap commits,
  // unless the user has already taken over scrolling.
  const userMoved = useRef(false);
  const anchorFixed = useRef(false);
  useEffect(() => {
    const mark = () => {
      userMoved.current = true;
    };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", mark, opts);
    window.addEventListener("touchmove", mark, opts);
    window.addEventListener("keydown", mark, opts);
    return () => {
      window.removeEventListener("wheel", mark);
      window.removeEventListener("touchmove", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);
  useEffect(() => {
    if (!pinned || anchorFixed.current) return;
    anchorFixed.current = true;
    if (userMoved.current || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    const self = document.getElementById("prosess");
    // Only targets at/below this section moved; #prosess itself did not.
    if (
      self &&
      (el === self ||
        (el.compareDocumentPosition(self) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
    ) {
      return;
    }
    requestAnimationFrame(() => {
      if (!userMoved.current) el.scrollIntoView();
    });
  }, [pinned]);
  return (
    <section id="prosess" className={`vk-pro${pinned ? "" : " vk-s"}`}>
      {pinned ? <Pinned p={t.prosess} /> : <Stacked p={t.prosess} />}
    </section>
  );
}

/* ── Desktop: sticky pin over 250vh, week counter scrubbed by scroll ── */

function Pinned({ p }: { p: ProsessContent }) {
  const outer = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: outer,
    offset: ["start start", "end end"],
  });
  const weekRef = useRef(0);
  const [week, setWeek] = useState(0);
  const [dir, setDir] = useState(1);
  const [circled, setCircled] = useState(false);

  const sync = (v: number) => {
    const i = Math.min(5, Math.floor(v * 6));
    if (i !== weekRef.current) {
      setDir(i > weekRef.current ? 1 : -1);
      weekRef.current = i;
      setWeek(i);
    }
    if (v >= 0.15) setCircled(true);
  };
  useMotionValueEvent(scrollYProgress, "change", sync);
  // Sync immediately for mid-page reloads / mode switches.
  useEffect(() => sync(scrollYProgress.get()), []); // eslint-disable-line react-hooks/exhaustive-deps

  const wk = p.weeks[Math.min(week, p.weeks.length - 1)];
  const live = week === 5;

  return (
    <div ref={outer} className="vk-pro-pin">
      <div className="vk-pro-pinview">
        <div className="vk-wrap vk-pro-pinwrap">
          <header className="vk-pro-head">
            <p className="vk-kicker">{p.kicker}</p>
            <h2 className="vk-display vk-pro-h2">{p.heading}</h2>
          </header>

          {/* The scrub is decoration for AT — the full timetable lives here. */}
          <ol className="vk-pro-sr">
            {p.weeks.map((w) => (
              <li key={w.n}>{`${p.weekLabel} ${w.n}: ${w.log}`}</li>
            ))}
          </ol>

          <div className="vk-pro-center" aria-hidden="true">
            <div className="vk-pro-counter">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.span
                  key={wk.n}
                  className="vk-display vk-pro-counter-text"
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ y: d > 0 ? "0.55em" : "-0.55em", opacity: 0 }),
                    center: { y: 0, opacity: 1 },
                    exit: (d: number) => ({ y: d > 0 ? "-0.55em" : "0.55em", opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.24, ease: EASE_WORK }}
                >
                  {p.weekLabel} {wk.n}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="vk-pro-logwrap">
              <TypeLine text={`${p.weekLabel.toLowerCase()} ${wk.n}: ${wk.log}`} />
              <motion.svg
                className="vk-pro-circle"
                viewBox="0 0 340 72"
                preserveAspectRatio="none"
                aria-hidden="true"
                initial={false}
                animate={{ opacity: week === 0 ? 1 : 0 }}
                transition={{ duration: 0.24, ease: EASE_WORK }}
              >
                <motion.path
                  d={CHALK_D}
                  fill="none"
                  stroke="var(--kritt)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: circled ? 1 : 0 }}
                  transition={{ duration: 0.48, ease: EASE_WORK }}
                />
              </motion.svg>
              <motion.p
                className="vk-chalk vk-pro-chalkcap"
                initial={false}
                animate={{ opacity: circled && week === 0 ? 1 : 0 }}
                transition={{ duration: 0.24, ease: EASE_WORK }}
              >
                {p.chalkCircle}
              </motion.p>
            </div>
          </div>

          <div className="vk-pro-railrow" aria-hidden="true">
            <div className="vk-pro-rail">
              <ThreadSegment d={RAIL_D} viewBox="0 0 720 80" className="vk-pro-thread" />
              {p.weeks.map((w, i) => (
                <span
                  key={w.n}
                  className="vk-pro-marker"
                  data-state={i < week ? "passed" : i === week ? "current" : "future"}
                  style={{ "--vk-rot": ROTS[i % 4] } as React.CSSProperties}
                >
                  {w.n}
                </span>
              ))}
              {/* The key slides 80px across the thread to the visitor's side. */}
              <motion.span
                className="vk-pro-key"
                initial={false}
                animate={{ x: live ? 80 : 0, opacity: live ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                <KeyGlyph />
              </motion.span>
            </div>
            <div className="vk-pro-badge">
              <motion.span
                className="vk-pro-badge-face vk-pro-badge-face--live"
                initial={false}
                animate={{ opacity: live ? 1 : 0 }}
                transition={{ duration: 0.24, ease: EASE_WORK }}
              >
                {p.badgeLive}
              </motion.span>
              <motion.span
                className="vk-pro-badge-face vk-pro-badge-face--building"
                initial={false}
                animate={{ opacity: live ? 0 : 1 }}
                transition={{ duration: 0.24, ease: EASE_WORK }}
              >
                {p.badgeBuilding}
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Build-log line that types itself in (18ms/char) whenever the week flips.
   Full text renders invisibly underneath so the line never changes width. */
function TypeLine({ text }: { text: string }) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 18);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <p className="vk-mono vk-pro-log" aria-live="off">
      <span className="vk-pro-log-size">{text}</span>
      <span className="vk-pro-log-typed">
        {text.slice(0, n)}
        <span className="vk-pro-caret" />
      </span>
    </p>
  );
}

function KeyGlyph() {
  return (
    <svg viewBox="0 0 48 20" width="48" height="20" aria-hidden="true" focusable="false">
      <circle cx="9" cy="10" r="5.75" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14.75 10H44M37 10v6M42 10v4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Mobile / coarse / reduced: stacked timetable, first-class ──
   Resting CSS state is the printed, fully-composed poster; the slams only
   exist behind prefers-reduced-motion: no-preference + JS-set data attrs. */

function Stacked({ p }: { p: ProsessContent }) {
  return (
    <div className="vk-wrap vk-pro-stack">
      <header className="vk-pro-head">
        <p className="vk-kicker">{p.kicker}</p>
        <h2 className="vk-display vk-pro-h2 vk-pro-h2--stack">{p.heading}</h2>
      </header>
      <div className="vk-pro-note">
        <span className="vk-chalk vk-pro-note-text">{p.chalkCircle}</span>
        <svg className="vk-pro-note-ring" viewBox="0 0 340 72" preserveAspectRatio="none" aria-hidden="true">
          <path
            d={CHALK_D}
            fill="none"
            stroke="var(--kritt)"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <ol className="vk-pro-list">
        {p.weeks.map((w, i) => (
          <StampRow key={w.n} w={w} label={p.weekLabel} index={i} />
        ))}
      </ol>
      <BadgeRow building={p.badgeBuilding} live={p.badgeLive} />
    </div>
  );
}

function StampRow({
  w,
  label,
  index,
}: {
  w: ProsessContent["weeks"][number];
  label: string;
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const mounted = useMounted();
  const { reduced } = useThread();
  const slam = mounted && !reduced ? (inView ? "in" : "pre") : undefined;
  return (
    <li
      ref={ref}
      className="vk-pro-row"
      data-slam={slam}
      style={{ "--vk-rot": ROTS[index % 4] } as React.CSSProperties}
    >
      <span className="vk-mono vk-pro-plate">
        {label} {w.n}
      </span>
      <p className="vk-pro-rowlog">{w.log}</p>
    </li>
  );
}

function BadgeRow({ building, live }: { building: string; live: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const mounted = useMounted();
  const { reduced } = useThread();
  const flip = mounted && !reduced ? (inView ? "in" : "pre") : undefined;
  return (
    <div ref={ref} className="vk-pro-badge vk-pro-badge--row" data-flip={flip}>
      <span className="vk-pro-badge-face vk-pro-badge-face--live">{live}</span>
      <span className="vk-pro-badge-face vk-pro-badge-face--building" aria-hidden="true">
        {building}
      </span>
    </div>
  );
}
