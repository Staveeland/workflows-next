"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Process() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="accent-section" id="prosess">
      <div className="wrap">
        <motion.div
          className="section__head section__head--left"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag tag--on-accent" variants={fadeUp}>
            {t.process.tag}
          </motion.span>
          <AnimatedHeading text={t.process.heading} className="accent-section__heading" />
        </motion.div>

        <div className="steps">
          {t.process.steps.map((s, i) => (
            <div key={i} className="step">
              <span className="step__num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="step__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
