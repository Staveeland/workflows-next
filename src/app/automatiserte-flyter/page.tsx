import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb, buildService } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { FlyterPipeline, FlyterProof } from "@/components/verksted/pages/FlyterClient";

export const metadata: Metadata = {
  title: "Automatiserte flyter — prosesser som kjører av seg selv",
  description:
    "Vi bygger automatiserte flyter som triggeres av hendelser og kjører uten manuell inngripen. Koble sammen systemer, flytt data, og la AI ta stegene som krever forståelse.",
  alternates: {
    canonical: "/automatiserte-flyter",
    languages: {
      "nb-NO": "/automatiserte-flyter",
      "en": "/automatiserte-flyter",
      "x-default": "/automatiserte-flyter",
    },
  },
  openGraph: {
    title: "Automatiserte flyter | Workflows",
    description:
      "Prosessautomatisering og systemintegrasjon som fjerner manuelt arbeid.",
    url: urlFor("/automatiserte-flyter"),
    type: "article",
  },
  keywords: [
    "automatiserte flyter",
    "prosessautomatisering",
    "automatisering",
    "automatisering bedrift",
    "systemintegrasjon",
    "workflow automation",
    "automatisering Haugesund",
    "n8n automatisering",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Automatiserte flyter", path: "/automatiserte-flyter" },
]);

const serviceJsonLd = buildService({
  name: "Automatiserte flyter",
  path: "/automatiserte-flyter",
  serviceType: "Prosessautomatisering",
  description:
    "Utvikling av automatiserte flyter og systemintegrasjoner som kobler sammen bedriftens verktøy og fjerner manuelt arbeid.",
});

const TRIGGERS = [
  "en e-post lander i en bestemt innboks",
  "et skjema fylles ut på nettsiden",
  "en fil legges i en mappe — OneDrive, Google Drive, Dropbox",
  "en ordre opprettes i butikksystemet",
  "en rad legges til i et regneark eller en database",
  "klokka — hver natt, hver mandag klokka åtte, hver time",
  "et webhook fra et hvilket som helst annet system",
];

const USE_CASES = [
  {
    title: "Fakturabehandling",
    body:
      "Leser innkommende fakturaer, trekker ut data, matcher mot ordre og sender til godkjenning — rett inn i regnskapssystemet.",
    mono: "innboks → regnskap",
  },
  {
    title: "Lead-routing",
    body:
      "Nye leads sorteres etter kilde og type, legges inn i CRM, og riktig selger får varsel.",
    mono: "skjema → crm → selger",
  },
  {
    title: "Rapportgenerering",
    body:
      "Henter data fra flere systemer, setter sammen rapporten og leverer den på e-post, i Slack eller Teams — til faste tidspunkter.",
    mono: "data inn → rapport ut",
  },
  {
    title: "Kundeoppfølging",
    body:
      "Etter kjøp eller booking sendes oppfølgingsmailer, anmeldelsesforespørsler og påminnelser automatisk.",
    mono: "kjøp → takk → påminnelse",
  },
  {
    title: "Datamigrering",
    body:
      "Data synkroniseres mellom systemer som ikke snakker sammen — uten manuell kopiering i mellomleddet.",
    mono: "Tripletex ↔ CRM · Sheets ↔ database",
  },
  {
    title: "Dokumentbehandling",
    body:
      "Innkommende dokumenter leses, kategoriseres og arkiveres automatisk — med AI på stegene som krever forståelse.",
    mono: "lest → kategorisert → arkivert",
  },
];

const INTEGRATIONS = [
  "Tripletex",
  "Visma",
  "PowerOffice",
  "24SevenOffice",
  "Microsoft 365",
  "Google Workspace",
  "Slack",
  "Teams",
  "HubSpot",
  "Salesforce",
  "Shopify",
  "WooCommerce",
  "Airtable",
  "Notion",
  "Monday.com",
];

