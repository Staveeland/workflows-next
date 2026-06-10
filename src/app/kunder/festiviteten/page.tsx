import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment } from "@/components/verksted/ThreadContext";
import {
  FestivitetenMerge,
  FestivitetenWatchPanel,
} from "@/components/verksted/pages/FestivitetenCaseClient";
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
  path: "/kunder/festiviteten",
  about: { "@type": "Thing", name: "Festiviteten" },
});

// Tråden gjennom nattevakt-seksjonen — samme 38 %-ryggrad som resten av huset.
const NATT_THREAD_D = "M 50 0 C 44 40 58 80 52 120 C 48 152 54 176 50 200";

const LOSNING_PUNKTER = [
  "Sanntidsoversikt over billettsalg per arrangement — koblet mot annonseutgifter per kanal",
  "Direkte integrasjon mot Meta Ads, Google Ads og billettsystemet",
  "Råd om hvilke annonser som bør skaleres opp, pauses eller endres",
  "Automatisk varsel når salget underpresterer mot prognosen",
  "Konkrete forslag som løfter salget: annonsetekst, målgruppe, budsjett, kanal",
  "Personlige AI-assistenter koblet på hele økosystemet — spør når som helst på døgnet",
];

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
      <VerkstedShell>
        <PageHero
          kicker="Kundecase · Historisk teater i Haugesund"
          title="Festiviteten"
          lead="Et historisk teater — og en AI-agent som følger billettsalg og annonser på Meta, Google og radio i sanntid. Svikter salget, kommer varselet med en gang."
          chalk="lyset på scenen er av — lyset i systemet er på"
        >
          <Reveal className="vk-festiviteten-hero-extra" delay={0.3}>
            <Link href="/kunder" className="vk-pg-link vk-festiviteten-back">
              <span aria-hidden="true">←</span> Alle kundecaser
            </Link>
            <div className="vk-festiviteten-meta">
              <dl className="vk-festiviteten-facts">
                <div>
                  <dt>Bransje</dt>
                  <dd>Kultur og arrangement</dd>
                </div>
                <div>
                  <dt>Tjenester</dt>
                  <dd>AI-agenter, dataintegrasjon, skreddersydd programvare</dd>
                </div>
                <div>
                  <dt>Tidsramme</dt>
                  <dd>6 uker</dd>
                </div>
              </dl>
              <figure className="vk-paper vk-festiviteten-playbill">
                <Image
                  src="/kunder-festiviteten.png"
                  alt="Festiviteten Haugesund – logo"
                  width={911}
                  height={387}
                  sizes="250px"
                />
                <figcaption className="vk-mono">
                  historisk teater · haugesund
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </PageHero>

        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="festiviteten-kort-h">
          <h2 id="festiviteten-kort-h" className="vk-sr">
            Kort oppsummert
          </h2>
          <div className="vk-wrap">
            <ul className="vk-festiviteten-tiles">
              <Reveal as="li" className="vk-festiviteten-tile">
                <strong className="vk-display">Sanntid</strong>
                <span>oversikt over billettsalg og annonser — alle kanaler</span>
              </Reveal>
              <Reveal as="li" className="vk-festiviteten-tile" delay={0.08}>
                <strong className="vk-display">24/7</strong>
                <span>personlige AI-assistenter, koblet på hele økosystemet</span>
              </Reveal>
              <Reveal as="li" className="vk-festiviteten-tile" delay={0.16}>
                <strong className="vk-display">Varsler</strong>
                <span>når salget underpresterer mot prognosen</span>
              </Reveal>
            </ul>
          </div>
        </section>

        <section className="vk-pg-s" aria-labelledby="festiviteten-utfordring-h">
          <div className="vk-wrap">
            <p className="vk-kicker vk-festiviteten-kick">Utfordringen</p>
            <Reveal>
              <h2 id="festiviteten-utfordring-h" className="vk-display vk-pg-h2">
                Innsikten lå spredt over fire kanaler
              </h2>
            </Reveal>
            <div className="vk-pg-prose vk-festiviteten-prose">
              <p>
                Festiviteten setter opp konserter og forestillinger gjennom hele
                året. Hvert arrangement skal markedsføres riktig, og budsjettet
                fordeles på radio, Meta (Facebook og Instagram) og Google Ads.
                Når noe presterer dårlig, koster det både penger og fulle saler.
              </p>
              <p>
                Men innsikten lå spredt: billettsystemet ett sted, Meta Ads
                Manager et annet, Google Ads et tredje — og radioplanene i et
                regneark. Å se helheten krevde manuelt arbeid. Og når salget på
                et arrangement plutselig stoppet opp, ble det oppdaget for sent
                til å justere kursen.
              </p>
            </div>
            <p className="vk-chalk vk-festiviteten-aside">
              fire kanaler — fire steder å lete
            </p>
          </div>
        </section>

        <section className="vk-pg-s" aria-labelledby="festiviteten-losning-h">
          <div className="vk-wrap">
            <p className="vk-kicker vk-festiviteten-kick">Løsningen</p>
            <Reveal>
              <h2 id="festiviteten-losning-h" className="vk-display vk-pg-h2">
                Fire kanaler inn. Én tråd ut.
              </h2>
            </Reveal>
            <div className="vk-pg-prose vk-festiviteten-prose">
              <p>
                Workflows bygde et AI-system som kobler seg direkte til
                billettsystemet, Meta, Google Ads og radioplanen. Alt salg og
                all annonseytelse samles i én sanntidsoversikt. Oppå datalaget
                ligger personlige AI-assistenter — tilgjengelige hele døgnet for
                å analysere, anbefale og varsle.
              </p>
            </div>
            <FestivitetenMerge />
            <Reveal delay={0.06}>
              <ul className="vk-festiviteten-points">
                {LOSNING_PUNKTER.map((punkt) => (
                  <li key={punkt}>{punkt}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section
          className="vk-pg-s vk-festiviteten-natt"
          aria-labelledby="festiviteten-natt-h"
        >
          <ThreadSegment
            d={NATT_THREAD_D}
            viewBox="0 0 100 200"
            className="vk-festiviteten-natt-thread"
          />
          <div className="vk-wrap">
            <div className="vk-festiviteten-natt-grid">
              <div className="vk-festiviteten-natt-copy">
                <p className="vk-kicker vk-festiviteten-kick">Nattevakten</p>
                <Reveal>
                  <h2 id="festiviteten-natt-h" className="vk-display vk-pg-h2">
                    Teateret sover. Agenten gjør ikke.
                  </h2>
                </Reveal>
                <div className="vk-pg-prose vk-festiviteten-prose">
                  <p>
                    Hver natt går agenten gjennom salgstallene for kommende
                    forestillinger og måler dem mot annonsene som kjører.
                    Svikter salget, går varselet ut med en gang — ikke neste
                    arbeidsdag. Anbefalingen ligger klar når teamet kommer på
                    jobb.
                  </p>
                </div>
                <Link
                  href="/ai-agenter"
                  className="vk-pg-link vk-festiviteten-natt-link"
                >
                  Slik bygger vi AI-agenter <span aria-hidden="true">→</span>
                </Link>
              </div>
              <FestivitetenWatchPanel />
            </div>
          </div>
        </section>

        <section className="vk-pg-s" aria-labelledby="festiviteten-resultat-h">
          <div className="vk-wrap">
            <p className="vk-kicker vk-festiviteten-kick">Resultatet</p>
            <Reveal>
              <h2 id="festiviteten-resultat-h" className="vk-display vk-pg-h2">
                Beslutninger på tall, ikke magefølelse
              </h2>
            </Reveal>
            <div className="vk-pg-prose vk-festiviteten-prose">
              <p>
                Festiviteten har gått fra å sjonglere dashboards og regneark til
                én samlet oversikt — og en AI-assistent som faktisk forstår
                sammenhengen mellom annonseinvestering og billettsalg. Begynner
                et arrangement å skjelve, vet teamet det med en gang, med
                konkrete anbefalinger om hva som bør gjøres.
              </p>
              <p>
                Markedsføringsbudsjettet brukes mer presist, fordi beslutninger
                tas på data og ikke magefølelse. Og fordi assistenten er våken
                hele døgnet, slipper teamet å vente til neste arbeidsdag for å
                vurdere en kampanje som glipper i helgen.
              </p>
            </div>
            <Reveal delay={0.1}>
              <figure className="vk-festiviteten-quote">
                <blockquote>
                  <p>
                    «Vi hadde tallene, men ikke tiden til å koble dem sammen. Nå
                    har vi en AI-assistent som ser alt — billettsalg, annonser,
                    radio — og sier ifra med en gang noe ikke fungerer. Det er
                    som å ha en ekstra markedssjef som aldri sover.»
                  </p>
                </blockquote>
              </figure>
            </Reveal>
          </div>
        </section>

        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="festiviteten-neste-h">
          <div className="vk-wrap">
            <p className="vk-kicker vk-festiviteten-kick">Flere fra verkstedet</p>
            <Reveal>
              <h2 id="festiviteten-neste-h" className="vk-display vk-pg-h2">
                Les flere kundecaser
              </h2>
            </Reveal>
            <div className="vk-pg-grid">
              <article className="vk-pg-card vk-festiviteten-next-card">
                <span className="vk-stamp">Neste case</span>
                <h3 className="vk-pg-card-title">
                  <Link
                    href="/kunder/elementlab"
                    className="vk-festiviteten-next-link"
                  >
                    ElementLab
                  </Link>
                </h3>
                <p className="vk-pg-card-body">
                  Sømløs booking rett på nettsiden og AI-chatbot trent på
                  behandlingsdata — for Norges ledende senter for hyperbar
                  oksygenterapi.
                </p>
                <p
                  className="vk-mono vk-pg-card-mono vk-festiviteten-next-cue"
                  aria-hidden="true"
                >
                  les caset →
                </p>
              </article>
              <article className="vk-pg-card vk-festiviteten-next-card">
                <p className="vk-mono vk-festiviteten-next-tag">
                  subsea-engineering
                </p>
                <h3 className="vk-pg-card-title">
                  <Link
                    href="/kunder/csub"
                    className="vk-festiviteten-next-link"
                  >
                    CSUB
                  </Link>
                </h3>
                <p className="vk-pg-card-body">
                  Intelligent dashbord og AI-assistent som gjør prosjektdata
                  tilgjengelig på sekunder.
                </p>
                <p
                  className="vk-mono vk-pg-card-mono vk-festiviteten-next-cue"
                  aria-hidden="true"
                >
                  les caset →
                </p>
              </article>
            </div>
            <div className="vk-festiviteten-next-foot">
              <Link href="/kunder" className="vk-pg-link">
                <span aria-hidden="true">←</span> Alle kundecaser
              </Link>
              <Link href="/#tjenester" className="vk-pg-link">
                Alt vi bygger <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <PageCta />
      </VerkstedShell>
    </>
  );
}
