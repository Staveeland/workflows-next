import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "Kunstig intelligens i Haugesund — praktisk AI for bedrifter",
  description:
    "Praktisk kunstig intelligens for bedrifter i Haugesund. Vi bygger AI-løsninger som løser konkrete problemer — ikke hype, bare ting som faktisk fungerer.",
  alternates: { canonical: "/kunstig-intelligens-haugesund" },
  openGraph: {
    title: "Kunstig intelligens i Haugesund | Workflows",
    description:
      "Praktisk AI for bedrifter på Haugalandet. Chatboter, assistenter, dokumentforståelse og automatisering.",
    url: `${SITE_URL}/kunstig-intelligens-haugesund`,
    type: "article",
  },
  keywords: [
    "kunstig intelligens Haugesund",
    "KI Haugesund",
    "AI Haugesund",
    "kunstig intelligens bedrift",
    "maskinlæring Haugesund",
    "AI-løsninger Haugesund",
    "kunstig intelligens Haugalandet",
    "kunstig intelligens Rogaland",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hjem", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Kunstig intelligens i Haugesund",
      item: `${SITE_URL}/kunstig-intelligens-haugesund`,
    },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Kunstig intelligens",
  name: "Kunstig intelligens i Haugesund",
  description:
    "Praktiske AI-løsninger for bedrifter: chatboter, RAG-assistenter, dokumentforståelse, automatisert kategorisering og integrerte AI-agenter.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "AdministrativeArea", name: "Haugalandet" },
    { "@type": "AdministrativeArea", name: "Rogaland" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/kunstig-intelligens-haugesund`,
};

export default function KunstigIntelligensHaugesundPage() {
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
          <span className="tag">Kunstig intelligens Haugesund</span>
          <h1>Kunstig intelligens i Haugesund</h1>
          <p className="page-hero__sub">
            Praktisk AI, ikke hype. Workflows er basert i Haugesund og bygger løsninger med
            kunstig intelligens som faktisk løser konkrete problemer for bedrifter på
            Haugalandet og i resten av Norge.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Kunstig intelligens — enkelt forklart</h2>
            <p>
              Kunstig intelligens er en samlebetegnelse for systemer som kan gjøre oppgaver som
              tradisjonelt har krevd menneskelig forståelse: å lese og tolke tekst, gjenkjenne
              mønstre i data, føre en samtale, klassifisere innhold, eller ta avgjørelser
              basert på ufullstendig informasjon.
            </p>
            <p>
              De siste årene har språkmodeller som GPT og Claude gjort AI praktisk anvendelig
              for nesten alle bedrifter. Du trenger ikke lenger et datateam på 20 for å
              bruke AI — du trenger en partner som vet hvor og hvordan det gir verdi.
            </p>

            <h2>Hvor passer AI — og hvor passer det ikke</h2>
            <p>
              Vi er prinsippielle på dette: AI er ikke alltid svaret. Mange problemer løses
              bedre med en enkel automatisering eller en bedre prosess. AI er riktig verktøy
              når du trenger:
            </p>
            <ul>
              <li>Å forstå eller tolke tekst (e-post, dokumenter, kundehenvendelser).</li>
              <li>Å kategorisere eller prioritere noe der reglene er uklare eller varierer.</li>
              <li>Å hente svar fra store mengder interne data raskt.</li>
              <li>Å generere tekst, oppsummeringer eller rapporter.</li>
              <li>Å ta beslutninger basert på mønstre i data, ikke eksakte regler.</li>
            </ul>
            <p>
              For strukturerte oppgaver med klare regler (for eksempel «når ordre kommer inn,
              send faktura»), er tradisjonell automatisering både billigere og mer forutsigbar.
              Vår jobb er å velge riktig verktøy for hvert problem.
            </p>

            <h2>Konkrete bruksområder</h2>
            <ul>
              <li>
                <strong>Kundeservice-assistenter</strong> som svarer på spørsmål basert på
                bedriftens egen dokumentasjon og data, døgnet rundt.
              </li>
              <li>
                <strong>RAG-systemer</strong> (retrieval-augmented generation) som henter svar
                fra interne kilder i stedet for å finne på ting.
              </li>
              <li>
                <strong>Dokumentforståelse</strong> — automatisk lesing av fakturaer,
                kontrakter, rapporter. Trekker ut nøkkeldata og legger det inn i riktig system.
              </li>
              <li>
                <strong>Automatisk kategorisering</strong> av henvendelser, leads, tickets
                eller data — med forklaring på hvorfor AI-en kategoriserte slik.
              </li>
              <li>
                <strong>AI-agenter</strong> som kan utføre handlinger på egen hånd. Les mer
                på <Link href="/ai-agenter">vår side om AI-agenter</Link>.
              </li>
            </ul>

            <h2>AI-prosjekter på Haugalandet</h2>
            <p>
              Vi har levert AI-løsninger til bedrifter i regionen. Tre eksempler:
            </p>
            <ul>
              <li>
                <Link href="/kunder/csub"><strong>CSUB</strong></Link> — RAG-assistent som gir
                prosjektledere svar fra Excel-filer og systemer på sekunder.
              </li>
              <li>
                <Link href="/kunder/saga-subsea"><strong>Saga Subsea</strong></Link> — AI som
                overvåker maritim trafikk og varsler automatisk.
              </li>
              <li>
                <Link href="/kunder/elementlab"><strong>ElementLab</strong></Link> — chatbot
                trent på behandlingsdata, integrert med booking.
              </li>
            </ul>

            <h2>Teknologi og personvern</h2>
            <p>
              Vi bygger på de beste språkmodellene som finnes i dag — OpenAI, Anthropic Claude,
              og Google Gemini. For sensitive data kjører vi innenfor EU, og vi følger
              GDPR-kravene. Du skal alltid vite hvor dataene dine ligger, hvem som har tilgang
              og hvordan AI-en bruker dem.
            </p>

            <h2>Lokal AI-partner i Haugesund</h2>
            <p>
              Vi er basert i Haugesund og kjenner bedriftene på Haugalandet. Vi kan møtes
              fysisk når det gir mening, og vi vet hva som kjennetegner lokale bransjer.
              Du får en partner som snakker ditt språk og forstår konteksten din.
            </p>
            <p>
              Se også <Link href="/ai-haugesund">AI i Haugesund</Link> for en bredere oversikt
              over hva vi gjør lokalt.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Nysgjerrig på hva AI kan gjøre for din bedrift?</h2>
            <p>Ta kontakt for en uforpliktende samtale. Vi finner ut sammen hva som passer.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
