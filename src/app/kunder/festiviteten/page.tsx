import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildArticle, buildBreadcrumb } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "Festiviteten – AI som styrer billettsalg og annonsering",
  description:
    "Kundecase: Workflows bygde et AI-system som overvåker billettsalg og annonsering på Meta, Google og radio for Festiviteten — med personlige AI-assistenter som rådgir 24/7.",
  alternates: {
    canonical: "/kunder/festiviteten",
    languages: {
      "nb-NO": "/kunder/festiviteten",
      "x-default": "/kunder/festiviteten",
    },
  },
  openGraph: {
    title: "Festiviteten – AI som styrer billettsalg og annonsering | Workflows",
    description:
      "AI-system med sanntidsoversikt over billettsalg og annonseytelse — koblet direkte til Meta, Google og billettsystem.",
    url: urlFor("/kunder/festiviteten"),
    type: "article",
  },
  keywords: [
    "Festiviteten",
    "AI billettsalg",
    "AI annonsering",
    "kunstig intelligens kultur",
    "Meta Ads AI",
    "Google Ads AI",
    "AI Haugesund",
    "Workflows kundecase",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Kundecaser", path: "/kunder" },
  { name: "Festiviteten", path: "/kunder/festiviteten" },
]);

const articleJsonLd = buildArticle({
  headline: "Festiviteten – AI for billettsalg og annonsering",
  description:
    "Workflows bygde et AI-system for Festiviteten som holder styr på billettsalg og annonser på Meta, Google og radio — med personlige AI-assistenter koblet direkte til hele økosystemet.",
  image: "/kunder-festiviteten.png",
  slug: "/kunder/festiviteten",
  about: { "@type": "Thing", name: "Festiviteten" },
});

export default function FestivitetenCase() {
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
              <h1>Festiviteten</h1>
              <p className="case-hero__tagline">AI som holder styr på billettsalget og annonseringen — døgnet rundt</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Kultur & arrangement</span></div>
                <div><strong>Tjenester</strong><span>AI-assistenter, Dataintegrasjon, Skreddersydd software</span></div>
                <div><strong>Tidsramme</strong><span>6 uker</span></div>
              </div>
            </div>
            <div className="case-hero__logo">
              <Image src="/kunder-festiviteten.png" alt="Festiviteten Haugesund" width={250} height={80} style={{ width: "auto", height: "60px" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="case-content">
            <div className="case-results-bar">
              <div className="case-result">
                <span className="case-result__num">Sanntid</span>
                <span className="case-result__label">oversikt over alle kanaler</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">24/7</span>
                <span className="case-result__label">personlig AI-assistent</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">Varsler</span>
                <span className="case-result__label">ved svakt salg og dårlig ytelse</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                Festiviteten setter opp et bredt program av konserter og forestillinger gjennom hele året. Hvert arrangement må markedsføres riktig, og budsjettet fordeles på flere kanaler — radio, Meta (Facebook og Instagram) og Google Ads. Når noe presterer dårlig, koster det både penger og fulle saler.
              </p>
              <p>
                Problemet var at innsikten lå spredt: billettsystemet ett sted, Meta Ads Manager et annet, Google Ads et tredje, radioplaner i et regneark. Det krevde manuelt arbeid å se helheten, og når salget på et arrangement plutselig stoppet opp, ble det oppdaget for sent til å justere kursen.
              </p>

              <h2>Løsningen</h2>
              <p>
                Workflows bygde et AI-system som kobler seg direkte til billettsystemet, Meta, Google Ads og oversikten over radioannonsering. Alt salg og all annonseytelse samles i én sanntidsoversikt — og oppå datalaget ligger personlige AI-assistenter som er tilgjengelige 24 timer i døgnet for å analysere, anbefale og varsle.
              </p>
              <ul>
                <li>Sanntidsoversikt over billettsalg per arrangement, koblet mot annonseutgifter per kanal</li>
                <li>Direkte integrasjon mot Meta Ads, Google Ads og billettsystem</li>
                <li>Skreddersydde råd om hvilke annonser som bør skaleres opp, pauses eller endres</li>
                <li>Automatiske varsler når salget på et arrangement underpresterer mot prognosen</li>
                <li>Konkrete forslag til hvordan salget kan løftes — annonsetekst, målgruppe, budsjett, kanal</li>
                <li>Personlige AI-assistenter som er koblet på hele økosystemet og kan rådgi når som helst på døgnet</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Festiviteten har gått fra å sjonglere flere dashboards og regneark til å ha én samlet oversikt — og en AI-assistent som faktisk forstår sammenhengen mellom annonseinvestering og billettsalg. Når et arrangement begynner å skjelve, vet teamet om det med en gang, og de får konkrete anbefalinger om hva som bør gjøres.
              </p>
              <p>
                Markedsføringsbudsjettet brukes mer presist, fordi beslutninger tas på data og ikke magefølelse. Og fordi assistenten er tilgjengelig hele døgnet, slipper teamet å vente til neste arbeidsdag for å vurdere en kampanje som glipper i helgen.
              </p>

              <blockquote>
                &ldquo;Vi hadde tallene, men ikke tiden til å koble dem sammen. Nå har vi en AI-assistent som ser alt — billettsalg, annonser, radio — og sier ifra med en gang noe ikke fungerer. Det er som å ha en ekstra markedssjef som aldri sover.&rdquo;
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
