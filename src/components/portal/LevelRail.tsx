"use client";

import type { CSSProperties } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";

/**
 * The level rail — 1 KARTLEGGING → 5 SKJØTET, always visible at the top.
 * Same visual language as the prosess rail: hairline track, amber progress
 * line, stamp-plate stops. The current stop pulses amber (gated behind
 * prefers-reduced-motion in portal.css); future stops stay dim.
 *
 * Clickable BACKWARD only: a past stop becomes a real <button> when the
 * parent passes onBack and navigation to it means something. Forward stops
 * are never interactive.
 */
interface LevelRailProps {
  /** Current level, 1..5. */
  current: number;
  /** Called with the level number when a past stop is pressed. */
  onBack?: (n: number) => void;
  /** Generating: the rail is visible but nothing is pressable. */
  disabled?: boolean;
}

export default function LevelRail({ current, onBack, disabled = false }: LevelRailProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const progress = (current - 1) / (t.levels.length - 1);

  return (
    <nav className="vk-portal-rail" aria-label={t.a11y.railLabel}>
      <div className="vk-portal-track" aria-hidden="true">
        <div
          className="vk-portal-trackline"
          style={{ "--vk-rail-progress": progress } as CSSProperties}
        />
      </div>
      <ol className="vk-portal-rail-ol">
        {t.levels.map((lvl) => {
          const isCurrent = lvl.n === current;
          const done = lvl.n < current;
          const label = t.a11y.levelTemplate
            .replace("{n}", String(lvl.n))
            .replace("{navn}", lvl.navn);
          const clickable = done && !!onBack && !disabled;
          const inner = (
            <>
              <span className="vk-portal-stop-num" aria-hidden="true">
                {lvl.n}
              </span>
              <span className="vk-portal-stop-navn" aria-hidden="true">
                {lvl.navn}
              </span>
              <span className="vk-sr">
                {label}
                {isCurrent ? ` — ${t.a11y.duErHer}` : ""}
              </span>
            </>
          );
          return (
            <li key={lvl.n} className="vk-portal-rail-li">
              {clickable ? (
                <button
                  type="button"
                  className="vk-portal-stop vk-portal-stop--btn"
                  data-done="true"
                  onClick={() => onBack?.(lvl.n)}
                >
                  {inner}
                </button>
              ) : (
                <span
                  className="vk-portal-stop"
                  data-done={done ? "true" : undefined}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
