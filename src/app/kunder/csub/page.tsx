import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSUB – Kundecase",
  description: "Se hvordan Workflows bygget et intelligent dashboard med AI-assistent som samler prosjektdata og genererer rapporter for CSUB.",
  keywords: ["CSUB", "dashboard", "AI-assistent", "prosjektdata", "rapportering", "RAG", "Workflows kundecase"],
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
              <p className="case-hero__tagline">Intelligent dashboard og AI-assistent som gjør prosjektdata tilgjengelig på sekunder</p>
              <div className="case-hero__meta">
                <div><strong>Bransje</strong><span>Subsea & Offshore</span></div>
                <div><strong>Tjenester</strong><span>Dashboard, AI-assistent, Dataintegrasjon</span></div>
                <div><strong>Tidsramme</strong><span>6 uker</span></div>
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
                <span className="case-result__num">Alt</span>
                <span className="case-result__label">samlet på ett sted</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">AI</span>
                <span className="case-result__label">assistent med full datainnsikt</span>
              </div>
              <div className="case-result">
                <span className="case-result__num">Sek.</span>
                <span className="case-result__label">fra spørsmål til rapport</span>
              </div>
            </div>

            <div className="case-body">
              <h2>Utfordringen</h2>
              <p>
                CSUB driver komplekse subsea-prosjekter med store mengder data spredt utover utallige Excel-filer, e-poster og systemer. Prosjektlederne brukte timer på å grave frem tall, sammenstille informasjon og lage rapporter manuelt.
              </p>
              <p>
                Å få svar på enkle spørsmål som «Hva er status på prosjekt X?» eller «Hvor mye har vi brukt på Y?» krevde at noen satt seg ned og lette gjennom mapper og regneark. Verdifull innsikt lå skjult i data ingen hadde tid til å analysere.
              </p>

              <h2>Løsningen</h2>
              <p>
                Workflows bygget et sentralisert dashboard som automatisk samler og strukturerer data fra CSUBs eksisterende Excel-filer og systemer. All prosjektinformasjon — økonomi, fremdrift, ressursbruk — er tilgjengelig i et oversiktlig grensesnitt.
              </p>
              <p>
                I tillegg ble det utviklet en AI-drevet chatassistent som har full tilgang til databasen. Teamet kan stille spørsmål i naturlig språk og få svar umiddelbart — enten det er en statusoppdatering, et sammendrag eller en fullstendig rapport.
              </p>
              <ul>
                <li>Sentralisert dashboard som samler data fra Excel-filer og eksisterende systemer</li>
                <li>Navigerbar prosjektoversikt med økonomi, fremdrift og nøkkeltall</li>
                <li>AI-chatassistent med tilgang til hele databasen via RAG-system</li>
                <li>Rapportgenerering på forespørsel — spør og få rapport i løpet av sekunder</li>
                <li>Filtrerbart og søkbart grensesnitt for rask navigering</li>
              </ul>

              <h2>Resultatet</h2>
              <p>
                CSUB har gått fra å bruke timer på å lete etter informasjon til å få svar på sekunder. Prosjektledere kan nå fokusere på å drive prosjektene fremover istedenfor å lage rapporter, og ledelsen har sanntidsoversikt over hele porteføljen.
              </p>
              <p>
                AI-assistenten har blitt et naturlig verktøy i hverdagen. Teamet bruker den til alt fra raske statussjekker til å generere detaljerte rapporter for kunder — uten å åpne en eneste Excel-fil.
              </p>

              <blockquote>
                &ldquo;Før måtte vi bruke en halv dag på å sette sammen en prosjektrapport. Nå spør vi bare assistenten, og den leverer på sekunder. Det er som å ha en ekstra prosjektleder som aldri glemmer noe.&rdquo;
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
                <p>Intelligent sporingsteknologi</p>
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
