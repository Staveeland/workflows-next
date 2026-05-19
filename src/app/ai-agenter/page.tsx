import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb, buildService } from "@/lib/jsonLd";
import PageHero from "@/components/visuals/PageHero";
import Timeline from "@/components/visuals/Timeline";
import HighlightGrid from "@/components/visuals/HighlightGrid";
import BeforeAfter from "@/components/visuals/BeforeAfter";
import UseCaseGrid from "@/components/visuals/UseCaseGrid";
import {
  IconAgent,
  IconEye,
  IconBrain,
  IconBolt,
  IconCheck,
  IconShield,
  IconSearch,
  IconMail,
  IconChart,
  IconHandshake,
  IconDoc,
  IconSpark,
} from "@/components/icons/ServiceIcons";

export const metadata: Metadata = {
  title: "AI-agenter — autonome assistenter for bedrifter",
  description:
    "Autonome AI-agenter som oppfatter, planlegger, handler og verifiserer. Multi-step workflows med beslutninger — fra research og salg til kundestøtte. Bygget trygt og testet for din bedrift.",
  alternates: { canonical: "/ai-agenter" },
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
  slug: "/ai-agenter",
  serviceType: "AI-agentutvikling",
  description:
    "Utvikling av autonome AI-agenter (agentic AI) som oppfatter, planlegger, handler og verifiserer — multi-step workflows som tar beslutninger og utfører oppgaver på vegne av bedrifter.",
});

const heroHighlights = [
  { icon: <IconBrain size={22} />, text: "Planlegger og handler — ikke bare svarer" },
  { icon: <IconShield size={22} />, text: "Begrensede tilganger og menneske i løkken" },
  { icon: <IconCheck size={22} />, text: "Loggføring og verifisering på hvert steg" },
];

const agentLoop = [
  {
    icon: <IconEye size={22} />,
    title: "Oppfatte",
    body: "Leser konteksten — e-post, oppgave, sanntidsdata — og forstår hva som har skjedd.",
    meta: "Steg 1",
  },
  {
    icon: <IconBrain size={22} />,
    title: "Planlegge",
    body: "Bryter målet ned i konkrete steg og velger riktige verktøy. Kan revidere planen underveis.",
    meta: "Steg 2",
  },
  {
    icon: <IconBolt size={22} />,
    title: "Handle",
    body: "Kaller APIer, oppretter ordrer, sender e-post, oppdaterer CRM. Godkjenning der det trengs.",
    meta: "Steg 3",
  },
  {
    icon: <IconCheck size={22} />,
    title: "Verifisere",
    body: "Sjekker resultatet, logger hva som ble gjort, rapporterer tilbake. Feil oppdages tidlig.",
    meta: "Steg 4",
  },
];

const agentTypes = [
  {
    icon: <IconSearch size={22} />,
    title: "Research-agent",
    body: "Graver frem og kryssjekker informasjon fra interne og eksterne kilder.",
  },
  {
    icon: <IconHandshake size={22} />,
    title: "Salgs- og lead-agent",
    body: "Kvalifiserer leads, beriker dem og oppretter oppgaver i CRM.",
  },
  {
    icon: <IconMail size={22} />,
    title: "Innboks-agent",
    body: "Klassifiserer e-post, trekker ut data, legger inn i riktig system.",
  },
  {
    icon: <IconChart size={22} />,
    title: "Rapport-agent",
    body: "Henter tall fra flere systemer og leverer ferdig presentasjon.",
  },
  {
    icon: <IconDoc size={22} />,
    title: "Dokument-agent",
    body: "Leser kontrakter og tilbud, validerer mot regler, fyller ut maler.",
  },
  {
    icon: <IconSpark size={22} />,
    title: "Overvåkings-agent",
    body: "Varsler eller handler når data eller hendelser avviker fra normalt.",
  },
];

const agentUseCases = [
  {
    icon: <IconChart size={22} />,
    title: "Kvartalsrapport på minutter",
    body: "Henter tall fra ERP, regnskap og CRM, leverer ferdig presentasjon.",
  },
  {
    icon: <IconHandshake size={22} />,
    title: "Kundestøtte som løser saker",
    body: "Oppretter ordrer, booker møter, oppdaterer kontoer — ikke bare svarer.",
  },
  {
    icon: <IconSearch size={22} />,
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

      <PageHero
        tag="Nivå 3 — AI-agenter"
        title="Autonome AI-agenter som gjør jobben"
        sub="En AI-agent får et mål, lager en plan, bruker verktøy og utfører handlinger — ikke bare svarer. Agentic AI med begrensede tilganger og menneske i løkken der det trengs."
        visual="agent"
        highlights={heroHighlights}
      />

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Slik jobber en agent</span>
            <h2>Oppfatte → planlegge → handle → verifisere</h2>
          </header>
          <Timeline steps={agentLoop} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Uten vs Med</span>
            <h2>Timer manuelt — minutter med agent</h2>
          </header>
          <BeforeAfter
            beforeTitle="Manuell prosess"
            before={[
              { label: "Hopper mellom 5 systemer for å samle data" },
              { label: "Bygger rapporter fra bunnen hver gang" },
              { label: "Glemmer steg når dagen blir hektisk" },
              { label: "Tar timer, gjøres ulikt av ulike personer" },
            ]}
            afterTitle="Med AI-agent"
            after={[
              { label: "Henter og kobler data automatisk" },
              { label: "Standardisert utkast ferdig på minutter" },
              { label: "Alle steg logges og kan revurderes" },
              { label: "Du godkjenner kun det som krever vurdering" },
            ]}
          />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Typer agenter</span>
            <h2>Agentic AI tilpasset rollen</h2>
          </header>
          <HighlightGrid items={agentTypes} columns={3} />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <header className="section__header">
            <span className="tag">Bruksområder</span>
            <h2>Hvor en agent virkelig betaler seg</h2>
          </header>
          <UseCaseGrid items={agentUseCases} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform longform--center">
            <h2>Når er det riktig med en agent?</h2>
            <p>
              Skal systemet bare <em>svare</em>, er en{" "}
              <Link href="/chatboter">chatbot</Link> raskere. Er prosessen helt forutsigbar,
              passer en <Link href="/automatiserte-flyter">automatisert flyt</Link>. AI-agenter
              kommer til sin rett der oppgaven krever <strong>beslutninger</strong>, flere steg
              og skjønn.
            </p>
            <p>
              Se hvordan vi har bygget agent-lignende systemer for{" "}
              <Link href="/kunder/csub">CSUB</Link> og{" "}
              <Link href="/kunder/festiviteten">Festiviteten</Link>.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Vil du utforske AI-agenter for din bedrift?</h2>
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
