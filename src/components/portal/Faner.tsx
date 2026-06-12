"use client";

import type { KeyboardEvent, ReactNode } from "react";

/**
 * Faner — the ONE tab primitive for both portal surfaces (Benken's
 * project room and verkstedkontorets detail view).
 *
 * A11y contract (WAI-ARIA tabs pattern):
 *   - role=tablist / tab / tabpanel, aria-selected, aria-controls,
 *     aria-labelledby all wired through the shared id helpers.
 *   - Roving tabindex: ONE tab stop in the strip; ArrowLeft/Right move
 *     AND activate (panels render instantly from in-memory state, so
 *     automatic activation has no latency cost); Home/End jump.
 *   - Panels stay MOUNTED and hide via the `hidden` attribute — state,
 *     realtime channels and IntersectionObservers inside them survive
 *     tab switches (display:none elements simply never intersect).
 *   - Panels carry tabIndex=0 so text-only panels are keyboard
 *     scrollable/readable straight from the tab strip.
 *
 * Badges are aria-hidden; the meaning travels in a vk-sr suffix.
 */

export interface FaneDef {
  id: string;
  label: string;
  /** Count badge (renders when > 0) — or a plain attention dot. */
  badge?: number | "dot";
  /** «varsel» rims the badge (e.g. overdue invoice) — still decorative. */
  badgeTone?: "varsel";
  /** Screen-reader text naming what the badge means («3 uleste»). */
  badgeSr?: string;
}

export function faneTabId(idPrefix: string, id: string): string {
  return `${idPrefix}-fane-${id}`;
}

export function fanePanelId(idPrefix: string, id: string): string {
  return `${idPrefix}-panel-${id}`;
}

interface FanerProps {
  faner: FaneDef[];
  /** Id of the active tab — MUST exist in `faner`. */
  aktiv: string;
  /** Accessible name for the tablist. */
  label: string;
  /** Unique per surface — builds the tab/panel id pairs. */
  idPrefix: string;
  className?: string;
  onVelg: (id: string) => void;
}

export default function Faner({
  faner,
  aktiv,
  label,
  idPrefix,
  className,
  onVelg,
}: FanerProps) {
  // Automatic activation: focus follows selection, so the active index
  // is also the focused index whenever keyboard lands here.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (faner.length === 0) return;
    const idx = Math.max(
      0,
      faner.findIndex((f) => f.id === aktiv)
    );
    let neste = -1;
    if (e.key === "ArrowRight") neste = (idx + 1) % faner.length;
    else if (e.key === "ArrowLeft") neste = (idx - 1 + faner.length) % faner.length;
    else if (e.key === "Home") neste = 0;
    else if (e.key === "End") neste = faner.length - 1;
    if (neste === -1) return;
    e.preventDefault();
    const id = faner[neste].id;
    onVelg(id);
    document.getElementById(faneTabId(idPrefix, id))?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`vk-faner${className ? ` ${className}` : ""}`}
      onKeyDown={onKeyDown}
    >
      {faner.map((f) => {
        const valgt = f.id === aktiv;
        const visBadge =
          typeof f.badge === "number" ? f.badge > 0 : f.badge === "dot";
        return (
          <button
            key={f.id}
            id={faneTabId(idPrefix, f.id)}
            type="button"
            role="tab"
            aria-selected={valgt}
            aria-controls={fanePanelId(idPrefix, f.id)}
            tabIndex={valgt ? 0 : -1}
            className="vk-mono vk-fane"
            onClick={() => onVelg(f.id)}
          >
            {f.label}
            {visBadge ? (
              typeof f.badge === "number" ? (
                <span
                  className="vk-fane-badge"
                  data-tone={f.badgeTone}
                  aria-hidden="true"
                >
                  {f.badge > 9 ? "9+" : f.badge}
                </span>
              ) : (
                <span
                  className="vk-fane-badge vk-fane-badge--dot"
                  data-tone={f.badgeTone}
                  aria-hidden="true"
                />
              )
            ) : null}
            {visBadge && f.badgeSr ? (
              <span className="vk-sr">{f.badgeSr}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface FanePanelProps {
  idPrefix: string;
  id: string;
  aktiv: string;
  className?: string;
  children: ReactNode;
}

/**
 * One tabpanel — mounted always, hidden when inactive. `hidden` (plus
 * the .vk-fane-panel[hidden] CSS guard) removes it from layout AND the
 * accessibility tree without unmounting React state.
 */
export function FanePanel({ idPrefix, id, aktiv, className, children }: FanePanelProps) {
  return (
    <div
      role="tabpanel"
      id={fanePanelId(idPrefix, id)}
      aria-labelledby={faneTabId(idPrefix, id)}
      tabIndex={0}
      hidden={aktiv !== id}
      className={`vk-fane-panel${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
