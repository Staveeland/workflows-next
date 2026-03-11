import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kundecaser",
  description: "Se hvordan Workflows har hjulpet norske bedrifter med skreddersydd software, AI-assistenter og smarte integrasjoner. Les våre kundecaser fra CSUB, Saga Subsea og ElementLab.",
  keywords: ["kundecaser", "referanser", "automatisering eksempler", "skreddersydd software Norge", "AI-løsninger case study"],
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
    name: "Saga Subsea",
    logo: "/kunder-saga.png",
    slug: "saga-subsea",
    industry: "Subsea-tjenester",
    summary: "Intelligent sporingsteknologi som overvåker maritim trafikk og varsler om salgsmuligheter — lenge før konkurrentene oppdager dem.",
    results: ["Tidlig varsling", "Automatisk overvåking 24/7", "Flere innhentede oppdrag"],
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

export default function KunderPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="tag">Kundecaser</span>
          <h1>Bedrifter som jobber smartere med Workflows</h1>
          <p className="page-hero__sub">
            Fra subsea-operasjoner til helsesentre — se hvordan vi har bygget skreddersydde løsninger som faktisk gjør en forskjell i hverdagen.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cases-grid">
            {cases.map((c) => (
              <Link key={c.slug} href={`/kunder/${c.slug}`} className="case-card">
                <div className="case-card__header">
                  <div className="case-card__logo">
                    <Image src={c.logo} alt={c.name} width={200} height={70} style={{ width: "auto", height: "44px", objectFit: "contain" }} />
                  </div>
                  <span className="case-card__industry">{c.industry}</span>
                </div>
                <h2>{c.name}</h2>
                <p>{c.summary}</p>
                <div className="case-card__results">
                  {c.results.map((r) => (
                    <span key={r} className="case-card__result">{r}</span>
                  ))}
                </div>
                <span className="case-card__link">Les hele casen &rarr;</span>
              </Link>
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
