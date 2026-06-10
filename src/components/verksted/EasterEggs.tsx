"use client";

import "@/styles/verksted/eggs.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";

/* ════════════════════════════════════════════════════════════════════
   Easter eggs (contract §6 «eggs»): console art, «kaffe» toast, Konami
   nattskift, status-dot wonk. ONE window keydown listener + one delegated
   click listener; zero cost when idle (no rAF, no scroll listeners).
   Overlays (incl. the nattskift dim) portal to <body> — no filter ever
   lands on .vk, which would re-parent its fixed nav/grain children.
   ════════════════════════════════════════════════════════════════════ */

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
] as const;

const CONSOLE_STYLE =
  "font-family:monospace;color:#FFB454;background:#171310;padding:8px 12px;line-height:1.4";

// Portals live outside .vk — re-apply the next/font variable classes.
const FONT_VARS = `${fraunces.variable} ${schibsted.variable} ${spline.variable}`;

function CoffeeCup() {
  return (
    <svg
      className="vk-egg-cup"
      viewBox="0 0 44 48"
      width="40"
      height="44"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="var(--kritt)" strokeWidth="1.6" strokeLinecap="round">
        <path className="vk-egg-steam" d="M12 16 C 10.5 13 13.5 11 12 8 C 10.8 5.8 13 4 12 2" />
        <path className="vk-egg-steam" d="M19 16 C 17.5 13 20.5 11 19 8 C 17.8 5.8 20 4 19 2" />
        <path className="vk-egg-steam" d="M26 16 C 24.5 13 27.5 11 26 8 C 24.8 5.8 27 4 26 2" />
      </g>
      <g fill="none" stroke="var(--stov)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 21 H 32 V 31 a 8 8 0 0 1 -8 8 H 14 a 8 8 0 0 1 -8 -8 Z" />
        <path d="M32 24 h 3.5 a 4.5 4.5 0 0 1 0 9 H 32" />
        <path d="M5 44 h 30" />
      </g>
    </svg>
  );
}

