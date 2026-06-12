"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";

/**
 * «Lysbordet» — the shared in-app lightbox for raster previews on Benken,
 * used by BOTH feeds (the customer room and verkstedkontoret). One image
 * per opening: a full-viewport dialog with the image at contain-size, the
 * filename, and a «Last ned»-link carrying the SAME signed download URL
 * the feed already holds.
 *
 * Security posture: only files the server flagged bilde=true (raster
 * extensions, never SVG) ever reach this component — browsers never
 * execute script inside <img>, and SVG/HTML/PDF stay download-only (the
 * established XSS wall).
 *
 * A11y: role=dialog aria-modal, focus lands on the 44px close button on
 * open and returns to the opener on close, Tab is trapped inside, Esc and
 * a click outside the frame both close. Poster law: no animation — the
 * open dialog IS the composed state.
 */

export interface LysbordBilde {
  navn: string;
  /** The signed download URL — doubles as src and the download link. */
  url: string;
}

export default function Lysbord({
  bilde,
  onClose,
}: {
  bilde: LysbordBilde;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const dialogRef = useRef<HTMLDivElement>(null);
  const lukkRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Focus the close button on open; hand focus back to the opener (the
  // thumbnail) on close — never drop SR users on <body>.
  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    lukkRef.current?.focus();
    return () => {
      openerRef.current?.focus();
    };
  }, []);

  // Lock the page scroll behind the dialog (the nav-overlay pattern).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc closes + Tab focus-trap — pattern carried from NavVerksted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="vk-lys"
      onClick={(e) => {
        // A click OUTSIDE the frame closes; clicks on the content don't.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="vk-lys-ramme"
        role="dialog"
        aria-modal="true"
        aria-label={bilde.navn}
      >
        <button
          ref={lukkRef}
          type="button"
          className="vk-lys-lukk"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
          <span className="vk-sr">{t.benken.lysLukk}</span>
        </button>
        {/* Signed, short-lived URL — next/image's optimizer has no business
            proxying it (same call as the forslag mockup). The filename is
            the only truth we have — it IS the alt text. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="vk-lys-bilde" src={bilde.url} alt={bilde.navn} />
        <div className="vk-lys-meta">
          <span className="vk-mono vk-lys-navn">{bilde.navn}</span>
          <a
            className="vk-mono vk-lys-lastned"
            href={bilde.url}
            aria-label={t.benken.lastNedTemplate.replace("{navn}", bilde.navn)}
          >
            <span aria-hidden="true">↓ </span>
            {t.benken.lysLastNed}
          </a>
        </div>
      </div>
    </div>
  );
}
