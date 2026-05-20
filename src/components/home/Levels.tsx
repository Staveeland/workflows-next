"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Levels() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="levels" id="nivaer">
      <div className="wrap">
        <motion.div
          className="section__head"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag" variants={fadeUp}>
            {t.levels.tag}
          </motion.span>
          <AnimatedHeading text={t.levels.heading} />
          <motion.p className="section__sub" variants={fadeUp} custom={2}>
            {t.levels.sub}
          </motion.p>
        </motion.div>

        <motion.div
          className="levels__staircase"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          variants={stagger}
        >
          {t.levels.items.map((level, i) => (
            <motion.article
              key={level.title}
              className={`level level--${i + 1} card-link-host`}
              variants={fadeUp}
              custom={i}
            >
              <div className="level__header">
                <span className="level__num">
                  {level.levelLabel} {i + 1}
                </span>
                <h3 className="level__title">
                  <Link href={level.href} className="level__link card-link">
                    {level.title}
                  </Link>
                </h3>
              </div>
              <ul className="level__points">
                {level.points.map((p, j) => (
                  <li key={j}>
                    <span className="level__arrow">&rarr;</span> {p}
                  </li>
                ))}
              </ul>
              <p className="level__example">
                <span className="level__think">{t.levels.think}</span> {level.example}
              </p>
              <span className="level__cta" aria-hidden="true">{t.levels.readMore} &rarr;</span>
            </motion.article>
          ))}
        </motion.div>

        <div className="levels__footer">
          <p className="levels__footer-text">{t.levels.footerText}</p>
          <div>
            <a href="#kontakt" className="btn btn--primary">
              {t.levels.footerCta} <span className="btn__arrow">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
