"use client";

import { useEffect, useMemo, useReducer } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { DEFAULT_EASE } from "./_shared";

type TypewriterState = { idx: number; chars: number; del: boolean };
type TypewriterAction = { type: "tick"; wordsLen: number; wordLen: number } | { type: "reset" };

const INITIAL_STATE: TypewriterState = { idx: 0, chars: 0, del: false };

function typewriterReducer(state: TypewriterState, action: TypewriterAction): TypewriterState {
  if (action.type === "reset") return INITIAL_STATE;
  // tick: advance the typewriter by one logical step.
  const { wordsLen, wordLen } = action;
  if (!state.del && state.chars === wordLen) {
    // Finished typing: flip to deleting after a pause (handled by timer).
    return { ...state, del: true };
  }
  if (state.del && state.chars === 0) {
    // Finished deleting: move to next word, start typing again.
    return { idx: (state.idx + 1) % wordsLen, chars: 0, del: false };
  }
  return { ...state, chars: state.chars + (state.del ? -1 : 1) };
}

function Typewriter({ words }: { words: readonly string[] }) {
  const reduceMotion = useReducedMotion();
  const [state, dispatch] = useReducer(typewriterReducer, INITIAL_STATE);
  const word = words[state.idx];

  // Reset when the word set changes (e.g. language switch).
  // useMemo gives a stable identity so the effect below doesn't re-trigger every render.
  const wordsKey = useMemo(() => words.join("|"), [words]);
  useEffect(() => {
    dispatch({ type: "reset" });
  }, [wordsKey]);

  useEffect(() => {
    if (reduceMotion) return;
    const finishedTyping = !state.del && state.chars === word.length;
    const delay = finishedTyping ? 2200 : state.del ? 45 : 90;
    const t = setTimeout(() => {
      dispatch({ type: "tick", wordsLen: words.length, wordLen: word.length });
    }, delay);
    return () => clearTimeout(t);
  }, [state.chars, state.del, word, words.length, reduceMotion]);

  if (reduceMotion) {
    return <span className="hero__accent">{words[0]}</span>;
  }

  return (
    <span className="hero__accent typewriter">
      {word.slice(0, state.chars)}
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
