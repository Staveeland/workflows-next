import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb, buildService } from "@/lib/jsonLd";
import PageHero from "@/components/visuals/PageHero";
import HighlightGrid from "@/components/visuals/HighlightGrid";
import BeforeAfter from "@/components/visuals/BeforeAfter";
import UseCaseGrid from "@/components/visuals/UseCaseGrid";
import IntegrationCloud from "@/components/visuals/IntegrationCloud";
import {
  IconChatbot,
  IconDoc,
  IconSearch,
  IconHandshake,
  IconBolt,
  IconShield,
  IconMail,
  IconBrain,
} from "@/components/icons/ServiceIcons";

export const metadata: Metadata = {
  title: "Chatboter for bedrifter — AI-drevne assistenter",
  description:
    "Vi bygger chatboter som svarer kunder 24/7, henter svar fra dine egne dokumenter (RAG) og integrerer med Slack, Teams, CRM og nettside. Kundeservice som er på når du ikke er.",
  alternates: { canonical: "/chatboter" },
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
  slug: "/chatboter",
  serviceType: "Chatbot-utvikling",
  description:
    "Utvikling av AI-drevne chatboter og AI-assistenter som svarer kunder 24/7, henter data fra interne systemer via RAG, og integrerer med Slack, Teams, CRM og nettside.",
});

const heroHighlights = [
  { icon: <IconBolt size={22} />, text: "Svarer på sekunder, døgnet rundt" },
  { icon: <IconBrain size={22} />, text: "RAG mot dine egne dokumenter — ikke gjetting" },
  { icon: <IconShield size={22} />, text: "EU-region og GDPR for sensitive data" },
];

const chatbotTypes = [
  {
    icon: <IconHandshake size={22} />,
    title: "Kundeservice-bot",
    body: "Svarer om produkter, ordrer og retur. Eskalerer til menneske med full kontekst.",
  },
  {
    icon: <IconDoc size={22} />,
    title: "Intern kunnskapsbot",
    body: "Hjelper ansatte å finne svar i rutiner, håndbøker og HR-dokumenter.",
  },
  {
    icon: <IconSearch size={22} />,
    title: "Dokumentsøk med RAG",
    body: "Presise, sporbare svar fra dine egne kontrakter, manualer og prosedyrer.",
  },
  {
    icon: <IconMail size={22} />,
    title: "Lead-kvalifisering",
    body: "Sorterer besøkende, varsler selger med en oppsummering.",
  },
];

const chatbotUseCases = [
  {
    icon: <IconChatbot size={22} />,
    title: "24/7 kundeservice",
    body: "Bot tar enkle henvendelser, mennesker tar resten.",
  },
  {
    icon: <IconDoc size={22} />,
    title: "Onboarding av nye ansatte",
    body: "Lavere terskel for å spørre om alt fra ferie-rutiner til blanketter.",
  },
  {
    icon: <IconSearch size={22} />,
    title: "Teknisk dokumentasjon",
    body: "Manualer blir søkbare på naturlig språk i Slack, Teams eller på mobil.",
  },
];

const chatbotIntegrations = [
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

      <PageHero
        tag="Nivå 1 — Chatboter"
        title="Chatboter og AI-assistenter for bedrifter"
        sub="En moderne chatbot svarer kunder 24/7 — på nettsiden, i Slack eller Teams — og henter svar fra dine egne dokumenter via RAG. Ikke skript, ikke gjetting."
        visual="chatbot"
        highlights={heroHighlights}
      />

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Typer chatboter</span>
            <h2>En AI-assistent for hver rolle</h2>
          </header>
          <HighlightGrid items={chatbotTypes} columns={2} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Uten vs Med</span>
            <h2>Fra ventekø til selvbetjening</h2>
          </header>
          <BeforeAfter
            beforeTitle="Manuell kundesupport"
            before={[
              { label: "Samme spørsmål besvares dusinvis av ganger" },
              { label: "Henvendelser etter åpningstid mister momentum" },
              { label: "Svar varierer mellom ansatte" },
              { label: "Support brukes opp på enkle saker" },
            ]}
            afterTitle="AI-bot med handover"
            after={[
              { label: "Bot svarer 24/7 fra dine dokumenter" },
              { label: "Komplekse saker eskaleres med full kontekst" },
              { label: "Konsistent tone og brand-stemme" },
              { label: "Support jobber bare med det som krever menneske" },
            ]}
          />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Bruksområder</span>
            <h2>Hvor en chatbot gjør størst forskjell</h2>
          </header>
          <UseCaseGrid items={chatbotUseCases} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Integrasjoner</span>
            <h2>Der kundene og kollegene allerede er</h2>
          </header>
          <IntegrationCloud items={chatbotIntegrations} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform longform--center">
            <h2>Når er en chatbot riktig — og når er det noe annet?</h2>
            <p>
              En chatbot passer når jobben er å <em>svare</em>. Skal systemet også{" "}
              <em>handle</em> — opprette ordrer, oppdatere data, bestille møter — trenger du en{" "}
              <Link href="/ai-agenter">AI-agent</Link>. Er prosessen helt forutsigbar, er en{" "}
              <Link href="/automatiserte-flyter">automatisert flyt</Link> enklere.
            </p>
            <p>
              Se hvordan vi har bygget AI-assistenter for{" "}
              <Link href="/kunder/csub">CSUB</Link> og{" "}
              <Link href="/kunder/festiviteten">Festiviteten</Link>.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Vil du utforske chatbot for din bedrift?</h2>
            <p>Book en uforpliktende samtale. Vi finner ut sammen hva som passer.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
