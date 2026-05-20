"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Faq() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="cta-section" id="faq">
      <div className="wrap">
        <motion.div
          className="section__head"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag tag--on-accent" variants={fadeUp}>
            {t.faq.tag}
          </motion.span>
          <AnimatedHeading text={t.faq.heading} className="accent-section__heading" />
        </motion.div>

        <div className="faq-list faq-list--featured">
          {t.faq.featured.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="faq-see-all">
          <Link href={t.faq.seeAllHref} className="btn btn--dark">
            {t.faq.seeAllLabel} <span className="btn__arrow">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
