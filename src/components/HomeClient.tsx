"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

/* ─── Typewriter ─── */
function Typewriter({ words }: { words: readonly string[] }) {
  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [del, setDel] = useState(false);
  const word = words[idx];

  useEffect(() => {
    setIdx(0);
    setChars(0);
    setDel(false);
  }, [words]);

  useEffect(() => {
    if (reduceMotion) return;
    if (!del && chars === word.length) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && chars === 0) {
      setDel(false);
      setIdx((p) => (p + 1) % words.length);
      return;
    }
    const t = setTimeout(() => setChars((p) => p + (del ? -1 : 1)), del ? 45 : 90);
    return () => clearTimeout(t);
  }, [chars, del, word, words, reduceMotion]);

  if (reduceMotion) {
    return <span className="hero__accent">{words[0]}</span>;
  }

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
  const { lang } = useLang();
  const t = translations[lang];
  const reduceMotion = useReducedMotion();

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "0px 0px -10% 0px" });

  const s1 = useCounter(40, 2000, statsInView);
  const s2 = useCounter(12, 2000, statsInView);

  const { scrollYProgress } = useScroll();
  const heroYRaw = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const heroOpRaw = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = reduceMotion ? 0 : heroYRaw;
  const heroOp = reduceMotion ? 1 : heroOpRaw;

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
              {t.hero.title}
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <Typewriter words={t.hero.rotateWords} />
            </motion.span>
          </h1>

          <motion.p className="hero__sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.0 }}>
            {t.hero.sub}
          </motion.p>

          <motion.div className="hero__actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <a href="#kontakt" className="btn btn--primary">
              {t.hero.cta} <span className="btn__arrow">&rarr;</span>
            </a>
            <Link href="/kunder" className="btn btn--ghost">
              {t.hero.ctaSecondary}
            </Link>
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
            {t.logoStrip.label}
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
            <div className="logo-strip__item">
              <Image src="/kunder-festiviteten.png" alt="Festiviteten Haugesund" width={120} height={40} style={{ width: "auto", height: "40px" }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── 3 LEVELS OF AI ──── */}
      <section className="levels" id="nivaer">
        <div className="wrap">
          <motion.div className="section__head"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>{t.levels.tag}</motion.span>
            <AnimatedHeading text={t.levels.heading} />
            <motion.p className="section__sub" variants={fadeUp} custom={2}>
              {t.levels.sub}
            </motion.p>
          </motion.div>

          <div className="levels__staircase">
            {t.levels.items.map((level, i) => (
              <motion.div
                key={level.title}
                className={`level level--${i + 1}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                variants={fadeUp}
                custom={i}
              >
                <Link href={level.href} className="level__link">
                  <div className="level__header">
                    <span className="level__num">{level.levelLabel} {i + 1}</span>
                    <h3 className="level__title">{level.title}</h3>
                  </div>
                  <ul className="level__points">
                    {level.points.map((p, j) => (
                      <li key={j}><span className="level__arrow">&rarr;</span> {p}</li>
                    ))}
                  </ul>
                  <p className="level__example">
                    <span className="level__think">{t.levels.think}</span> {level.example}
                  </p>
                  <span className="level__cta">{t.levels.readMore} &rarr;</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div className="levels__footer"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.p className="levels__footer-text" variants={fadeUp}>
              {t.levels.footerText}
            </motion.p>
            <motion.div variants={fadeUp} custom={1}>
              <a href="#kontakt" className="btn btn--primary">
                {t.levels.footerCta} <span className="btn__arrow">&rarr;</span>
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
            <AnimatedHeading text={t.statement.heading} />
            <motion.p variants={fadeUp} custom={2}>
              {t.statement.body}
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
              <span className="stats__label">{t.stats.s1Label}</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={1}>
              <span className="stats__num">{s2}<span className="stats__pct">+</span></span>
              <span className="stats__label">{t.stats.s2Label}</span>
            </motion.div>
            <motion.div className="stats__item" variants={fadeUp} custom={2}>
              <span className="stats__num">24<span className="stats__pct">/7</span></span>
              <span className="stats__label">{t.stats.s3Label}</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── SERVICES AS FEATURE ROWS ──── */}
      <section className="features" id="tjenester">
        <div className="wrap">
          <motion.div className="statement__inner" style={{ marginBottom: "clamp(48px, 6vw, 80px)" }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>{t.features.tag}</motion.span>
            <AnimatedHeading text={t.features.heading} />
          </motion.div>

          {/* Feature 1 */}
          <motion.div className="feature-row"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
            <motion.div className="feature-row__content" variants={fadeUp}>
              <span className="feature-row__label">{t.features.rows[0].label}</span>
              <h3>{t.features.rows[0].title}</h3>
              <p>{t.features.rows[0].body}</p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {t.features.rows[0].items.map((item, i) => (
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
              <span className="feature-row__label">{t.features.rows[1].label}</span>
              <h3>{t.features.rows[1].title}</h3>
              <p>{t.features.rows[1].body1}</p>
              <p>{t.features.rows[1].body2}</p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {t.features.rows[1].items.map((item, i) => (
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
              <span className="feature-row__label">{t.features.rows[2].label}</span>
              <h3>{t.features.rows[2].title}</h3>
              <p>{t.features.rows[2].body1}</p>
              <p>{t.features.rows[2].body2}</p>
            </motion.div>
            <motion.div className="feature-row__visual" variants={fadeUp} custom={1}>
              {t.features.rows[2].items.map((item, i) => (
                <div key={i} className="feature-row__visual-item">
                  <span className="feature-row__check">&#10003;</span>
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── MID CTA ──── */}
      <motion.div className="mid-cta"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
        <motion.div variants={fadeUp}>
          <a href="#kontakt" className="btn btn--primary">
            {t.midCta.cta} <span className="btn__arrow">&rarr;</span>
          </a>
        </motion.div>
      </motion.div>

      {/* ──── HOW WE WORK ──── */}
      <section className="accent-section" id="prosess">
        <div className="wrap">
          <motion.div className="section__head section__head--left" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag tag--on-accent" variants={fadeUp}>{t.process.tag}</motion.span>
            <AnimatedHeading text={t.process.heading} className="accent-section__heading" />
          </motion.div>

          <motion.div className="steps" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {t.process.steps.map((s, i) => (
              <motion.div key={i} className="step" variants={fadeUp} custom={i}>
                <span className="step__num">0{i + 1}</span>
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
            <motion.span className="tag" variants={fadeUp}>{t.results.tag}</motion.span>
            <AnimatedHeading text={t.results.heading} />
          </motion.div>

          <motion.div className="results-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {t.results.items.map((r, i) => (
              <motion.div key={i} className="result" variants={fadeUp} custom={i}>
                <span className="result__num">0{i + 1}</span>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──── MID CTA 2 ──── */}
      <motion.div className="mid-cta"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
        <motion.p className="mid-cta__text" variants={fadeUp}>{t.midCta.text2}</motion.p>
        <motion.div variants={fadeUp} custom={1}>
          <a href="#kontakt" className="btn btn--primary">
            {t.midCta.cta} <span className="btn__arrow">&rarr;</span>
          </a>
        </motion.div>
      </motion.div>

      {/* ──── ABOUT ──── */}
      <section className="section section--elevated" id="om">
        <div className="wrap">
          <motion.div className="split" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
            <motion.div className="split__left" variants={fadeUp}>
              <span className="tag">{t.about.tag}</span>
              <AnimatedHeading text={t.about.heading} />
              <motion.p variants={fadeUp} custom={2}>
                {t.about.body1}
              </motion.p>
              <motion.p variants={fadeUp} custom={3}>
                {t.about.body2}
              </motion.p>
            </motion.div>
            <motion.div className="split__right" variants={stagger}>
              {t.about.values.map(([title, desc], i) => (
                <motion.div key={i} className="val" variants={fadeUp} custom={i}>
                  <div className="val__bar" />
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

      {/* ──── TECH PARTNERS ──── */}
      <section className="partners">
        <div className="wrap">
          <motion.div className="partners__inner"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.p className="partners__label" variants={fadeUp}>{t.partners.label}</motion.p>
            <motion.div className="partners__row" variants={fadeUp} custom={1}>
              {["OpenAI", "Anthropic", "Microsoft", "Google Cloud", "n8n", "Vercel"].map((name) => (
                <span key={name} className="partners__badge">{name}</span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──── CUSTOMERS ──── */}
      <section className="section" id="kunder">
        <div className="wrap">
          <motion.div className="section__head" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            <motion.span className="tag" variants={fadeUp}>{t.clientsSection.tag}</motion.span>
            <AnimatedHeading text={t.clientsSection.heading} />
            <motion.p className="section__sub" variants={fadeUp} custom={3}>
              {t.clientsSection.sub}
            </motion.p>
          </motion.div>

          <motion.div className="clients-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {t.clientsSection.clients.map((c, i) => (
              <motion.div key={c.slug} variants={fadeUp} custom={i}>
                <Link href={`/kunder/${c.slug}`} className="client-card">
                  <div className="client-card__logo">
                    <Image src={c.logo} alt={c.name} width={180} height={60} style={{ width: "auto", height: "40px", objectFit: "contain" }} />
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  <span className="client-card__link">{t.clientsSection.readMore} &rarr;</span>
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
            <motion.span className="tag tag--on-accent" variants={fadeUp}>{t.faq.tag}</motion.span>
            <AnimatedHeading text={t.faq.heading} className="accent-section__heading" />
          </motion.div>

          <motion.div className="faq-list faq-list--featured" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={stagger}>
            {t.faq.featured.map((faq, fi) => (
              <motion.details key={faq.q} className="faq-item" variants={fadeUp} custom={fi}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </motion.details>
            ))}
          </motion.div>

          <motion.div className="faq-see-all" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20% 0px -20% 0px" }} variants={fadeUp}>
            <Link href={t.faq.seeAllHref} className="btn btn--dark">
              {t.faq.seeAllLabel} <span className="btn__arrow">&rarr;</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ──── CONTACT ──── */}
      <section className="section" id="kontakt">
        <div className="wrap">
          <motion.div className="contact" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-25% 0px -25% 0px" }} variants={stagger}>
            <motion.div className="contact__left" variants={fadeUp}>
              <span className="tag">{t.contact.tag}</span>
              <h2>{t.contact.heading}</h2>
              <p>{t.contact.body}</p>
            </motion.div>
            <motion.div className="contact__right" variants={fadeUp} custom={1}>
              <a href="mailto:petter@workflows.no" className="contact__card">
                <div className="contact__person">
                  <div className="contact__avatar">PS</div>
                  <div>
                    <strong>Petter Staveland</strong>
                    <span>{t.contact.role}</span>
                  </div>
                </div>
                <div className="contact__email-row">
                  <span className="contact__email-label">petter@workflows.no</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </div>
              </a>
              <a href="tel:+4793077915" className="contact__card contact__card--phone">
                <div className="contact__email-row">
                  <span className="contact__email-label">+47 930 77 915</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
