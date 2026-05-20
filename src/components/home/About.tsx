"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function About() {
  const { lang } = useLang();
  const t = translations[lang];

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
          </motion.div>
          <motion.div className="split__right" variants={stagger}>
            {t.about.values.map(([title, desc], i) => (
              <motion.div key={i} className="val" variants={fadeUp} custom={i}>
                <div className="val__bar" />
                <div>
                  <h4>{title}</h4>
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
