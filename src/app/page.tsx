"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
// import Creature from "@/components/Creature";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.85, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }
  })
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const wordAnim = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }
  })
};

/* ─── Animated words component ─── */
function AnimatedHeading({ text, className }: { text: string; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const words = text.split(" ");
  return (
    <h2 ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="word-wrap">
            <motion.span
              className="word"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </h2>
  );
}

/* ─── Counter hook ─── */
function useCounter(end: number, dur: number, active: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0;
    const step = end / (dur / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= end) { setN(end); clearInterval(t); }
      else setN(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [end, dur, active]);
  return n;
}

/* ═══════════════════════════════════════ */
export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const s1 = useCounter(40, 2000, statsInView);
  const s2 = useCounter(12, 2000, statsInView);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const heroOp = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el && headerRef.current) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerRef.current.offsetHeight - 24, behavior: "smooth" });
    }
    setNavOpen(false);
    document.body.style.overflow = "";
  };

  const toggleNav = () => {
    setNavOpen(!navOpen);
    document.body.style.overflow = !navOpen ? "hidden" : "";
  };

  return (
    <>
      {/* <Creature /> */}
      {/* ──── NAV ──── */}
      <header ref={headerRef} className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <a href="/" className="nav__logo">
            <Image src="/logo-dark.png" alt="Workflows" width={140} height={40} priority style={{ width: "auto", height: "26px" }} />
          </a>
          <div className="nav__links">
            <a href="#tjenester" onClick={e => scrollTo(e, "#tjenester")}>Tjenester</a>
            <a href="#prosess" onClick={e => scrollTo(e, "#prosess")}>Prosess</a>
            <a href="#om" onClick={e => scrollTo(e, "#om")}>Om oss</a>
            <a href="#kontakt" className="nav__cta" onClick={e => scrollTo(e, "#kontakt")}>Ta kontakt</a>
          </div>
          <button className={`nav__burger${navOpen ? " open" : ""}`} onClick={toggleNav} aria-label="Meny">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {navOpen && (
        <div className="mobile-overlay">
          {["Tjenester", "Prosess", "Om oss", "Kontakt"].map((l, i) => {
            const ids = ["#tjenester", "#prosess", "#om", "#kontakt"];
            return <a key={l} href={ids[i]} onClick={e => scrollTo(e, ids[i])} style={{ animationDelay: `${i * 0.06}s` }}>{l}</a>;
          })}
        </div>
      )}

      {/* ──── HERO ──── */}
      <section className="hero">
        {/* Floating shapes */}
        <motion.div className="hero__shape hero__shape--1"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="hero__shape hero__shape--2"
          animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="hero__shape hero__shape--3"
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOp }}>
          <motion.div className="hero__logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            <Image src="/logo-dark.png" alt="Workflows" width={500} height={150} priority style={{ width: "auto", height: "clamp(80px, 12vw, 140px)", margin: "0 auto" }} />
          </motion.div>

          <h1 className="hero__title">
            {"Vi bygger systemene".split(" ").map((w, i) => (
              <span key={i}>
                <span className="word-wrap">
                  <motion.span className="word"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>
                    {w}
                  </motion.span>
                </span>{" "}
              </span>
            ))}
            <br />
            {"som jobber".split(" ").map((w, i) => (
              <span key={i}>
                <span className="word-wrap">
                  <motion.span className="word"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.6 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>
                    {w}
                  </motion.span>
                </span>{" "}
              </span>
            ))}
            <span className="word-wrap">
              <motion.span className="word hero__accent"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                for&nbsp;deg
              </motion.span>
            </span>
          </h1>

          <motion.p className="hero__sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.0 }}>
            Skreddersydd software, digitale assistenter og automatiserte systemer — bygget for å spare tid, kutte kostnader og gi din bedrift et forsprang.
          </motion.p>

          <motion.div className="hero__actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <a href="#kontakt" className="btn btn--primary" onClick={e => scrollTo(e, "#kontakt")}>
              Start en samtale <span className="btn__arrow">&rarr;</span>
            </a>
            <a href="#tjenester" className="btn btn--ghost" onClick={e => scrollTo(e, "#tjenester")}>
              Utforsk tjenester
            </a>
          </motion.div>
        </motion.div>

        <div className="hero__scroll">
          <div className="hero__scroll-line"><div className="hero__scroll-dot" /></div>
        </div>
      </section>

      {/* ──── STATS BAR ──── */}
      <section className="stats" ref={statsRef}>
        <div className="wrap">
          <motion.div className="stats__grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div className="stats__item" variants={fadeUp}>
              <span className="stats__num">{s1}<span className="stats__pct">%</span></span>
              <span className="stats__label">gjennomsnittlig tid spart hos våre kunder</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={1}>
              <span className="stats__num">{s2}<span className="stats__pct">+</span></span>
              <span className="stats__label">norske bedrifter bruker systemene våre daglig</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={2}>
              <span className="stats__num">24<span className="stats__pct">/7</span></span>
              <span className="stats__label">systemene dine jobber mens du sover</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── PROBLEM ──── */}
      <section className="dark-section">
        <div className="wrap">
          <motion.div className="split" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="split__left" variants={fadeUp}>
              <span className="tag tag--dark">Problemet</span>
              <AnimatedHeading text="Bedriften din gjør mye manuelt arbeid som maskiner burde håndtere" className="dark-section__heading" />
            </motion.div>
            <motion.div className="split__right" variants={stagger}>
              {[
                ["Dobbeltarbeid", "Data kopieres manuelt mellom systemer. Igjen og igjen."],
                ["Treg oppfølging", "Kundehenvendelser hoper seg opp. Potensielle salg forsvinner."],
                ["Tidkrevende rapporter", "Noen bruker halve dagen på å sette sammen tall i et regneark."],
                ["Frakoblede systemer", "Verktøyene snakker ikke sammen. Feil oppstår, folk frustreres."],
              ].map(([title, desc], i) => (
                <motion.div key={i} className="problem-row" variants={fadeUp} custom={i}>
                  <span className="problem-row__num">0{i + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── TJENESTER ──── */}
      <section className="section" id="tjenester">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Tjenester</motion.span>
            <AnimatedHeading text="Vi bygger det du trenger, ingenting mer" />
            <motion.p className="section__sub" variants={fadeUp} custom={3}>Hver løsning er skreddersydd for din bedrift. Ingen hyllevare, ingen unødvendig kompleksitet.</motion.p>
          </motion.div>

          <motion.div className="card-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              { tag: "Utvikling", title: "Skreddersydd software", desc: "Programvare bygget spesifikt for dine prosesser. Ingen kompromisser, ingen begrensninger fra hyllevare.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg> },
              { tag: "Automatisering", title: "Digitale assistenter", desc: "Systemer som håndterer rutineoppgaver døgnet rundt. Kundeservice, oppfølging, rapporter — helt automatisk.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg> },
              { tag: "Integrasjon", title: "Systemintegrasjon", desc: "Vi kobler verktøyene dine sammen slik at data flyter automatisk. Slutt på manuell overføring.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.07a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757"/></svg> },
              { tag: "Data", title: "Automatisk rapportering", desc: "Nøkkeltall levert når du trenger dem — daglig, ukentlig eller i sanntid. Ingen manuell tallknusing.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg> },
              { tag: "Support", title: "Kundeservice-systemer", desc: "Automatisert kundestøtte som svarer, løser og eskalerer — flerspråklig og tilgjengelig 24/7.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg> },
              { tag: "Kunnskap", title: "Interne kunnskapsbaser", desc: "Gjør dokumenter og håndbøker søkbare. Ansatte finner svar på sekunder istedenfor timer.", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg> },
            ].map((s, i) => (
              <motion.div key={i} className="card" variants={fadeUp} custom={i}>
                <div className="card__top">
                  <div className="card__icon">{s.icon}</div>
                  <span className="card__tag">{s.tag}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── PROSESS ──── */}
      <section className="accent-section" id="prosess">
        <div className="wrap">
          <motion.div className="section__head section__head--left" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag tag--accent" variants={fadeUp}>Prosess</motion.span>
            <AnimatedHeading text="Tre steg til et system som jobber for deg" className="accent-section__heading" />
          </motion.div>

          <motion.div className="steps" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              { n: "01", title: "Vi lytter", desc: "Vi setter oss ned og forstår hverdagen din. Ingen teknisk sjargong — bare en ærlig samtale om hva som tar for mye tid.", label: "Gratis og uforpliktende" },
              { n: "02", title: "Vi bygger", desc: "Du ser fremgang fra uke én. Ukentlige demoer, tett dialog. Vi justerer basert på dine tilbakemeldinger.", label: "Ukentlige oppdateringer" },
              { n: "03", title: "Vi leverer", desc: "Et ferdig system som fungerer. Opplæring, dokumentasjon og support inkludert — så lenge du trenger det.", label: "Full support" },
            ].map((s, i) => (
              <motion.div key={i} className="step" variants={fadeUp} custom={i}>
                <span className="step__num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="step__label">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── RESULTATER ──── */}
      <section className="section" id="resultater">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Resultater</motion.span>
            <AnimatedHeading text="Konkurrentene gjør ting manuelt. Du har et system." />
          </motion.div>

          <motion.div className="results-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              { title: "Spar 10–40 timer i uken", desc: "Repeterende oppgaver automatisert helt bort. Teamet ditt får tiden tilbake til det som faktisk betyr noe.", accent: true },
              { title: "Raskere beslutninger", desc: "Automatiske rapporter og sanntidsdata. Du vet alltid hvor bedriften står — uten å vente på noen.", accent: false },
              { title: "Færre feil, bedre kvalitet", desc: "Systemer gjør ikke slurve-feil. Datakvaliteten går opp, risikoen ned, kundene blir mer fornøyde.", accent: false },
              { title: "Voks uten å ansette", desc: "Digitale systemer skalerer med bedriften din. Smartere verktøy — ikke flere hender.", accent: true },
            ].map((r, i) => (
              <motion.div key={i} className={`result${r.accent ? " result--accent" : ""}`} variants={fadeUp} custom={i}>
                <span className="result__num">0{i + 1}</span>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── OM OSS ──── */}
      <section className="section section--warm" id="om">
        <div className="wrap">
          <motion.div className="split split--reverse" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="split__left" variants={fadeUp}>
              <span className="tag">Om Workflows</span>
              <AnimatedHeading text="Vi gjør komplisert teknologi enkelt" />
              <motion.p variants={fadeUp} custom={2}>
                Workflows er et norsk teknologiselskap som hjelper bedrifter med å jobbe smartere. Vi bygger skreddersydd software, digitale assistenter og automatiserte systemer som faktisk gjør en forskjell i hverdagen.
              </motion.p>
              <motion.p variants={fadeUp} custom={3}>
                Basert på Haugalandet. Jobber med bedrifter over hele Norge.
              </motion.p>
            </motion.div>
            <motion.div className="split__right" variants={stagger}>
              {[
                ["Ingen sjargong", "Vi forklarer alt på vanlig norsk. Du trenger ikke forstå teknologien — bare resultatene."],
                ["Resultater fra dag én", "Du ser fremgang allerede første uke. Ingen lange prosjekter uten synlige resultater."],
                ["Din kontroll, alltid", "Du eier alt vi bygger. Ingen innlåsing, ingen skjulte kostnader."],
              ].map(([t, d], i) => (
                <motion.div key={i} className="val" variants={fadeUp} custom={i}>
                  <div className="val__bar" />
                  <div>
                    <h4>{t}</h4>
                    <p>{d}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="wrap">
          <motion.div className="cta" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp}>Klar for å slippe det manuelle arbeidet?</motion.h2>
            <motion.p variants={fadeUp} custom={1}>
              Book en uforpliktende samtale. Vi finner ut sammen hva vi kan gjøre for deg — helt gratis.
            </motion.p>
            <motion.a href="#kontakt" className="btn btn--white" onClick={e => scrollTo(e, "#kontakt")} variants={fadeUp} custom={2}>
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ──── KONTAKT ──── */}
      <section className="section" id="kontakt">
        <div className="wrap">
          <motion.div className="contact" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="contact__left" variants={fadeUp}>
              <span className="tag">Kontakt</span>
              <h2>La oss ta en prat</h2>
              <p>Fortell oss litt om bedriften din. Vi finner ut hva vi kan hjelpe med — helt uforpliktende.</p>
            </motion.div>
            <motion.div className="contact__right" variants={fadeUp} custom={1}>
              <div className="contact__person">
                <div className="contact__avatar">PS</div>
                <div>
                  <strong>Petter Staveland</strong>
                  <span>Daglig leder</span>
                </div>
              </div>
              <a href="mailto:petter@workflows.no" className="contact__email">
                petter@workflows.no
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
              <a href="mailto:petter@workflows.no" className="btn btn--primary">
                Send e-post <span className="btn__arrow">&rarr;</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer__inner">
            <div className="footer__left">
              <Image src="/logo-dark.png" alt="Workflows" width={100} height={28} style={{ width: "auto", height: "18px", opacity: 0.3 }} />
              <span>&copy; 2026 Workflows</span>
            </div>
            <div className="footer__links">
              <a href="#tjenester" onClick={e => scrollTo(e, "#tjenester")}>Tjenester</a>
              <a href="#om" onClick={e => scrollTo(e, "#om")}>Om oss</a>
              <a href="mailto:petter@workflows.no">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
