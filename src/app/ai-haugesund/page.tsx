import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import {
  buildBreadcrumb,
  buildService,
  HAUGESUND_AREA_SERVED,
} from "@/lib/jsonLd";
import PageHero from "@/components/visuals/PageHero";
import HighlightGrid from "@/components/visuals/HighlightGrid";
import BeforeAfter from "@/components/visuals/BeforeAfter";
import IntegrationCloud from "@/components/visuals/IntegrationCloud";
import Timeline from "@/components/visuals/Timeline";
import UseCaseGrid from "@/components/visuals/UseCaseGrid";

export const metadata: Metadata = {
  title: "AI i Haugesund — kunstig intelligens og skreddersydd software",
  description:
    "Workflows er et lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge.",
  alternates: { canonical: "/ai-haugesund" },
  openGraph: {
    title:
      "AI i Haugesund — kunstig intelligens og skreddersydd software | Workflows",
    description:
      "Praktisk AI, kunstig intelligens og skreddersydd software bygget av et team i Haugesund. For bedrifter på Haugalandet og i hele Norge.",
    url: urlFor("/ai-haugesund"),
    type: "article",
  },
  keywords: [
    "AI Haugesund",
    "AI-selskap Haugesund",
    "AI-byrå Haugesund",
    "AI-konsulent Haugesund",
    "AI-agenter Haugesund",
    "kunstig intelligens Haugesund",
    "KI Haugesund",
    "AI-løsninger Haugesund",
    "maskinlæring Haugesund",
    "software utvikling Haugesund",
    "softwareutvikling Haugesund",
    "programvareutvikling Haugesund",
    "skreddersydd software Haugesund",
    "systemutvikling Haugesund",
    "utviklingsselskap Haugesund",
    "AI Haugalandet",
    "AI Rogaland",
    "kunstig intelligens Haugalandet",
    "kunstig intelligens Rogaland",
    "software Haugalandet",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "AI i Haugesund", path: "/ai-haugesund" },
]);

const serviceJsonLd = buildService({
  name: "AI, kunstig intelligens og softwareutvikling i Haugesund",
  slug: "/ai-haugesund",
  serviceType: "AI- og softwareutvikling",
  description:
    "Lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter, chatboter, RAG-assistenter, dokumentforståelse, integrasjoner og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge.",
  areaServed: HAUGESUND_AREA_SERVED,
});

// Inline SVG icons used by the visuals on this page.
const IconChat = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
  </svg>
);
const IconFlow = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="6" height="6" rx="1.5" />
    <rect x="15" y="4" width="6" height="6" rx="1.5" />
    <rect x="9" y="14" width="6" height="6" rx="1.5" />
    <path d="M6 10v2h12v-2M12 10v4" />
  </svg>
);
const IconAgent = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
    <path d="M9 8h6" />
  </svg>
);
const IconDoc = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h6" />
  </svg>
);
const IconDash = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);
const IconPortal = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 14h4" />
  </svg>
);
const IconPin = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s7-7.6 7-13a7 7 0 1 0-14 0c0 5.4 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const IconShield = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const IconSpark = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);

const services = [
  {
    icon: IconChat,
    title: "Chatboter og AI-assistenter",
    body:
      "AI-drevne assistenter som svarer kunder, sorterer henvendelser og henter data fra systemene dine — døgnet rundt.",
  },
  {
    icon: IconDoc,
    title: "RAG og dokumentforståelse",
    body:
      "Henter svar fra interne dokumenter, fakturaer, kontrakter og rapporter. Trekker ut nøkkeldata automatisk.",
  },
  {
    icon: IconFlow,
    title: "Automatiserte flyter med AI",
    body:
      "Prosesser som kjører av seg selv. AI tar seg av stegene som krever forståelse — kategorisering, tekstanalyse, beslutninger.",
  },
  {
    icon: IconAgent,
    title: "AI-agenter",
    body:
      "Autonome systemer som får et mål, lager en plan og utfører handlinger. Trygt, testet og koblet til verktøyene dine.",
  },
  {
    icon: IconDash,
    title: "Interne verktøy og dashbord",
    body:
      "Samler data fra flere kilder i ett grensesnitt. Slutt på å hoppe mellom Excel, e-post og fem ulike systemer.",
  },
  {
    icon: IconPortal,
    title: "Kundeportaler og forretningssystemer",
    body:
      "Skreddersydde portaler, ordrehåndtering, prosjektstyring og rapportering — bygget for hvordan dere faktisk jobber.",
  },
];

const useCases = [
  {
    icon: IconDash,
    title: "CSUB — dashboard og AI-assistent",
    body:
      "Intelligent dashboard og RAG-basert AI-assistent som gir subsea-prosjektledere svar fra Excel og interne systemer på sekunder.",
  },
  {
    icon: IconSpark,
    title: "Festiviteten — AI for billettsalg",
    body:
      "AI som overvåker salg og annonser på Meta, Google og radio, med personlige assistenter tilgjengelig 24/7.",
  },
  {
    icon: IconPortal,
    title: "ElementLab — bookingintegrasjon",
    body:
      "Skreddersydd bookingintegrasjon som sitter direkte i nettsiden og snakker med backend-systemene.",
  },
];