export function EasterEggs() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedMotion() === true;

  const [toastOpen, setToastOpen] = useState(false);
  const [natt, setNatt] = useState<{ path: string } | null>(null);
  const [nattStamp, setNattStamp] = useState(false);
  const [wonkCap, setWonkCap] = useState<{ x: number; y: number; leaving: boolean } | null>(null);

  // Latest values for the stable (empty-deps) listeners.
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const tRef = useRef(t);
  tRef.current = t;

  // (1) Console egg — once per session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("vk-console")) return;
      sessionStorage.setItem("vk-console", "1");
    } catch {
      // sessionStorage unavailable (private mode) — still log once per mount
    }
    console.log("%c" + tRef.current.eggs.consoleArt, CONSOLE_STYLE);
  }, []);

  useEffect(() => {
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id: number) => {
      window.clearTimeout(id);
      timers.delete(id);
    };

    const vkRoot = () => document.querySelector<HTMLElement>(".vk");

    let buf = "";
    let kIdx = 0;
    let toastTimer = 0;
    let nattActive = false;
    let wonkActive = false;
    let clicks: number[] = [];

    // (2) «kaffe» toast — dismissed by Esc / click / 6s.
    const openToast = () => {
      if (toastTimer) cancel(toastTimer);
      setToastOpen(true);
      toastTimer = later(() => setToastOpen(false), 6000);
    };

    // (3) Konami «nattskiftet» — ~9s, skipped entirely under reduced motion.
    // The 10% dim is a portaled overlay, NOT a filter on .vk: a filter would
    // become the containing block for the fixed nav/grain and re-parent them.
    const runNattskift = () => {
      if (nattActive || reducedRef.current) return;
      nattActive = true;
      // path() takes px only — bake the viewport into a gentle S at trigger time
      const w = window.innerWidth;
      const h = window.innerHeight;
      const r = Math.round;
      const path =
        `M ${r(w * 0.38)} -12 ` +
        `C ${r(w * 0.74)} ${r(h * 0.2)} ${r(w * 0.1)} ${r(h * 0.45)} ${r(w * 0.46)} ${r(h * 0.64)} ` +
        `C ${r(w * 0.72)} ${r(h * 0.74)} ${r(w * 0.5)} ${r(h * 0.79)} ${r(w * 0.5)} ${r(h * 0.86)}`;
      setNatt({ path });
      later(() => setNattStamp(true), 6000);
      later(() => {
        setNatt(null);
        setNattStamp(false);
        nattActive = false;
      }, 9200);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (toastTimer) {
          cancel(toastTimer);
          toastTimer = 0;
        }
        setToastOpen(false);
        return;
      }
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
      ) {
        return;
      }

      const expect = KONAMI[kIdx];
      if (e.key === expect || e.key.toLowerCase() === expect) {
        kIdx += 1;
        if (kIdx === KONAMI.length) {
          kIdx = 0;
          runNattskift();
        }
      } else {
        kIdx = e.key === KONAMI[0] ? 1 : 0;
      }

      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        buf = (buf + e.key.toLowerCase()).slice(-5);
        if (buf === "kaffe") {
          buf = "";
          openToast();
        }
      }
    };

    // (4) Wonk — 3 clicks on the nav status dot within 1.2s.
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const dot = target?.closest?.("[data-vk-statusdot]");
      if (!dot) return;
      const now = performance.now();
      clicks = [...clicks.filter((ts) => now - ts <= 1200), now];
      if (clicks.length < 3) return;
      clicks = [];
      if (wonkActive) return;
      const root = vkRoot();
      if (!root) return;
      wonkActive = true;
      root.classList.add("vk-wonk");
      const rect = (dot as HTMLElement).getBoundingClientRect();
      const x = Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150);
      setWonkCap({ x, y: rect.bottom + 12, leaving: false });
      later(() => setWonkCap((c) => (c ? { ...c, leaving: true } : c)), 2400);
      later(() => setWonkCap(null), 3000);
      later(() => {
        root.classList.remove("vk-wonk");
        wonkActive = false;
      }, 10000);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
      timers.forEach((id) => window.clearTimeout(id));
      document.querySelector(".vk")?.classList.remove("vk-wonk");
    };
  }, []);

  return (
    <>
      {toastOpen &&
        createPortal(
          <div className={`vk-egg-layer ${FONT_VARS}`}>
            {/* role="status" = polite live region; click anywhere on it dismisses */}
            <div className="vk-egg-toast" role="status" onClick={() => setToastOpen(false)}>
              <CoffeeCup />
              <div className="vk-egg-toast-body">
                <p className="vk-egg-toast-text">{t.eggs.kaffeToast}</p>
                <a className="vk-egg-toast-link" href="#kontakt">
                  {t.kontakt.cta}
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {natt &&
        createPortal(
          <div className={`vk-egg-layer ${FONT_VARS}`} aria-hidden="true">
            <i className="vk-egg-natt-dim" />
            <i className="vk-egg-natt-dot" style={{ offsetPath: `path("${natt.path}")` }} />
            <i className="vk-egg-natt-ghost" style={{ offsetPath: `path("${natt.path}")` }} />
            <i className="vk-egg-natt-ghost" style={{ offsetPath: `path("${natt.path}")` }} />
            <i className="vk-egg-natt-ghost" style={{ offsetPath: `path("${natt.path}")` }} />
            {nattStamp && (
              <span className="vk-egg-natt-stampwrap">
                <span className="vk-stamp vk-egg-natt-stamp">{t.eggs.konamiStamp}</span>
              </span>
            )}
          </div>,
          document.body,
        )}

      {wonkCap &&
        createPortal(
          <div className={`vk-egg-layer ${FONT_VARS}`} aria-hidden="true">
            <span
              className={`vk-egg-wonk-cap${wonkCap.leaving ? " vk-egg-wonk-cap--out" : ""}`}
              style={{ left: wonkCap.x, top: wonkCap.y }}
            >
              {t.eggs.wonkCaption}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
