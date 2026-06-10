"use client";

import "@/styles/verksted/eierskap.css";
import { useRef, useSyncExternalStore } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Eierskap() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();

  const sectionRef = useRef<HTMLElement>(null);
  const factsRef = useRef<HTMLOListElement>(null);
  const factsInView = useInView(factsRef, { once: true, amount: 0.35 });

  // The panel settles in: 0.96→1 / 32px→0 as it enters the viewport.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "start 0.3"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });
  const scale = useTransform(progress, [0, 1], [0.96, 1]);
  const y = useTransform(progress, [0, 1], [32, 0]);

  // Poster law: SSR / no-JS / reduced motion = panel full size, facts shown.
  const scrub = mounted && !reduced;
  const reveal = scrub ? (factsInView ? "in" : "pre") : undefined;

  return (
    <section ref={sectionRef} className="vk-eie vk-s" aria-labelledby="vk-eie-heading">
      <motion.div className="vk-eie-panelwrap" style={scrub ? { scale, y } : undefined}>
        <div className="vk-paper vk-eie-panel">
          <div className="vk-eie-head">
            <p className="vk-kicker vk-eie-kicker">{t.eierskap.kicker}</p>
            <h2 id="vk-eie-heading" className="vk-display vk-eie-heading">
              {t.eierskap.heading}
              {/* hand-drawn amber underline, drawn in as the facts land */}
              <svg
                className="vk-eie-underline"
                viewBox="0 0 320 14"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <motion.path
                  d="M 4 9 C 64 5, 158 4, 230 7 C 264 8.4, 296 9.6, 316 9"
                  fill="none"
                  initial={false}
                  animate={
                    scrub ? { pathLength: factsInView ? 1 : 0 } : undefined
                  }
                  transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                />
              </svg>
            </h2>
            <p className="vk-eie-body">{t.eierskap.body}</p>
          </div>

          <ol ref={factsRef} className="vk-eie-facts">
            {t.eierskap.facts.map((fact, i) => (
              <li
                key={fact.title}
                className="vk-eie-fact"
                data-reveal={reveal}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="vk-mono vk-eie-idx" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="vk-eie-fact-title">{fact.title}</h3>
                <p className="vk-eie-fact-body">{fact.body}</p>
              </li>
            ))}
          </ol>

          <div className="vk-eie-foot">
            <p className="vk-mono vk-eie-footnote">{t.eierskap.footnote}</p>
            <a className="vk-eie-link" href={t.eierskap.linkHref}>
              {t.eierskap.linkLabel}
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
