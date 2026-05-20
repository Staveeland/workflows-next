"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

// Portrait with graceful fallback. If `/petter.jpg` exists in /public it will
// be used; otherwise we render an editorial Lora-styled initials mark.
function FounderPortrait({ alt }: { alt: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div className="about__portrait about__portrait--fallback" aria-label={alt} role="img">
        <span className="about__portrait-mark" aria-hidden="true">PS</span>
      </div>
    );
  }

  return (
    // Plain <img> (not next/image) so onError fallback works even when the
    // file is missing during dev/build. Swap to next/image once /public/petter.jpg lands.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/petter.jpg"
      alt={alt}
      className="about__portrait"
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      onError={() => setImgFailed(true)}
    />
  );
}

export function About() {
  const { lang } = useLang();
  const t = translations[lang];

  const founderAlt =
    lang === "no"
      ? "Petter Staveland, grunnlegger av Workflows AS"
      : "Petter Staveland, founder of Workflows AS";
  const founderRole = lang === "no" ? "Grunnlegger & daglig leder" : "Founder & CEO";

  return (
    <section className="section section--elevated" id="om">
      <div className="wrap">
        <motion.div
          className="split"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.div className="split__left" variants={fadeUp}>
            <span className="tag">{t.about.tag}</span>
            <AnimatedHeading text={t.about.heading} />
            <motion.p variants={fadeUp} custom={2}>
              {t.about.body1}
            </motion.p>
            <motion.p variants={fadeUp} custom={3}>
              {t.about.body2}
            </motion.p>
            <motion.div className="about__founder" variants={fadeUp} custom={4}>
              <FounderPortrait alt={founderAlt} />
              <div className="about__founder-meta">
                <strong>Petter Staveland</strong>
                <span>{founderRole}</span>
              </div>
            </motion.div>
          </motion.div>
          <motion.div className="split__right" variants={stagger}>
            {t.about.values.map(([title, desc], i) => (
              <motion.div key={i} className="val" variants={fadeUp} custom={i}>
                <div className="val__bar" />
                <div>
                  {/* h3 (was h4) — matches sibling sections (Levels, Process,
                     Customers etc. all use h3 for card-level subheads under
                     the section h2). Sprint 4.2. */}
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
