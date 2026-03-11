"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.85, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const }
  })
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Animated words component ─── */
function AnimatedHeading({ text, className, as: Tag = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className}>
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
    </Tag>
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
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const s1 = useCounter(40, 2000, statsInView);
  const s2 = useCounter(12, 2000, statsInView);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const heroOp = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <>
      {/* ──── HERO ──── */}
      <section className="hero">
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
          <motion.div className="hero__badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <span className="hero__badge-dot" />
            Norskutviklet teknologi
          </motion.div>

          <h1 className="hero__title">
            {"Vi gjør hverdagen din".split(" ").map((w, i) => (
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
            <span className="word-wrap">
              <motion.span className="word hero__accent"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                enklere.
              </motion.span>
            </span>
          </h1>

          <motion.p className="hero__sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.0 }}>
            Vi bygger smarte systemer som tar seg av det kjedelige arbeidet —
            slik at du kan fokusere på det som faktisk betyr noe.
          </motion.p>

          <motion.div className="hero__actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <a href="#kontakt" className="btn btn--primary">
              Book en gratis prat <span className="btn__arrow">&rarr;</span>
            </a>
            <a href="#tjenester" className="btn btn--ghost">
              Se hva vi gjør
            </a>
          </motion.div>
        </motion.div>

        <div className="hero__scroll">
          <div className="hero__scroll-line"><div className="hero__scroll-dot" /></div>
        </div>
      </section>

      {/* ──── TRUST LOGOS ──── */}
      <section className="logo-strip">
        <div className="wrap">
          <motion.p className="logo-strip__label"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            Brukt av bedrifter som
          </motion.p>
          <motion.div className="logo-strip__row"
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="logo-strip__item">
              <Image src="/kunder-csub.svg" alt="CSUB" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-saga.png" alt="Saga Subsea" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-elementlab.png" alt="ElementLab" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── BIG STATEMENT ──── */}
      <section className="statement">
        <div className="wrap">
          <motion.div className="statement__inner"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <AnimatedHeading text="Du bruker for mye tid på ting som burde gått av seg selv." />
            <motion.p variants={fadeUp} custom={2}>
              Kopiere data mellom systemer. Lage rapporter manuelt. Følge opp kunder for hånd.
              Det finnes en bedre måte — vi bygger systemer som gjør disse tingene for deg,
              automatisk, døgnets rundt, uten feil.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ──── STATS BAR ──── */}
      <section className="stats" ref={statsRef}>
        <div className="wrap">
          <motion.div className="stats__grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div className="stats__item" variants={fadeUp}>
              <span className="stats__num">{s1}<span className="stats__pct">%</span></span>
              <span className="stats__label">mindre tid på repeterende oppgaver</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={1}>
              <span className="stats__num">{s2}<span className="stats__pct">+</span></span>
              <span className="stats__label">norske bedrifter bruker systemene våre daglig</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={2}>
              <span className="stats__num">24<span className="stats__pct">/7</span></span>
              <span className="stats__label">systemene jobber — også når du ikke gjør det</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── SERVICES AS FEATURE ROWS ──── */}
      <section className="features" id="tjenester">
        <div className="wrap">
          <motion.div className="statement__inner" style={{ marginBottom: "clamp(48px, 6vw, 80px)" }}
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Hva vi gjør</motion.span>
            <AnimatedHeading text="Verktøy som gjør jobben for deg" />
          </motion.div>

          {/* Feature 1 */}
          <motion.div className="feature-row"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="feature-row__content" variants={fadeUp}>
              <span className="feature-row__label">Automatisering</span>
              <h3>Slutt på kjedelig manuelt arbeid</h3>
              <p>
                Vi setter opp systemer som gjør de repeterende oppgavene automatisk.
                Rapporter lager seg selv. Kunder får svar med en gang.
                Data flyter mellom systemene dine uten at noen trenger å løfte en finger.
              </p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {["Automatiske rapporter og oppdateringer", "Svar kunder døgnets rundt", "Koble sammen alle verktøyene dine", "Kutt ut dobbeltarbeid for godt"].map((item, i) => (
                <div key={i} className="feature-row__visual-item">
                  <span className="feature-row__check">&#10003;</span>
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div className="feature-row feature-row--reverse"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="feature-row__content" variants={fadeUp}>
              <span className="feature-row__label">AI-assistent</span>
              <h3>Din digitale medarbeider</h3>
              <p>
                En smart assistent som svarer kunder, sorterer henvendelser og følger opp — akkurat som en ekte kollega, bare raskere og tilgjengelig døgnets rundt.
              </p>
              <p>
                Den lærer bedriften din å kjenne, og blir bedre over tid. Du bestemmer hva den skal gjøre, og vi sørger for at den gjør det riktig.
              </p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {["Svarer kunder på sekunder", "Sorterer og videresender henvendelser", "Følger opp automatisk", "Tilgjengelig 24/7, hele året"].map((item, i) => (
                <div key={i} className="feature-row__visual-item">
                  <span className="feature-row__check">&#10003;</span>
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div className="feature-row"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="feature-row__content" variants={fadeUp}>
              <span className="feature-row__label">Skreddersydd software</span>
              <h3>Bygget for akkurat din bedrift</h3>
              <p>
                Trenger du et system som ikke finnes? Vi bygger det. Tilpasset din bedrift, dine behov, dine prosesser — ingen kompromisser, ingen unødvendige funksjoner.
              </p>
              <p>
                Alt fra interne verktøy og kundeportaler til komplette forretningssystemer.
              </p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {["Skreddersydd til dine prosesser", "Søkbare kunnskapsbaser", "Rapporter som lager seg selv", "Vokser med bedriften din"].map((item, i) => (
                <div key={i} className="feature-row__visual-item">
                  <span className="feature-row__check">&#10003;</span>
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── HOW WE WORK ──── */}
      <section className="accent-section" id="prosess">
        <div className="wrap">
          <motion.div className="section__head section__head--left" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag tag--on-accent" variants={fadeUp}>Slik jobber vi</motion.span>
            <AnimatedHeading text="Fra idé til ferdig system på noen uker" className="accent-section__heading" />
          </motion.div>

          <motion.div className="steps" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              {
                n: "01",
                title: "Vi snakker sammen",
                desc: "Du forteller oss hva som tar for mye tid i hverdagen. Vi lytter, stiller spørsmål, og finner ut hva vi kan lage for deg. Ingen teknisk sjargong — bare en vanlig samtale.",
                label: "Gratis og uforpliktende"
              },
              {
                n: "02",
                title: "Vi bygger det",
                desc: "Du ser fremgang fra første uke. Vi viser deg hva vi lager underveis, og du gir tilbakemeldinger. Ingen overraskelser når vi er ferdige.",
                label: "Du er med hele veien"
              },
              {
                n: "03",
                title: "Det bare fungerer",
                desc: "Systemet er klart. Vi lærer deg å bruke det, og vi er her hvis noe trengs. Dine ansatte sparer tid fra dag én.",
                label: "Opplæring inkludert"
              },
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

      {/* ──── RESULTS ──── */}
      <section className="section" id="resultater">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Resultater</motion.span>
            <AnimatedHeading text="Hva kundene våre faktisk opplever" />
          </motion.div>

          <motion.div className="results-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              { title: "Mer tid til det viktige", desc: "Ansatte slipper å bruke timer på kopiering, rapporter og oppfølging. De får tiden tilbake til det de faktisk er gode på.", accent: true },
              { title: "Færre feil", desc: "Maskiner gjør ikke slurve-feil. Når data flyter automatisk, blir alt mer nøyaktig og pålitelig.", accent: false },
              { title: "Fornøyde kunder", desc: "Kunder får raskere svar, bedre oppfølging, og slipper å vente. Det merkes.", accent: false },
              { title: "Vekst uten stress", desc: "Digitale systemer vokser med bedriften din. Du kan ta på deg mer uten å måtte ansette flere.", accent: true },
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

      {/* ──── ABOUT ──── */}
      <section className="section section--elevated" id="om">
        <div className="wrap">
          <motion.div className="split" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="split__left" variants={fadeUp}>
              <span className="tag">Om oss</span>
              <AnimatedHeading text="Teknologi skal være enkelt" />
              <motion.p variants={fadeUp} custom={2}>
                Vi er et lite team fra Haugalandet som brenner for å gjøre teknologi tilgjengelig for alle.
                Du trenger ikke forstå programmering eller kunstig intelligens — det er vår jobb.
              </motion.p>
              <motion.p variants={fadeUp} custom={3}>
                Din jobb er å fortelle oss hva som tar for mye tid. Vår jobb er å fikse det.
              </motion.p>
            </motion.div>
            <motion.div className="split__right" variants={stagger}>
              {[
                ["Null sjargong", "Vi snakker norsk, ikke data-norsk. Du skal forstå alt vi sier og gjør."],
                ["Du ser resultater fort", "Ingen månedslange prosjekter i mørket. Du ser fremgang fra uke én."],
                ["Du eier alt", "Koden er din. Systemet er ditt. Ingen innlåsing, ingen skjulte avgifter."],
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

      {/* ──── CUSTOMERS ──── */}
      <section className="section" id="kunder">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Kunder</motion.span>
            <AnimatedHeading text="Se hva vi har bygget for andre" />
            <motion.p className="section__sub" variants={fadeUp} custom={3}>
              Ekte bedrifter med ekte resultater. Klikk for å lese hele historien.
            </motion.p>
          </motion.div>

          <motion.div className="clients-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}>
            {[
              { name: "CSUB", logo: "/kunder-csub.svg", slug: "csub", desc: "Automatisert prosjektstyring og rapportering for subsea-selskap. Sparer 25 timer i uken." },
              { name: "Saga Subsea", logo: "/kunder-saga.png", slug: "saga-subsea", desc: "Digital assistent som svarer kunder døgnets rundt. 50% raskere responstid." },
              { name: "ElementLab", logo: "/kunder-elementlab.png", slug: "elementlab", desc: "Søkbar kunnskapsbase for all bedriftens kunnskap. 80% raskere rapporter." },
            ].map((c, i) => (
              <motion.div key={c.slug} variants={fadeUp} custom={i}>
                <Link href={`/kunder/${c.slug}`} className="client-card">
                  <div className="client-card__logo">
                    <Image src={c.logo} alt={c.name} width={180} height={60} style={{ width: "auto", height: "40px", objectFit: "contain" }} />
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  <span className="client-card__link">Les hele casen &rarr;</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="wrap">
          <motion.div className="cta" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp}>Lurer du på om vi kan hjelpe deg?</motion.h2>
            <motion.p variants={fadeUp} custom={1}>
              Ta en uforpliktende prat med oss. Vi finner ut sammen om det gir mening — helt gratis, ingen forpliktelser.
            </motion.p>
            <motion.a href="#kontakt" className="btn btn--dark" variants={fadeUp} custom={2}>
              Ta kontakt <span className="btn__arrow">&rarr;</span>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ──── CONTACT ──── */}
      <section className="section" id="kontakt">
        <div className="wrap">
          <motion.div className="contact" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}>
            <motion.div className="contact__left" variants={fadeUp}>
              <span className="tag">Kontakt</span>
              <h2>La oss snakke sammen</h2>
              <p>Send oss en e-post eller ring. Vi svarer raskt, og første samtale er alltid gratis.</p>
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
    </>
  );
}
