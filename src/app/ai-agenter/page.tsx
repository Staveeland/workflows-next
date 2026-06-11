import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb, buildService } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { AgenterClient } from "@/components/verksted/pages/AgenterClient";

export const metadata: Metadata = {
  title: "AI-agenter — autonome assistenter for bedrifter",
  description:
    "Autonome AI-agenter som oppfatter, planlegger, handler og verifiserer. Multi-step workflows med beslutninger — fra research og salg til kundestøtte. Bygget trygt og testet for din bedrift.",
  alternates: {
    canonical: "/ai-agenter",
    languages: {
      "nb-NO": "/ai-agenter",
      "en": "/ai-agenter",
      "x-default": "/ai-agenter",
    },
  },
  openGraph: {
    title: "AI-agenter — autonome assistenter for bedrifter | Workflows",
    description:
      "Autonome AI-agenter som får et mål, lager en plan og utfører handlinger. Bygget av Workflows i Haugesund.",
    url: urlFor("/ai-agenter"),
    type: "article",
  },
  keywords: [
    "AI-agenter",
    "AI agenter",
    "autonome agenter",
    "autonome AI-agenter",
    "agentic AI",
    "AI agent bedrift",
    "AI-agent Norge",
    "AI-agent Haugesund",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "AI-agenter", path: "/ai-agenter" },
]);

const serviceJsonLd = buildService({
  name: "AI-agenter",
  path: "/ai-agenter",
  serviceType: "AI-agentutvikling",
  description:
    "Utvikling av autonome AI-agenter (agentic AI) som oppfatter, planlegger, handler og verifiserer — multi-step workflows som tar beslutninger og utfører oppgaver på vegne av bedrifter.",
});

const agentLoop = [
  {
    step: "Steg 1 / 4",
    title: "Oppfatte",
    body: "Leser konteksten — e-post, oppgave, sanntidsdata — og forstår hva som har skjedd.",
  },
  {
    step: "Steg 2 / 4",
    title: "Planlegge",
    body: "Bryter målet ned i konkrete steg og velger riktige verktøy. Kan revidere planen underveis.",
  },
  {
    step: "Steg 3 / 4",
    title: "Handle",
    body: "Kaller APIer, oppretter ordrer, sender e-post, oppdaterer CRM. Godkjenning der det trengs.",
  },
  {
    step: "Steg 4 / 4",
    title: "Verifisere",
    body: "Sjekker resultatet, logger hva som ble gjort, rapporterer tilbake. Feil oppdages tidlig.",
  },
];

const manuellProsess = [
  "Hopper mellom 5 systemer for å samle data",
  "Bygger rapporter fra bunnen hver gang",
  "Glemmer steg når dagen blir hektisk",
  "Tar timer, gjøres ulikt av ulike personer",
];

const medAgent = [
  "Henter og kobler data automatisk",
  "Standardisert utkast ferdig på minutter",
  "Alle steg logges og kan revurderes",
  "Du godkjenner kun det som krever vurdering",
];

const agentTyper = [
  {
    title: "Research-agent",
    body: "Graver frem og kryssjekker informasjon fra interne og eksterne kilder.",
  },
  {
    title: "Salgs- og lead-agent",
    body: "Kvalifiserer leads, beriker dem og oppretter oppgaver i CRM.",
  },
  {
    title: "Innboks-agent",
    body: "Klassifiserer e-post, trekker ut data, legger inn i riktig system.",
  },
  {
    title: "Rapport-agent",
    body: "Henter tall fra flere systemer og leverer ferdig presentasjon.",
  },
  {
    title: "Dokument-agent",
    body: "Leser kontrakter og tilbud, validerer mot regler, fyller ut maler.",
  },
  {
    title: "Overvåkings-agent",
    body: "Varsler eller handler når data eller hendelser avviker fra normalt.",
  },
];

const bruksomrader = [
  {
    title: "Kvartalsrapport på minutter",
    body: "Henter tall fra ERP, regnskap og CRM, leverer ferdig presentasjon.",
  },
  {
    title: "Kundestøtte som løser saker",
    body: "Oppretter ordrer, booker møter, oppdaterer kontoer — ikke bare svarer.",
  },
  {
    title: "Markeds- og konkurrentanalyse",
    body: "Leser nettsider og rapporter, leverer oppdatert konkurransebilde hver uke.",
  },
];

