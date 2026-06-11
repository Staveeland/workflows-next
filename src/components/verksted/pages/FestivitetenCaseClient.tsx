"use client";

import "@/styles/verksted/pages/festiviteten.css";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { useThread } from "@/components/verksted/ThreadContext";

// Hydration probe: false på server/hydrering, true etter mount (som Reveal).
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* ════════════════════════════════════════════════════════════════════
   Festiviteten-caset — interaktive biter for /kunder/festiviteten.
   To stykker: nattloggen (syklende mono-logg, teaterets nattevakt) og
   flettediagrammet (fire kanaler → én amber tråd → varsel).
   Poster law: hvilestilstand = ferdig komponert; skjulte starttilstander
   finnes kun etter mount med motion tillatt (samme mønster som
   Tjenester-vignettene på forsiden).
   ════════════════════════════════════════════════════════════════════ */

const WATCH_LINES: ReadonlyArray<readonly [string, string]> = [
  ["23:40", "teateret stenger — lyset på scenen slukkes"],
  ["03:11", "agent: leser billettsalg, meta, google og radio"],
  ["03:12", "avvik: svakt salg mot prognose"],
  ["03:12", "varsel sendt → teamet"],
  ["08:30", "teamet åpner — anbefalingen ligger klar"],
];

/* ── Nattloggen: alle linjene står alltid i DOM (stabil layout, komponert
   hvilestilstand); i view sykler den aktive linjen med blinkende caret. ── */
export function FestivitetenWatchPanel() {
  const { reduced } = useThread();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const live = !reduced && inView;
  // step 0 = hvilestilstand (siste linje aktiv, komponert plakat);
  // klokka tikker kun i view, og setState skjer i timer-callbacks.
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!live) return;
    const tick = () => setStep((s) => s + 1);
    const first = window.setTimeout(tick, 140);
    const id = window.setInterval(tick, 3600);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [live]);

  const active =
    step === 0 ? WATCH_LINES.length - 1 : (step - 1) % WATCH_LINES.length;

  return (
    <div className="vk-festiviteten-watch">
      <p className="vk-sr">
        Illustrasjon: om natta leser agenten billettsalg og annonsetall. Klokka
        03:12 oppdager den svakt salg og varsler teamet — anbefalingen ligger
        klar når teateret åpner.
      </p>
      <div
        ref={ref}
        className="vk-festiviteten-log"
        data-live={live ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="vk-festiviteten-log-head">
          <strong>
            <span className="vk-festiviteten-log-dot" />
            nattlogg
          </strong>
          <span>haugesund · natt</span>
        </div>
        <div className="vk-festiviteten-log-lines">
          {WATCH_LINES.map(([time, text], i) => (
            <p
              key={`${time}-${text}`}
              className="vk-festiviteten-log-line"
              data-active={i === active ? "true" : "false"}
            >
              <span className="vk-festiviteten-log-time">{time}</span>
              <span>{text}</span>
              <span className="vk-festiviteten-caret" />
            </p>
          ))}
        </div>
      </div>
      <p className="vk-chalk vk-festiviteten-whisper" aria-hidden="true">
        fullt hus planlegges klokka tre om natta
      </p>
    </div>
  );
}

/* ── Flettediagrammet: fire kanaler inn, én tråd ut. Banene tegner seg
   inn ved view (FRA from{} TIL naturlig tilstand); rest/no-JS/reduced
   viser ferdig tegnet plakat. ── */
const LANES = [
  "M50 0 C 50 56, 194 58, 199 108",
  "M150 0 C 150 48, 198 60, 199.6 108",
  "M250 0 C 250 48, 202 60, 200.4 108",
  "M350 0 C 350 56, 206 58, 201 108",
];
const AMBER_D = "M200 108 L200 146";

export function FestivitetenMerge() {
  const { reduced } = useThread();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const mounted = useMounted();

  // Armert kun etter mount med motion tillatt — SSR/no-JS/reduced = "rest".
  const armed = mounted && !reduced;
  const state = !armed ? "rest" : inView ? "draw" : "armed";

  return (
    <div ref={ref} className="vk-festiviteten-merge" data-draw={state}>
      <p className="vk-sr">
        Billettsystem, Meta, Google Ads og radio samles i én sanntidsoversikt —
        med varsel når salget svikter.
      </p>
      <div aria-hidden="true">
        <ul className="vk-festiviteten-merge-row">
          <li>billettsystem</li>
          <li>meta</li>
          <li>google ads</li>
          <li>radio</li>
        </ul>
        <svg viewBox="0 0 400 150" aria-hidden="true" focusable="false">
          {LANES.map((d) => (
            <path key={d} className="vk-festiviteten-lane" d={d} pathLength={1} />
          ))}
          <path className="vk-festiviteten-amber-halo" d={AMBER_D} pathLength={1} />
          <path className="vk-festiviteten-amber" d={AMBER_D} pathLength={1} />
          <circle className="vk-festiviteten-dot-halo" cx={200} cy={146} r={8} />
          <circle className="vk-festiviteten-dot" cx={200} cy={146} r={4} />
        </svg>
        <p className="vk-festiviteten-merge-out">
          <strong>én sanntidsoversikt</strong>
          <span>varsel ved svakt salg — med råd om hva som bør gjøres</span>
        </p>
      </div>
    </div>
  );
}
