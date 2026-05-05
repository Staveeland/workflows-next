"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

export default function Nav() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { lang, setLang } = useLang();
  const t = translations[lang].nav;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleNav = () => {
    setNavOpen(!navOpen);
    document.body.style.overflow = !navOpen ? "hidden" : "";
  };

  const closeNav = () => {
    setNavOpen(false);
    document.body.style.overflow = "";
  };

  return (
    <>
      <header className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <Link href="/" className="nav__logo">
            <Image src="/logo-dark.png" alt="Workflows" width={140} height={40} priority style={{ width: "auto", height: "26px" }} />
          </Link>
          <div className="nav__links">
            {isHome ? (
              <>
                <a href="#tjenester">{t.services}</a>
                <a href="#prosess">{t.process}</a>
              </>
            ) : (
              <>
                <Link href="/#tjenester">{t.services}</Link>
                <Link href="/#prosess">{t.process}</Link>
              </>
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
          </div>
          <button className={`nav__burger${navOpen ? " open" : ""}`} onClick={toggleNav} aria-label="Meny">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {navOpen && (
        <div className="mobile-overlay">
          {[
            { label: t.services, href: isHome ? "#tjenester" : "/#tjenester" },
            { label: t.customers, href: "/kunder" },
            { label: t.process, href: isHome ? "#prosess" : "/#prosess" },
            { label: t.faq, href: isHome ? "#faq" : "/#faq" },
            { label: t.about, href: isHome ? "#om" : "/#om" },
            { label: t.contact, href: isHome ? "#kontakt" : "/#kontakt" },
          ].map((l, i) => (
            <Link key={l.label} href={l.href} onClick={closeNav} style={{ animationDelay: `${i * 0.06}s` }}>
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
