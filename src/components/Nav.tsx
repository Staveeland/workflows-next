"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

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
                <a href="#tjenester">Tjenester</a>
                <a href="#prosess">Prosess</a>
              </>
            ) : (
              <>
                <Link href="/#tjenester">Tjenester</Link>
                <Link href="/#prosess">Prosess</Link>
              </>
            )}
            <Link href="/kunder">Kunder</Link>
            {isHome ? (
              <>
                <a href="#faq">FAQ</a>
                <a href="#om">Om oss</a>
                <a href="#kontakt" className="nav__cta">Ta kontakt</a>
              </>
            ) : (
              <>
                <Link href="/#faq">FAQ</Link>
                <Link href="/#om">Om oss</Link>
                <Link href="/#kontakt" className="nav__cta">Ta kontakt</Link>
              </>
            )}
          </div>
          <button className={`nav__burger${navOpen ? " open" : ""}`} onClick={toggleNav} aria-label="Meny">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {navOpen && (
        <div className="mobile-overlay">
          {[
            { label: "Tjenester", href: isHome ? "#tjenester" : "/#tjenester" },
            { label: "Kunder", href: "/kunder" },
            { label: "Prosess", href: isHome ? "#prosess" : "/#prosess" },
            { label: "FAQ", href: isHome ? "#faq" : "/#faq" },
            { label: "Om oss", href: isHome ? "#om" : "/#om" },
            { label: "Kontakt", href: isHome ? "#kontakt" : "/#kontakt" },
          ].map((l, i) => (
            <Link key={l.label} href={l.href} onClick={closeNav} style={{ animationDelay: `${i * 0.06}s` }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
