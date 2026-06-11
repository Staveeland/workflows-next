import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb, buildService } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment } from "@/components/verksted/ThreadContext";
import { ChatboterClient } from "@/components/verksted/pages/ChatboterClient";

export const metadata: Metadata = {
  title: "Chatboter for bedrifter — AI-drevne assistenter",
  description:
    "Vi bygger chatboter som svarer kunder 24/7, henter svar fra dine egne dokumenter (RAG) og integrerer med Slack, Teams, CRM og nettside. Kundeservice som er på når du ikke er.",
  alternates: {
    canonical: "/chatboter",
    languages: {
      "nb-NO": "/chatboter",
      "en": "/chatboter",
      "x-default": "/chatboter",
    },
  },
  openGraph: {
    title: "Chatboter for bedrifter | Workflows",
    description:
      "AI-drevne chatboter som svarer kunder og henter data fra bedriftens egne systemer.",
    url: urlFor("/chatboter"),
    type: "article",
  },
  keywords: [
    "chatbot",
    "chatbot bedrift",
    "AI chatbot",
    "AI-assistent",
    "kundeservice chatbot",
    "RAG chatbot",
    "chatbot Haugesund",
    "chatbot Norge",
    "språkmodell chatbot",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Chatboter", path: "/chatboter" },
]);

const serviceJsonLd = buildService({
  name: "Chatboter for bedrifter",
  path: "/chatboter",
  serviceType: "Chatbot-utvikling",
  description:
    "Utvikling av AI-drevne chatboter og AI-assistenter som svarer kunder 24/7, henter data fra interne systemer via RAG, og integrerer med Slack, Teams, CRM og nettside.",
});

// Tråden gjennom RAG-rommet — samme spor (38 %) som resten av verkstedet.
const RAG_THREAD_D = "M 50 0 C 46 40 58 70 54 110 C 51 140 44 170 46 200";

const RAG_STEPS = [
  {
    n: "01",
    title: "Vi kobler til dokumentene dine",
    body: "Håndbøker, kontrakter, prislister, rutiner — boten får lesetilgang til kildene dere allerede stoler på.",
  },
  {
    n: "02",
    title: "Boten slår opp før den svarer",
    body: "Når noen spør, henter den de relevante avsnittene først. Svaret bygger på det den fant — ikke på det den tror.",
  },
  {
    n: "03",
    title: "Svaret kommer med kilde",
    body: "Hvert svar peker tilbake til dokumentet det kom fra. Du kan ettergå alt — ned til siden og punktet.",
  },
];

const UTEN_BOT = [
  "Samme spørsmål besvares dusinvis av ganger",
  "Henvendelser etter åpningstid mister momentum",
  "Svar varierer fra ansatt til ansatt",
  "Support brukes opp på enkle saker",
];

const MED_BOT = [
  "Boten svarer 24/7 — fra dine egne dokumenter",
  "Komplekse saker eskaleres til menneske, med full kontekst",
  "Samme tone og samme svar, hver gang",
  "Support jobber bare med det som faktisk krever et menneske",
];

const BRUKSOMRADER = [
  {
    title: "24/7 kundeservice",
    body: "Boten tar de enkle henvendelsene, menneskene tar resten. Ingen står i kø klokka tre om natta.",
  },
  {
    title: "Onboarding av nye ansatte",
    body: "Lavere terskel for å spørre om alt fra ferie-rutiner til blanketter — uten å forstyrre en kollega.",
  },
  {
    title: "Teknisk dokumentasjon",
    body: "Manualer blir søkbare på naturlig språk — i Slack, Teams eller på mobilen ute i felt.",
  },
];

const INTEGRASJONER = [
  "Nettside-widget",
  "Slack",
  "Microsoft Teams",
  "WhatsApp",
  "Messenger",
  "Telegram",
  "HubSpot",
  "Salesforce",
  "Tripletex",
  "Microsoft 365",
  "Google Workspace",
  "OpenAI",
  "Anthropic Claude",
  "Webhook / API",
];