export default function AutomatiserteFlyterPage() {
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
          kicker="Tjenester · Benk 02 — går av seg selv"
          title="Automatiserte flyter"
          lead="En automatisert flyt er en prosess som starter av en hendelse og går samme vei hver gang — uten at noen rører et tastatur. Vi kobler sammen systemene dine, flytter data dit de skal, og bruker AI bare der det trengs forståelse."
          chalk="fra innboks til levert — uten et tastetrykk"
        />

        {/* Star: scroll-driven pipeline (client) */}
        <FlyterPipeline />

        {/* Flyt eller agent */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-vs-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Flyt eller agent?
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-vs-h" className="vk-display vk-pg-h2">
                Flyten følger planen. Agenten lager sin egen.
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.12}>
              De fleste bedrifter bør starte med flyter — og ta i bruk agenter der
              kompleksiteten faktisk krever det.
            </Reveal>
            <div className="vk-pg-grid">
              <Reveal className="vk-pg-card" delay={0.08}>
                <h3 className="vk-pg-card-title">Automatisert flyt</h3>
                <p className="vk-pg-card-body">
                  Følger en bestemt plan, samme vei hver gang. Billigere, mer forutsigbar
                  og enklere å feilsøke.
                </p>
                <p className="vk-mono vk-pg-card-mono">forutsigbar · sporbar · rimelig</p>
              </Reveal>
              <Reveal className="vk-pg-card" delay={0.16}>
                <h3 className="vk-pg-card-title">AI-agent</h3>
                <p className="vk-pg-card-body">
                  Lager sin egen plan underveis. Mer fleksibel, men krever mer testing og
                  overvåking.
                </p>
                <Link href="/ai-agenter" className="vk-pg-link">
                  Les mer om AI-agenter →
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Før/etter */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-ba-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Før og etter
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-ba-h" className="vk-display vk-pg-h2">
                Hverdagen, med og uten flyt
              </h2>
            </Reveal>
            <div className="vk-pg-grid">
              <Reveal className="vk-pg-card" delay={0.08}>
                <h3 className="vk-pg-card-title">Uten flyt</h3>
                <ul className="vk-flyter-ba-list">
                  <li>
                    <span className="vk-flyter-ba-mark" aria-hidden="true">
                      ✕
                    </span>
                    Manuell kopiering mellom systemer
                  </li>
                  <li>
                    <span className="vk-flyter-ba-mark" aria-hidden="true">
                      ✕
                    </span>
                    Glemte oppfølginger og misforståelser
                  </li>
                  <li>
                    <span className="vk-flyter-ba-mark" aria-hidden="true">
                      ✕
                    </span>
                    Ingen oversikt over hva som er gjort
                  </li>
                </ul>
              </Reveal>
              <Reveal className="vk-pg-card vk-flyter-ba-card--ok" delay={0.16}>
                <h3 className="vk-pg-card-title">Med flyt</h3>
                <ul className="vk-flyter-ba-list">
                  <li>
                    <span className="vk-flyter-ba-mark" data-tone="ok" aria-hidden="true">
                      →
                    </span>
                    Data flyter automatisk dit den skal
                  </li>
                  <li>
                    <span className="vk-flyter-ba-mark" data-tone="ok" aria-hidden="true">
                      →
                    </span>
                    Hver hendelse følges opp, hver gang
                  </li>
                  <li>
                    <span className="vk-flyter-ba-mark" data-tone="ok" aria-hidden="true">
                      →
                    </span>
                    Logg og varsling ved feil
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Triggere */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-trigg-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Startskuddet
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-trigg-h" className="vk-display vk-pg-h2">
                Hva kan starte en flyt?
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.12}>
              En flyt ligger og lytter. Når noe skjer, går den i gang — uansett
              klokkeslett.
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="vk-flyter-trigg">
                {TRIGGERS.map((t) => (
                  <li key={t}>
                    <span className="vk-flyter-trigg-mark" aria-hidden="true">
                      →
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Bruksområder */}
        <section className="vk-pg-s" aria-labelledby="vk-flyter-bruk-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Bruksområder
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-bruk-h" className="vk-display vk-pg-h2">
                Typiske bruksområder
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="vk-pg-grid vk-pg-grid--3">
                {USE_CASES.map((u) => (
                  <article key={u.title} className="vk-pg-card">
                    <h3 className="vk-pg-card-title">{u.title}</h3>
                    <p className="vk-pg-card-body">{u.body}</p>
                    <p className="vk-mono vk-pg-card-mono">{u.mono}</p>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* AI som en del av flyten */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-ai-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Ett steg, ikke hele flyten
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-ai-h" className="vk-display vk-pg-h2">
                AI som en del av flyten
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="vk-pg-prose vk-flyter-prose">
                <p>
                  Mange flyter har steg der reglene er uklare eller varierer: «finn ut
                  hvem denne e-posten skal til», «trekk ut nøkkeldataene fra dette
                  dokumentet». Der bygger vi inn AI som ett enkelt steg i flyten.
                </p>
                <p>
                  Resten av flyten er forutsigbar kode. AI brukes bare der den er
                  nødvendig — <strong>forutsigbarhet der det er mulig, forståelse der
                  det trengs</strong>. Skal flyten også svare kundene dine, kobler vi den
                  til en <Link href="/chatboter">chatbot</Link>.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="vk-flyter-aistrip" aria-hidden="true">
                <span className="vk-flyter-ainode">hentet</span>
                <span className="vk-flyter-aisep" />
                <span className="vk-flyter-ainode">sjekket</span>
                <span className="vk-flyter-aisep" />
                <span className="vk-flyter-ainode" data-ai="true">
                  AI: forstår
                </span>
                <span className="vk-flyter-aisep" />
                <span className="vk-flyter-ainode">sendt</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Integrasjoner */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-int-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Integrasjoner
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-int-h" className="vk-display vk-pg-h2">
                Systemer vi integrerer med
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.12}>
              Vi kobler sammen de aller fleste verktøy — fra regnskap og CRM til
              samhandling og e-handel. Det gjelder også bransjeløsninger innen subsea,
              offshore, eiendom, helse og logistikk.
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="vk-flyter-chips">
                {INTEGRATIONS.map((name) => (
                  <li key={name} className="vk-flyter-chip">
                    {name}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal as="p" className="vk-chalk vk-flyter-chips-chalk" delay={0.22} y={10}>
              + alt som har et API eller webhook
            </Reveal>
          </div>
        </section>

        {/* Teknologi og pålitelighet */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="vk-flyter-tek-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Under panseret
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-flyter-tek-h" className="vk-display vk-pg-h2">
                Bygget for å tåle drift
              </h2>
            </Reveal>
            <div className="vk-pg-grid">
              <Reveal className="vk-pg-card" delay={0.08}>
                <h3 className="vk-pg-card-title">Teknologi</h3>
                <p className="vk-pg-card-body">
                  Vi bygger flytene på <strong>n8n</strong> — en open source
                  workflow-plattform — og egen kode der det gir mer kontroll eller
                  ytelse. AI-stegene kjører på OpenAI, Anthropic Claude eller andre
                  modeller, avhengig av oppgaven. Alt på robust infrastruktur: Vercel,
                  Azure, Google Cloud — innenfor EU når det er nødvendig.
                </p>
                <p className="vk-mono vk-pg-card-mono">n8n + egen kode</p>
              </Reveal>
              <Reveal className="vk-pg-card" delay={0.16}>
                <h3 className="vk-pg-card-title">Pålitelighet og overvåking</h3>
                <p className="vk-pg-card-body">
                  En flyt som feiler i stillhet er verre enn ingen flyt. Vi setter opp
                  logging, varsling ved feil og automatiske nye forsøk. Du ser hva som
                  har kjørt, hva som feilet og hvorfor — slik at du kan stole på
                  systemet.
                </p>
                <p className="vk-mono vk-pg-card-mono">logg · varsling · retry</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Bevis (client: count-up) */}
        <FlyterProof />

        <PageCta />
      </VerkstedShell>
    </>
  );
}