const processSteps = [
  {
    title: "Vi snakker sammen",
    body:
      "Gratis førstesamtale — fysisk i Haugesund eller digitalt. Du forteller hva som tar for mye tid, vi finner ut om og hvordan AI eller skreddersydd software hjelper.",
  },
  {
    title: "Vi bygger, du ser",
    body:
      "Demo hver uke. Du gir tidlige tilbakemeldinger, vi justerer raskt. Ingen overraskelser ved leveranse.",
  },
  {
    title: "Vi setter i drift sammen",
    body:
      "Opplæring er inkludert. Vi lander løsningen godt i organisasjonen og er tilgjengelige når dere har spørsmål.",
  },
  {
    title: "Vi videreutvikler",
    body:
      "Gode systemer vokser med bedriften. Vi fortsetter å forbedre og utvide etter behov — eller overlater til dere når dere er klare.",
  },
];

const integrations = [
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

const heroHighlights = [
  { icon: IconPin, text: "Basert i Haugesund — møtes fysisk når det gir mening" },
  { icon: IconShield, text: "GDPR-tilpasset, EU-region for sensitive data" },
  { icon: IconSpark, text: "Riktig verktøy for jobben — AI når det gir verdi, software når det ikke gjør det" },
];

export default function AiHaugesundPage() {
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
        tag="AI Haugesund"
        title="AI, kunstig intelligens og skreddersydd software i Haugesund"
        sub="Workflows er et lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge."
        visual="haugesund"
        highlights={heroHighlights}
      />

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Hva vi tilbyr lokalt</span>
            <h2>Praktisk AI og skreddersydd software</h2>
            <p className="section__sub">
              AI er ikke alltid svaret — og er alltid en del av svaret når det gir reell verdi.
              Vi jobber både med kunstig intelligens, automatisering og tradisjonell
              programvareutvikling, og velger riktig verktøy for hvert problem.
            </p>
          </header>
          <HighlightGrid items={services} columns={3} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Når hyllevare ikke strekker til</span>
            <h2>Fra Excel og workarounds til et system som passer</h2>
            <p className="section__sub">
              Mange bedrifter på Haugalandet har vokst forbi hyllevaren sin. Skreddersydd
              software og AI lar dere jobbe slik dere faktisk gjør — uten kompromisser eller
              dyre lisenser dere knapt bruker.
            </p>
          </header>
          <BeforeAfter
            beforeTitle="I dag"
            before={[
              { label: "Excel og Sheets brukes som system" },
              { label: "Data spredt på fem systemer som ikke snakker sammen" },
              { label: "Workarounds og manuell kopiering tar timer hver uke" },
              { label: "Dyre SaaS-lisenser med 20 % utnyttelse" },
              { label: "Kundeservice mister henvendelser i e-postkøen" },
            ]}
            afterTitle="Med Workflows"
            after={[
              { label: "Ett samlet dashboard for hele teamet" },
              { label: "Integrasjoner som lar data flyte automatisk" },
              { label: "AI tar tekstanalyse, kategorisering og dokumentlesing" },
              { label: "Skreddersydd software dere eier — ingen innlåsing" },
              { label: "AI-assistent som svarer kunder døgnet rundt" },
            ]}
          />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Systemer vi integrerer</span>
            <h2>Vi kobler oss på verktøyene dere allerede bruker</h2>
            <p className="section__sub">
              Vi bygger på moderne, velprøvde teknologier — TypeScript, React, Next.js,
              Python — og integrerer med de systemene dere har. For sensitive data kjører vi
              innenfor EU. Du eier alltid koden og dataene.
            </p>
          </header>
          <IntegrationCloud items={integrations} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Eksempler fra Haugaland-bedrifter</span>
            <h2>Hva vi har bygget</h2>
            <p className="section__sub">
              Tre konkrete leveranser til bedrifter i regionen. Se alle{" "}
              <Link href="/kunder">kundecaser</Link> for flere eksempler.
            </p>
          </header>
          <UseCaseGrid items={useCases} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Slik jobber vi</span>
            <h2>Fra første samtale til ferdig system</h2>
            <p className="section__sub">
              Tett samarbeid, korte iterasjoner og ingen lange kravspesifikasjoner. Du ser
              fremdrift hver uke.
            </p>
          </header>
          <Timeline steps={processSteps} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <article className="longform longform--center">
            <h2>Hvorfor et lokalt AI-selskap i Haugesund?</h2>
            <p>
              AI- og softwareprosjekter krever tett samarbeid. De beste løsningene kommer av
              mange korte samtaler, ikke en lang kravspesifikasjon. Når vi holder til i
              Haugesund, kan vi møte deg på kontoret ditt, forstå hvordan dere faktisk jobber
              og iterere raskt. Vi kjenner lokale bransjer — subsea og offshore, industri,
              handel, eiendom, helse og tjenesteyting — og vet at en god løsning må passe inn
              i hvordan bedriften allerede fungerer.
            </p>
            <p>
              Vil du dykke dypere i én av tjenestene? Les mer om{" "}
              <Link href="/ai-agenter">AI-agenter</Link>,{" "}
              <Link href="/chatboter">chatboter</Link> og{" "}
              <Link href="/automatiserte-flyter">automatiserte flyter</Link>.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Snakk med oss om AI og software i Haugesund</h2>
            <p>
              Ta kontakt for en uforpliktende samtale om hva AI eller skreddersydd software
              kan gjøre for din bedrift.
            </p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
