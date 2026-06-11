"use client";

import "@/styles/verksted/pages/aihaugesund.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

/* ════════════════════════════════════════════════════════════════════
   /ai-haugesund — «AI i Haugesund», the workshop's front door.
   Norwegian-only body copy (local landing page); chrome is bilingual.
   ════════════════════════════════════════════════════════════════════ */

const COORDS = "59.4138° N, 5.2679° Ø · Haugesund";

const IDAG = [
  "Excel og Sheets brukes som system",
  "Data spredt på fem systemer som ikke snakker sammen",
  "Manuell kopiering tar timer hver uke",
  "Dyre lisenser med 20 % utnyttelse",
  "Henvendelser drukner i e-postkøen",
];

const MED_WORKFLOWS = [
  "Ett samlet dashbord for hele teamet",
  "Integrasjoner som lar data flyte av seg selv",
  "AI tar tekstanalyse, kategorisering og dokumentlesing",
  "En assistent som svarer kunder døgnet rundt",
  "Ingen bindingstid — dataene blir med deg ut",
];

const TJENESTER = [
  {
    title: "Chatboter og AI-assistenter",
    body: "Svarer kundene på norsk, døgnet rundt. Med RAG henter de svar rett fra egne dokumenter — kontrakter, fakturaer, rapporter.",
    href: "/chatboter",
    cta: "les mer om chatboter",
  },
  {
    title: "Automatiserte flyter",
    body: "Rutinejobber som gjør seg selv — fra innboks til ferdig rapport. AI tar stegene som krever forståelse: kategorisering, tekstanalyse, beslutninger.",
    href: "/automatiserte-flyter",
    cta: "les mer om flyter",
  },
  {
    title: "AI-agenter",
    body: "Autonome systemer som får et mål, lager en plan og utfører. Trygt, testet og koblet til verktøyene dere allerede bruker.",
    href: "/ai-agenter",
    cta: "les mer om AI-agenter",
  },
  {
    title: "Skreddersydd programvare",
    body: "Dashbord, kundeportaler og forretningssystemer som samler data fra flere kilder i ett grensesnitt — bygget for hvordan dere faktisk jobber.",
    href: "/#tjenester",
    cta: "se alle arbeidsbenkene",
  },
];

const CASES = [
  {
    name: "Festiviteten",
    dateline: "historisk teater · haugesund",
    stamp: "I HAUGESUND",
    body: "Det historiske teateret har en nattevakt som aldri blunker: AI følger billettsalg og annonser på Meta, Google og radio — i sanntid. Svikter salget for en forestilling, kommer varselet med en gang.",
    mono: "03:12 i natt: svakt salg oppdaget → varsel sendt",
    href: "/kunder/festiviteten",
  },
  {
    name: "CSUB",
    dateline: "subsea-engineering",
    stamp: null,
    body: "Prosjektdata lå spredt i Excel-ark. Nå ligger alt i ett dashbord — med en RAG-assistent som svarer rett fra deres egne prosjektdokumenter.",
    mono: "assistent: svar funnet i prosjektarkivet",
    href: "/kunder/csub",
  },
  {
    name: "ElementLab",
    dateline: "hyperbar oksygenterapi",
    stamp: null,
    body: "Skreddersydd bookingintegrasjon som sitter direkte i nettsiden og snakker med bookingsystemet bak. Kundene finner tid, velger behandling og booker uten å forlate siden.",
    mono: "fra info til booking — uten å bytte system",
    href: "/kunder/elementlab",
  },
];

const FAKTA = [
  {
    title: "Ingen bindingstid",
    body: "Avtalen løper måned for måned. Vil du gå, går du — uten gebyr og uten diskusjon.",
  },
  {
    title: "Dataene blir med deg",
    body: "Det dere legger inn, får dere med ut — i formater det neste systemet kan lese.",
  },
  {
    title: "Dokumentert overlevering",
    body: "Alt vi bygger er dokumentert, og teamet ditt får opplæring. Du kan bytte leverandør når du vil.",
  },
];

const BRANSJER = [
  "subsea og offshore",
  "industri",
  "handel",
  "eiendom",
  "helse",
  "tjenesteyting",
];

const INTEGRASJONER = [
  "Tripletex",
  "Visma",
  "Microsoft 365",
  "Google Workspace",
  "Slack",
  "Teams",
  "HubSpot",
  "Salesforce",
  "Shopify",
  "Supabase",
  "Azure",
  "OpenAI",
  "Anthropic Claude",
  "Webhook",
];

const STEG = [
  {
    num: "01",
    title: "Vi snakker sammen",
    body: "Gratis førstesamtale — fysisk i Haugesund eller digitalt. Du forteller hva som tar for mye tid; vi sier ærlig fra om AI eller skreddersydd software er svaret.",
  },
  {
    num: "02",
    title: "Vi bygger, du ser",
    body: "Demo hver uke. Du gir tilbakemeldinger tidlig, vi justerer raskt. Ingen overraskelser ved leveranse.",
  },
  {
    num: "03",
    title: "Vi setter i drift sammen",
    body: "Opplæring er inkludert. Vi lander løsningen godt i organisasjonen og er tilgjengelige når dere har spørsmål.",
  },
  {
    num: "04",
    title: "Vi videreutvikler",
    body: "Gode systemer vokser med bedriften. Vi forbedrer og utvider etter behov — eller overleverer dokumentert når dere vil ta det videre selv.",
  },
];

