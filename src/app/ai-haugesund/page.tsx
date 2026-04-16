import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "AI i Haugesund — lokalt AI-selskap",
  description:
    "Workflows er et lokalt AI-selskap i Haugesund som bygger AI-agenter, chatboter og automatisering for bedrifter på Haugalandet og i resten av Norge.",
  alternates: { canonical: "/ai-haugesund" },
  openGraph: {
    title: "AI i Haugesund — lokalt AI-selskap | Workflows",
    description:
      "AI-agenter, kunstig intelligens og skreddersydde systemer bygget av et team i Haugesund.",
    url: `${SITE_URL}/ai-haugesund`,
    type: "article",
  },
  keywords: [
    "AI Haugesund",
    "AI-selskap Haugesund",
    "AI-byrå Haugesund",
    "kunstig intelligens Haugesund",
    "AI-agenter Haugesund",
    "AI-konsulent Haugesund",
    "AI Haugalandet",
    "AI Rogaland",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "AI i Haugesund", item: `${SITE_URL}/ai-haugesund` },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "AI-utvikling",
  name: "AI i Haugesund",
  description:
    "Lokalt AI-selskap i Haugesund som bygger AI-agenter, kunstig intelligens og skreddersydde systemer for bedrifter på Haugalandet og i Norge.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "AdministrativeArea", name: "Haugalandet" },
    { "@type": "AdministrativeArea", name: "Rogaland" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/ai-haugesund`,
};

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

      <section className="page-hero">
        <div className="wrap">
          <span className="tag">AI Haugesund</span>
          <h1>AI i Haugesund</h1>
          <p className="page-hero__sub">
            Workflows er et lokalt AI-selskap basert i Haugesund. Vi bygger AI-agenter,
            kunstig intelligens og skreddersydde systemer for bedrifter på Haugalandet
            og i resten av Norge.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Lokalt AI-miljø på Haugalandet</h2>
            <p>
              Det skjer mye spennende innen kunstig intelligens akkurat nå — men det meste av støyen
              kommer fra Oslo, San Francisco og sosiale medier. På Haugalandet finnes det bedrifter
              som driver med alt fra subsea-operasjoner og industri til helse, handel og
              tjenesteyting. Alle har de prosesser som kan gjøres bedre med AI. Vi mener at
              teknologien bør være tilgjengelig lokalt, med folk du kan møte ansikt til ansikt.
            </p>
            <p>
              Workflows er basert i Haugesund, og vi kjenner næringslivet i regionen. Vi snakker
              samme språk som deg — både bokstavelig og om hvordan bedrifter faktisk fungerer.
              Du trenger ikke forstå teknologien; vår jobb er å oversette behovene dine til noe
              som fungerer i praksis.
            </p>

            <h2>Hva vi bygger av AI-løsninger</h2>
            <p>
              AI er ikke én ting. Vi jobber på tre nivåer, avhengig av hva som passer bedriften
              din best:
            </p>
            <ul>
              <li>
                <strong>Chatboter og digitale assistenter</strong> — AI-drevne assistenter som
                svarer kunder, sorterer henvendelser og henter frem data fra systemene dine.
              </li>
              <li>
                <strong>Automatiserte flyter med AI innebygd</strong> — prosesser som kjører av
                seg selv, der AI tar seg av stegene som krever forståelse (kategorisering,
                tekstanalyse, dokumentbehandling).
              </li>
              <li>
                <strong>AI-agenter</strong> — autonome systemer som får et mål, lager en plan,
                bruker verktøy og utfører handlinger. Les mer på{" "}
                <Link href="/ai-agenter">vår side om AI-agenter</Link>.
              </li>
            </ul>

            <h2>AI-prosjekter fra Haugesund-regionen</h2>
            <p>
              Vi har levert konkrete AI-prosjekter til bedrifter i regionen. Her er tre eksempler:
            </p>
            <ul>
              <li>
                <Link href="/kunder/csub"><strong>CSUB</strong></Link> — intelligent dashboard
                og RAG-basert AI-assistent som gir prosjektledere svar på sekunder.
              </li>
              <li>
                <Link href="/kunder/saga-subsea"><strong>Saga Subsea</strong></Link> — AI-drevet
                sporingsteknologi som overvåker maritim trafikk og varsler om salgsmuligheter.
              </li>
              <li>
                <Link href="/kunder/elementlab"><strong>ElementLab</strong></Link> — skreddersydd
                bookingintegrasjon som sitter direkte på nettsiden.
              </li>
            </ul>
            <p>
              Se alle <Link href="/kunder">kundecaser</Link>.
            </p>

            <h2>Hvorfor velge et lokalt AI-selskap</h2>
            <p>
              AI-prosjekter krever tett samarbeid. De beste løsningene kommer av mange korte
              samtaler, ikke en lang kravspesifikasjon. Når vi holder til i Haugesund, kan vi
              møte deg på kontoret ditt, forstå hvordan dere faktisk jobber og gjøre raske
              iterasjoner underveis. Ingen tidssoner, ingen språkbarrierer, ingen lange
              reiseregninger.
            </p>
            <p>
              Du får et team som kjenner lokale bransjer — subsea og offshore, handel, eiendom,
              helse — og som forstår at en god løsning må passe inn i hvordan bedriften din
              allerede fungerer.
            </p>

            <h2>Slik kommer vi i gang</h2>
            <p>
              Første samtale er uforpliktende. Vi møtes (fysisk i Haugesund eller digitalt),
              du forteller hva som tar for mye tid, og vi finner ut om og hvordan AI kan hjelpe.
              Etter samtalen får du et konkret forslag du kan ta stilling til.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Snakk med oss om AI i Haugesund</h2>
            <p>Ta kontakt for en uforpliktende samtale om hva AI kan gjøre for din bedrift.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
