"use client";

import "@/styles/verksted/kolofon.css";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";

// Contact data — invariant in both languages, sanctioned by contract §6 (kontakt row).
const EMAIL = "petter@workflows.no";
const PHONE_TEL = "+4793077915";
const PHONE_DISPLAY = "+47 930 77 915";

// Honest counter: real measured average across client systems (brief §6 kolofon).
const TASKS_PER_SECOND = 0.125;

/**
 * Time-on-page counter — the copy says «mens du leste denne siden», so the
 * number is computed from seconds since page load (performance.now), not
 * seconds at the footer. The interval only runs while the footer is in view
 * AND the page is visible (IO keeps observing both ways), so nothing ticks
 * or re-renders offscreen. Reduced motion updates every 8s instead of 1s.
 */
function useHonestCounter(ref: React.RefObject<HTMLElement | null>, reduced: boolean) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof IntersectionObserver === "undefined") return;
    const step = reduced ? 8 : 1;
    let interval = 0;
    let inView = false;

    const tick = () =>
      setN(Math.round((performance.now() / 1000) * TASKS_PER_SECOND));
    const sync = () => {
      if (inView && !document.hidden) {
        if (interval === 0) {
          tick(); // honest number the moment the footer appears
          interval = window.setInterval(tick, step * 1000);
        }
      } else if (interval !== 0) {
        window.clearInterval(interval);
        interval = 0;
      }
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    return () => {
      if (interval !== 0) window.clearInterval(interval);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, reduced]);

  return n;
}

/** Renders the llms line with /llms.txt as a real link. */
function LlmsLine({ text }: { text: string }) {
  const token = "/llms.txt";
  const i = text.indexOf(token);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <a className="vk-kol-llmslink" href={token}>
        {token}
      </a>
      {text.slice(i + token.length)}
    </>
  );
}

/**
 * Tråden's loose end — trails off the bottom edge below the columns.
 * Two overlapping paths (halo + 2px core) stroked with a gradient that fades
 * to transparent; the tail frays into two thin strands. Sway is pure CSS.
 */
function ThreadLooseEnd() {
  return (
    <div className="vk-kol-fraywrap" aria-hidden="true">
      <svg
        className="vk-kol-thread"
        viewBox="0 0 120 150"
        width="120"
        height="150"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="vk-kol-fade"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="0"
            x2="60"
            y2="148"
          >
            <stop offset="0" stopColor="var(--glod)" stopOpacity="0" />
            <stop offset="0.12" stopColor="var(--glod)" stopOpacity="1" />
            <stop offset="0.6" stopColor="var(--glod)" stopOpacity="0.9" />
            <stop offset="0.97" stopColor="var(--glod)" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="vk-kol-fade-halo"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="0"
            x2="60"
            y2="148"
          >
            <stop offset="0.05" stopColor="var(--glod-halo)" stopOpacity="0" />
            <stop offset="0.2" stopColor="var(--glod-halo)" stopOpacity="0.35" />
            <stop offset="0.88" stopColor="var(--glod-halo)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="vk-kol-thread-halo"
          d="M 60 0 C 57 26, 65 44, 61 66 C 58 82, 65 96, 61 112"
          stroke="url(#vk-kol-fade-halo)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 60 0 C 57 26, 65 44, 61 66 C 58 82, 65 96, 61 112"
          stroke="url(#vk-kol-fade)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          className="vk-kol-strand vk-kol-strand--a"
          d="M 61 100 C 55 114, 49 124, 46 138"
          stroke="url(#vk-kol-fade)"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          className="vk-kol-strand vk-kol-strand--b"
          d="M 61 102 C 66 116, 71 126, 74 140"
          stroke="url(#vk-kol-fade)"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

export function Kolofon() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const k = t.kolofon;
  const reduced = useReducedMotion() === true;
  const footerRef = useRef<HTMLElement>(null);
  const n = useHonestCounter(footerRef, reduced);
  const year = new Date().getFullYear();
  const counterParts = k.counterTemplate.split("{n}");

  return (
    <footer ref={footerRef} className="vk-kol">
      <div className="vk-wrap vk-kol-inner">
        <div className="vk-kol-grid">
          <nav className="vk-kol-col" aria-labelledby="vk-kol-h-tjenester">
            <p id="vk-kol-h-tjenester" className="vk-kol-colhead">
              {k.colTjenester}
            </p>
            <ul className="vk-kol-list">
              <li>
                <a className="vk-kol-link" href="/chatboter">
                  {k.links.chatboter}
                </a>
              </li>
              <li>
                <a className="vk-kol-link" href="/automatiserte-flyter">
                  {k.links.flyter}
                </a>
              </li>
              <li>
                <a className="vk-kol-link" href="/ai-agenter">
                  {k.links.agenter}
                </a>
              </li>
            </ul>
          </nav>

          <nav className="vk-kol-col" aria-labelledby="vk-kol-h-selskap">
            <p id="vk-kol-h-selskap" className="vk-kol-colhead">
              {k.colSelskap}
            </p>
            <ul className="vk-kol-list">
              <li>
                <a className="vk-kol-link" href="/kunder">
                  {k.links.kunder}
                </a>
              </li>
              <li>
                {/* Legacy anchor target: external links to /#faq land here. */}
                <div id="faq" className="vk-kol-faq">
                  <a className="vk-kol-link" href="/faq">
                    {k.links.faq}
                  </a>
                  <span className="vk-kol-faq-note">{k.faqLabel}</span>
                </div>
              </li>
              <li>
                <a className="vk-kol-link" href="/mystyler">
                  {k.links.mystyler}
                </a>
              </li>
              <li>
                <a className="vk-kol-link" href="/ai-haugesund">
                  {k.links.aiHaugesund}
                </a>
              </li>
            </ul>
          </nav>

          <div className="vk-kol-col">
            <p className="vk-kol-colhead">{k.colKontakt}</p>
            <ul className="vk-kol-list">
              <li>
                <a className="vk-kol-link" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </li>
              <li>
                <a className="vk-kol-link" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
              </li>
            </ul>
            <p className="vk-kol-based">{k.based}</p>
          </div>
        </div>

        <div className="vk-kol-sig">
          <p className="vk-kol-signature">{k.signature}</p>
          <div className="vk-kol-sigside">
            <p className="vk-kol-llms">
              <LlmsLine text={k.llmsLine} />
            </p>
            <p className="vk-kol-cosign">
              <span className="vk-kol-dot" aria-hidden="true" />
              {k.chatCosign}
            </p>
          </div>
        </div>

        <div className="vk-kol-meta">
          {/* Decorative counter (contract §5): hidden from AT, footnote keeps it
              honest. Renders only once n >= 1 — «ca. 0 oppgaver» reads broken. */}
          {n >= 1 && (
            <div className="vk-kol-counter" aria-hidden="true">
              <p className="vk-kol-counter-line">
                {counterParts[0]}
                {counterParts.length > 1 && (
                  <>
                    <span className="vk-kol-counter-n">{n}</span>
                    {counterParts.slice(1).join("{n}")}
                  </>
                )}
              </p>
              <p className="vk-kol-counter-foot">{k.counterFootnote}</p>
            </div>
          )}
          <p className="vk-kol-copy">© {year} Workflows AS</p>
        </div>
      </div>

      <ThreadLooseEnd />
    </footer>
  );
}
