"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Features() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="features" id="tjenester">
      <div className="wrap">
        <motion.div
          className="statement__inner"
          style={{ marginBottom: "clamp(48px, 6vw, 80px)" }}
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag" variants={fadeUp}>
            {t.features.tag}
          </motion.span>
          <AnimatedHeading text={t.features.heading} />
        </motion.div>

        {/* Feature 1 */}
        <div className="feature-row">
          <div className="feature-row__content">
            <span className="feature-row__label">{t.features.rows[0].label}</span>
            <h3>{t.features.rows[0].title}</h3>
            <p>{t.features.rows[0].body}</p>
          </div>
          <div className="feature-row__visual">
            {t.features.rows[0].items.map((item, i) => (
              <div key={i} className="feature-row__visual-item">
                <span className="feature-row__check">&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Feature 2 */}
        <div className="feature-row feature-row--reverse">
          <div className="feature-row__content">
            <span className="feature-row__label">{t.features.rows[1].label}</span>
            <h3>{t.features.rows[1].title}</h3>
            <p>{t.features.rows[1].body1}</p>
            <p>{t.features.rows[1].body2}</p>
          </div>
          <div className="feature-row__visual">
            {t.features.rows[1].items.map((item, i) => (
              <div key={i} className="feature-row__visual-item">
                <span className="feature-row__check">&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Feature 3 */}
        <div className="feature-row">
          <div className="feature-row__content">
            <span className="feature-row__label">{t.features.rows[2].label}</span>
            <h3>{t.features.rows[2].title}</h3>
            <p>{t.features.rows[2].body1}</p>
            <p>{t.features.rows[2].body2}</p>
          </div>
          <div className="feature-row__visual">
            {t.features.rows[2].items.map((item, i) => (
              <div key={i} className="feature-row__visual-item">
                <span className="feature-row__check">&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
