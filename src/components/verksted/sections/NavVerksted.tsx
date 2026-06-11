"use client";

import "@/styles/verksted/nav.css";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";
import { verkstedContent } from "@/lib/verkstedContent";
import { WorkflowsLogo } from "@/components/verksted/WorkflowsLogo";

// Not provided by verkstedContent — implemented locally per contract §0.4.
// Language-switch labels conventionally stay in their target language.
const LANG_GROUP_LABEL: Record<Lang, string> = { no: "Velg språk", en: "Choose language" };
const LANG_BTN_LABEL: Record<Lang, string> = { no: "Bytt til norsk", en: "Switch to English" };

// Hand-placed scatter for the UKE-stamp egg (clicks 2..6) — rotation only
// from the fixed token set, positions stay inside a 360px viewport.
const STAMP_POS = [
  { left: "6%", top: 62 },
  { left: "26%", top: 80 },
  { left: "13%", top: 68 },
  { left: "33%", top: 86 },
  { left: "21%", top: 72 },
] as const;
const STAMP_ROT = ["vk-rot-c", "vk-rot-a", "vk-rot-d", "vk-rot-b", "vk-rot-c"] as const;

interface MiniStamp {
  id: number;
  n: number;
}

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function NavVerksted({ variant = "home" }: { variant?: "home" | "page" }) {
  const { lang, setLang } = useLang();
  const t = verkstedContent[lang];
  const onHome = variant === "home";
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();

  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const [stamps, setStamps] = useState<MiniStamp[]>([]);
  const [finale, setFinale] = useState(0); // 0 = hidden; otherwise keyed instance

  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const clicks = useRef(0);
  const nextId = useRef(0);
  const idleReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setCondensed(y > 50));
  useEffect(() => {
    // Sync the condensed state when the page loads mid-scroll (anchor refresh).
    const raf = requestAnimationFrame(() => setCondensed(window.scrollY > 50));
    return () => cancelAnimationFrame(raf);
  }, []);
  // Reduced motion pins the bar fully drawn (poster law) — the binding stays
  // attached either way, so framer always syncs the inline style post-SSR.
  const progress = useTransform(scrollYProgress, (v) => (reduced ? 1 : v));

  const after = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
      if (idleReset.current) clearTimeout(idleReset.current);
      document.body.style.overflow = "";
    };
  }, []);

  const switchLang = (l: Lang) => {
    if (l === lang) return;
    const apply = () => setLang(l);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!reduced && typeof doc.startViewTransition === "function") {
      // Commit the React update inside the transition so the swap cross-fades.
      doc.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  };

  // Logo egg: 6 clicks = the six delivery weeks. Repeatable by design (no
  // session guard). Counter resets after 3.2s idle so stray clicks don't pool.
  // On sub-pages the logo is a plain home link — no egg, no preventDefault.
  const onLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onHome) return;
    e.preventDefault(); // on "/" the self-link is swallowed
    clicks.current += 1;
    const n = clicks.current;
    // A home-logo that does nothing on Enter is an a11y smell — the first
    // activation scrolls to top (the link's natural meaning on "/").
    if (n === 1) {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
    if (idleReset.current) clearTimeout(idleReset.current);
    idleReset.current = setTimeout(() => {
      clicks.current = 0;
    }, 3200);
    if (n >= 2) {
      const id = ++nextId.current;
      setStamps((s) => [...s, { id, n }]);
      after(2000, () => setStamps((s) => s.filter((x) => x.id !== id)));
    }
    if (n >= 6) {
      clicks.current = 0;
      const id = ++nextId.current;
      setFinale(id);
      after(3000, () => setFinale((f) => (f === id ? 0 : f)));
    }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    document.body.style.overflow = next ? "hidden" : "";
  };

  const closeOverlay = () => {
    setOpen(false);
    document.body.style.overflow = "";
  };

  // Esc closes (returns focus to the burger) + Tab focus-trap — pattern
  // carried over from src/components/Nav.tsx.
  useEffect(() => {
    if (!open) return;

    const getFocusable = (): HTMLElement[] => {
      const root = overlayRef.current;
      if (!root) return [];
      const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null,
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        document.body.style.overflow = "";
        requestAnimationFrame(() => burgerRef.current?.focus());
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const overlayHasFocus = overlayRef.current?.contains(active);
      // The burger stays part of the trap so Shift+Tab from the first overlay
      // item lands back on it instead of rolling out of the page.
      if (!overlayHasFocus && active !== burgerRef.current) {
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
  }, [open]);

  // Move focus into the overlay once it has mounted.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      overlayRef.current
        ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
        ?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [open]);

  // The overlay is mobile-only CSS — release the scroll lock if the viewport
  // grows past the breakpoint while it is open.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (mq.matches) {
        setOpen(false);
        document.body.style.overflow = "";
      }
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  // While the modal overlay is open, the page behind it leaves the
  // accessibility tree (aria-modal mitigates; inert makes it explicit).
  // Bar controls get inert via props below — the burger must stay live.
  useEffect(() => {
    if (!open) return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".vk main, .vk footer"),
    );
    els.forEach((el) => {
      el.inert = true;
    });
    return () => {
      els.forEach((el) => {
        el.inert = false;
      });
    };
  }, [open]);

  const prefix = onHome ? "" : "/";
  const links = [
    { href: `${prefix}#tjenester`, label: t.nav.links.tjenester },
    { href: `${prefix}#kundecaser`, label: t.nav.links.kundecaser },
    { href: `${prefix}#folkene`, label: t.nav.links.folkene },
  ];

  // The bar copy goes inert while the overlay dialog is open (the overlay
  // copy stays live) — hence a factory instead of one shared element.
  const langToggle = (inertWhenOpen = false) => (
    <div
      className="vk-nav-lang"
      role="group"
      aria-label={LANG_GROUP_LABEL[lang]}
      inert={inertWhenOpen && open ? true : undefined}
    >
      <button
        type="button"
        aria-pressed={lang === "no"}
        aria-label={LANG_BTN_LABEL.no}
        onClick={() => switchLang("no")}
      >
        NO
      </button>
      <span className="vk-nav-lang-sep" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        aria-pressed={lang === "en"}
        aria-label={LANG_BTN_LABEL.en}
        onClick={() => switchLang("en")}
      >
        EN
      </button>
    </div>
  );

  return (
    <header
      className={`vk-nav${condensed ? " vk-nav--condensed" : ""}${open ? " vk-nav--open" : ""}`}
    >
      <div className="vk-nav-bar">
        <div className="vk-wrap vk-nav-in">
          <span className="vk-nav-brand" inert={open ? true : undefined}>
            <Link href="/" className="vk-nav-logo" onClick={onLogoClick}>
              <WorkflowsLogo className="vk-nav-logosvg" />
              <span className="vk-sr">Workflows</span>
            </Link>
            <span
              className="vk-nav-status"
              data-vk-statusdot=""
              role="img"
              aria-label={t.nav.statusTooltip}
              title={t.nav.statusTooltip}
            >
              <span className="vk-nav-dot" aria-hidden="true" />
            </span>
          </span>

          <nav
            className="vk-nav-links"
            aria-label={t.a11y.mainMenu}
            inert={open ? true : undefined}
          >
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="vk-nav-tools">
            {langToggle(true)}
            <a
              className="vk-btn vk-btn--cta vk-nav-cta"
              href="#kontakt"
              inert={open ? true : undefined}
            >
              {t.nav.cta}
            </a>
            <button
              ref={burgerRef}
              type="button"
              className="vk-nav-burger"
              aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
              aria-expanded={open}
              aria-controls="vk-nav-overlay"
              onClick={toggleOpen}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="vk-nav-track" aria-hidden="true">
          {/* Binding attaches after mount only — SSR/no-JS keeps the CSS
              resting state scaleX(1) (the fully-drawn amber hairline). */}
          <motion.div
            className="vk-nav-progress"
            style={mounted ? { scaleX: progress } : undefined}
          />
        </div>
      </div>

      {/* Egg stamps: minis are decorative; the finale text is announced. */}
      <div className="vk-nav-stamps" aria-live="polite">
        {stamps.map((s) => (
          <span
            key={s.id}
            className={`vk-stamp ${STAMP_ROT[(s.n - 2) % STAMP_ROT.length]} vk-nav-ministamp`}
            style={
              {
                left: STAMP_POS[(s.n - 2) % STAMP_POS.length].left,
                top: STAMP_POS[(s.n - 2) % STAMP_POS.length].top,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            {t.prosess.weekLabel} {s.n}
          </span>
        ))}
        {finale !== 0 && (
          <div key={finale} className="vk-nav-finale">
            {t.eggs.logoStampFinal}
          </div>
        )}
      </div>

      {open && (
        <div
          ref={overlayRef}
          id="vk-nav-overlay"
          className="vk-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.a11y.mainMenu}
        >
          <nav className="vk-nav-ovl-links">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                className="vk-display vk-nav-ovl-link vk-nav-ovl-item"
                style={{ "--i": i } as CSSProperties}
                onClick={closeOverlay}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="vk-nav-ovl-tools vk-nav-ovl-item" style={{ "--i": 3 } as CSSProperties}>
            <a className="vk-btn vk-btn--cta" href="#kontakt" onClick={closeOverlay}>
              {t.nav.cta}
            </a>
            {langToggle()}
          </div>
          <p className="vk-mono vk-nav-ovl-live vk-nav-ovl-item" style={{ "--i": 4 } as CSSProperties}>
            {t.nav.overlayLive}
          </p>
        </div>
      )}
    </header>
  );
}
