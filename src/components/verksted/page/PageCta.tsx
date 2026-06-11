"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { ThreadSegment } from "@/components/verksted/ThreadContext";

const EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

// The thread's exit on every sub-page: drops from the spine into the lamp.
const CTA_THREAD_D = "M 62 0 C 58 28 38 42 28 62 C 20 78 22 102 22 124";

/**
 * Shared closing CTA for sub-pages — carries id="kontakt" so the nav CTA
 * anchor resolves in-page. Bilingual via verkstedContent (chrome language).
 */
export function PageCta({ heading, note }: { heading?: string; note?: string }) {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const sectionRef = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "center center"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p >= 0.95) setLit(true);
  });

  return (
    <section id="kontakt" ref={sectionRef} className={`vk-s vk-pg-cta${lit ? " vk-pg-cta--lit" : ""}`}>
      <div className="vk-pg-cta-lamp" aria-hidden="true" />
      <div className="vk-wrap">
        <p className="vk-kicker vk-pg-cta-kicker">{t.kontakt.kicker}</p>
        <h2 className="vk-display vk-pg-cta-heading">{heading ?? t.kontakt.heading}</h2>
        <p className="vk-pg-cta-disarm">{note ?? t.kontakt.disarm}</p>
        <div className="vk-pg-cta-row">
          <ThreadSegment
            d={CTA_THREAD_D}
            viewBox="0 0 100 124"
            className="vk-pg-cta-thread"
            offset={["start 0.9", "end 0.5"]}
          />
          <span className="vk-pg-cta-dot" aria-hidden="true" />
          <a href={`mailto:${EMAIL}`} className="vk-btn vk-btn--cta vk-pg-cta-btn">
            {t.kontakt.cta}
          </a>
          <a href={PHONE_HREF} className="vk-pg-cta-phone">
            {PHONE_DISPLAY}
          </a>
        </div>
        <p className="vk-mono vk-pg-cta-mono">{t.kontakt.mono}</p>
      </div>
    </section>
  );
}
