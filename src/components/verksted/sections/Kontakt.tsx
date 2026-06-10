"use client";

import "@/styles/verksted/kontakt.css";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment } from "@/components/verksted/ThreadContext";

const EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

// Tråden's finale: enters at the top near the 38% spine, sweeps left and
// drops vertically into the CTA status lamp. The viewBox bottom edge is
// anchored to the button's vertical centerline (see .vk-kon-thread).
const THREAD_D =
  "M 86 0 C 83 24 66 36 52 48 C 36 62 14 70 6 86 C 0.5 97 1.25 112 1.25 133";

const MAGNET_REACH = 120; // px from the button edge
const MAGNET_MAX = 6; // px max translate

export function Kontakt() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion() === true;
  const [lit, setLit] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "center center"],
  });
  // Latches once — lit never unsets.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p >= 0.98) setLit(true);
  });

  // Reduced motion or coarse pointer: the finale is pre-lit (poster law).
  useEffect(() => {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) setLit(true);
  }, [reduced]);

  // Magnetic CTA — fine pointers only, <=6px toward the cursor, spring return.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 380, damping: 24, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 380, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const section = sectionRef.current;
    const btn = ctaRef.current;
    if (!section || !btn) return;

    const onMove = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      const px = e.clientX - (r.left + r.width / 2);
      const py = e.clientY - (r.top + r.height / 2);
      const ox = Math.max(Math.abs(px) - r.width / 2, 0);
      const oy = Math.max(Math.abs(py) - r.height / 2, 0);
      const gap = Math.hypot(ox, oy); // distance from the button edge
      if (gap > MAGNET_REACH) {
        mx.set(0);
        my.set(0);
        return;
      }
      const pull = 1 - gap / MAGNET_REACH;
      const mag = Math.hypot(px, py) || 1;
      const f = Math.min(MAGNET_MAX, mag * 0.08) * pull;
      mx.set((px / mag) * f);
      my.set((py / mag) * f);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, mx, my]);

  return (
    <section
      id="kontakt"
      ref={sectionRef}
      className={`vk-s vk-kon${lit ? " vk-kon-lit" : ""}`}
    >
      <div className="vk-kon-lamp" aria-hidden="true" />
      <div className="vk-wrap">
        <p className="vk-kicker vk-kon-kicker">{t.kontakt.kicker}</p>
        <h2 className="vk-display vk-kon-heading">{t.kontakt.heading}</h2>
        <p className="vk-kon-disarm">{t.kontakt.disarm}</p>

        <div className="vk-kon-row">
          <ThreadSegment d={THREAD_D} viewBox="0 0 100 133" className="vk-kon-thread" />
          <span className="vk-kon-dot" aria-hidden="true" />
          <motion.a
            ref={ctaRef}
            href={`mailto:${EMAIL}`}
            className="vk-btn vk-btn--cta vk-kon-cta"
            style={{ x: sx, y: sy }}
            whileTap={{ scale: 0.97 }}
          >
            {t.kontakt.cta}
          </motion.a>
          <span
            className="vk-stamp vk-rot-c vk-kon-stamp"
            data-slam={lit ? "in" : undefined}
          >
            {t.kontakt.ctaStamp}
          </span>
        </div>

        <p className="vk-mono vk-kon-proof">{t.kontakt.proof}</p>
        <p className="vk-mono vk-kon-svar">{t.kontakt.mono}</p>

        <div className="vk-kon-cards">
          <div className="vk-kon-card">
            <h3 className="vk-kon-cardlabel">{t.kontakt.emailLabel}</h3>
            <a className="vk-kon-cardlink" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <p className="vk-mono vk-kon-cardmicro">
              {t.folkene.person.name} · {t.folkene.person.role}
            </p>
          </div>
          <div className="vk-kon-card">
            <h3 className="vk-kon-cardlabel">{t.kontakt.phoneLabel}</h3>
            <a className="vk-kon-cardlink" href={PHONE_HREF}>
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
