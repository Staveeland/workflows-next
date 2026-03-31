"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

/* ─── Typewriter ─── */
const ROTATE_WORDS = ["enklere", "smartere", "raskere", "billigere"];

function Typewriter() {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [del, setDel] = useState(false);
  const word = ROTATE_WORDS[idx];

  useEffect(() => {
    if (!del && chars === word.length) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && chars === 0) {
      setDel(false);
      setIdx((p) => (p + 1) % ROTATE_WORDS.length);
      return;
    }
    const t = setTimeout(() => setChars((p) => p + (del ? -1 : 1)), del ? 45 : 90);
    return () => clearTimeout(t);
  }, [chars, del, word]);

  return (
    <span className="hero__accent typewriter">
      {word.slice(0, chars)}
      <span className="typewriter__cursor" />
    </span>
  );
}

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }
  })
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

/* ─── Animated words component ─── */
function AnimatedHeading({ text, className, as: Tag = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30% 0px -30% 0px" });
  return (
    <Tag ref={ref} className={className}>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "inline-block" }}
      >
        {text}
      </motion.span>
    </Tag>
  );
}

/* ─── Counter hook (uses rAF instead of setInterval) ─── */
function useCounter(end: number, dur: number, active: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / dur, 1);
      setN(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, dur, active]);
  return n;
}

