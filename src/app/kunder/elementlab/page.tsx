import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ElementLab – Kundecase",
  description: "Se hvordan Workflows bygget en intern kunnskapsbase og automatisert datainnsamling for ElementLab. 80% raskere rapportering og sokbar dokumentasjon.",
  keywords: ["ElementLab", "kunnskapsbase", "automatisert rapportering", "laboratorium software", "forskning automatisering", "Workflows kundecase"],
};

export default function ElementLabCase() {
  return (
    <>
      <section className="page-hero page-hero--case">
        <div className="wrap">
          <Link href="/kunder" className="back-link">&larr; Alle kundecaser</Link>
          <div className="case-hero">
            <div className="case-hero__info">
              <span className="tag">Kundecase</span>
              <h1>ElementLab</h1>
              <p className="case-hero__tagline">Intern kunnskapsbase og automatisert datainnsamling for forskningsmiljo</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Forskning & Laboratorium</span></div>
                <div><strong>Tjenester</strong><span>Kunnskapsbase, Automatisert rapportering</span></div>
                <div><strong>Tidsramme</strong><span>10 uker</span></div>
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
                <span className="case-result__num">80%</span>
                <span className="case-result__label">raskere rapportering</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">500+</span>
                <span className="case-result__label">sokbare dokumenter</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">15</span>
                <span className="case-result__label">timer spart per uke</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                ElementLab er et forsknings- og analyselaboratorium som jobber med komplekse proveprosesser og genererer store mengder data daglig. Forskerne brukte uforholdsmessig mye tid pa a dokumentere resultater, finne tidligere forsoksdata og sette sammen rapporter.
              </p>
              <p>
                Kunnskapen var spredt pa tvers av individuelle datamaskiner, utdaterte mapper pa en filserver og hodene til erfarne ansatte. Nar nye forskere begynte, tok det maneder for de var produktive fordi opplaeringen var ustrukturert.
              </p>

              <h2>Losningen</h2>
              <p>
                Workflows bygget en intelligent kunnskapsbase som samler all dokumentasjon, prosedyrer og forsoksdata pa ett sted — sokbart og tilgjengelig for alle. I tillegg ble det laget et automatisert system for datainnsamling fra laboratorieutstyr.
              </p>
              <ul>
                <li>Sokbar kunnskapsbase med AI-drevet sok og kategorisering</li>
                <li>Automatisk import av data fra laboratorieinstrumenter</li>
                <li>Mal-basert rapportgenerering med ett klikk</li>
                <li>Versjonskontroll for prosedyrer og metoder</li>
                <li>Onboarding-modul for nye ansatte med steg-for-steg-guider</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Rapporteringstiden gikk ned med 80% — fra en halv dag til under en time for en fullstendig analyserapport. Nye ansatte er na produktive etter to uker istedenfor to maneder, takket vaere den strukturerte kunnskapsbasen.
              </p>
              <p>
                Forskerne bruker na mesteparten av tiden sin pa faktisk forskning istedenfor administrativt arbeid. Ledelsen har full sporbarhet pa alle prosesser, noe som ogsaa har forenklet kvalitetssikring og sertifiseringsprosesser.
              </p>

              <blockquote>
                &ldquo;Kunnskapsbasen har forandret maten vi jobber pa. Tidligere brukte vi timer pa a lete etter informasjon — na finner vi alt pa sekunder. Og det automatiserte rapporteringssystemet har frigjort tid vi ikke visste vi hadde.&rdquo;
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
              <Link href="/kunder/saga-subsea" className="case-other__card">
                <Image src="/kunder-saga.png" alt="Saga Subsea" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>Saga Subsea</h3>
                <p>Digital assistent og kundeoppfolging</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
