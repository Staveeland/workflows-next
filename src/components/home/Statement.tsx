"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Statement() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="statement">
      <div className="wrap">
        <motion.div
          className="statement__inner"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <AnimatedHeading text={t.statement.heading} />
          <motion.p variants={fadeUp} custom={2}>
            {t.statement.body}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
