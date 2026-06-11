"use client";

import "@/styles/verksted/pages/chatboter.css";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/verksted/page/Reveal";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* ════════════════════════════════════════════════════════════════════
   /chatboter — typer-seksjonen med demo-benken (stjerneinteraksjonen).
   Fire scenarioer = fire bot-typer. Velg en bot, se samtalen skrive seg
   ut ord for ord — og kildelinjen lande når svaret er ferdig.
   Poster law: SSR / no-JS / reduced motion ser samtalen ferdig komponert.
   ════════════════════════════════════════════════════════════════════ */

interface Scenario {
  id: string;
  tab: string;
  time: string;
  q: string;
  a: string;
  source: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "kundeservice",
    tab: "Kundeservice",
    time: "03:12 · natt til torsdag",
    q: "Hei! Bestilte i forrige uke — hvor er pakken min?",
    a: "Ordren din ble sendt i går og er framme torsdag. Vil du ha sporingslenken?",
    source: "ordre funnet → svar gitt · eskalerer til menneske ved behov",
  },
  {
    id: "kunnskap",
    tab: "Intern kunnskap",
    time: "08:57 · mandag morgen",
    q: "Hvor mange feriedager kan jeg overføre til neste år?",
    a: "Inntil to uker, etter avtale med leder — det står i personalhåndboka, kapittel 4.",
    source: "kilde: personalhåndboka · kapittel 4",
  },
  {
    id: "dokumentsok",
    tab: "Dokumentsøk (RAG)",
    time: "13:05 · midt i møtet",
    q: "Hva sier rammeavtalen om oppsigelsestid?",
    a: "Tre måneder gjensidig, regnet fra første dag i påfølgende måned — se punkt 8.2.",
    source: "kilde: rammeavtale.pdf · punkt 8.2",
  },
  {
    id: "leads",
    tab: "Leads",
    time: "22:31 · etter stengetid",
    q: "Hva koster en chatbot for et firma på ti ansatte?",
    a: "Det kommer an på hva den skal kunne. Tre korte spørsmål, så har selgeren alt som trengs for å svare presist.",
    source: "lead kvalifisert → selger varslet med oppsummering",
  },
];

const TYPES = [
  {
    title: "Kundeservice-bot",
    body: "Svarer om produkter, ordrer og retur — døgnet rundt. Eskalerer til menneske med full kontekst når saken krever det.",
    mono: "nettside · messenger · whatsapp",
  },
  {
    title: "Intern kunnskapsbot",
    body: "Hjelper ansatte å finne svar i rutiner, håndbøker og HR-dokumenter. Lav terskel for å spørre — null leting.",
    mono: "slack · microsoft teams",
  },
  {
    title: "Dokumentsøk med RAG",
    body: "Presise, sporbare svar fra dine egne kontrakter, manualer og prosedyrer. Hvert svar peker tilbake til kilden.",
    mono: "svar med kildehenvisning",
  },
  {
    title: "Lead-kvalifisering",
    body: "Sorterer besøkende på nettsiden og varsler selger med en oppsummering — før leadet blir kaldt.",
    mono: "hubspot · salesforce · e-post",
  },
];

export function ChatboterClient() {
  const reduced = useReducedMotion() === true;
  const [active, setActive] = useState(0);
  const scenario = SCENARIOS[active] ?? SCENARIOS[0];

  return (
    <section className="vk-pg-s" aria-labelledby="chatboter-typer-h">
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker" y={14}>
          Typer chatboter
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id="chatboter-typer-h" className="vk-display vk-pg-h2">
            En AI-assistent for hver rolle
          </h2>
        </Reveal>
        <Reveal as="p" className="vk-pg-sub" delay={0.1}>
          Velg en bot og se hvordan den svarer. Eksemplene under viser hvordan en
          ferdig bot oppfører seg — trent på deres egne dokumenter, i deres tone.
        </Reveal>

        <Reveal delay={0.16}>
          <div className="vk-chatboter-demo">
            <div className="vk-chatboter-demo-head">
              <span className="vk-chatboter-demo-dot" aria-hidden="true" />
              <span className="vk-mono vk-chatboter-demo-status">
                bot: våken
                <span className="vk-chatboter-whisper" aria-hidden="true">
                  {" "}
                  · tar ikke kaffepause heller
                </span>
              </span>
              <span className="vk-mono vk-chatboter-demo-time">{scenario.time}</span>
            </div>
            <div className="vk-chatboter-tabs" role="group" aria-label="Velg chatbot-eksempel">
              {SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="vk-chatboter-tab"
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  {s.tab}
                </button>
              ))}
            </div>
            <ChatThread
              key={scenario.id}
              q={scenario.q}
              a={scenario.a}
              source={scenario.source}
              reduced={reduced}
            />
          </div>
        </Reveal>

        <ul className="vk-pg-grid vk-chatboter-list">
          {TYPES.map((t, i) => (
            <Reveal
              as="li"
              key={t.title}
              className="vk-pg-card vk-chatboter-card"
              delay={0.06 * i}
            >
              <p className="vk-mono vk-chatboter-card-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="vk-pg-card-title">{t.title}</h3>
              <p className="vk-pg-card-body">{t.body}</p>
              <p className="vk-mono vk-pg-card-mono">{t.mono}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Samtalen: spørsmål og svar skriver seg ut ord for ord når benken
   kommer i syne; kildelinjen toner inn når svaret har landet.
   Resting state (SSR / no-JS / reduced) = alt ferdig komponert. ── */
function ChatThread({
  q,
  a,
  source,
  reduced,
}: {
  q: string;
  a: string;
  source: string;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const qWords = useMemo(() => q.split(" "), [q]);
  const aWords = useMemo(() => a.split(" "), [a]);
  const total = qWords.length + aWords.length;
  const mounted = useMounted();
  const armed = mounted && !reduced; // ingen setState i effekt — avledet
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (!armed || !inView || typedCount >= total) return;
    // 26 ms per ord; lengre pust før hver boble begynner.
    const delay = typedCount === 0 ? 240 : typedCount === qWords.length ? 560 : 26;
    const id = window.setTimeout(() => setTypedCount((s) => s + 1), delay);
    return () => window.clearTimeout(id);
  }, [armed, inView, typedCount, total, qWords.length]);

  // Komponert som standard (poster law): uten mount+motion vises alt.
  const shown = armed ? typedCount : total;
  const typing = armed && shown < total;
  const qShown = Math.min(shown, qWords.length);
  const aShown = Math.max(0, shown - qWords.length);

  return (
    <div ref={ref} className="vk-chatboter-chat">
      <Bubble
        role="q"
        full={q}
        typed={qWords.slice(0, qShown).join(" ")}
        on={!typing || shown > 0}
      />
      <Bubble
        role="a"
        full={a}
        typed={aWords.slice(0, aShown).join(" ")}
        on={!typing || shown > qWords.length}
      />
      <p className="vk-mono vk-chatboter-source" data-on={typing ? "false" : "true"}>
        {source}
      </p>
    </div>
  );
}

function Bubble({
  role,
  full,
  typed,
  on,
}: {
  role: "q" | "a";
  full: string;
  typed: string;
  on: boolean;
}) {
  return (
    <p className="vk-chatboter-bubble" data-role={role} data-on={on ? "true" : "false"}>
      {/* ghost reserverer endelig størrelse så skrivingen aldri reflower benken */}
      <span className="vk-chatboter-ghost" aria-hidden="true">
        {full}
      </span>
      <span className="vk-chatboter-typed" aria-hidden="true">
        {typed}
      </span>
      <span className="vk-sr">{full}</span>
    </p>
  );
}
