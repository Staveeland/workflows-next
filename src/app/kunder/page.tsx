import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kundecaser",
  description: "Se hvordan Workflows har hjulpet norske bedrifter med skreddersydd software, automatisering og digitale assistenter. Les våre kundecaser fra CSUB, Saga Subsea og ElementLab.",
  keywords: ["kundecaser", "referanser", "automatisering eksempler", "skreddersydd software Norge", "bedriftsautomatisering case study"],
};

const cases = [
  {
    name: "CSUB",
    logo: "/kunder-csub.svg",
    slug: "csub",
    industry: "Subsea & Offshore",
    summary: "Automatisert prosjektstyring og sanntidsrapportering som sparte 25 timer per uke.",
    results: ["25 timer spart per uke", "Sanntidsdata", "Null manuelle rapporter"],
  },
  {
    name: "Saga Subsea",
    logo: "/kunder-saga.png",
    slug: "saga-subsea",
    industry: "Subsea-tjenester",
    summary: "Digital assistent for kundeoppfølging og prosjektsporing som doblet responstiden.",
    results: ["50% raskere responstid", "Automatisk oppfølging", "24/7 tilgjengelighet"],
  },
  {
    name: "ElementLab",
    logo: "/kunder-elementlab.png",
    slug: "elementlab",
    industry: "Forskning & Laboratorium",
    summary: "Intern kunnskapsbase og automatisert datainnsamling som kuttet rapporteringstid med 80%.",
    results: ["80% raskere rapporter", "Søkbar kunnskapsbase", "Automatisk dataflyt"],
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
            Fra subsea-operasjoner til forskningslaboratorier — se hvordan vi har hjulpet norske bedrifter med å spare tid, kutte kostnader og jobbe mer effektivt.
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