/* ═══════════════════════════════════════ */
export default function Home() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-30% 0px -30% 0px" });

  const s1 = useCounter(40, 2000, statsInView);
  const s2 = useCounter(12, 2000, statsInView);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const heroOp = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <>
      {/* ──── HERO ──── */}
      <section className="hero">
        <div className="hero__shape hero__shape--1" />
        <div className="hero__shape hero__shape--2" />
        <div className="hero__shape hero__shape--3" />

        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOp }}>
          <h1 className="hero__title">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "inline-block" }}>
              Vi gjør hverdagen din
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Typewriter />
            </motion.span>
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
            viewport={{ once: true, margin: "-20% 0px -20% 0px" }} transition={{ duration: 0.6 }}>
            Brukt av bedrifter som
          </motion.p>
          <motion.div className="logo-strip__row"
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px -20% 0px" }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="logo-strip__item">
              <Image src="/kunder-csub.svg" alt="CSUB" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-saga.png" alt="Saga Subsea" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-elementlab.png" alt="ElementLab" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-port.webp" alt="Port 5561" width={120} height={40} style={{ width: "auto", height: "32px" }} />
            </div>
            <div className="logo-strip__item">
              <Image src="/kunder-nyholmen.png" alt="Nyholmen" width={120} height={40} style={{ width: "auto", height: "56px" }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── 3 LEVELS OF AI ──── */}
      <section className="levels" id="nivaer">
        <div className="wrap">
          <motion.div className="section__head"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Hva vi bygger</motion.span>
            <AnimatedHeading text="Tre nivåer av AI" />
            <motion.p className="section__sub" variants={fadeUp} custom={2}>
              Fra enkel chatbot til autonom agent — vi bygger løsninger på alle nivåer.
            </motion.p>
          </motion.div>

          <div className="levels__staircase">
            {[
              {
                n: 1,
                title: "Chatboter",
                points: [
                  "Den er koblet på språkmodeller og data",
                  "Du snakker med den via et tilpasset chatvindu",
                  "Den svarer på spørsmål basert på tilgjengelig data",
                ],
                example: "En kundeservice-chatbot som svarer på spørsmål basert på bedriftens dokumentasjon.",
              },
              {
                n: 2,
                title: "Automatiserte flyter",
                points: [
                  "Trigges av en hendelse og følger et fast flyt",
                  "Kjører automatisk uten menneskelig input",
                  "AI er bakt inn i ett eller flere steg i flyten",
                ],
                example: "Et system som automatisk leser innkommende fakturaer, trekker ut nøkkeldata, og legger det inn i regnskapssystemet.",
              },
              {
                n: 3,
                title: "Agenter",
                points: [
                  "Får et mål og tilgang til verktøy og data",
                  "Lager selv en plan og justerer underveis",
                  "Tar beslutninger og utfører handlinger",
                ],
                example: "Du sier 'lag kvartalsrapport for Q1' og den henter tallene, analyserer trender, lager grafer, skriver sammendrag og lager en powerpoint.",
              },
            ].map((level, i) => (
              <motion.div
                key={level.n}
                className={`level level--${level.n}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="level__header">
                  <span className="level__num">Nivå {level.n}</span>
                  <h3 className="level__title">{level.title}</h3>
                </div>
                <ul className="level__points">
                  {level.points.map((p, j) => (
                    <li key={j}><span className="level__arrow">&rarr;</span> {p}</li>
                  ))}
                </ul>
                <p className="level__example">
                  <span className="level__think">Tenk:</span> {level.example}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div className="levels__footer"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.p className="levels__footer-text" variants={fadeUp}>
              Vi bygger på alle tre nivåene.
            </motion.p>
            <motion.div variants={fadeUp} custom={1}>
              <a href="#kontakt" className="btn btn--primary">
                Book en gratis prat <span className="btn__arrow">&rarr;</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── BIG STATEMENT ──── */}
      <section className="statement">
        <div className="wrap">
          <motion.div className="statement__inner"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
            <AnimatedHeading text="Uansett om du trenger en chatbot som svarer kunder, automatiserte flyter som fjerner dobbeltarbeid, eller en AI-agent som jobber for deg — vi bygger det." />
            <motion.p variants={fadeUp} custom={2}>
              Du forteller oss hva som tar for mye tid. Vi finner ut hvilket nivå som løser det, og bygger systemet for deg — automatisk, døgnets rundt, uten feil.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ──── STATS BAR ──── */}
      <section className="stats" ref={statsRef}>
        <div className="wrap">
          <motion.div className="stats__grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
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
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Hva vi gjør</motion.span>
            <AnimatedHeading text="Verktøy som gjør jobben for deg" />
          </motion.div>

          {/* Feature 1 */}
          <motion.div className="feature-row"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
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
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
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
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
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
          <motion.div className="section__head section__head--left" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag tag--on-accent" variants={fadeUp}>Slik jobber vi</motion.span>
            <AnimatedHeading text="Fra idé til ferdig system på noen uker" className="accent-section__heading" />
          </motion.div>

          <motion.div className="steps" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
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
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Resultater</motion.span>
            <AnimatedHeading text="Hva kundene våre faktisk opplever" />
          </motion.div>

          <motion.div className="results-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {[
              { title: "Mer tid til det viktige", desc: "Ansatte slipper å bruke timer på kopiering, rapporter og oppfølging. De får tiden tilbake til det de faktisk er gode på." },
              { title: "Færre feil", desc: "Maskiner gjør ikke slurve-feil. Når data flyter automatisk, blir alt mer nøyaktig og pålitelig." },
              { title: "Fornøyde kunder", desc: "Kunder får raskere svar, bedre oppfølging, og slipper å vente. Det merkes." },
              { title: "Vekst uten stress", desc: "Digitale systemer vokser med bedriften din. Du kan ta på deg mer uten å måtte ansette flere." },
            ].map((r, i) => (
              <motion.div key={i} className="result" variants={fadeUp} custom={i}>
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
          <motion.div className="split" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
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
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>Kunder</motion.span>
            <AnimatedHeading text="Se hva vi har bygget for andre" />
            <motion.p className="section__sub" variants={fadeUp} custom={3}>
              Ekte bedrifter med ekte resultater. Klikk for å lese hele historien.
            </motion.p>
          </motion.div>

          <motion.div className="clients-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
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

      {/* ──── FAQ ──── */}
      <section className="cta-section" id="faq">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag tag--on-accent" variants={fadeUp}>FAQ</motion.span>
            <AnimatedHeading text="Ofte stilte spørsmål" className="accent-section__heading" />
          </motion.div>

          <motion.div className="faq-layout" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {[
              {
                category: "Om tjenestene",
                questions: [
                  {
                    q: "Hva slags bedrifter jobber dere med?",
                    a: "Vi jobber med bedrifter i alle størrelser — fra småbedrifter med 5 ansatte til større selskaper med hundrevis. Fellesnevneren er at de har manuelle prosesser som tar for mye tid. Vi har erfaring fra bransjer som subsea, forskning, eiendom, handel og tjenesteyting.",
                  },
                  {
                    q: "Hva er skreddersydd software?",
                    a: "Skreddersydd software er programvare bygget spesifikt for din bedrift og dine prosesser. I motsetning til hyllevare som Salesforce eller HubSpot, får du et system som passer perfekt til måten du jobber på — uten unødvendige funksjoner eller begrensninger.",
                  },
                  {
                    q: "Hva er en digital assistent?",
                    a: "En digital assistent er et AI-drevet system som kan håndtere oppgaver som kundeservice, oppfølging, rapportering eller databehandling — automatisk og døgnets alle timer. Tenk på det som en kollega som aldri sover, aldri glemmer, og aldri gjør slurve-feil.",
                  },
                  {
                    q: "Kan dere integrere med systemene vi allerede bruker?",
                    a: "Ja. Vi spesialiserer oss på å koble sammen eksisterende verktøy. Enten du bruker Tripletex, Visma, Microsoft 365, Google Workspace, Slack eller bransjespesifikke systemer — vi bygger broer mellom dem slik at data flyter automatisk.",
                  },
                  {
                    q: "Trenger vi teknisk kompetanse internt?",
                    a: "Nei. Vi bygger systemer som er enkle å bruke for alle. Du trenger ikke forstå teknologien — bare resultatene. Vi tar oss av alt det tekniske, og gir grundig opplæring når systemet er klart.",
                  },
                ],
              },
              {
                category: "Pris og prosess",
                questions: [
                  {
                    q: "Hva koster det?",
                    a: "Prisen avhenger av prosjektets omfang og størrelse. Vi gir alltid et fast pristilbud etter en uforpliktende første samtale — slik at du vet nøyaktig hva du betaler før du bestemmer deg.",
                  },
                  {
                    q: "Hvor lang tid tar det?",
                    a: "De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser deg demoer underveis slik at du kan gi tilbakemeldinger tidlig.",
                  },
                  {
                    q: "Hva skjer etter lansering?",
                    a: "Vi tilbyr support og vedlikehold så lenge du trenger det. Alle systemer leveres med dokumentasjon og opplæring. Hvis noe trenger justering eller du vil legge til nye funksjoner senere, er vi tilgjengelige.",
                  },
                  {
                    q: "Er den første samtalen virkelig gratis?",
                    a: "Ja, helt gratis og uforpliktende. Vi setter oss ned (fysisk eller digitalt) og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre — uten noen forpliktelser.",
                  },
                ],
              },
              {
                category: "Teknologi og sikkerhet",
                questions: [
                  {
                    q: "Er dataene våre trygge?",
                    a: "Absolutt. Vi følger beste praksis for datasikkerhet og personvern. Alle systemer bygges med kryptering, tilgangskontroll og sikker hosting. Vi er kjent med GDPR-kravene og sørger for at løsningene er i samsvar med norske og europeiske regelverk.",
                  },
                  {
                    q: "Bruker dere kunstig intelligens (AI)?",
                    a: "Ja, der det gir verdi. Vi bruker AI for oppgaver som tekstforståelse, automatisk kategorisering, chatboter og dataanalyse. Men vi bruker det ikke bare for å være hippe — AI er et verktøy, og vi bruker det kun når det faktisk løser et problem bedre enn alternativene.",
                  },
                  {
                    q: "Kan systemet skalere når vi vokser?",
                    a: "Ja. Vi bygger med skalering i tankene fra dag én. Enten du dobler antall ansatte, får ti ganger så mange kunder, eller ekspanderer til nye markeder — systemene våre vokser med deg uten at du trenger å bygge på nytt.",
                  },
                ],
              },
            ].map((cat, ci) => (
              <motion.div key={cat.category} className="faq-category" variants={fadeUp} custom={ci}>
                <h2>{cat.category}</h2>
                <div className="faq-list">
                  {cat.questions.map((faq) => (
                    <details key={faq.q} className="faq-item">
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── CONTACT ──── */}
      <section className="section" id="kontakt">
        <div className="wrap">
          <motion.div className="contact" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
            <motion.div className="contact__left" variants={fadeUp}>
              <span className="tag">Kontakt</span>
              <h2>La oss snakke sammen</h2>
              <p>Send oss en e-post eller ring. Vi svarer raskt, og første samtale er alltid gratis.</p>
            </motion.div>
            <motion.div className="contact__right" variants={fadeUp} custom={1}>
              <a href="mailto:petter@workflows.no" className="contact__card">
                <div className="contact__person">
                  <div className="contact__avatar">PS</div>
                  <div>
                    <strong>Petter Staveland</strong>
                    <span>Daglig leder</span>
                  </div>
                </div>
                <div className="contact__email-row">
                  <span className="contact__email-label">petter@workflows.no</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
