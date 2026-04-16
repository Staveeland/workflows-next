import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "Saga Subsea – AI-drevet maritim sporing | Kundecase",
  description:
    "Kundecase: Workflows bygget et intelligent sporingssystem som hjelper Saga Subsea å identifisere salgsmuligheter før konkurrentene.",
  alternates: { canonical: "/kunder/saga-subsea" },
  openGraph: {
    title: "Saga Subsea – AI-drevet maritim sporing | Workflows Haugesund",
    description:
      "Automatisk overvåking av maritim trafikk med AI — tidlig varsling og flere innhentede oppdrag.",
    url: `${SITE_URL}/kunder/saga-subsea`,
    type: "article",
  },
  keywords: [
    "Saga Subsea",
    "AI sporing",
    "maritim intelligence",
    "kunstig intelligens subsea",
    "automatisert prospektering",
    "AI Haugesund",
    "Workflows kundecase",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Kundecaser", item: `${SITE_URL}/kunder` },
    { "@type": "ListItem", position: 3, name: "Saga Subsea", item: `${SITE_URL}/kunder/saga-subsea` },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Saga Subsea – Intelligent maritim sporing med AI",
  description:
    "Workflows bygget et AI-drevet sporingssystem for Saga Subsea som varsler om salgsmuligheter før konkurrentene oppdager dem.",
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  image: `${SITE_URL}/kunder-saga.png`,
  mainEntityOfPage: `${SITE_URL}/kunder/saga-subsea`,
  inLanguage: "nb-NO",
  about: { "@type": "Thing", name: "Saga Subsea" },
};

export default function SagaSubseaCase() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <section className="page-hero page-hero--case">
        <div className="wrap">
          <Link href="/kunder" className="back-link">&larr; Alle kundecaser</Link>
          <div className="case-hero">
            <div className="case-hero__info">
              <span className="tag">Kundecase</span>
              <h1>Saga Subsea</h1>
              <p className="case-hero__tagline">Intelligent sporingsteknologi som gir et forsprang i markedet</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Subsea-tjenester</span></div>
                <div><strong>Tjenester</strong><span>Skreddersydd software, Dataintegrasjon</span></div>
                <div><strong>Tidsramme</strong><span>4 uker</span></div>
              </div>
            </div>
            <div className="case-hero__logo">
              <Image src="/kunder-saga.png" alt="Saga Subsea" width={250} height={80} style={{ width: "auto", height: "60px" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="case-content">
            <div className="case-results-bar">
              <div className="case-result">
                <span className="case-result__num">Tidlig</span>
                <span className="case-result__label">varsling på muligheter</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">24/7</span>
                <span className="case-result__label">automatisk overvåking</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">Flere</span>
                <span className="case-result__label">innhentede oppdrag</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                Saga Subsea tilbyr spesialiserte subsea-tjenester langs norskekysten. For å vinne oppdrag er timing alt — de må vite når relevante fartøy er på vei mot havn, slik at de kan ta kontakt med rederiene og tilby sine tjenester før konkurrentene.
              </p>
              <p>
                Tidligere var dette en manuell prosess. Teamet brukte tid på å følge med på skipstrafikk, ringe rundt og sjekke havneanløp — uten noen systematisk måte å fange opp muligheter på. Verdifulle oppdrag gikk tapt fordi de rett og slett ikke visste at fartøyene var i området.
              </p>

              <h2>Løsningen</h2>
              <p>
                Workflows utviklet et intelligent sporingssystem som kontinuerlig overvåker maritim trafikk og identifiserer fartøy av interesse for Saga Subsea. Når et relevant fartøy nærmer seg et aktuelt område, får teamet automatisk varsel med all nødvendig informasjon for å ta kontakt.
              </p>
              <ul>
                <li>Sanntids overvåking av maritim trafikk i relevante områder</li>
                <li>Automatisk identifisering av fartøy som matcher Sagas målgruppe</li>
                <li>Intelligente varsler med kontekst og anbefalinger</li>
                <li>Historisk oversikt over fartøybevegelser og mønstre</li>
                <li>Dashboard for visuell oversikt over aktivitet i nærområdet</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Saga Subsea har nå et kraftig verktøy som gir dem et konkret forsprang i markedet. De vet om salgsmuligheter lenge før de ville oppdaget dem manuelt, og kan ta kontakt med potensielle kunder mens de fortsatt planlegger sitt havneopphold.
              </p>
              <p>
                Systemet kjører døgnet rundt og har allerede bidratt til å innhente oppdrag som teamet ellers aldri ville fanget opp. Tiden som tidligere gikk til manuell overvåking brukes nå på det som faktisk skaper verdi — å levere tjenester.
              </p>

              <blockquote>
                &ldquo;Vi visste at informasjonen fantes der ute, men hadde aldri kapasitet til å følge med systematisk. Nå får vi varsel i det et interessant fartøy er på vei — det har vært en gamechanger for salgsteamet.&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--elevated">
        <div className="wrap">
          <div className="case-other">
            <h2>Andre kundecaser</h2>
            <div className="case-other__grid">
              <Link href="/kunder/csub" className="case-other__card">
                <Image src="/kunder-csub.svg" alt="CSUB" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>CSUB</h3>
                <p>Intelligent dashboard og AI-assistent</p>
              </Link>
              <Link href="/kunder/elementlab" className="case-other__card">
                <Image src="/kunder-elementlab.png" alt="ElementLab" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>ElementLab</h3>
                <p>Bookingintegrasjon og AI-chatbot</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
