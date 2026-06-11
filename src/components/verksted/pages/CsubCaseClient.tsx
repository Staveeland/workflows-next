"use client";

import "@/styles/verksted/pages/csub.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

// Hydration probe: false on the server/hydration pass, true after mount —
// the poster-law switch (same approach as <Reveal>).
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* CSUB case body — three chapters along the thread. Marginalia plates
   (Excel-pile, assistant log, after-plate) sit opaque above the spine;
   all vignettes are decorative, the prose carries the content. */

// Body spine: continues the hero hand-off at x≈47, weaves down the 38% line.
const BODY_THREAD_D =
  "M 47 0 C 44 40 56 80 52 130 C 48 175 38 210 40 260 " +
  "C 42 310 60 350 56 405 C 52 455 42 490 44 545 C 46 600 54 650 50 720";

const FACTS: ReadonlyArray<readonly [string, string]> = [
  ["Alt", "samlet på ett sted"],
  ["AI", "assistent med full datainnsikt"],
  ["Sek.", "fra spørsmål til rapport"],
];

const FILES: ReadonlyArray<{ name: string; rot: string; ark?: boolean }> = [
  { name: "status_prosjektX_v3_FINAL.xlsx", rot: "vk-rot-b" },
  { name: "budsjett (kopi av kopi).xlsx", rot: "vk-rot-c" },
  { name: "timeliste_ny_NYESTE.xlsx", rot: "vk-rot-a" },
  { name: "'Ark 37'", rot: "vk-rot-d", ark: true },
  { name: "rapport_utkast (3).xlsx", rot: "vk-rot-b" },
  { name: "kostnader_Y_endelig.xlsx", rot: "vk-rot-c" },
];

const SPEC: ReadonlyArray<readonly [string, string]> = [
  ["Sentralisert dashbord", "Samler data fra Excel-filer og eksisterende systemer."],
  ["Navigerbar prosjektoversikt", "Statistikk, økonomi og fremdrift på ett brett."],
  ["AI-chatassistent", "Svarer fra hele databasen gjennom et RAG-system."],
  ["Rapportgenerering", "Bygger rapporter etter brukerens egne preferanser."],
  ["Delegering av prosjekter", "Tydelig hvem som jobber med hva."],
  ["Filtrerbart og søkbart", "Rask navigering i alt, hele tiden."],
];

const LOG_LINES: ReadonlyArray<{ text: string; tone: "q" | "sys" | "a" }> = [
  { text: "> hva er status på prosjekt X?", tone: "q" },
  { text: "søker i prosjektarkivet …", tone: "sys" },
  { text: "treff: økonomi · fremdrift · ressursbruk", tone: "sys" },
  { text: "svar levert — kilde: egne dokumenter", tone: "a" },
];

