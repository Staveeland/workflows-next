"use client";

import "@/styles/verksted/eierskap.css";
import Image from "next/image";
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
  const stampsRef = useRef<HTMLDivElement>(null);
  const stampsInView = useInView(stampsRef, { once: true, amount: 0.5 });

  // The panel settles in: 0.96→1 / 32px→0 as it enters the viewport.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.9", "start 0.3"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });
  const scale = useTransform(progress, [0, 1], [0.96, 1]);
  const y = useTransform(progress, [0, 1], [32, 0]);

  // Poster law: SSR / no-JS / reduced motion = panel full size, chips landed.
  const scrub = mounted && !reduced;
  // "pre" (hidden) exists only after mount with motion allowed, so the rise
  // plays from hidden instead of blinking out already-visible chips.
  const slam = scrub ? (stampsInView ? "in" : "pre") : undefined;

  return (
    <section ref={sectionRef} className="vk-eie vk-s" aria-labelledby="vk-eie-heading">
      <motion.div className="vk-eie-panelwrap" style={scrub ? { scale, y } : undefined}>
        <div className="vk-paper vk-eie-panel">
          <div className="vk-eie-head">
            <p className="vk-kicker vk-eie-kicker">{t.eierskap.kicker}</p>
            <h2 id="vk-eie-heading" className="vk-display vk-eie-heading">
              {t.eierskap.heading}
              {/* hand-drawn amber underline, drawn in as the chips land */}
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
                    scrub ? { pathLength: stampsInView ? 1 : 0 } : undefined
                  }
                  transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                />
              </svg>
            </h2>
            <p className="vk-eie-body">{t.eierskap.body}</p>
          </div>

          <div className="vk-eie-mid">
            <div ref={stampsRef} className="vk-eie-stamps">
              {t.eierskap.stamps.map((stamp) => (
                <span key={stamp} className="vk-stamp vk-eie-stamp" data-slam={slam}>
                  {stamp}
                </span>
              ))}
            </div>
            {/* Tipped-in plate: the dark spot illustration pinned to the
                panel — cream photo border + chalk tape (poster-static). */}
            <div className="vk-eie-plate vk-rot-c">
              <Image
                className="vk-ill vk-eie-plate-img"
                src="/verksted/eierskap-spot.webp"
                alt={t.eierskap.alt}
                width={1024}
                height={1024}
                sizes="(max-width: 767px) 60vw, 384px"
              />
            </div>
          </div>

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