const TRYGGHET = [
  {
    title: "Data i EU-region",
    body: "Modeller og lagring settes opp i EU-region når dataene krever det. Du vet hvor tingene dine bor.",
  },
  {
    title: "GDPR fra første linje",
    body: "Personvern er ikke et vedlegg vi legger ved til slutt. Det er med i tegningen fra start.",
  },
  {
    title: "Ingen lås på døra",
    body: "Ingen bindingstid. Dataene blir med deg ut, og overleveringen er dokumentert med opplæring — bytt leverandør når du vil.",
  },
];

export default function ChatboterPage() {
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
          kicker="Tjenester · Benk 01 — svarer 24/7"
          title="Chatboter for bedrifter"
          lead="En moderne chatbot er en AI-assistent som svarer kundene dine døgnet rundt — på nettsiden, i Slack eller i Teams — og henter svar fra dine egne dokumenter via RAG. Ikke skript. Ikke gjetting."
          chalk="også klokka tre om natta"
        >
          <Reveal as="p" className="vk-mono vk-chatboter-facts" delay={0.3} y={10}>
            svar på sekunder · døgnet rundt · rag mot egne dokumenter · eu-region og gdpr
          </Reveal>
        </PageHero>

        {/* Typer + demo-benken (stjerneinteraksjonen) — klientkomponent */}
        <ChatboterClient />

        {/* RAG forklart enkelt */}
        <section className="vk-pg-s" aria-labelledby="chatboter-rag-h">
          <ThreadSegment
            d={RAG_THREAD_D}
            viewBox="0 0 100 200"
            className="vk-chatboter-thread"
          />
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              RAG — på godt norsk
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-rag-h" className="vk-display vk-pg-h2">
                Boten leser før den svarer
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.1}>
              RAG står for Retrieval-Augmented Generation. På godt norsk: boten slår
              opp i dokumentene dine før den åpner munnen. Det er forskjellen på å
              gjette og å vite.
            </Reveal>
            <Reveal as="p" className="vk-mono vk-chatboter-ragline" delay={0.14} y={10}>
              spørsmål → dine dokumenter → <strong>svar med kilde</strong>
            </Reveal>
            <ul className="vk-chatboter-steps">
              {RAG_STEPS.map((step, i) => (
                <Reveal as="li" key={step.n} className="vk-chatboter-step" delay={0.08 * i}>
                  <p className="vk-mono vk-chatboter-step-n">{step.n}</p>
                  <h3 className="vk-chatboter-step-t">{step.title}</h3>
                  <p className="vk-chatboter-step-b">{step.body}</p>
                </Reveal>
              ))}
            </ul>
            <Reveal as="p" className="vk-chalk vk-chatboter-rag-chalk" delay={0.2} y={10}>
              rag = «slå opp før du svarer»
            </Reveal>
          </div>
        </section>

        {/* Uten / med bot */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="chatboter-ba-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Uten og med
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-ba-h" className="vk-display vk-pg-h2">
                Fra ventekø til selvbetjening
              </h2>
            </Reveal>
            <div className="vk-chatboter-ba">
              <Reveal className="vk-chatboter-ba-col">
                <h3 className="vk-mono vk-chatboter-ba-h">Uten bot — manuell kundesupport</h3>
                <ul className="vk-chatboter-ba-list">
                  {UTEN_BOT.map((line) => (
                    <li key={line} className="vk-chatboter-ba-item">
                      <span className="vk-chatboter-ba-mark" aria-hidden="true">
                        —
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="vk-chatboter-ba-col vk-chatboter-ba-col--med" delay={0.1}>
                <h3 className="vk-mono vk-chatboter-ba-h">Med bot — og handover</h3>
                <ul className="vk-chatboter-ba-list">
                  {MED_BOT.map((line) => (
                    <li key={line} className="vk-chatboter-ba-item">
                      <span className="vk-chatboter-ba-mark" aria-hidden="true">
                        →
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Bruksområder */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="chatboter-bruk-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Bruksområder
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-bruk-h" className="vk-display vk-pg-h2">
                Hvor en chatbot gjør størst forskjell
              </h2>
            </Reveal>
            <ul className="vk-pg-grid vk-pg-grid--3 vk-chatboter-list">
              {BRUKSOMRADER.map((u, i) => (
                <Reveal
                  as="li"
                  key={u.title}
                  className="vk-pg-card vk-chatboter-card"
                  delay={0.06 * i}
                >
                  <h3 className="vk-pg-card-title">{u.title}</h3>
                  <p className="vk-pg-card-body">{u.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Integrasjoner — delelageret */}
        <section className="vk-pg-s" aria-labelledby="chatboter-int-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Integrasjoner
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-int-h" className="vk-display vk-pg-h2">
                Der kundene og kollegene allerede er
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.1}>
              Boten flytter ikke folk til et nytt verktøy. Den flytter inn der
              samtalene allerede skjer.
            </Reveal>
            <Reveal delay={0.15}>
              <ul className="vk-chatboter-inv">
                {INTEGRASJONER.map((navn, i) => (
                  <li key={navn} className="vk-chatboter-inv-item">
                    <span className="vk-chatboter-inv-n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {navn}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal as="p" className="vk-mono vk-chatboter-inv-note" delay={0.2} y={10}>
              ser du ikke systemet deres? spør — webhook og api dekker mye
            </Reveal>
          </div>
        </section>

        {/* Trygghet */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="chatboter-trygg-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Trygghet
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-trygg-h" className="vk-display vk-pg-h2">
                Trygt nok for sensitive data
              </h2>
            </Reveal>
            <ul className="vk-pg-grid vk-pg-grid--3 vk-chatboter-list">
              {TRYGGHET.map((f, i) => (
                <Reveal
                  as="li"
                  key={f.title}
                  className="vk-pg-card vk-chatboter-card"
                  delay={0.06 * i}
                >
                  <h3 className="vk-pg-card-title">{f.title}</h3>
                  <p className="vk-pg-card-body">{f.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Når er en chatbot riktig + CSUB-bevis */}
        <section className="vk-pg-s" aria-labelledby="chatboter-nar-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Fra verkstedet
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="chatboter-nar-h" className="vk-display vk-pg-h2">
                Når er en chatbot riktig — og når er det noe annet?
              </h2>
            </Reveal>
            <div className="vk-chatboter-proof">
              <Reveal className="vk-pg-prose vk-chatboter-prose" delay={0.1}>
                <p>
                  En chatbot passer når jobben er å <strong>svare</strong>. Skal
                  systemet også <strong>handle</strong> — opprette ordrer, oppdatere
                  data, booke møter — trenger du en{" "}
                  <Link href="/ai-agenter">AI-agent</Link>. Og er prosessen helt
                  forutsigbar, uten spørsmål underveis, er en{" "}
                  <Link href="/automatiserte-flyter">automatisert flyt</Link> enklere.
                </p>
                <p>
                  Usikker på nivået? Se{" "}
                  <Link href="/#tjenester">de fire arbeidsbenkene</Link> — eller ta
                  praten, så finner vi det sammen.
                </p>
              </Reveal>
              <Reveal className="vk-chatboter-case" delay={0.16}>
                <p className="vk-mono vk-chatboter-case-date">
                  kundecase · subsea-engineering
                </p>
                <span className="vk-stamp">I daglig bruk</span>
                <p className="vk-chatboter-case-lead">
                  CSUB spør assistenten sin — og får svar rett fra egne
                  prosjektdokumenter.
                </p>
                <p className="vk-mono vk-chatboter-case-mono">
                  assistent: svar funnet i prosjektarkivet
                </p>
                <div className="vk-chatboter-case-links">
                  <Link href="/kunder/csub" className="vk-pg-link">
                    Les hele caset →
                  </Link>
                  <Link href="/kunder/festiviteten" className="vk-pg-link">
                    Se også: Festiviteten →
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <PageCta note="Book en uforpliktende prat om chatbot for dere. Som regel vet du etter 30 minutter hva som passer." />
      </VerkstedShell>
    </>
  );
}
