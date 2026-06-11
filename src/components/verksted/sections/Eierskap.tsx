"use client";

import "@/styles/verksted/eierskap.css";
import Image from "next/image";
import { useRef, useSyncExternalStore } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment } from "@/components/verksted/ThreadContext";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

// Stamp rotation jitter — fixed token set only (contract §2).
const ROT = ["vk-rot-a", "vk-rot-c", "vk-rot-b"] as const;

// Tråden crossing the section: enters and exits on the 38% spine (x=50 in a
// container centered on it), bowing into the sheet's left margin — read as
// the thread bleeding through the paper as a hand-drawn ink line.
const THREAD_D =
  "M 50 0 C 49 8 46 14 40 22 C 32 32 21 38 18 50 C 15.2 61 19 70 25 76 " +
  "C 30 81 29.5 88 23.5 91 C 18.5 93.5 16.5 99 20.5 104 " +
  "C 26.5 111 37 118 43.5 128 C 47.5 134.5 49.6 142 50 150";

export function Eierskap() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();

  const sectionRef = useRef<HTMLElement>(null);
  const stampsRef = useRef<HTMLDivElement>(null);
  const stampsInView = useInView(stampsRef, { once: true, amount: 0.5 });

  // The deed arrives: sheet scrubs 0.92→1 / 40px→0 as it enters.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "start 0.25"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });
  const scale = useTransform(progress, [0, 1], [0.92, 1]);
  const y = useTransform(progress, [0, 1], [40, 0]);

  // Poster law: SSR / no-JS / reduced motion = sheet full size, stamps landed.
  const scrub = mounted && !reduced;
  // "pre" (hidden) exists only after mount with motion allowed, so the slam
  // plays from hidden instead of blinking out already-visible stamps.
  const slam = scrub ? (stampsInView ? "in" : "pre") : undefined;

  return (
    <section ref={sectionRef} className="vk-eie vk-s" aria-labelledby="vk-eie-heading">
      <ThreadSegment d={THREAD_D} viewBox="0 0 100 150" className="vk-eie-thread" />
      <motion.div className="vk-eie-sheetwrap" style={scrub ? { scale, y } : undefined}>
        <div className="vk-paper vk-eie-sheet">
          <p className="vk-kicker vk-eie-kicker">{t.eierskap.kicker}</p>
          <h2 id="vk-eie-heading" className="vk-display vk-eie-heading">
            {t.eierskap.heading}
          </h2>
          <div className="vk-eie-mid">
            <div ref={stampsRef} className="vk-eie-stamps">
              {t.eierskap.stamps.map((stamp, i) => (
                <span
                  key={stamp}
                  className={`vk-stamp vk-eie-stamp ${ROT[i] ?? ROT[0]}`}
                  data-slam={slam}
                >
                  {stamp}
                </span>
              ))}
            </div>
            {/* Tipped-in plate: the dark spot illustration pinned to the
                deed — cream photo border + chalk tape (poster-static). */}
            <div className="vk-eie-plate vk-rot-c">
              <Image
                className="vk-ill vk-eie-plate-img"
                src="/verksted/eierskap-spot.webp"
                alt={t.eierskap.alt}
                width={1024}
                height={1024}
                sizes="(max-width: 768px) 60vw, 340px"
              />
            </div>
            <p className="vk-eie-body">{t.eierskap.body}</p>
          </div>
          <div className="vk-eie-foot">
            <p className="vk-mono vk-eie-footnote">{t.eierskap.footnote}</p>
            <a className="vk-eie-link" href={t.eierskap.linkHref}>
              {t.eierskap.linkLabel}
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
