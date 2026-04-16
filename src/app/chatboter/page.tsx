import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "Chatboter for bedrifter — AI-drevne assistenter",
  description:
    "Vi bygger chatboter som svarer kunder, henter data fra interne systemer og håndterer henvendelser døgnet rundt. Bygget med språkmodeller, trent på bedriftens egen data.",
  alternates: { canonical: "/chatboter" },
  openGraph: {
    title: "Chatboter for bedrifter | Workflows",
    description:
      "AI-drevne chatboter som svarer kunder og henter data fra bedriftens egne systemer.",
    url: `${SITE_URL}/chatboter`,
    type: "article",
  },
  keywords: [
    "chatbot",
    "chatbot bedrift",
    "AI chatbot",
    "chatbot Haugesund",
    "chatbot Norge",
    "kundeservice chatbot",
    "RAG chatbot",
    "språkmodell chatbot",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Chatboter", item: `${SITE_URL}/chatboter` },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Chatbot-utvikling",
  name: "Chatboter for bedrifter",
  description:
    "Utvikling av AI-drevne chatboter som svarer kunder, håndterer henvendelser og henter data fra interne systemer.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/chatboter`,
};

export default function ChatboterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <section className="page-hero">
        <div className="wrap">
          <span className="tag">Nivå 1 — Chatboter</span>
          <h1>Chatboter for bedrifter</h1>
          <p className="page-hero__sub">
            En chatbot er en digital assistent som svarer på spørsmål i et samtalegrensesnitt.
            Vi bygger chatboter som er koblet til språkmodeller og bedriftens egne data —
            slik at de faktisk kan være nyttige, ikke bare skript-styrte.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Hva er en moderne chatbot?</h2>
            <p>
              De gamle chatbotene var i praksis beslutningstrær — «velg 1 for ordre, 2 for
              support». Moderne chatboter er koblet på språkmodeller som GPT eller Claude, og
              kan føre en naturlig samtale. De kan også kobles på bedriftens egen dokumentasjon
              og data, slik at de svarer ut fra reell informasjon — ikke bare hva de ble trent
              på generelt.
            </p>
            <p>
              Denne tilnærmingen kalles ofte <strong>RAG</strong> (retrieval-augmented
              generation). Chatboten henter frem relevante utdrag fra dine dokumenter og bruker
              dem som grunnlag for svaret. Det gjør svarene presise og sporbare — og reduserer
              risikoen for at den finner på ting.
            </p>

            <h2>Når er en chatbot riktig verktøy?</h2>
            <p>En chatbot passer godt når du har:</p>
            <ul>
              <li>
                Mange repeterende spørsmål fra kunder eller ansatte som egentlig har standardsvar
                i dokumentasjon noen må lete seg frem til.
              </li>
              <li>
                En stor mengde informasjon — produkter, behandlinger, regler, prosedyrer — som
                er vanskelig å navigere via meny eller søk.
              </li>
              <li>Behov for støtte døgnet rundt, uten å bemanne utenom åpningstid.</li>
              <li>
                En ønsket tone og brand-stemme som må være konsistent på tvers av henvendelser.
              </li>
            </ul>
            <p>
              Trenger du noe som gjør mer enn å svare — for eksempel opprette ordrer, oppdatere
              data eller ta handlinger — er det ofte en{" "}
              <Link href="/ai-agenter">AI-agent</Link> du trenger, ikke en chatbot. Og hvis
              oppgaven er strukturert og forutsigbar, kan en{" "}
              <Link href="/automatiserte-flyter">automatisert flyt</Link> være enklere og
              rimeligere.
            </p>

            <h2>Typer chatboter vi bygger</h2>
            <ul>
              <li>
                <strong>Kundeservice-chatboter</strong> — svarer kunder på spørsmål om
                produkter, ordrer, retur, levering.
              </li>
              <li>
                <strong>Interne kunnskapsassistenter</strong> — hjelper ansatte med å finne
                frem i rutiner, håndbøker, tekniske manualer, HR-dokumenter.
              </li>
              <li>
                <strong>Lead-kvalifisering</strong> — fører en innledende samtale med besøkende
                på nettsiden og sorterer mellom reelle interessenter og generelle spørsmål.
              </li>
              <li>
                <strong>Support-chatboter med eskalering</strong> — håndterer enkle saker selv,
                og sender komplekse saker videre til et menneske med full kontekst.
              </li>
            </ul>

            <h2>Hvordan vi bygger en chatbot</h2>
            <ol>
              <li>
                <strong>Kartlegging.</strong> Vi ser på hvilke spørsmål chatboten skal kunne
                svare på, og hvilken data den trenger tilgang til.
              </li>
              <li>
                <strong>Datagrunnlag.</strong> Vi samler, strukturerer og indekserer
                dokumentasjonen. Dårlig datagrunnlag gir dårlig chatbot — uansett hvor god
                modellen er.
              </li>
              <li>
                <strong>Prompt og tone.</strong> Vi skreddersyr hvordan chatboten skal snakke
                — formell eller uformell, fag-språk eller forenklet.
              </li>
              <li>
                <strong>Testing og iterasjon.</strong> Vi tester mot realistiske spørsmål, og
                justerer til den svarer slik du vil.
              </li>
              <li>
                <strong>Publisering.</strong> Integreres på nettsiden, i Slack, Teams, WhatsApp,
                eller et eget grensesnitt.
              </li>
            </ol>

            <h2>Integrasjon med eksisterende kanaler</h2>
            <p>
              Chatboten trenger ikke å leve i et eget vindu på nettsiden din. Vi kan bygge den
              inn i Slack eller Microsoft Teams for interne team, i WhatsApp eller Messenger
              for kundehenvendelser, eller som et API andre systemer kan kalle.
            </p>

            <h2>Personvern og datasikkerhet</h2>
            <p>
              For sensitive data kjører vi innenfor EU og følger GDPR. Du bestemmer selv hva
              chatboten har tilgang til, hva som logges, og hvor lenge samtaler lagres. Vi kan
              også sette opp versjoner der ingen data sendes ut av din egen infrastruktur.
            </p>

          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Vil du utforske chatbot for din bedrift?</h2>
            <p>Book en uforpliktende samtale. Vi finner ut sammen hva som passer.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
