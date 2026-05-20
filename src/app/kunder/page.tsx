import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "Kundecaser — AI-agenter og skreddersydd software",
  description:
    "Workflows i Haugesund bygger AI-agenter, kunstig intelligens og skreddersydd software. Les kundecasene fra CSUB, Festiviteten og ElementLab.",
  alternates: {
    canonical: "/kunder",
    languages: {
      "nb-NO": "/kunder",
      "en": "/kunder",
      "x-default": "/kunder",
    },
  },
  openGraph: {
    title: "Kundecaser | Workflows",
    description:
      "Ekte AI- og softwareprosjekter levert av Workflows i Haugesund — CSUB, Festiviteten og ElementLab.",
    url: urlFor("/kunder"),
  },
  keywords: [
    "AI kundecaser",
    "kunstig intelligens case Norge",
    "AI-agenter kundecase",
    "skreddersydd software Norge",
    "automatisering eksempler",
    "Workflows referanser",
    "AI Haugesund referanser",
  ],
};

const cases = [
  {
    name: "CSUB",
    logo: "/kunder-csub.svg",
    slug: "csub",
    industry: "Subsea & Offshore",
    summary: "Intelligent dashboard som samler prosjektdata fra Excel-filer, med en AI-assistent som svarer på spørsmål og genererer rapporter på sekunder.",
    results: ["Alt samlet på ett sted", "AI-assistent med datainnsikt", "Rapporter på sekunder"],
  },
  {
    name: "Festiviteten",
    logo: "/kunder-festiviteten.png",
    slug: "festiviteten",
    industry: "Kultur & arrangement",
    summary: "AI som holder styr på billettsalg og annonser på Meta, Google og radio — med personlige AI-assistenter koblet på hele økosystemet, tilgjengelig 24/7.",
    results: ["Sanntidsoversikt på alle kanaler", "AI-assistent 24/7", "Varsler ved svakt salg"],
  },
  {
    name: "ElementLab",
    logo: "/kunder-elementlab.png",
    slug: "elementlab",
    industry: "Helse & Velvære",
    summary: "Skreddersydd booking-frontend integrert i nettsiden og AI-chatbot trent på behandlingsdata — en sømløs kundereise fra A til Å.",
    results: ["Booking rett på nettsiden", "AI-chatbot 24/7", "Eget design, full kontroll"],
  },
];

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Kundecaser", path: "/kunder" },
]);

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Kundecaser — Workflows Haugesund",
  description:
    "Samling av kundecaser som viser AI-agenter, kunstig intelligens og skreddersydd software levert av Workflows.",
  url: urlFor("/kunder"),
  inLanguage: "nb-NO",
  hasPart: cases.map((c) => ({
    "@type": "CreativeWork",
    name: c.name,
    url: urlFor(`/kunder/${c.slug}`),
    about: c.industry,
  })),
};

export default function KunderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <section className="page-hero">
        <div className="wrap">
          <span className="tag">Kundecaser</span>
          <h1>Bedrifter som jobber smartere med AI fra Workflows</h1>
          <p className="page-hero__sub">
            Fra subsea-operasjoner til helsesentre — se hvordan vi har bygget AI-agenter,
            kunstig intelligens og skreddersydd software som faktisk gjør en forskjell i hverdagen.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cases-grid">
            {cases.map((c) => (
              <article key={c.slug} className="case-card card-link-host">
                <div className="case-card__header">
                  <div className="case-card__logo">
                    <Image src={c.logo} alt={c.name} width={200} height={70} style={{ width: "auto", height: "44px", objectFit: "contain" }} />
                  </div>
                  <span className="case-card__industry">{c.industry}</span>
                </div>
                <h2>
                  <Link href={`/kunder/${c.slug}`} className="card-link">
                    {c.name}
                  </Link>
                </h2>
                <p>{c.summary}</p>
                <div className="case-card__results">
                  {c.results.map((r) => (
                    <span key={r} className="case-card__result">{r}</span>
                  ))}
                </div>
                <span className="case-card__link" aria-hidden="true">Les hele casen &rarr;</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Vil du bli neste suksesshistorie?</h2>
            <p>Book en uforpliktende samtale. Vi finner ut sammen hva vi kan gjøre for din bedrift.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
