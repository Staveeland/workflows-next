"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Results() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="section" id="resultater">
      <div className="wrap">
        <motion.div
          className="section__head"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag" variants={fadeUp}>
            {t.results.tag}
          </motion.span>
          <AnimatedHeading text={t.results.heading} />
        </motion.div>

        <div className="results-grid">
          {t.results.items.map((r, i) => (
            <div key={i} className="result">
              <span className="result__num">0{i + 1}</span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
