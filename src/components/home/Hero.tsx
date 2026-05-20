"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { DEFAULT_EASE } from "./_shared";

function Typewriter({ words }: { words: readonly string[] }) {
  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [del, setDel] = useState(false);
  const word = words[idx];

  useEffect(() => {
    setIdx(0);
    setChars(0);
    setDel(false);
  }, [words]);

  useEffect(() => {
    if (reduceMotion) return;
    if (!del && chars === word.length) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && chars === 0) {
      setDel(false);
      setIdx((p) => (p + 1) % words.length);
      return;
    }
    const t = setTimeout(() => setChars((p) => p + (del ? -1 : 1)), del ? 45 : 90);
    return () => clearTimeout(t);
  }, [chars, del, word, words, reduceMotion]);

  if (reduceMotion) {
    return <span className="hero__accent">{words[0]}</span>;
  }

  return (
    <span className="hero__accent typewriter">
      {word.slice(0, chars)}
      <span className="typewriter__cursor" />
    </span>
  );
}

export function Hero() {
  const { lang } = useLang();
  const t = translations[lang];
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const heroYRaw = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const heroOpRaw = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = reduceMotion ? 0 : heroYRaw;
  const heroOp = reduceMotion ? 1 : heroOpRaw;

  return (
    <section className="hero">
      <div className="hero__shape hero__shape--1" />
      <div className="hero__shape hero__shape--2" />
      <div className="hero__shape hero__shape--3" />

      <motion.div className="hero__content" style={{ y: heroY, opacity: heroOp }}>
        <h1 className="hero__title">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: DEFAULT_EASE }}
            style={{ display: "inline-block" }}
          >
            {t.hero.title}
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: DEFAULT_EASE }}
          >
            <Typewriter words={t.hero.rotateWords} />
          </motion.span>
        </h1>

        <motion.p
          className="hero__sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
        >
          {t.hero.sub}
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: DEFAULT_EASE }}
        >
          <a href="#kontakt" className="btn btn--primary">
            {t.hero.cta} <span className="btn__arrow">&rarr;</span>
          </a>
          <Link href="/kunder" className="btn btn--ghost">
            {t.hero.ctaSecondary}
          </Link>
        </motion.div>
      </motion.div>

      <div className="hero__scroll">
        <div className="hero__scroll-line">
          <div className="hero__scroll-dot" />
        </div>
      </div>
    </section>
  );
}
