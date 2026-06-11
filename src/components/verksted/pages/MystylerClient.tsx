"use client";

import "@/styles/verksted/pages/mystyler.css";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment, useThread } from "@/components/verksted/ThreadContext";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* Anledninger fra produktet selv — promptlinjen skriver dem, galleriet
   svarer. Poster law: SSR/no-JS/reduced viser første frase ferdig satt. */
const OCCASIONS = [
  "Middag i Paris",
  "Jobbintervju",
  "Strandbryllup",
  "Første dag tilbake på kontoret",
];

const LONGEST = "Første dag tilbake på kontoret";

const SHOTS = [
  {
    src: "/mystyler-1.png",
    alt: "Bygg et stilbibliotek — favorittlooks du elsker",
    n: "01",
    cap: "Stilbiblioteket — favorittene dine, samlet",
  },
  {
    src: "/mystyler-2.png",
    alt: "Bruk klærne du eier — garderobe-modus",
    n: "02",
    cap: "Garderobe-modus — klærne du allerede eier",
  },
  {
    src: "/mystyler-3.png",
    alt: "Fotorealistisk og umiskjennelig deg — fire variasjoner per prompt",
    n: "03",
    cap: "Fire variasjoner per prompt — umiskjennelig deg",
  },
  {
    src: "/mystyler-4.png",
    alt: "Middag, intervju, strand — beskriv øyeblikket, MyStyler kler deg for det",
    n: "04",
    cap: "Middag. Intervju. Strand. Ferdig.",
  },
];

// Tråden fortsetter gjennom galleriet langs 38 %-ryggraden.
const GALLERY_THREAD_D =
  "M 50 0 C 44 36 58 72 52 112 C 47 144 56 184 50 222 C 47 244 52 252 50 260";

/* ── Promptlinjen: skriver anledninger tegn for tegn når den er i syne.
   Hvilestand (SSR / no-JS / reduced motion) = første frase ferdig satt;
   med motion sletter og omskriver maskinen fra den komponerte frasen.
   Ghost-spennet reserverer plassen til den lengste frasen, så ingenting
   reflowes mens det skrives. ── */
function PromptDemo({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const mounted = useMounted();
  const armed = mounted && !reduced; // ingen setState i effekt — avledet
  const [idx, setIdx] = useState(0);
  const [n, setN] = useState(OCCASIONS[0].length); // komponert som standard
  const [phase, setPhase] = useState<"type" | "del">("type");

  useEffect(() => {
    if (!armed || !inView) return;
    const word = OCCASIONS[idx];
    let t: number;
    if (phase === "type") {
      t =
        n < word.length
          ? window.setTimeout(() => setN(n + 1), 52)
          : window.setTimeout(() => setPhase("del"), 2600);
    } else {
      t =
        n > 0
          ? window.setTimeout(() => setN(n - 1), 24)
          : window.setTimeout(() => {
              setIdx((idx + 1) % OCCASIONS.length);
              setPhase("type");
            }, 280);
    }
    return () => window.clearTimeout(t);
  }, [armed, inView, idx, n, phase]);

  return (
    <div ref={ref}>
      <p className="vk-mystyler-prompt">
        <span className="vk-mono vk-mystyler-prompt-label" aria-hidden="true">
          anledning:
        </span>
        <span className="vk-mystyler-prompt-field" aria-hidden="true">
          <span className="vk-mystyler-prompt-ghost">{LONGEST}</span>
          <span className="vk-mystyler-prompt-typed">
            {OCCASIONS[idx].slice(0, n)}
            <span className="vk-mystyler-caret" />
          </span>
        </span>
        <span className="vk-sr">
          Beskriv en anledning — for eksempel: {OCCASIONS.join(". ")}. Appen
          svarer med fire antrekk på sekunder.
        </span>
      </p>
      <p className="vk-mono vk-mystyler-prompt-out" aria-hidden="true">
        → fire antrekk · på sekunder
      </p>
    </div>
  );
}

/* ── Galleriet: fire App Store-kort som trykk på benken, med rotasjons-
   jitter fra det faste settet, hover-løft og mono-bildetekster. ── */
export function MystylerClient() {
  const { reduced } = useThread();

  return (
    <section className="vk-pg-s" aria-labelledby="mystyler-demo-h">
      <ThreadSegment
        d={GALLERY_THREAD_D}
        viewBox="0 0 100 260"
        className="vk-mystyler-thread"
      />
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker vk-mystyler-kicker" y={14}>
          Galleriet
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id="mystyler-demo-h" className="vk-display vk-pg-h2">
            Se MyStyler i bruk
          </h2>
        </Reveal>
        <Reveal as="p" className="vk-pg-sub" delay={0.1}>
          Beskriv øyeblikket — appen kler deg for det. Fire kort fra appen:
        </Reveal>
        <Reveal delay={0.16}>
          <PromptDemo reduced={reduced} />
        </Reveal>
        <ul className="vk-mystyler-shots">
          {SHOTS.map((shot, i) => (
            <li key={shot.src}>
              <Reveal delay={0.05 + i * 0.07}>
                <figure className="vk-mystyler-shot">
                  <div className="vk-mystyler-frame">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1242}
                      height={2688}
                      sizes="(max-width: 699px) 72vw, (max-width: 1023px) 46vw, 290px"
                    />
                  </div>
                  <figcaption className="vk-mono vk-mystyler-cap">
                    <span className="vk-mystyler-cap-n" aria-hidden="true">
                      {shot.n}
                    </span>
                    <span>{shot.cap}</span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="vk-chalk vk-mystyler-galchalk">
          umiskjennelig deg — det er hele poenget
        </p>
      </div>
    </section>
  );
}
