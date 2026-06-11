import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildArticle, buildBreadcrumb } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment } from "@/components/verksted/ThreadContext";
import { ElementlabCaseClient } from "@/components/verksted/pages/ElementlabCaseClient";

export const metadata: Metadata = {
  title: "ElementLab – automatisert rapportflyt, booking og AI-chatbot",
  description:
    "Kundecase: Workflows automatiserte rapportflyten til ElementLab – 80 % raskere rapporter og hundrevis av timer frigjort i året – og bygget bookingintegrasjon og AI-chatbot.",
  alternates: {
    canonical: "/kunder/elementlab",
    languages: {
      "nb-NO": "/kunder/elementlab",
      "x-default": "/kunder/elementlab",
    },
  },
  openGraph: {
    title: "ElementLab – automatisert rapportflyt, booking og AI-chatbot | Workflows",
    description:
      "80 % raskere rapporter, sømløs booking på nettsiden og en AI-chatbot trent på behandlingsdata – kundecase fra Workflows.",
    url: urlFor("/kunder/elementlab"),
    type: "article",
  },
  keywords: [
    "ElementLab",
    "automatisert rapportflyt",
    "rapportautomatisering",
    "AI chatbot",
    "booking integrasjon",
    "kunstig intelligens helse",
    "hyperbar oksygenterapi",
    "AI Haugesund",
    "Workflows kundecase",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Kundecaser", path: "/kunder" },
  { name: "ElementLab", path: "/kunder/elementlab" },
]);

const articleJsonLd = buildArticle({
  headline: "ElementLab – automatisert rapportflyt, booking og AI-chatbot",
  description:
    "Workflows automatiserte rapportflyten til ElementLab – 80 % raskere rapporter og hundrevis av timer frigjort i året – og bygget skreddersydd booking-frontend og AI-chatbot.",
  image: "/kunder-elementlab.png",
  path: "/kunder/elementlab",
  about: { "@type": "Thing", name: "ElementLab" },
});

