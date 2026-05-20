"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { IconChatbot, IconFlow, IconAgent, IconArrow } from "@/components/icons/ServiceIcons";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  chatbot: IconChatbot,
  flow: IconFlow,
  agent: IconAgent,
};

export default function Nav() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { lang, setLang } = useLang();
  const t = translations[lang].nav;
  const a11y = translations[lang].a11y;
  const services = t.servicesMenu;

  const servicesWrapRef = useRef<HTMLDivElement | null>(null);
  const servicesBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset dropdown state when the route changes. Done during render via the
  // "store-and-compare-prev-prop" pattern recommended by React docs — avoids
  // the cascading-renders cost of setting state in an effect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (servicesOpen) setServicesOpen(false);
    if (mobileServicesOpen) setMobileServicesOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close burger menu on Escape
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  // Close services dropdown on Escape (returns focus to button)
  useEffect(() => {
    if (!servicesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setServicesOpen(false);
        servicesBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [servicesOpen]);

  // Close services dropdown on outside click (desktop)
  useEffect(() => {
    if (!servicesOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!servicesWrapRef.current?.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [servicesOpen]);

  // Ensure body overflow is always restored on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleNav = () => {
    setNavOpen(!navOpen);
    document.body.style.overflow = !navOpen ? "hidden" : "";
  };

  const closeNav = () => {
    setNavOpen(false);
    setMobileServicesOpen(false);
    document.body.style.overflow = "";
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleServicesEnter = () => {
    clearCloseTimer();
    setServicesOpen(true);
  };

  const handleServicesLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setServicesOpen(false), 200);
  };

  const handleServicesBtnKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setServicesOpen(true);
      // Focus first link in dropdown after it renders
      requestAnimationFrame(() => {
        const firstLink = servicesWrapRef.current?.querySelector<HTMLAnchorElement>(
          ".nav__services-dropdown a"
        );
        firstLink?.focus();
      });
    }
  };

  return (
    <>
      <header className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <Link href="/" className="nav__logo">
            <Image src="/logo-dark.png" alt="Workflows" width={140} height={40} priority style={{ width: "auto", height: "26px" }} />
          </Link>
          <nav className="nav__links" aria-label={a11y.mainMenu}>
            <div
              className="nav__services-wrap"
              ref={servicesWrapRef}
              onMouseEnter={handleServicesEnter}
              onMouseLeave={handleServicesLeave}
            >
              <button
                ref={servicesBtnRef}
                type="button"
                className={`nav__services-btn${servicesOpen ? " nav__services-btn--open" : ""}`}
                aria-expanded={servicesOpen}
                aria-controls="nav-services-dropdown"
                aria-haspopup="menu"
                onClick={() => setServicesOpen((v) => !v)}
                onKeyDown={handleServicesBtnKey}
              >
                {t.services}
                <svg
                  className="nav__services-caret"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                id="nav-services-dropdown"
                className={`nav__services-dropdown${servicesOpen ? " nav__services-dropdown--open" : ""}`}
                role="menu"
                aria-hidden={!servicesOpen}
              >
                <ul className="nav__services-list">
                  {services.items.map((item) => {
                    const Icon = ICONS[item.icon] ?? IconChatbot;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          role="menuitem"
                          className="nav__services-item"
                          tabIndex={servicesOpen ? 0 : -1}
                          onClick={() => setServicesOpen(false)}
                        >
                          <span className="nav__services-item-icon" aria-hidden="true">
                            <Icon size={22} />
                          </span>
                          <span className="nav__services-item-text">
                            <span className="nav__services-item-title">{item.label}</span>
                            <span className="nav__services-item-desc">{item.description}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={services.seeAllHref}
                  role="menuitem"
                  className="nav__services-seeall"
                  tabIndex={servicesOpen ? 0 : -1}
                  onClick={() => setServicesOpen(false)}
                >
                  {services.seeAll}
                  <IconArrow size={14} />
                </Link>
              </div>
            </div>

            {isHome ? (
              <a href="#prosess">{t.process}</a>
            ) : (
              <Link href="/#prosess">{t.process}</Link>
            )}
            <Link href="/kunder">{t.customers}</Link>
            {isHome ? (
              <>
                <a href="#faq">{t.faq}</a>
                <a href="#om">{t.about}</a>
                <a href="#kontakt" className="nav__cta">{t.contact}</a>
              </>
            ) : (
              <>
                <Link href="/#faq">{t.faq}</Link>
                <Link href="/#om">{t.about}</Link>
                <Link href="/#kontakt" className="nav__cta">{t.contact}</Link>
              </>
            )}
            <div className="lang-toggle">
              <button
                className={`lang-toggle__btn${lang === "no" ? " lang-toggle__btn--active" : ""}`}
                onClick={() => setLang("no")}
                aria-label="Norsk"
                title="Norsk"
              >
                🇳🇴
              </button>
              <button
                className={`lang-toggle__btn${lang === "en" ? " lang-toggle__btn--active" : ""}`}
                onClick={() => setLang("en")}
                aria-label="English"
                title="English"
              >
                🇬🇧
              </button>
            </div>
          </nav>
          <button
            className={`nav__burger${navOpen ? " open" : ""}`}
            onClick={toggleNav}
            aria-label="Meny"
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {navOpen && (
        <div className="mobile-overlay" id="mobile-nav">
          <div className="mobile-overlay__services" style={{ animationDelay: "0s" }}>
            <button
              type="button"
              className={`mobile-overlay__services-toggle${mobileServicesOpen ? " mobile-overlay__services-toggle--open" : ""}`}
              aria-expanded={mobileServicesOpen}
              aria-controls="mobile-services-panel"
              onClick={() => setMobileServicesOpen((v) => !v)}
            >
              {t.services}
              <svg
                width="14"
                height="14"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                focusable="false"
                style={{
                  transform: mobileServicesOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s var(--ease, ease)",
                }}
              >
                <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {mobileServicesOpen && (
              <ul id="mobile-services-panel" className="mobile-overlay__services-list">
                {services.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? IconChatbot;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={closeNav}>
                        <span className="mobile-overlay__services-icon" aria-hidden="true">
                          <Icon size={20} />
                        </span>
                        <span>
                          <span className="mobile-overlay__services-title">{item.label}</span>
                          <span className="mobile-overlay__services-desc">{item.description}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link href={services.seeAllHref} onClick={closeNav} className="mobile-overlay__services-seeall">
                    {services.seeAll}
                  </Link>
                </li>
              </ul>
            )}
          </div>
          {[
            { label: t.customers, href: "/kunder" },
            { label: t.process, href: isHome ? "#prosess" : "/#prosess" },
            { label: t.faq, href: isHome ? "#faq" : "/#faq" },
            { label: t.about, href: isHome ? "#om" : "/#om" },
            { label: t.contact, href: isHome ? "#kontakt" : "/#kontakt" },
          ].map((l, i) => (
            <Link key={l.label} href={l.href} onClick={closeNav} style={{ animationDelay: `${(i + 1) * 0.06}s` }}>
              {l.label}
            </Link>
          ))}
          <div className="lang-toggle lang-toggle--mobile">
            <button
              className={`lang-toggle__btn${lang === "no" ? " lang-toggle__btn--active" : ""}`}
              onClick={() => { setLang("no"); closeNav(); }}
              aria-label="Norsk"
            >
              🇳🇴 NO
            </button>
            <button
              className={`lang-toggle__btn${lang === "en" ? " lang-toggle__btn--active" : ""}`}
              onClick={() => { setLang("en"); closeNav(); }}
              aria-label="English"
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      )}
    </>
  );
}
