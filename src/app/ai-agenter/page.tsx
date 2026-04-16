import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "AI-agenter — autonome assistenter for bedrifter",
  description:
    "Vi bygger AI-agenter som planlegger, bruker verktøy og utfører oppgaver på egen hånd. Fra idé til ferdig agent, tilpasset din bedrift.",
  alternates: { canonical: "/ai-agenter" },
  openGraph: {
    title: "AI-agenter — autonome assistenter for bedrifter | Workflows",
    description:
      "Autonome AI-agenter som får et mål, lager en plan og utfører handlinger. Bygget av Workflows i Haugesund.",
    url: `${SITE_URL}/ai-agenter`,
    type: "article",
  },
  keywords: [
    "AI-agenter",
    "AI agenter",
    "smarte agenter",
    "autonome AI-agenter",
    "AI agent bedrift",
    "AI-agent Norge",
    "AI-agent Haugesund",
    "agentic AI",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "AI-agenter", item: `${SITE_URL}/ai-agenter` },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "AI-agentutvikling",
  name: "AI-agenter",
  description:
    "Utvikling av autonome AI-agenter som planlegger, bruker verktøy og utfører oppgaver på vegne av bedrifter.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/ai-agenter`,
};

export default function AiAgenterPage() {
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
          <span className="tag">AI-agenter</span>
          <h1>AI-agenter</h1>
          <p className="page-hero__sub">
            En AI-agent får et mål, lager sin egen plan, henter data, bruker verktøy og utfører
            handlinger. Vi bygger agenter som faktisk gjør jobben for deg — trygt, testet og
            tilpasset din bedrift.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Hva er en AI-agent?</h2>
            <p>
              En AI-agent er et system som er koblet til en språkmodell og til verktøy og data
              i bedriften din. I stedet for å bare svare på spørsmål, kan agenten ta beslutninger
              og utføre handlinger. Du forteller agenten hva målet er, og den finner ut resten
              på egen hånd.
            </p>
            <p>
              Hvis du ber en vanlig chatbot om å «lage en kvartalsrapport for Q1», svarer den
              kanskje med et forslag til hvordan rapporten kan se ut. En agent derimot henter
              faktiske tall fra systemene dine, analyserer trender, lager grafer, skriver
              sammendraget og leverer deg en ferdig presentasjon.
            </p>

            <h2>Forskjellen på chatbot, automatisering og agent</h2>
            <ul>
              <li>
                <strong>Chatbot:</strong> Svarer på spørsmål basert på tilgjengelig data.
                Reaktiv — venter på at du skal spørre om noe.
              </li>
              <li>
                <strong>Automatisert flyt:</strong> Kjører en fast sekvens av steg når noe
                trigger den. Forutsigbar — gjør det samme hver gang.
              </li>
              <li>
                <strong>AI-agent:</strong> Får et mål og velger selv hvilke steg som trengs.
                Dynamisk — tilpasser seg situasjonen.
              </li>
            </ul>
            <p>
              De tre nivåene utelukker ikke hverandre. Ofte er den beste løsningen en
              kombinasjon: automatiserte flyter for det som er forutsigbart, og agenter der
              det kreves skjønn eller variasjon.
            </p>

            <h2>Hva en AI-agent kan gjøre for bedriften din</h2>
            <p>Noen typiske bruksområder vi bygger agenter for:</p>
            <ul>
              <li>
                Lese innkommende e-post, klassifisere dem, trekke ut data og legge det inn i
                riktig system.
              </li>
              <li>
                Overvåke data kontinuerlig og varsle når det skjer noe som krever oppmerksomhet.
              </li>
              <li>
                Forberede rapporter ved å hente tall fra flere systemer, analysere og oppsummere.
              </li>
              <li>
                Kundestøtte som ikke bare svarer, men også faktisk løser saker — oppretter
                ordrer, booker møter, oppdaterer kontoer.
              </li>
              <li>
                Research-oppgaver: grave frem informasjon fra interne dokumenter og eksterne
                kilder, kryssjekke og levere et sammendrag.
              </li>
            </ul>

            <h2>Slik bygger vi AI-agenter</h2>
            <p>
              En agent som får tilgang til produksjonssystemer er et alvorlig ansvar. Vi følger
              noen grunnprinsipper:
            </p>
            <ul>
              <li>
                <strong>Begrensede tilganger.</strong> Agenten får bare verktøyene og dataene
                den faktisk trenger. Ingen generell tilgang.
              </li>
              <li>
                <strong>Menneske i løkken der det trengs.</strong> Handlinger med konsekvenser
                krever ofte godkjenning før de utføres.
              </li>
              <li>
                <strong>Logging og sporing.</strong> Alle beslutninger og handlinger logges,
                slik at du kan se nøyaktig hva agenten har gjort og hvorfor.
              </li>
              <li>
                <strong>Testing.</strong> Agenter testes mot realistiske scenarier før de
                settes i produksjon.
              </li>
              <li>
                <strong>Iterasjon.</strong> Vi starter med et smalt scope, lar agenten bevise
                seg, og utvider først når den fungerer trygt.
              </li>
            </ul>

            <h2>Teknologi vi bruker</h2>
            <p>
              Vi bygger på de beste tilgjengelige språkmodellene: OpenAI (GPT-serien), Anthropic
              (Claude), og Google (Gemini). Vi er teknologi-agnostiske og velger det som passer
              best for hvert prosjekt. Agentene kjøres typisk på Vercel, Microsoft Azure eller
              Google Cloud — ofte innenfor EU for å følge norske og europeiske personvernkrav.
            </p>

            <h2>Eksempler fra våre prosjekter</h2>
            <p>
              Vi har bygget agent-lignende systemer for flere kunder. Les om{" "}
              <Link href="/kunder/csub">CSUB</Link> — der en RAG-assistent henter frem
              prosjektdata og genererer rapporter — eller{" "}
              <Link href="/kunder/saga-subsea">Saga Subsea</Link>, der AI overvåker maritim
              trafikk og varsler automatisk.
            </p>

            <h2>Kom i gang</h2>
            <p>
              Ikke alle problemer trenger en agent. Noen ganger er en enkel automatisering bedre.
              I en første samtale finner vi ut sammen hva som passer din bedrift — og om en
              AI-agent er riktig verktøy.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Vil du utforske AI-agenter for din bedrift?</h2>
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