// Tråden stitches the two jobs together in the whitespace between them.
const STITCH_D = "M 50 0 C 42 30 60 62 52 90 C 48 104 50 112 50 120";

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
      <VerkstedShell>
        <PageHero
          kicker="Kundecase — i daglig drift"
          title="ElementLab"
          lead="Flyten henter tallene, bygger rapporten og legger den klar — uten at noen rører et tastatur. 80 % raskere rapporter. Hundrevis av timer frigjort, hvert år."
          chalk="ekte tall — vi har målt"
        >
          <Reveal delay={0.3} y={12}>
            <dl className="vk-elementlab-facts">
              <div className="vk-elementlab-fact">
                <dt>Bransje</dt>
                <dd>Helse og velvære</dd>
              </div>
              <div className="vk-elementlab-fact">
                <dt>Leveranser</dt>
                <dd>Rapportflyt · Booking · AI-chatbot</dd>
              </div>
              <div className="vk-elementlab-fact">
                <dt>Status</dt>
                <dd>I daglig bruk</dd>
              </div>
            </dl>
            <Link href="/kunder" className="vk-elementlab-back">
              <span aria-hidden="true">←</span> Alle kundecaser
            </Link>
          </Reveal>
        </PageHero>

        {/* ── Jobb 1: rapportflyten ── */}
        <section className="vk-pg-s vk-elementlab-jobb1" aria-labelledby="el-flyt-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Jobb 1 — Automatisert flyt
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="el-flyt-h" className="vk-display vk-pg-h2">
                Rapportflyten går av seg selv
              </h2>
            </Reveal>

            <div className="vk-elementlab-cols">
              <Reveal>
                <h3 className="vk-elementlab-h3">Før</h3>
                <div className="vk-pg-prose">
                  <p>
                    Hver rapport begynte på null. Noen måtte hente tallene, lime dem inn og
                    gjøre dem ferdige — uke etter uke. Viktig arbeid, men ikke arbeid som
                    trenger et menneske.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h3 className="vk-elementlab-h3">Etter</h3>
                <div className="vk-pg-prose">
                  <p>
                    Vi bygde en <Link href="/automatiserte-flyter">automatisert flyt</Link>{" "}
                    som gjør jobben: den henter tallene, bygger rapporten og legger den
                    klar. Ingen dobbeltføring, ingen leting — og neste rapport står
                    allerede i kø.
                  </p>
                </div>
              </Reveal>
            </div>

            <ElementlabCaseClient />

            <p className="vk-chalk vk-elementlab-chalk">timene gikk tilbake til folka</p>
          </div>
        </section>

        {/* ── Jobb 2: booking og chatbot ── */}
        <section className="vk-pg-s vk-elementlab-jobb2" aria-labelledby="el-book-h">
          <ThreadSegment d={STITCH_D} viewBox="0 0 100 120" className="vk-elementlab-spine" />
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Jobb 2 — Booking og chatbot
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="el-book-h" className="vk-display vk-pg-h2">
                Booking og AI-chatbot, uten omveier
              </h2>
            </Reveal>

            <div className="vk-elementlab-cols">
              <Reveal>
                <h3 className="vk-elementlab-h3">Utfordringen</h3>
                <div className="vk-pg-prose">
                  <p>
                    ElementLab er Norges ledende senter for hyperbar oksygenterapi.
                    Kundene leser seg grundig opp før de booker — men bookingsystemet
                    levde i et helt eget system. Kunder som var klare til å booke, ble
                    sendt ut av nettsiden til et generisk grensesnitt med et helt annet
                    design. Mange falt fra på veien.
                  </p>
                  <p>
                    Samtidig fikk resepsjonen de samme spørsmålene om behandlinger,
                    priser og forberedelser — om og om igjen.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h3 className="vk-elementlab-h3">Det vi bygde</h3>
                <ul className="vk-elementlab-list">
                  <li>
                    Skreddersydd booking-frontend rett på nettsiden — i ElementLabs eget
                    design.
                  </li>
                  <li>
                    Direkte kobling mot bookingsystemet de allerede hadde. Ingen
                    dobbeltføring.
                  </li>
                  <li>
                    <Link href="/chatboter">AI-chatbot</Link> trent på behandlinger,
                    priser, forberedelser og ettervern. Svarer hele døgnet.
                  </li>
                  <li>Chatboten guider kundene til riktig behandling — og videre til booking.</li>
                  <li>Fungerer like godt på mobil som på desktop.</li>
                </ul>
              </Reveal>
            </div>

            <Reveal className="vk-elementlab-resultat">
              <h3 className="vk-elementlab-h3">Resultatet</h3>
              <div className="vk-pg-prose">
                <p>
                  Kundereisen er sømløs fra informasjon til booking — uten å forlate
                  nettsiden. <strong>Frafallet i bookingprosessen har falt merkbart.</strong>{" "}
                  Chatboten tar de gjentakende henvendelsene døgnet rundt, og resepsjonen
                  bruker tiden på kundene som faktisk er i senteret.
                </p>
              </div>
              <p className="vk-mono vk-elementlab-levert">Levert på fire uker</p>
            </Reveal>

            <Reveal>
              <figure className="vk-elementlab-quote">
                <blockquote>
                  <p>
                    «Vi hadde lenge ønsket at kundene kunne booke direkte på nettsiden
                    vår, men trodde det ville kreve et helt nytt bookingsystem. Workflows
                    løste det ved å bygge en bro mellom det vi allerede hadde og
                    nettsiden — elegant og enkelt.»
                  </p>
                </blockquote>
                <figcaption className="vk-mono vk-elementlab-cite">— ElementLab</figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ── Neste sak ── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="el-next-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker">
              Neste sak fra verkstedet
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="el-next-h" className="vk-display vk-pg-h2">
                Les videre
              </h2>
            </Reveal>

            <div className="vk-elementlab-nextgrid">
              <Reveal>
                <article className="vk-pg-card vk-elementlab-nextcard">
                  <p className="vk-kicker">Kundecase</p>
                  <h3 className="vk-elementlab-nextname">
                    <Link href="/kunder/csub" className="vk-elementlab-nextlink">
                      CSUB
                    </Link>
                  </h3>
                  <p className="vk-pg-card-body">
                    Prosjektdata lå spredt i Excel-ark. Nå ligger alt i ett dashbord —
                    med en AI-assistent som svarer rett fra egne prosjektdokumenter.
                  </p>
                  <span className="vk-elementlab-nextarrow" aria-hidden="true">
                    Les hele caset →
                  </span>
                </article>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="vk-elementlab-nextlinks">
                  <Link href="/kunder/festiviteten" className="vk-pg-link">
                    Festiviteten — AI-nattevakt for billettsalg
                  </Link>
                  <Link href="/kunder" className="vk-pg-link">
                    Alle kundecaser
                  </Link>
                  <Link href="/#tjenester" className="vk-pg-link">
                    Det vi bygger på verkstedet
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <PageCta note="ElementLab sparte hundrevis av timer i året. Praten som startet det kostet ingenting." />
      </VerkstedShell>
    </>
  );
}
