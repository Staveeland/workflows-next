import type { Metadata } from "next";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildArticle, buildBreadcrumb } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { CsubCaseClient } from "@/components/verksted/pages/CsubCaseClient";

export const metadata: Metadata = {
  title: "CSUB – AI-dashboard og RAG-assistent",
  description:
    "Kundecase: CSUBs prosjektdata lå spredt i Excel. Workflows samlet alt i ett dashbord — med AI-assistent (RAG) som svarer fra egne dokumenter på sekunder.",
  alternates: {
    canonical: "/kunder/csub",
    languages: {
      "nb-NO": "/kunder/csub",
      "x-default": "/kunder/csub",
    },
  },
  openGraph: {
    title: "CSUB – AI-dashboard og RAG-assistent | Workflows",
    description:
      "Hvordan Workflows bygget et sentralisert dashboard og en AI-drevet chatassistent for CSUB.",
    url: urlFor("/kunder/csub"),
    type: "article",
  },
  keywords: [
    "CSUB",
    "AI dashboard",
    "RAG-assistent",
    "AI-assistent bedrift",
    "prosjektdata",
    "rapportering",
    "Workflows kundecase",
    "kunstig intelligens subsea",
    "AI Haugesund",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Kundecaser", path: "/kunder" },
  { name: "CSUB", path: "/kunder/csub" },
]);

const articleJsonLd = buildArticle({
  headline: "CSUB – Intelligent dashboard og AI-assistent på sekunder",
  description:
    "Workflows bygget et sentralisert dashboard og en AI-drevet chatassistent med RAG for CSUB som erstattet timevis med manuell leting i Excel-filer.",
  image: "/kunder-csub.svg",
  path: "/kunder/csub",
  about: { "@type": "Thing", name: "CSUB" },
});

const DOSSIER: ReadonlyArray<readonly [string, string]> = [
  ["Bransje", "Subsea & offshore"],
  ["Tjenester", "Dashbord · AI-assistent · Dataintegrasjon"],
  ["Tidsramme", "6 uker"],
];

export default function CsubCase() {
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
          kicker="Kundecase · Subsea-engineering"
          title="CSUB"
          lead="Prosjektdata lå spredt i utallige Excel-ark, e-poster og systemer. Nå ligger alt i ett dashbord — med en AI-assistent som svarer fra CSUBs egne dokumenter. På sekunder."
          chalk="seks uker fra kaos til flyt"
        >
          <Reveal className="vk-csub-hero-extra" delay={0.3} y={14}>
            <div className="vk-csub-stampline">
              <span className="vk-stamp">ALT PÅ ETT BRETT</span>
              <span className="vk-mono vk-csub-inuse">i daglig bruk</span>
            </div>
            <dl className="vk-csub-dossier">
              {DOSSIER.map(([label, value]) => (
                <div key={label} className="vk-csub-doss">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </PageHero>

        <CsubCaseClient />

        {/* ── Next from the workshop ── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="csub-h-neste">
          <div className="vk-wrap">
            <p className="vk-kicker vk-pg-kicker">Kundecaser</p>
            <h2 id="csub-h-neste" className="vk-display vk-pg-h2">
              Neste fra verkstedet
            </h2>
            <div className="vk-csub-nextgrid">
              <article className="vk-pg-card">
                <p className="vk-mono vk-csub-nextlabel">Neste case</p>
                <h3 className="vk-pg-card-title">
                  <Link href="/kunder/festiviteten" className="vk-csub-nextlink">
                    Festiviteten
                  </Link>
                </h3>
                <p className="vk-pg-card-body">
                  Teateret sover — agenten gjør ikke. AI-en følger billettsalg og annonser i
                  sanntid, og varsler når salget svikter.
                </p>
                <p className="vk-mono vk-pg-card-mono" aria-hidden="true">
                  03:12 i natt: svakt salg oppdaget → varsel sendt
                </p>
              </article>
              <article className="vk-pg-card">
                <p className="vk-mono vk-csub-nextlabel">Også fra verkstedet</p>
                <h3 className="vk-pg-card-title">
                  <Link href="/kunder/elementlab" className="vk-csub-nextlink">
                    ElementLab
                  </Link>
                </h3>
                <p className="vk-pg-card-body">
                  80 % raskere rapporter — hundrevis av timer frigjort hvert år.
                </p>
                <p className="vk-mono vk-pg-card-mono" aria-hidden="true">
                  rapport bygget → levert · neste i kø
                </p>
              </article>
            </div>
            <p className="vk-csub-back">
              <Link href="/kunder" className="vk-pg-link">
                ← Alle kundecaser
              </Link>
            </p>
          </div>
        </section>

        <PageCta />
      </VerkstedShell>
    </>
  );
}