// Thread stitch into the proof section, on the ~38% spine.
const BEVIS_THREAD_D =
  "M 50 0 C 46 40 56 90 50 140 C 45 180 52 215 50 240";

// Hydration probe: false on the server/hydration pass, true after mount —
// same pattern as the shared <Reveal> (poster law without setState-in-effect).
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* ── Typed coordinate line (poster law: SSR/no-JS/reduced = full text). ── */
function TypedCoords() {
  const { reduced } = useThread();
  const mounted = useMounted();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const armed = mounted && !reduced; // armed = retype after mount with motion
  const [shown, setShown] = useState(0); // only read while armed

  useEffect(() => {
    if (!armed || !inView || shown >= COORDS.length) return;
    const id = window.setTimeout(() => setShown((s) => s + 1), 34);
    return () => window.clearTimeout(id);
  }, [armed, inView, shown]);

  const typing = armed && shown < COORDS.length;

  return (
    <p ref={ref} className="vk-mono vk-aihaugesund-coords">
      {/* ghost reserves the final size so typing never reflows the hero */}
      <span className="vk-aihaugesund-coords-ghost" aria-hidden="true">
        {COORDS}
      </span>
      <span
        className="vk-aihaugesund-coords-typed"
        aria-hidden="true"
        data-typing={typing ? "true" : "false"}
      >
        {armed ? COORDS.slice(0, shown) : COORDS}
      </span>
      <span className="vk-sr">{COORDS}</span>
    </p>
  );
}

