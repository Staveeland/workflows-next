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
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";

const EGG_KEY = "vk-egg-coords";
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

/* Single-stroke, hand-drawn Karmsundet: two roughly-parallel wobbly
   coastlines (Karmøy west, mainland east), the old sailing lane as
   dashes, and Haugesund as the one lit dot. */
const COAST_WEST =
  "M 63 14 C 55 36, 69 58, 60 82 C 52 104, 66 124, 58 146 C 49 170, 64 190, 56 214 C 49 236, 62 260, 52 288";
const COAST_EAST =
  "M 126 8 C 133 26, 120 44, 129 60 C 122 68, 121 76, 131 82 C 139 102, 125 126, 134 148 C 142 172, 128 194, 137 218 C 145 242, 131 264, 140 292";
const ROUTE =
  "M 96 12 C 91 62, 101 112, 94 164 C 89 210, 100 254, 93 290";

function KarmsundetMap({ anim }: { anim: boolean }) {
  const draw = (delay: number): MotionProps =>
    anim
      ? {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, amount: 0.5 },
          transition: { duration: 1.2, ease: EASE, delay },
        }
      : { initial: false };
  const fade = (delay: number, to: number): MotionProps =>
    anim
      ? {
          initial: { opacity: 0 },
          whileInView: { opacity: to },
          viewport: { once: true, amount: 0.5 },
          transition: { duration: 0.5, ease: EASE, delay },
        }
      : { initial: false };

  return (
    <svg
      className="vk-folk-map-svg"
      viewBox="0 0 200 300"
      aria-hidden="true"
      focusable="false"
    >
      {/* key on `anim` remounts so the draw/fade initial states apply */}
      <motion.path
        key={`west-${anim}`}
        className="vk-folk-coast"
        d={COAST_WEST}
        vectorEffect="non-scaling-stroke"
        {...draw(0)}
      />
      <motion.path
        key={`east-${anim}`}
        className="vk-folk-coast"
        d={COAST_EAST}
        vectorEffect="non-scaling-stroke"
        {...draw(0.15)}
      />
      <motion.path
        key={`route-${anim}`}
        className="vk-folk-route"
        d={ROUTE}
        vectorEffect="non-scaling-stroke"
        {...fade(0.95, 0.55)}
      />
      <motion.circle
        key={`halo-${anim}`}
        className="vk-folk-town-halo"
        cx={143}
        cy={62}
        r={10}
        vectorEffect="non-scaling-stroke"
        {...fade(1.05, 0.35)}
      />
      <motion.circle
        key={`town-${anim}`}
        className="vk-folk-town"
        cx={143}
        cy={62}
        r={4.5}
        {...fade(1.05, 1)}
      />
    </svg>
  );
}

export function Folkene() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  const anim = mounted && !reduced;
  const headingId = useId();
  const tipId = useId();

  const [beamOn, setBeamOn] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const fired = useRef(false);
  const pressTimer = useRef(0);
  const beamTimer = useRef(0);

  const template = t.eggs.coordsTooltipTemplate;

  const trigger = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    try {
      if (window.sessionStorage.getItem(EGG_KEY)) return; // once per session
      window.sessionStorage.setItem(EGG_KEY, "1");
    } catch {
      // storage unavailable — still fire once per mount
    }
    if (!reduced) {
      setBeamOn(true);
      beamTimer.current = window.setTimeout(() => setBeamOn(false), 1900);
    }
    void fetchWind(lang).then((wind) => {
      const text = buildTooltip(template, wind);
      if (text) setTip(text);
    });
  }, [reduced, template, lang]);

  // Long-press (coarse pointers): 500ms hold on the coordinates line.
  const startPress = () => {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(trigger, 500);
  };
  const cancelPress = () => window.clearTimeout(pressTimer.current);

  useEffect(
    () => () => {
      window.clearTimeout(pressTimer.current);
      window.clearTimeout(beamTimer.current);
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
          <div className="vk-folk-head-main">
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
            <motion.p key={`body-${anim}`} className="vk-folk-body" {...rise(anim, 0.16)}>
              {t.folkene.body}
            </motion.p>
          </div>

          <motion.div
            key={`person-${anim}`}
            className="vk-folk-person"
            {...stampIn(anim, 0.26)}
          >
            <div className="vk-folk-plate" aria-hidden="true">
              <span>{t.folkene.person.initials}</span>
            </div>
            <p className="vk-folk-person-meta">
              <span className="vk-folk-person-name">{t.folkene.person.name}</span>
              <span className="vk-folk-person-role">{t.folkene.person.role}</span>
            </p>
          </motion.div>
        </header>

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

        <div className="vk-folk-leia">
          <div className="vk-folk-map" aria-hidden="true">
            <KarmsundetMap anim={anim} />
          </div>

          <motion.div key={`leia-${anim}`} className="vk-folk-leia-text" {...rise(anim, 0.1)}>
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
          </motion.div>
        </div>
      </div>

      {beamOn && <div className="vk-folk-beam" aria-hidden="true" />}
      <div className="vk-grain vk-grain--heavy vk-folk-grain" aria-hidden="true" />
    </section>
  );
}
