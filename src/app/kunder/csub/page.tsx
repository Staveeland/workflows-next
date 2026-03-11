import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSUB – Kundecase",
  description: "Se hvordan Workflows hjalp CSUB med å automatisere prosjektstyring og rapportering for subsea-operasjoner. 25 timer spart per uke med skreddersydd software.",
  keywords: ["CSUB", "subsea automatisering", "prosjektstyring", "sanntidsrapportering", "offshore software", "Workflows kundecase"],
};

export default function CsubCase() {
  return (
    <>
      <section className="page-hero page-hero--case">
        <div className="wrap">
          <Link href="/kunder" className="back-link">&larr; Alle kundecaser</Link>
          <div className="case-hero">
            <div className="case-hero__info">
              <span className="tag">Kundecase</span>
              <h1>CSUB</h1>
              <p className="case-hero__tagline">Automatisert prosjektstyring og sanntidsrapportering for subsea-operasjoner</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Subsea & Offshore</span></div>
                <div><strong>Tjenester</strong><span>Skreddersydd software, Automatisering</span></div>
                <div><strong>Tidsramme</strong><span>8 uker</span></div>
              </div>
            </div>
            <div className="case-hero__logo">
              <Image src="/kunder-csub.svg" alt="CSUB" width={250} height={80} style={{ width: "auto", height: "60px" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="case-content">
            <div className="case-results-bar">
              <div className="case-result">
                <span className="case-result__num">25</span>
                <span className="case-result__label">timer spart per uke</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">100%</span>
                <span className="case-result__label">automatiserte rapporter</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">3x</span>
                <span className="case-result__label">raskere beslutninger</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                CSUB er et ledende selskap innen subsea-tjenester med operasjoner langs hele norskekysten. Med flere parallelle prosjekter og et voksende team ble det stadig vanskeligere å holde oversikt over fremdrift, ressursbruk og økonomi.
              </p>
              <p>
                Prosjektlederne brukte timer hver dag på å samle inn data fra ulike systemer, sette sammen rapporter manuelt i Excel, og sende oppdateringer til kunder og ledelse. Informasjonen var ofte utdatert innen den ble levert.
              </p>

              <h2>Løsningen</h2>
              <p>
                Workflows bygget et skreddersydd prosjektstyringssystem som automatisk henter data fra CSUBs eksisterende verktøy — timeregistrering, økonomi og operasjonelle logger. Systemet genererer sanntidsrapporter og dashboards som gir full oversikt med et blikk.
              </p>
              <ul>
                <li>Automatisk datainnsamling fra 4 ulike kildesystemer</li>
                <li>Sanntids-dashboard med prosjektstatus, økonomi og KPIer</li>
                <li>Automatisk genererte ukerapporter sendt direkte til kunder</li>
                <li>Varslingssystem for avvik og budsjettoverskridelser</li>
                <li>Mobilvennlig grensesnitt for bruk offshore</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                Prosjektlederne fikk tilbake 25 timer i uken som tidligere gikk til manuell rapportering. Ledelsen har nå sanntidsoversikt over alle prosjekter, og kunder får automatiske oppdateringer uten at noen trenger å lage dem manuelt.
              </p>
              <p>
                Systemet har også avdekket kostnadsbesparelser ved å synliggjøre ressursbruk på tvers av prosjekter — noe som tidligere var umulig å se uten omfattende manuelt arbeid.
              </p>

              <blockquote>
                &ldquo;Vi visste vi brukte for mye tid på rapportering, men vi hadde ikke forestilt oss at det kunne automatiseres så fullstendig. Workflows leverte et system som faktisk endret hverdagen vår.&rdquo;
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
              <Link href="/kunder/saga-subsea" className="case-other__card">
                <Image src="/kunder-saga.png" alt="Saga Subsea" width={160} height={50} style={{ width: "auto", height: "32px", objectFit: "contain" }} />
                <h3>Saga Subsea</h3>
                <p>Digital assistent og kundeoppfølging</p>
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