export default function AiHaugesundClient() {
  return (
    <>
      <PageHero
        kicker="Kunstig intelligens på Haugalandet"
        title="AI i Haugesund."
        lead="Workflows er et lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge."
        chalk="lyset er på — kom innom"
      >
        <TypedCoords />
      </PageHero>

      {/* ── Hvem det er for ── */}
      <section className="vk-pg-s" aria-labelledby="vk-aihaugesund-hvem-h">
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Hvem det er for
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-hvem-h" className="vk-display vk-pg-h2">
              Vokst forbi hyllevaren?
            </h2>
          </Reveal>
          <Reveal as="p" className="vk-pg-sub" delay={0.1}>
            Mange bedrifter på Haugalandet driver hverdagen på Excel, e-post og
            fem systemer som ikke snakker sammen. Det fungerer — helt til det
            ikke gjør det. Vi bygger systemet som passer måten dere faktisk
            jobber på.
          </Reveal>
          <div className="vk-pg-grid">
            <Reveal className="vk-pg-card vk-aihaugesund-ledgercol vk-aihaugesund-ledgercol--idag">
              <p className="vk-mono vk-aihaugesund-ledgerhead">I dag</p>
              <ul className="vk-aihaugesund-ledgerlist">
                {IDAG.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="vk-pg-card vk-aihaugesund-ledgercol" delay={0.08}>
              <p className="vk-mono vk-aihaugesund-ledgerhead" data-tone="glod">
                Med Workflows
              </p>
              <ul className="vk-aihaugesund-ledgerlist" data-tone="glod">
                {MED_WORKFLOWS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tjenester ── */}
      <section className="vk-pg-s" aria-labelledby="vk-aihaugesund-tjenester-h">
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Tjenester
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-tjenester-h" className="vk-display vk-pg-h2">
              Praktisk AI og skreddersydd software
            </h2>
          </Reveal>
          <Reveal as="p" className="vk-pg-sub" delay={0.1}>
            AI er ikke alltid svaret. Vi jobber med kunstig intelligens,
            automatisering og vanlig programvareutvikling — og velger riktig
            verktøy for hvert problem.
          </Reveal>
          <ul className="vk-pg-grid vk-aihaugesund-cards">
            {TJENESTER.map((t, i) => (
              <Reveal
                key={t.href}
                as="li"
                className="vk-pg-card vk-aihaugesund-card"
                delay={i * 0.06}
              >
                <h3 className="vk-pg-card-title">
                  <Link href={t.href} className="vk-aihaugesund-cardlink">
                    {t.title}
                  </Link>
                </h3>
                <p className="vk-pg-card-body">{t.body}</p>
                <p
                  className="vk-mono vk-pg-card-mono vk-aihaugesund-cardgo"
                  aria-hidden="true"
                >
                  {t.cta}{" "}
                  <span className="vk-aihaugesund-arrow">→</span>
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Lokalt bevis ── */}
      <section
        className="vk-pg-s vk-aihaugesund-s--pool"
        aria-labelledby="vk-aihaugesund-bevis-h"
      >
        <ThreadSegment
          d={BEVIS_THREAD_D}
          viewBox="0 0 100 240"
          className="vk-aihaugesund-thread"
        />
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Kundecaser
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-bevis-h" className="vk-display vk-pg-h2">
              Bygget her. I daglig bruk.
            </h2>
          </Reveal>
          <Reveal as="p" className="vk-pg-sub" delay={0.1}>
            Tre konkrete leveranser til bedrifter i regionen — Festiviteten
            ligger her i Haugesund.
          </Reveal>
          <ul className="vk-pg-grid vk-pg-grid--3 vk-aihaugesund-cards">
            {CASES.map((c, i) => (
              <Reveal
                key={c.href}
                as="li"
                className="vk-pg-card vk-aihaugesund-card"
                delay={i * 0.06}
              >
                {c.stamp ? (
                  <span className="vk-stamp vk-aihaugesund-stamp">{c.stamp}</span>
                ) : null}
                <h3 className="vk-pg-card-title">
                  <Link href={c.href} className="vk-aihaugesund-cardlink">
                    {c.name}
                  </Link>
                </h3>
                <p className="vk-mono vk-aihaugesund-dateline">{c.dateline}</p>
                <p className="vk-pg-card-body">{c.body}</p>
                <p className="vk-mono vk-aihaugesund-whisper">{c.mono}</p>
              </Reveal>
            ))}
          </ul>
          <div className="vk-aihaugesund-bevisfoot">
            <Reveal as="p" className="vk-chalk vk-aihaugesund-chalk" y={10}>
              kortreist kunstig intelligens
            </Reveal>
            <Reveal as="span" delay={0.06}>
              <Link href="/kunder" className="vk-pg-link">
                Se alle kundecaser →
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Hvorfor lokalt ── */}
      <section className="vk-pg-s" aria-labelledby="vk-aihaugesund-hvorfor-h">
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Hvorfor lokalt
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-hvorfor-h" className="vk-display vk-pg-h2">
              Hvorfor et AI-selskap i Haugesund?
            </h2>
          </Reveal>
          <div className="vk-aihaugesund-hvorfor">
            <Reveal className="vk-pg-prose vk-aihaugesund-prose" delay={0.08}>
              <p>
                AI- og softwareprosjekter krever tett samarbeid. De beste
                løsningene kommer av mange korte samtaler — ikke én lang
                kravspesifikasjon. Når vi holder til i Haugesund, kan vi møte
                deg på kontoret ditt, se hvordan dere faktisk jobber og justere
                raskt.
              </p>
              <p>
                Vi kjenner bransjene her, og vet at en god løsning må passe inn
                i hvordan bedriften allerede fungerer. Lurer du på noe? De
                vanligste spørsmålene har vi samlet i{" "}
                <Link href="/faq">FAQ-en</Link>.
              </p>
              <p className="vk-aihaugesund-bransjelabel vk-mono">
                Bransjer vi kjenner
              </p>
              <ul className="vk-mono vk-aihaugesund-chips vk-aihaugesund-chips--bransjer">
                {BRANSJER.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="vk-aihaugesund-facts" delay={0.14}>
              <p className="vk-mono vk-aihaugesund-factslabel">Åpen dør</p>
              {FAKTA.map((f) => (
                <div key={f.title} className="vk-aihaugesund-fact">
                  <h3 className="vk-aihaugesund-facttitle">{f.title}</h3>
                  <p className="vk-aihaugesund-factbody">{f.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Koblinger ── */}
      <section
        className="vk-pg-s vk-pg-s--tight"
        aria-labelledby="vk-aihaugesund-koblinger-h"
      >
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Koblinger
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-koblinger-h" className="vk-display vk-pg-h2">
              Vi kobler oss på det dere allerede bruker
            </h2>
          </Reveal>
          <Reveal as="p" className="vk-pg-sub" delay={0.1}>
            Moderne, velprøvd teknologi — TypeScript, React, Next.js og Python —
            koblet på systemene dere har. For sensitive data kjører vi innenfor
            EU, med GDPR i bakhodet fra første linje. Og vil du videre, blir
            dataene med deg ut.
          </Reveal>
          <Reveal delay={0.14}>
            <ul className="vk-mono vk-aihaugesund-chips">
              {INTEGRASJONER.map((navn) => (
                <li key={navn}>{navn}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Slik jobber vi ── */}
      <section className="vk-pg-s" aria-labelledby="vk-aihaugesund-prosess-h">
        <div className="vk-wrap">
          <Reveal as="p" className="vk-kicker" y={14}>
            Slik jobber vi
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="vk-aihaugesund-prosess-h" className="vk-display vk-pg-h2">
              Fra første prat til system i drift
            </h2>
          </Reveal>
          <ol className="vk-aihaugesund-steps">
            {STEG.map((s, i) => (
              <Reveal
                key={s.num}
                as="li"
                className="vk-aihaugesund-step"
                delay={i * 0.07}
              >
                <span className="vk-mono vk-aihaugesund-stepnum" aria-hidden="true">
                  {s.num}
                </span>
                <h3 className="vk-aihaugesund-steptitle">{s.title}</h3>
                <p className="vk-aihaugesund-stepbody">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <PageCta />
    </>
  );
}
