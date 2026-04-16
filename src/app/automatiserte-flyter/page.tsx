import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "Automatiserte flyter — prosesser som kjører av seg selv",
  description:
    "Vi bygger automatiserte flyter som triggeres av hendelser og kjører uten manuell inngripen. Koble sammen systemer, flytt data, og la AI ta stegene som krever forståelse.",
  alternates: { canonical: "/automatiserte-flyter" },
  openGraph: {
    title: "Automatiserte flyter | Workflows",
    description:
      "Prosessautomatisering og systemintegrasjon som fjerner manuelt arbeid.",
    url: `${SITE_URL}/automatiserte-flyter`,
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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Automatiserte flyter",
      item: `${SITE_URL}/automatiserte-flyter`,
    },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Prosessautomatisering",
  name: "Automatiserte flyter",
  description:
    "Utvikling av automatiserte flyter og systemintegrasjoner som kobler sammen bedriftens verktøy og fjerner manuelt arbeid.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/automatiserte-flyter`,
};

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

      <section className="page-hero">
        <div className="wrap">
          <span className="tag">Nivå 2 — Automatiserte flyter</span>
          <h1>Automatiserte flyter</h1>
          <p className="page-hero__sub">
            En automatisert flyt er en prosess som triggeres av en hendelse og følger en fast
            sekvens uten menneskelig input. Vi bygger flyter som kobler sammen systemene dine,
            flytter data og bruker AI der det gir mening.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Hva er en automatisert flyt?</h2>
            <p>
              En flyt består av tre deler: en <strong>trigger</strong> (noe som skjer),
              en rekke <strong>steg</strong> (data behandles, systemer oppdateres,
              varsler sendes), og et <strong>resultat</strong> (noe er ferdig). Flyten kjører
              samme vei hver gang — det er det som gjør den forutsigbar og pålitelig.
            </p>
            <p>
              Forskjellen på en flyt og en <Link href="/ai-agenter">AI-agent</Link> er at flyten
              følger en bestemt plan, mens agenten lager sin egen. Flyter er billigere, mer
              forutsigbare og enklere å feilsøke. Agenter er mer fleksible, men krever mer
              testing og overvåking. De fleste bedrifter bør starte med flyter og bruke agenter
              der kompleksiteten faktisk krever det.
            </p>

            <h2>Typiske triggere</h2>
            <ul>
              <li>En e-post kommer inn i en bestemt innboks.</li>
              <li>Et skjema fylles ut på nettsiden.</li>
              <li>En fil legges i en mappe (OneDrive, Google Drive, Dropbox).</li>
              <li>En ordre opprettes i butikksystemet.</li>
              <li>En rad legges til i et regneark eller en database.</li>
              <li>Tid — hver natt, hver mandag klokken åtte, hver time.</li>
              <li>Et webhook fra et annet system.</li>
            </ul>

            <h2>Typiske bruksområder</h2>
            <ul>
              <li>
                <strong>Fakturabehandling</strong> — leser inn innkommende fakturaer, trekker ut
                data, matcher mot ordrer, sender til godkjenning, legger inn i regnskapssystemet.
              </li>
              <li>
                <strong>Lead-routing</strong> — nye leads sorteres etter kilde og type, legges
                inn i CRM, og riktig selger får varsling.
              </li>
              <li>
                <strong>Rapportgenerering</strong> — data hentes fra flere systemer, settes
                sammen, og leveres som e-post eller i Slack/Teams til faste tidspunkter.
              </li>
              <li>
                <strong>Kundeoppfølging</strong> — etter kjøp eller booking sendes
                oppfølgingsmailer, anmeldelsesforespørsler eller påminnelser automatisk.
              </li>
              <li>
                <strong>Datamigrering</strong> — data synkroniseres mellom systemer som ikke
                snakker sammen (Tripletex ↔ CRM, Google Sheets ↔ database).
              </li>
              <li>
                <strong>Dokumentbehandling</strong> — innkommende dokumenter leses, kategoriseres
                og arkiveres automatisk, med AI på stegene som krever forståelse.
              </li>
            </ul>

            <h2>AI som en del av flyten</h2>
            <p>
              Mange flyter inneholder steg der reglene er uklare eller varierer — for eksempel
              «finn ut hvem denne e-posten skal sendes til» eller «trekk ut nøkkeldataene fra
              dette dokumentet». Her bygger vi inn AI som et enkeltsteg i flyten. Resten av
              flyten er forutsigbar kode, og AI-en brukes bare der den er nødvendig. Det gir
              deg det beste fra begge verdener: forutsigbarhet der det er mulig, forståelse
              der det trengs.
            </p>

            <h2>Systemer vi integrerer med</h2>
            <p>
              Vi kobler sammen de aller fleste verktøy: Tripletex, Visma, PowerOffice, 24SevenOffice,
              Microsoft 365, Google Workspace, Slack, Teams, HubSpot, Salesforce, Shopify, WooCommerce,
              Airtable, Notion, Monday.com — og hvilket som helst system med et API eller webhook.
              Også bransjespesifikke systemer innen subsea, offshore, eiendom, helse og logistikk.
            </p>

            <h2>Teknologi</h2>
            <p>
              Vi bygger flyter på en kombinasjon av{" "}
              <strong>n8n</strong> (open-source workflow-plattform) og egen kode der det gir mer
              kontroll eller ytelse. For AI-stegene bruker vi OpenAI, Anthropic Claude eller
              andre modeller avhengig av oppgaven. Alt kjører på robust infrastruktur (Vercel,
              Azure, Google Cloud) innenfor EU når det er nødvendig.
            </p>

            <h2>Pålitelighet og overvåking</h2>
            <p>
              En flyt som feiler i stillhet er verre enn ingen flyt. Vi setter opp logging,
              varsling ved feil, og automatiske retry-mekanismer. Du får oversikt over hva som
              har kjørt, hva som feilet og hvorfor — slik at du kan stole på systemet.
            </p>

            <h2>Eksempel: CSUB</h2>
            <p>
              For <Link href="/kunder/csub">CSUB</Link> bygget vi flyter som automatisk samler
              data fra Excel-filer og eksisterende systemer inn i et sentralisert dashboard.
              Det som før krevte manuelt arbeid fra prosjektledere skjer nå av seg selv.
            </p>

            <h2>Kom i gang</h2>
            <p>
              Første samtale er uforpliktende. Vi ser på hvilke prosesser som tar mest tid hos
              dere, og finner sammen hva som egner seg for automatisering.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Har du prosesser som tar for mye tid?</h2>
            <p>Book en uforpliktende samtale. Vi finner ut sammen hva som kan automatiseres.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
