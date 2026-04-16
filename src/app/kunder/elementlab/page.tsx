import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "ElementLab – AI-chatbot og bookingintegrasjon",
  description:
    "Kundecase: Workflows integrerte bookingsystemet i nettsiden og bygget en AI-chatbot trent på behandlingsdata for ElementLab.",
  alternates: { canonical: "/kunder/elementlab" },
  openGraph: {
    title: "ElementLab – AI-chatbot og bookingintegrasjon | Workflows",
    description:
      "Skreddersydd bookingfrontend og AI-chatbot som gir en sømløs kundereise for ElementLab.",
    url: `${SITE_URL}/kunder/elementlab`,
    type: "article",
  },
  keywords: [
    "ElementLab",
    "AI chatbot",
    "booking integrasjon",
    "kunstig intelligens helse",
    "hyperbar oksygenterapi",
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
    { "@type": "ListItem", position: 3, name: "ElementLab", item: `${SITE_URL}/kunder/elementlab` },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "ElementLab – AI-chatbot og skreddersydd bookingintegrasjon",
  description:
    "Workflows bygget en skreddersydd booking-frontend og en AI-chatbot trent på behandlingsdata for ElementLab.",
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  image: `${SITE_URL}/kunder-elementlab.png`,
  mainEntityOfPage: `${SITE_URL}/kunder/elementlab`,
  inLanguage: "nb-NO",
  about: { "@type": "Thing", name: "ElementLab" },
};

export default function ElementLabCase() {
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
              <h1>ElementLab</h1>
              <p className="case-hero__tagline">Sømløs bookingopplevelse og AI-chatbot for Norges ledende hyperbare oksygenterapi-senter</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Helse & Velvære</span></div>
                <div><strong>Tjenester</strong><span>Bookingintegrasjon, AI-chatbot, Frontend</span></div>
                <div><strong>Tidsramme</strong><span>4 uker</span></div>
              </div>
            </div>
            <div className="case-hero__logo">
              <Image src="/kunder-elementlab.png" alt="ElementLab" width={250} height={80} style={{ width: "auto", height: "60px" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="case-content">
            <div className="case-results-bar">
              <div className="case-result">
                <span className="case-result__num">Sømløs</span>
                <span className="case-result__label">booking via nettsiden</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">AI</span>
                <span className="case-result__label">chatbot trent på deres data</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">Eget</span>
                <span className="case-result__label">design, full kontroll</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                ElementLab tilbyr hyperbar oksygenterapi, en spesialisert behandling som tiltrekker seg kunder som gjør grundig research før de booker. Problemet var at bookingsystemet deres levde i et helt separat system fra nettsiden — kundene måtte forlate den flotte nettsiden for å booke en time i et generisk eksternt grensesnitt.
              </p>
              <p>
                Denne brutte opplevelsen førte til frafall. Potensielle kunder som hadde lest seg opp på behandlingene og var klare til å booke, møtte en vegg når de ble sendt til et annet system med helt annet design. I tillegg fikk resepsjonen mange gjentakende spørsmål om behandlinger, priser og forberedelser som tok tid fra kjernearbeidet.
              </p>

              <h2>Løsningen</h2>
              <p>
                Workflows bygget en skreddersydd booking-frontend som sitter direkte på ElementLabs nettside. Kunder kan nå finne ledig tid, velge behandling og fullføre bookingen — alt i ElementLabs eget design, uten å forlate nettsiden.
              </p>
              <p>
                I tillegg ble det implementert en AI-chatbot på nettsiden som er trent på all informasjon om ElementLabs behandlinger, priser, forberedelser og ettervern. Chatboten svarer på spørsmål døgnet rundt og kan guide kunder til riktig behandling.
              </p>
              <ul>
                <li>Skreddersydd booking-frontend integrert i nettsiden med ElementLabs eget design</li>
                <li>Direkte kobling mot eksisterende bookingsystem — ingen dobbeltføring</li>
                <li>AI-chatbot trent på ElementLabs tjenester, priser og medisinsk informasjon</li>
                <li>Chatboten håndterer vanlige spørsmål og guider til booking</li>
                <li>Responsivt design som fungerer like godt på mobil som desktop</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Kundereisen er nå sømløs fra informasjon til booking. Besøkende som leser om hyperbar oksygenterapi kan booke time uten å forlate nettsiden, i et design de kjenner igjen. Frafallet i bookingprosessen har falt merkbart.
              </p>
              <p>
                AI-chatboten har tatt over store deler av de gjentakende henvendelsene. Kunder får svar på spørsmål om behandlinger, forberedelser og priser umiddelbart — uansett tid på døgnet. Resepsjonen kan nå bruke tiden sin på å ta vare på kundene som faktisk er i senteret.
              </p>

              <blockquote>
                &ldquo;Vi hadde lenge ønsket at kundene kunne booke direkte på nettsiden vår, men trodde det ville kreve et helt nytt bookingsystem. Workflows løste det ved å bygge en bro mellom det vi allerede hadde og nettsiden — elegant og enkelt.&rdquo;
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
              <Link href="/kunder/saga-subsea" className="case-other__card">
                <Image src="/kunder-saga.png" alt="Saga Subsea" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>Saga Subsea</h3>
                <p>Intelligent sporingsteknologi</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
