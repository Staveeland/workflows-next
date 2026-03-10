import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Saga Subsea – Kundecase",
  description: "Se hvordan Workflows bygget en digital assistent og kundeoppfolgingssystem for Saga Subsea. 50% raskere responstid og 24/7 tilgjengelighet.",
  keywords: ["Saga Subsea", "digital assistent", "kundeoppfolging", "subsea tjenester", "automatisert kundekommunikasjon", "Workflows kundecase"],
};

export default function SagaSubseaCase() {
  return (
    <>
      <section className="page-hero page-hero--case">
        <div className="wrap">
          <Link href="/kunder" className="back-link">&larr; Alle kundecaser</Link>
          <div className="case-hero">
            <div className="case-hero__info">
              <span className="tag">Kundecase</span>
              <h1>Saga Subsea</h1>
              <p className="case-hero__tagline">Digital assistent og smart kundeoppfolging for subsea-tjenester</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Subsea-tjenester</span></div>
                <div><strong>Tjenester</strong><span>Digital assistent, Systemintegrasjon</span></div>
                <div><strong>Tidsramme</strong><span>6 uker</span></div>
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
                <span className="case-result__num">50%</span>
                <span className="case-result__label">raskere responstid</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">24/7</span>
                <span className="case-result__label">tilgjengelighet</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">0</span>
                <span className="case-result__label">tapte henvendelser</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                Saga Subsea tilbyr spesialiserte subsea-tjenester til olje- og gassindustrien. Med kunder spredt over hele Nordsjoen og henvendelser som kom dognets alle timer, slet teamet med a folge opp alle i tide.
              </p>
              <p>
                Potensielle oppdrag falt mellom stolene fordi henvendelser ble liggende ubesvart i innboksen. Prosjektoppdateringer ble gitt muntlig eller via ad hoc-e-poster, og det var ingen systematisk mate a spore kunderelasjoner pa.
              </p>

              <h2>Losningen</h2>
              <p>
                Workflows utviklet en digital assistent som handterer forstekontakt med kunder, kategoriserer henvendelser og ruter dem til riktig person. I tillegg ble det bygget et oppfolgingssystem som sikrer at ingen henvendelser gar tapt.
              </p>
              <ul>
                <li>AI-drevet digital assistent for forstelinjesvar pa e-post og nettside</li>
                <li>Automatisk kategorisering og prioritering av henvendelser</li>
                <li>Oppfolgingssystem med paaminnelser og eskalering</li>
                <li>Kundeportal med prosjektstatus og dokumenter</li>
                <li>Integrasjon med eksisterende e-post og CRM</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Saga Subsea svarer na pa alle henvendelser innen 30 minutter — ogsaa midt pa natten. Den digitale assistenten handterer 60% av rutinehenvendelsene helt automatisk, slik at teamet kan fokusere pa de komplekse forespørslene.
              </p>
              <p>
                Oppfolgingssystemet har eliminert problemet med tapte henvendelser fullstendig, og kundetilfredsheten har okt markant siden implementeringen.
              </p>

              <blockquote>
                &ldquo;Workflows forsto umiddelbart hva vi trengte. Den digitale assistenten foler seg som en naturlig del av teamet — den svarer profesjonelt og ruter alt riktig. Vi har ikke mistet en eneste henvendelse siden.&rdquo;
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
                <p>Prosjektstyring og sanntidsrapportering</p>
              </Link>
              <Link href="/kunder/elementlab" className="case-other__card">
                <Image src="/kunder-elementlab.png" alt="ElementLab" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>ElementLab</h3>
                <p>Kunnskapsbase og automatisert lab-data</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