export default function AiAgenterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <VerkstedShell>
        <PageHero
          kicker="Tjenester · Benk 03 — på nattevakt"
          title="Autonome AI-agenter som gjør jobben"
          lead="En AI-agent får et mål, lager en plan, bruker verktøy og utfører handlinger — ikke bare svarer. Bygget med begrensede tilganger, loggføring på hvert steg og et menneske i løkken der det trengs."
          chalk="sier fra før små avvik blir dyre"
        />

        {/* Nattevakten — live agent-log (star interaction, client) */}
        <AgenterClient />

        <section className="vk-pg-s" aria-labelledby="agenter-loop-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Slik jobber en agent
            </Reveal>
            <Reveal delay={0.06}>
              <h2
                id="agenter-loop-h"
                className="vk-display vk-pg-h2"
                aria-label="Oppfatte, planlegge, handle, verifisere"
              >
                Oppfatte → planlegge → handle → verifisere
              </h2>
            </Reveal>
            <div className="vk-pg-grid vk-pg-grid--4 vk-agenter-loop">
              {agentLoop.map((steg, i) => (
                <Reveal key={steg.title} delay={i * 0.06}>
                  <article className="vk-pg-card">
                    <p className="vk-mono vk-agenter-steg-nr">{steg.step}</p>
                    <h3 className="vk-pg-card-title">{steg.title}</h3>
                    <p className="vk-pg-card-body">{steg.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal as="p" className="vk-mono vk-agenter-trygg" delay={0.12}>
              begrensede tilganger · menneske i løkken · alle steg logges
            </Reveal>
          </div>
        </section>

        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="agenter-ba-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Uten vs. med
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="agenter-ba-h" className="vk-display vk-pg-h2">
                Timer manuelt — minutter med agent
              </h2>
            </Reveal>
            <div className="vk-agenter-ba">
              <Reveal>
                <article className="vk-agenter-ba-panel" data-side="for">
                  <h3 className="vk-kicker vk-agenter-ba-h">Manuell prosess</h3>
                  <ul className="vk-agenter-ba-list">
                    {manuellProsess.map((punkt) => (
                      <li key={punkt}>
                        <span className="vk-agenter-ba-mark" aria-hidden="true">
                          —
                        </span>
                        {punkt}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
              <Reveal delay={0.08}>
                <article className="vk-agenter-ba-panel" data-side="med">
                  <h3 className="vk-kicker vk-agenter-ba-h">Med AI-agent</h3>
                  <ul className="vk-agenter-ba-list">
                    {medAgent.map((punkt) => (
                      <li key={punkt}>
                        <span className="vk-agenter-ba-mark" aria-hidden="true">
                          →
                        </span>
                        {punkt}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="vk-pg-s" aria-labelledby="agenter-typer-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Typer agenter
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="agenter-typer-h" className="vk-display vk-pg-h2">
                Agentic AI tilpasset rollen
              </h2>
            </Reveal>
            <div className="vk-pg-grid vk-pg-grid--3 vk-agenter-typer">
              {agentTyper.map((type, i) => (
                <Reveal key={type.title} delay={(i % 3) * 0.05}>
                  <article className="vk-pg-card">
                    <p className="vk-mono vk-agenter-type-nr">{`0${i + 1}`}</p>
                    <h3 className="vk-pg-card-title">{type.title}</h3>
                    <p className="vk-pg-card-body">{type.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="agenter-bruk-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Bruksområder
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="agenter-bruk-h" className="vk-display vk-pg-h2">
                Hvor en agent virkelig betaler seg
              </h2>
            </Reveal>
            <div className="vk-agenter-ledger">
              {bruksomrader.map((rad, i) => (
                <Reveal key={rad.title} className="vk-agenter-rad" delay={i * 0.05}>
                  <p className="vk-agenter-rad-nr">{`0${i + 1}`}</p>
                  <h3 className="vk-agenter-rad-title">{rad.title}</h3>
                  <p className="vk-agenter-rad-body">{rad.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="vk-pg-s" aria-labelledby="agenter-valg-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Riktig verktøy
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="agenter-valg-h" className="vk-display vk-pg-h2">
                Når er det riktig med en agent?
              </h2>
            </Reveal>
            <div className="vk-agenter-valg">
              <Reveal className="vk-agenter-valg-rad">
                <p className="vk-agenter-valg-q">Skal systemet bare svare på spørsmål?</p>
                <Link href="/chatboter" className="vk-pg-link">
                  Da er en chatbot raskere <span aria-hidden="true">→</span>
                </Link>
              </Reveal>
              <Reveal className="vk-agenter-valg-rad" delay={0.05}>
                <p className="vk-agenter-valg-q">Er prosessen helt forutsigbar?</p>
                <Link href="/automatiserte-flyter" className="vk-pg-link">
                  Da passer en automatisert flyt <span aria-hidden="true">→</span>
                </Link>
              </Reveal>
              <Reveal className="vk-agenter-valg-rad vk-agenter-valg-rad--her" delay={0.1}>
                <p className="vk-agenter-valg-q">
                  Krever oppgaven beslutninger, flere steg og skjønn?
                </p>
                <span className="vk-agenter-valg-her">
                  <span className="vk-agenter-valg-herdot" aria-hidden="true" />
                  ai-agent — du er her
                </span>
              </Reveal>
            </div>
            <Reveal as="p" className="vk-pg-prose vk-agenter-prose" delay={0.12}>
              AI-agenter kommer til sin rett der oppgaven krever <strong>beslutninger</strong>,
              flere steg og skjønn. Se hvordan vi har bygget agent-lignende systemer for{" "}
              <Link href="/kunder/csub">CSUB</Link> og{" "}
              <Link href="/kunder/festiviteten">Festiviteten</Link> — eller se alle{" "}
              <Link href="/#tjenester">fire arbeidsbenkene</Link> i verkstedet.
            </Reveal>
          </div>
        </section>

        <PageCta />
      </VerkstedShell>
    </>
  );
}
