"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [leadchatActive, setLeadchatActive] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal, .line-reveal, .stagger-children, .text-reveal").forEach((el) => observer.observe(el));

    // Header scroll
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setHeaderScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Cursor glow
    const cursorGlow = cursorGlowRef.current;
    const darkSections = document.querySelectorAll(".process, .cta-banner");
    let isInDark = false;
    const onMouseMove = (e: MouseEvent) => {
      if (cursorGlow) {
        cursorGlow.style.left = e.clientX + "px";
        cursorGlow.style.top = e.clientY + "px";
      }
      let inDark = false;
      darkSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) inDark = true;
      });
      if (inDark !== isInDark) {
        isInDark = inDark;
        cursorGlow?.classList.toggle("active", inDark);
      }
    };
    document.addEventListener("mousemove", onMouseMove);

    // Magnetic buttons
    document.querySelectorAll(".btn").forEach((btn) => {
      const el = btn as HTMLElement;
      el.addEventListener("mousemove", (e: Event) => {
        const me = e as MouseEvent;
        const rect = el.getBoundingClientRect();
        const x = me.clientX - rect.left - rect.width / 2;
        const y = me.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });

    // Workflow canvas stagger
    const workflowCanvas = document.querySelector(".workflow-canvas");
    if (workflowCanvas) {
      const wfObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const nodes = workflowCanvas.querySelectorAll(".workflow-node");
              const hLines = workflowCanvas.querySelectorAll(".workflow-h-line");
              const vLines = workflowCanvas.querySelectorAll(".workflow-v-line");
              nodes.forEach((node, i) => {
                setTimeout(() => {
                  (node as HTMLElement).style.opacity = "1";
                  (node as HTMLElement).style.transform = "translateY(0)";
                }, i * 120);
              });
              hLines.forEach((hl, i) => {
                setTimeout(() => { (hl as HTMLElement).style.opacity = "1"; }, 80 + i * 120);
              });
              vLines.forEach((vl, i) => {
                setTimeout(() => {
                  (vl as HTMLElement).style.opacity = "1";
                  const s = vl.querySelector("span") as HTMLElement;
                  if (s) s.style.transform = "scaleY(1)";
                }, 380 + i * 80);
              });
              wfObserver.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      workflowCanvas.querySelectorAll(".workflow-node").forEach((n) => {
        const el = n as HTMLElement;
        el.style.opacity = "0";
        el.style.transform = "translateY(24px)";
        el.style.transition = "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)";
      });
      workflowCanvas.querySelectorAll(".workflow-h-line").forEach((hl) => {
        const el = hl as HTMLElement;
        el.style.opacity = "0";
        el.style.transition = "opacity 0.5s ease";
      });
      workflowCanvas.querySelectorAll(".workflow-v-line").forEach((vl) => {
        const el = vl as HTMLElement;
        el.style.opacity = "0";
        el.style.transition = "opacity 0.5s ease";
        const s = vl.querySelector("span") as HTMLElement;
        if (s) { s.style.transform = "scaleY(0)"; s.style.transition = "transform 0.5s ease"; }
      });
      wfObserver.observe(workflowCanvas);
    }

    // Process timeline stagger
    const timeline = document.querySelector(".process-timeline");
    if (timeline) {
      const timelineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const steps = timeline.querySelectorAll(".process-step");
              const connectors = timeline.querySelectorAll(".process-connector");
              steps.forEach((step, i) => {
                setTimeout(() => step.classList.add("visible"), i * 300);
                if (i > 0 && connectors[i - 1]) {
                  setTimeout(() => connectors[i - 1].classList.add("visible"), i * 300 - 150);
                }
              });
              timelineObserver.unobserve(e.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      timelineObserver.observe(timeline);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target && headerRef.current) {
      const offset = headerRef.current.offsetHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMobileNavActive(false);
    document.body.style.overflow = "";
  };

  const toggleMobileNav = () => {
    setMobileNavActive(!mobileNavActive);
    document.body.style.overflow = !mobileNavActive ? "hidden" : "";
  };

  return (
    <>
      <div ref={cursorGlowRef} className="cursor-glow" />

      <header ref={headerRef} className={`site-header${headerScrolled ? " scrolled" : ""}`}>
        <div className="container">
          <div className="header-inner">
            <a href="/" className="site-logo-link">
              <Image src="/logo.jpg" alt="Workflows" className="site-logo" width={100} height={28} style={{ width: "auto", height: "28px" }} />
            </a>
            <nav>
              <ul className="nav-links">
                <li><a href="#tjenester" onClick={(e) => scrollToSection(e, "#tjenester")}>Tjenester</a></li>
                <li><a href="#prosess" onClick={(e) => scrollToSection(e, "#prosess")}>Prosess</a></li>
                <li><a href="#sikkerhet" onClick={(e) => scrollToSection(e, "#sikkerhet")}>Sikkerhet</a></li>
                <li><a href="#om" onClick={(e) => scrollToSection(e, "#om")}>Om oss</a></li>
                <li><a href="#kontakt" className="nav-cta" onClick={(e) => scrollToSection(e, "#kontakt")}>Kontakt</a></li>
              </ul>
            </nav>
            <button className="hamburger" aria-label="Meny" onClick={toggleMobileNav}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-nav${mobileNavActive ? " active" : ""}`}>
        <a href="#tjenester" onClick={(e) => scrollToSection(e, "#tjenester")}>Tjenester</a>
        <a href="#prosess" onClick={(e) => scrollToSection(e, "#prosess")}>Prosess</a>
        <a href="#om" onClick={(e) => scrollToSection(e, "#om")}>Om oss</a>
        <a href="#kontakt" onClick={(e) => scrollToSection(e, "#kontakt")}>Kontakt</a>
      </div>

      {/* Hero */}
      <section className="hero hero-light">
        <div className="hero-content">
          <div className="hero-logo reveal">
            <Image src="/workflows-logo-dark-green.jpg" alt="Workflows" className="hero-logo-img" width={320} height={320} style={{ width: "auto", height: "clamp(180px, 30vw, 320px)" }} priority />
          </div>
          <p className="hero-tagline reveal reveal-delay-2">AI-agenter som gjør arbeidet — så du kan fokusere på vekst.</p>
          <div className="hero-buttons reveal reveal-delay-3" style={{ flexDirection: "column", alignItems: "center" }}>
            <a href="#" className="btn btn-primary btn-arrow" onClick={(e) => { e.preventDefault(); setLeadchatActive(true); document.body.style.overflow = "hidden"; }}>
              Kartlegg ditt AI-potensial — gratis
            </a>
            <p className="hero-sub">Du blir kontaktet med en skreddersydd rapport etter kartleggingen.</p>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* Marquee */}
      <section className="marquee-section">
        <div className="marquee-track">
          {["Automatisering", "·", "AI-agenter", "·", "Språkmodeller", "·", "Kunnskapsbaser", "·", "Kundeservice", "·", "Rapportering", "·", "Integrasjon", "·", "Automatisering", "·", "AI-agenter", "·", "Språkmodeller", "·", "Kunnskapsbaser", "·", "Kundeservice", "·", "Rapportering", "·", "Integrasjon", "·"].map((item, i) => (
            <span key={i} className="marquee-item">{item}</span>
          ))}
        </div>
      </section>

      {/* Tjenester */}
      <section className="services" id="tjenester">
        <div className="container">
          <div className="services-header reveal">
            <span className="section-label">Tjenester</span>
            <h2>Hva vi bygger</h2>
            <p>Skreddersydde AI-løsninger som leverer målbar verdi</p>
          </div>
          <div className="workflow-canvas reveal reveal-delay-1">
            <div className="workflow-row">
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
                </div>
                <h3>Intelligente agenter</h3>
                <p>AI-systemer som automatiserer repeterende oppgaver — fra kundeservice til datainnsamling og salg.</p>
              </div>
              <div className="workflow-h-line"><span></span></div>
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>
                </div>
                <h3>Kundeservice-agenter</h3>
                <p>Flerspråklig agent som svarer på henvendelser, foreslår løsninger og eskalerer ved behov.</p>
              </div>
              <div className="workflow-h-line"><span></span></div>
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                </div>
                <h3>Data og rapportering</h3>
                <p>Automatisert innsamling av nøkkeltall med ukentlige rapporter og varsler.</p>
              </div>
            </div>

            <div className="workflow-v-connectors">
              <div className="workflow-v-line"><span></span></div>
              <div className="workflow-v-line"><span></span></div>
              <div className="workflow-v-line"><span></span></div>
            </div>

            <div className="workflow-row">
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757"/></svg>
                </div>
                <h3>Språkmodell-integrasjon</h3>
                <p>Vi kobler store språkmodeller til deres systemer med sikre mellomlag.</p>
              </div>
              <div className="workflow-h-line"><span></span></div>
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
                </div>
                <h3>Proof of Concept</h3>
                <p>Raske testprosjekter der vi validerer teknologi og gevinst før fullskala.</p>
              </div>
              <div className="workflow-h-line"><span></span></div>
              <div className="workflow-node">
                <div className="service-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
                </div>
                <h3>RAG og kunnskapsbaser</h3>
                <p>Søk i interne dokumenter, håndbøker og produktdata med AI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prosess */}
      <section className="process" id="prosess">
        <div className="container">
          <div className="process-header reveal">
            <span className="section-label">Prosess</span>
            <h2>Tre steg til produksjon</h2>
          </div>
          <div className="process-timeline">
            <div className="process-step reveal">
              <div className="step-number">01</div>
              <h3>Kartlegging</h3>
              <p>Vi definerer tydelige mål og KPI-er. Forstår arbeidsflyten, identifiserer flaskehalser og designer løsningen.</p>
            </div>
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-dot"></div>
              <div className="connector-line"></div>
            </div>
            <div className="process-step reveal">
              <div className="step-number">02</div>
              <h3>Bygg og iterer</h3>
              <p>Ukentlige demoer og tett dialog. Vi bygger raskt, tester grundig og justerer basert på reelle data.</p>
            </div>
            <div className="process-connector">
              <div className="connector-line"></div>
              <div className="connector-dot"></div>
              <div className="connector-line"></div>
            </div>
            <div className="process-step reveal">
              <div className="step-number">03</div>
              <h3>Lansering</h3>
              <p>Dokumentasjon, opplæring og overlevering. Dere eier løsningen fullt ut — vi støtter videre ved behov.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sikkerhet */}
      <section className="security" id="sikkerhet">
        <div className="container">
          <div className="security-inner">
            <div className="reveal">
              <span className="section-label">Sikkerhet</span>
              <h2>Deres data er trygge<br/>hos oss</h2>
              <p>Vi vet at data er bedriftens mest verdifulle eiendel. Derfor bygger vi alle løsninger med sikkerhet som grunnpilar — ikke som ettertanke.</p>
            </div>
            <div className="security-grid reveal reveal-delay-1">
              <div className="security-item">
                <div className="security-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
                </div>
                <h3>Ingen trening på data</h3>
                <p>Vi bruker kun enterprise-grade infrastruktur der leverandøren kontraktsfestet ikke bruker deres data til modelltrening.</p>
              </div>
              <div className="security-item">
                <div className="security-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                </div>
                <h3>Prosessert i Europa</h3>
                <p>All data behandles i europeiske datasenter. Ingenting forlater EU — i tråd med GDPR og norske regulatoriske krav.</p>
              </div>
              <div className="security-item">
                <div className="security-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                </div>
                <h3>Kryptert og anonymisert</h3>
                <p>Sensitiv informasjon kan anonymiseres automatisk før prosessering. All kommunikasjon er kryptert ende-til-ende.</p>
              </div>
              <div className="security-item">
                <div className="security-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                </div>
                <h3>Juridisk rammeverk</h3>
                <p>Alle prosjekter leveres med databehandleravtale (DPA) og dokumentert GDPR-samsvar. Ingen overraskelser.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Om */}
      <section className="about" id="om">
        <div className="container">
          <div className="about-grid">
            <div className="about-text reveal">
              <span className="section-label">Om Workflows</span>
              <h2>Enkelt. Intelligent.<br/>Alltid i produksjon.</h2>
              <p>Workflows er et AI-selskap basert på Haugalandet. Vi designer og bygger intelligente systemer som faktisk leverer verdi — ikke bare ser bra ut i en presentasjon.</p>
              <p>Enkelhet er kjernen i alt vi gjør. Ingen unødvendig kompleksitet. Løsninger som fungerer fra dag én og skalerer når dere gjør det.</p>
            </div>
            <div className="about-values reveal reveal-delay-1">
              <div className="value-item">
                <div className="value-number">01</div>
                <div className="value-content">
                  <h3>Bygget for norske bedrifter</h3>
                  <p>Vi forstår lokale behov, regelverk og forretningskultur. All rådgivning på norsk.</p>
                </div>
              </div>
              <div className="value-item">
                <div className="value-number">02</div>
                <div className="value-content">
                  <h3>Spesialisert på AI</h3>
                  <p>Vi gjør én ting, og vi gjør det skikkelig. Agenter, automatisering og språkmodeller.</p>
                </div>
              </div>
              <div className="value-item">
                <div className="value-number">03</div>
                <div className="value-content">
                  <h3>Fra idé til produksjon — raskt</h3>
                  <p>Proof of concept på uker, ikke måneder. Dere ser resultater tidlig.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-inner reveal">
            <span className="section-label" style={{ color: "var(--gray-500)" }}>Klar?</span>
            <h2>La oss bygge noe<br/>ekstraordinært</h2>
            <p>Uansett om du har en konkret idé eller bare er nysgjerrig — vi tar gjerne en uforpliktende prat om mulighetene.</p>
            <a href="#kontakt" className="btn btn-dark btn-arrow" onClick={(e) => scrollToSection(e, "#kontakt")}>Start samtalen</a>
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section className="contact" id="kontakt">
        <div className="container">
          <div className="contact-inner reveal">
            <span className="section-label">Kontakt</span>
            <h2>Si hei</h2>
            <p className="text-large">Vi svarer fortløpende.</p>
            <div className="contact-info">
              <div className="contact-name">Petter Staveland</div>
              <div className="contact-role">Daglig leder</div>
              <a href="mailto:petter@workflows.no" className="contact-email">petter@workflows.no</a>
            </div>
            <a href="mailto:petter@workflows.no" className="btn btn-primary btn-arrow">Send e-post</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <Image src="/logo.jpg" alt="Workflows" className="footer-logo" width={80} height={18} style={{ width: "auto", height: "18px" }} />
              <span className="footer-copy">&copy; 2026 Workflows. Alle rettigheter reservert.</span>
            </div>
            <ul className="footer-links">
              <li><a href="#tjenester" onClick={(e) => scrollToSection(e, "#tjenester")}>Tjenester</a></li>
              <li><a href="#om" onClick={(e) => scrollToSection(e, "#om")}>Om oss</a></li>
              <li><a href="mailto:petter@workflows.no">Kontakt</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* LeadChat Overlay */}
      <div id="leadchat-overlay" className={`leadchat-overlay${leadchatActive ? " active" : ""}`} aria-hidden={!leadchatActive} onClick={(e) => { if ((e.target as HTMLElement).id === "leadchat-overlay") { setLeadchatActive(false); document.body.style.overflow = ""; } }}>
        <div className="leadchat-container">
          <button className="leadchat-close" aria-label="Lukk" onClick={() => { setLeadchatActive(false); document.body.style.overflow = ""; }}>&times;</button>
          <div className="leadchat-header">
            <div className="leadchat-logo">W</div>
            <div className="leadchat-header-text">
              <h2>Workflows</h2>
              <p>Kartleggingsassistent</p>
            </div>
          </div>
          <div className="leadchat-messages" id="leadchat-messages">
            {leadchatActive && (
              <div className="leadchat-msg assistant">
                Bra at du tar steget! Hva heter bedriften din, og hva driver dere med?
              </div>
            )}
          </div>
          <div className="leadchat-input-wrap">
            <textarea id="leadchat-input" placeholder="Skriv her..." rows={1}></textarea>
            <button id="leadchat-send" aria-label="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
