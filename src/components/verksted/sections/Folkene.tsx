"use client";

import "@/styles/verksted/folkene.css";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionProps,
} from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEW = { once: true, amount: 0.25 } as const;

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

// Fine-pointer probe (external store): false on server, tracks the MQ live.
const FINE_MQ = "(hover: hover) and (pointer: fine)";
const subscribeFine = (cb: () => void) => {
  const mq = window.matchMedia(FINE_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useFinePointer = () =>
  useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia(FINE_MQ).matches,
    () => false,
  );

// Poster law: when `anim` is false the element renders in its natural,
// fully-composed CSS state (initial: false = no hidden first frame).
// framer-motion reads `initial` only on mount, so every consumer ALSO keys
// its element on `anim` (the Manifest pattern) — the flip after hydration
// remounts the element and the hidden start state actually applies.
const rise = (anim: boolean, delay = 0): MotionProps =>
  anim
    ? {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEW,
        transition: { duration: 0.6, ease: EASE, delay },
      }
    : { initial: false };

const stampIn = (anim: boolean, delay = 0): MotionProps =>
  anim
    ? {
        initial: { opacity: 0, scale: 1.18, rotate: -4 },
        whileInView: { opacity: 1, scale: 1, rotate: -1 },
        viewport: VIEW,
        transition: { type: "spring", stiffness: 320, damping: 24, delay },
      }
    : { initial: false };

// Wind prose per language — /api/wind returns numbers only usable cross-lang;
// not provided by verkstedContent, implemented locally (contract §0.4).
const WIND_DIRS = {
  no: ["nord", "nordøst", "øst", "sørøst", "sør", "sørvest", "vest", "nordvest"],
  en: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
} as const;

function windText(lang: keyof typeof WIND_DIRS, speed: number, direction: number): string {
  const dir = WIND_DIRS[lang][Math.round((((direction % 360) + 360) % 360) / 45) % 8];
  return lang === "en"
    ? `${Math.round(speed)} m/s from the ${dir}`
    : `${Math.round(speed)} m/s fra ${dir}`;
}

async function fetchWind(lang: keyof typeof WIND_DIRS): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("/api/wind", { signal: ctrl.signal });
    window.clearTimeout(timer);
    if (res.status !== 200) return null; // 204 = wind unavailable, fail silent
    const data: unknown = await res.json();
    const d = data as { speed?: unknown; direction?: unknown } | null;
    if (typeof d?.speed === "number" && typeof d?.direction === "number") {
      return windText(lang, d.speed, d.direction);
    }
    return null;
  } catch {
    return null;
  }
}

function buildTooltip(template: string, wind: string | null): string {
  if (wind) return template.replace("{wind}", wind);
  // No wind data: drop the entire final sentence containing {wind} —
  // the first sentence stands alone.
  const at = template.indexOf("{wind}");
  if (at === -1) return template;
  const head = template.slice(0, at);
  const stop = Math.max(
    head.lastIndexOf("."),
    head.lastIndexOf("!"),
    head.lastIndexOf("?"),
  );
  return stop === -1 ? "" : template.slice(0, stop + 1).trim();
}

