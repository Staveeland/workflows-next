"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";

interface Props {
  /** When true, render the leading mid-cta text (used by the second instance). */
  withText?: boolean;
}

export function MidCta({ withText = false }: Props) {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <motion.div
      className="mid-cta"
      initial="hidden"
      whileInView="visible"
      viewport={SCROLL_VIEWPORT}
      variants={stagger}
    >
      {withText ? (
        <motion.p className="mid-cta__text" variants={fadeUp}>
          {t.midCta.text2}
        </motion.p>
      ) : null}
      <motion.div variants={fadeUp} custom={withText ? 1 : 0}>
        <a href="#kontakt" className="btn btn--primary">
          {t.midCta.cta} <span className="btn__arrow">&rarr;</span>
        </a>
      </motion.div>
    </motion.div>
  );
}