export function CsubCaseClient() {
  const { reduced } = useThread();

  return (
    <div className="vk-csub-body">
      <ThreadSegment d={BODY_THREAD_D} viewBox="0 0 100 720" className="vk-csub-thread" />

      {/* ── Fact strip ── */}
      <section className="vk-pg-s vk-pg-s--tight vk-csub-facts-s" aria-labelledby="csub-h-fakta">
        <div className="vk-wrap">
          <h2 id="csub-h-fakta" className="vk-sr">
            Resultatet i korte trekk
          </h2>
          <Reveal>
            <ul className="vk-csub-facts">
              {FACTS.map(([value, label]) => (
                <li key={label} className="vk-csub-fact">
                  <span className="vk-display vk-csub-factval">{value}</span>
                  <span className="vk-mono vk-csub-factlabel">{label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── 01 Utfordringen ── */}
      <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="csub-h-utfordringen">
        <div className="vk-wrap vk-csub-sgrid">
          <div className="vk-csub-main">
            <Reveal as="p" className="vk-csub-num" y={12}>
              01
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="csub-h-utfordringen" className="vk-display vk-pg-h2">
                Utfordringen
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="vk-pg-prose vk-csub-prose">
                <p>
                  CSUB driver komplekse subsea-prosjekter med store mengder data spredt utover
                  utallige Excel-filer, e-poster og systemer. Prosjektlederne brukte timer på å
                  grave frem tall, sammenstille informasjon og lage rapporter for hånd.
                </p>
                <p>
                  Å få svar på «Hva er status på prosjekt X?» eller «Hvor mye har vi brukt på Y?»
                  krevde at noen satte seg ned og lette gjennom mapper og regneark.{" "}
                  <strong>Verdifull innsikt lå skjult i data ingen hadde tid til å analysere.</strong>
                </p>
              </div>
            </Reveal>
          </div>
          <aside className="vk-csub-side">
            <Reveal delay={0.12}>
              <div className="vk-csub-pile" aria-hidden="true">
                <p className="vk-mono vk-csub-pilehead">P:\Prosjekter\_diverse\gammel</p>
                <div className="vk-csub-pilefiles">
                  {FILES.map((f) => (
                    <span
                      key={f.name}
                      className={`vk-csub-file ${f.rot}${f.ark ? " vk-csub-file--ark" : ""}`}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="vk-chalk vk-csub-chalk" aria-hidden="true">
                kjenner du igjen mappa?
              </p>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* ── 02 Løsningen ── */}
      <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="csub-h-losningen">
        <div className="vk-wrap vk-csub-sgrid">
          <div className="vk-csub-main">
            <Reveal as="p" className="vk-csub-num" y={12}>
              02
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="csub-h-losningen" className="vk-display vk-pg-h2">
                Løsningen
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="vk-pg-prose vk-csub-prose">
                <p>
                  Vi bygget et sentralisert dashbord som automatisk samler og strukturerer data fra
                  CSUBs eksisterende Excel-filer og systemer. Økonomi, fremdrift og ressursbruk — alt
                  i ett oversiktlig grensesnitt,{" "}
                  <Link href="/#tjenester">skreddersydd rundt måten CSUB faktisk jobber på</Link>.
                </p>
                <p>
                  På toppen står en <Link href="/chatboter">AI-assistent</Link> med tilgang til hele
                  databasen gjennom et RAG-system. Still spørsmål på vanlig norsk, få svar med en
                  gang — en statusoppdatering, et sammendrag eller en fullstendig rapport.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <ol className="vk-csub-spec">
                {SPEC.map(([title, body], i) => (
                  <li key={title}>
                    <span className="vk-csub-specnum" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          <aside className="vk-csub-side">
            <Reveal delay={0.12}>
              <AssistantLog reduced={reduced} />
            </Reveal>
          </aside>
        </div>
      </section>

      {/* ── 03 Resultatet ── */}
      <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="csub-h-resultatet">
        <div className="vk-wrap vk-csub-sgrid">
          <div className="vk-csub-main">
            <Reveal as="p" className="vk-csub-num" y={12}>
              03
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="csub-h-resultatet" className="vk-display vk-pg-h2">
                Resultatet
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="vk-pg-prose vk-csub-prose">
                <p>
                  CSUB har gått fra timer med leting til <strong>svar på sekunder</strong>.
                  Prosjektlederne driver prosjektene fremover i stedet for å lage rapporter, og
                  ledelsen har sanntidsoversikt over hele porteføljen.
                </p>
                <p>
                  Assistenten har blitt et naturlig verktøy i hverdagen — fra raske statussjekker
                  til detaljerte rapporter for kunder. Uten å åpne en eneste Excel-fil.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <blockquote className="vk-csub-quote">
                <span className="vk-csub-quotemark" aria-hidden="true">
                  «
                </span>
                <p>
                  Før måtte vi bruke en halv dag på å sette sammen en prosjektrapport. Nå spør vi
                  bare assistenten, og den leverer på sekunder. Det er som å ha en ekstra
                  prosjektleder som aldri glemmer noe.
                </p>
              </blockquote>
            </Reveal>
          </div>
          <aside className="vk-csub-side">
            <Reveal delay={0.12}>
              <div className="vk-csub-after" aria-hidden="true">
                <p className="vk-mono vk-csub-afterhead">etter seks uker</p>
                <ul>
                  <li>alt samlet på ett sted</li>
                  <li>svar på sekunder, ikke timer</li>
                  <li>sanntidsoversikt for ledelsen</li>
                </ul>
              </div>
              <StrikeLine reduced={reduced} />
            </Reveal>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* ── Assistant log: lines type in one by one once in view.
   Poster law: SSR/no-JS/reduced motion shows all lines composed —
   the hidden state exists only after mount with motion allowed. ── */
function AssistantLog({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const total = LOG_LINES.length;
  const armed = useMounted() && !reduced;
  const [typed, setTyped] = useState(0); // lines typed since arming
  const done = typed >= total;

  useEffect(() => {
    if (!armed || !inView || done) return;
    const id = window.setTimeout(() => setTyped((t) => t + 1), typed === 0 ? 240 : 760);
    return () => window.clearTimeout(id);
  }, [armed, inView, typed, done]);

  const shown = armed ? typed : total;
  const typing = armed && shown < total;

  return (
    <div ref={ref} className="vk-csub-log" aria-hidden="true">
      <p className="vk-mono vk-csub-loghead">
        <span>csub × workflows</span>
        <span>RAG-assistent</span>
      </p>
      {LOG_LINES.map((line, i) => (
        <p
          key={line.text}
          className="vk-mono vk-csub-logline"
          data-tone={line.tone}
          data-on={!typing || i < shown ? "true" : "false"}
          data-caret={typing && i === shown - 1 ? "true" : "false"}
        >
          <span>{line.text}</span>
          <span className="vk-csub-caret" />
        </p>
      ))}
      <p className="vk-chalk vk-csub-whisper">ingen åpnet et regneark for dette svaret</p>
    </div>
  );
}

/* ── Strike line: «en halv dag» strikes through on view.
   Rest/no-JS/reduced = already struck (composed poster). ── */
function StrikeLine({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.9 });
  const armed = useMounted() && !reduced;

  const state = !armed ? "rest" : inView ? "in" : "pre";

  return (
    <p ref={ref} className="vk-mono vk-csub-strike" data-anim={state} aria-hidden="true">
      én prosjektrapport: <s>en halv dag</s> → <strong>sekunder</strong>
    </p>
  );
}