export function Folkene() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  const anim = mounted && !reduced;
  const headingId = useId();
  const tipId = useId();

  // Parallax-light: the harbor drifts a few px against the scroll.
  // Fine pointers only; reduced motion and touch stay static.
  const stageRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [24, -24]);
  const fine = useFinePointer();
  const parallax = anim && fine;

  const [glow, setGlow] = useState(0); // 0 = off; >0 keys the flare instance
  const [tip, setTip] = useState<string | null>(null);
  const pressTimer = useRef(0);
  const glowTimer = useRef(0);
  const glowDelay = useRef(0);
  const glowSeq = useRef(0);
  const cachedTip = useRef<{ lang: string; text: string } | null>(null);
  const fetching = useRef(false);

  const template = t.eggs.coordsTooltipTemplate;

  const fireGlow = useCallback(() => {
    if (reduced) return;
    window.clearTimeout(glowTimer.current);
    window.clearTimeout(glowDelay.current);
    // async so callers inside effects stay pure; fresh key replays the flare
    glowDelay.current = window.setTimeout(() => {
      setGlow(++glowSeq.current);
      glowTimer.current = window.setTimeout(() => setGlow(0), 1900);
    }, 30);
  }, [reduced]);

  // The flare plays on every approach: fresh load, refresh mid-page, and
  // each scroll back to the harbor (deliberately NOT once-per-session).
  const stageInView = useInView(stageRef, { amount: 0.35 });
  useEffect(() => {
    if (stageInView) fireGlow();
  }, [stageInView, fireGlow]);

  const trigger = useCallback(() => {
    fireGlow();
    const cached = cachedTip.current;
    if (cached && cached.lang === lang) {
      if (cached.text) setTip(cached.text);
      return;
    }
    if (fetching.current) return;
    fetching.current = true;
    void fetchWind(lang).then((wind) => {
      fetching.current = false;
      const text = buildTooltip(template, wind);
      cachedTip.current = { lang, text };
      if (text) setTip(text);
    });
  }, [fireGlow, template, lang]);

  // Long-press (coarse pointers): 500ms hold on the coordinates line.
  const startPress = () => {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(trigger, 500);
  };
  const cancelPress = () => window.clearTimeout(pressTimer.current);

  useEffect(
    () => () => {
      window.clearTimeout(pressTimer.current);
      window.clearTimeout(glowTimer.current);
      window.clearTimeout(glowDelay.current);
    },
    [],
  );

  // WCAG 1.4.13: tooltip is dismissible (Esc) and self-expires.
  useEffect(() => {
    if (!tip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTip(null);
    };
    window.addEventListener("keydown", onKey);
    const hide = window.setTimeout(() => setTip(null), 9000);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(hide);
    };
  }, [tip]);

  return (
    <section id="folkene" className="vk-s vk-folk" aria-labelledby={headingId}>
      <div className="vk-wrap">
        <header className="vk-folk-head">
          <motion.p
            key={`kicker-${anim}`}
            className="vk-kicker vk-folk-kicker"
            {...rise(anim, 0)}
          >
            {t.folkene.kicker}
          </motion.p>
          <motion.h2
            key={`h2-${anim}`}
            id={headingId}
            className="vk-display vk-folk-h2"
            {...rise(anim, 0.07)}
          >
            {t.folkene.heading}
          </motion.h2>
        </header>

        {/* ── Centerpiece: the harbor at night. The heading hangs into its
              sky; the name story sits at its waterline as a caption plate. ── */}
        <figure className="vk-folk-stage" ref={stageRef}>
          <motion.div
            className="vk-folk-ill"
            style={parallax ? { y: parallaxY } : undefined}
          >
            <Image
              src="/verksted/folkene.webp"
              alt={t.folkene.alt}
              width={1536}
              height={1024}
              sizes="(max-width: 1147px) 100vw, 1100px"
              className="vk-ill vk-ill--feather"
            />

            {/* Easter egg: the painted lighthouse flares on every approach —
                keyed on the sequence so each pass replays the glow. Rendered
                only during the flare; the glow itself is reduced-motion-gated.
                Lives inside the parallax wrapper so it tracks the artwork. */}
            {glow !== 0 && <div key={glow} className="vk-folk-lys" aria-hidden="true" />}
          </motion.div>

          <motion.figcaption
            key={`caption-${anim}`}
            className="vk-folk-caption"
            {...rise(anim, 0.12)}
          >
            <p className="vk-folk-namestory">{t.folkene.nameStory}</p>
            <span className="vk-folk-coordswrap">
              <button
                type="button"
                className="vk-folk-coords"
                onMouseEnter={trigger}
                onClick={trigger}
                onPointerDown={startPress}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                aria-describedby={tip ? tipId : undefined}
              >
                {t.folkene.coordinates}
              </button>
              {tip && (
                <span role="tooltip" id={tipId} className="vk-folk-tip">
                  {tip}
                </span>
              )}
            </span>
          </motion.figcaption>
        </figure>

        <div className="vk-folk-meta">
          <motion.p key={`body-${anim}`} className="vk-folk-body" {...rise(anim, 0)}>
            {t.folkene.body}
          </motion.p>

          <motion.div
            key={`person-${anim}`}
            className="vk-folk-person"
            {...stampIn(anim, 0.15)}
          >
            <div className="vk-folk-plate" aria-hidden="true">
              <span>{t.folkene.person.initials}</span>
            </div>
            <p className="vk-folk-person-meta">
              <span className="vk-folk-person-name">{t.folkene.person.name}</span>
              <span className="vk-folk-person-role">{t.folkene.person.role}</span>
            </p>
          </motion.div>
        </div>

        <ul className="vk-folk-values">
          {t.folkene.values.map(([title, body], i) => (
            <motion.li
              key={`${title}-${anim}`}
              className="vk-folk-value"
              {...rise(anim, 0.06 + i * 0.13)}
            >
              <span className="vk-folk-value-idx" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="vk-folk-value-title">
                <span className="vk-folk-bracket" aria-hidden="true">
                  [&nbsp;
                </span>
                {title}
                <span className="vk-folk-bracket" aria-hidden="true">
                  &nbsp;]
                </span>
              </h3>
              <p className="vk-folk-value-body">{body}</p>
            </motion.li>
          ))}
        </ul>

        <motion.figure key={`pull-${anim}`} className="vk-folk-pull" {...rise(anim, 0.05)}>
          <span className="vk-folk-pull-dash" aria-hidden="true">
            —
          </span>
          <p className="vk-folk-oslo">{t.folkene.osloLine}</p>
        </motion.figure>
      </div>

      <div className="vk-grain vk-grain--heavy vk-folk-grain" aria-hidden="true" />
    </section>
  );
}
