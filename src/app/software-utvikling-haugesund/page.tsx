import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "Softwareutvikling i Haugesund — skreddersydd programvare",
  description:
    "Workflows er et softwareutviklingsselskap i Haugesund som bygger skreddersydd programvare, interne verktøy, kundeportaler og forretningssystemer.",
  alternates: { canonical: "/software-utvikling-haugesund" },
  openGraph: {
    title: "Softwareutvikling i Haugesund | Workflows",
    description:
      "Skreddersydd programvareutvikling for norske bedrifter, levert av et team i Haugesund.",
    url: `${SITE_URL}/software-utvikling-haugesund`,
    type: "article",
  },
  keywords: [
    "software utvikling Haugesund",
    "softwareutvikling Haugesund",
    "programutvikling Haugesund",
    "programvareutvikling Haugesund",
    "skreddersydd software Haugesund",
    "systemutvikling Haugesund",
    "utviklingsselskap Haugesund",
    "software Haugalandet",
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
      name: "Softwareutvikling i Haugesund",
      item: `${SITE_URL}/software-utvikling-haugesund`,
    },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Softwareutvikling",
  name: "Softwareutvikling i Haugesund",
  description:
    "Skreddersydd programvareutvikling for bedrifter. Interne verktøy, kundeportaler, dashbord, integrasjoner og komplette forretningssystemer.",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "AdministrativeArea", name: "Haugalandet" },
    { "@type": "AdministrativeArea", name: "Rogaland" },
    { "@type": "Country", name: "Norge" },
  ],
  audience: { "@type": "BusinessAudience", name: "Bedrifter" },
  url: `${SITE_URL}/software-utvikling-haugesund`,
};

export default function SoftwareUtviklingHaugesundPage() {
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
          <span className="tag">Softwareutvikling Haugesund</span>
          <h1>Softwareutvikling i Haugesund</h1>
          <p className="page-hero__sub">
            Workflows er et softwareutviklingsselskap i Haugesund. Vi bygger skreddersydd
            programvare for bedrifter som trenger noe som faktisk passer dem — ikke en
            tilnærming man strekker seg etter.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Hva er skreddersydd software?</h2>
            <p>
              Skreddersydd software er programvare bygget spesifikt for din bedrift og dine
              prosesser. I motsetning til hyllevare som Salesforce, HubSpot eller generiske
              bransjesystemer, får du et system som passer nøyaktig til måten dere jobber på.
              Ingen unødvendige funksjoner, ingen kompromisser, og ingenting dere må bøye dere
              etter.
            </p>

            <h2>Når hyllevare ikke strekker til</h2>
            <p>Noen typiske tegn på at du trenger skreddersydd software:</p>
            <ul>
              <li>
                Dere bruker Excel eller Google Sheets til noe som egentlig er et system
                — fordi ingen hyllevare passer helt.
              </li>
              <li>Dere har prosesser hyllevaren ikke støtter, og workarounds tar for mye tid.</li>
              <li>
                Data er spredt på fem forskjellige systemer som ikke snakker med hverandre.
              </li>
              <li>
                Dere betaler for dyre SaaS-lisenser, men bruker bare 20 prosent av funksjonene.
              </li>
              <li>
                Bransjen deres er så spesiell at generiske systemer føles fremmed uansett hvor
                mye dere tilpasser dem.
              </li>
            </ul>

            <h2>Typer systemer vi bygger</h2>
            <ul>
              <li>
                <strong>Interne verktøy og dashbord</strong> — samler data fra flere kilder i
                ett grensesnitt, slik at teamet ditt slipper å hoppe mellom systemer.
              </li>
              <li>
                <strong>Kundeportaler</strong> — gir kundene dine selvbetjening, status, filer
                og kommunikasjon i en profesjonell innpakning.
              </li>
              <li>
                <strong>Systemintegrasjoner</strong> — kobler sammen verktøyene du allerede
                bruker (Tripletex, Visma, Microsoft 365, Google Workspace, Slack,
                bransjespesifikke systemer) slik at data flyter automatisk.
              </li>
              <li>
                <strong>Forretningssystemer</strong> — komplette systemer som dekker
                kjerneprosesser: prosjektstyring, ordrehåndtering, ressursplanlegging,
                rapportering.
              </li>
              <li>
                <strong>AI-integrerte løsninger</strong> — når AI gir reell verdi, bygger vi
                det inn. Les mer om <Link href="/ai-agenter">AI-agenter</Link> og{" "}
                <Link href="/kunstig-intelligens-haugesund">kunstig intelligens</Link>.
              </li>
            </ul>

            <h2>Vår utviklingsprosess</h2>
            <ol>
              <li>
                <strong>Vi snakker sammen.</strong> Gratis førstesamtale der du forteller hva
                som tar for mye tid. Vi lytter, stiller spørsmål og finner ut hva som faktisk
                trengs.
              </li>
              <li>
                <strong>Vi bygger, du ser.</strong> Du ser fremdrift hver uke. Vi viser demoer
                underveis slik at du kan gi tilbakemeldinger tidlig — ingen overraskelser ved
                leveranse.
              </li>
              <li>
                <strong>Vi setter i drift sammen.</strong> Opplæring er inkludert. Vi er
                tilgjengelige når dere har spørsmål, og hjelper til med å lande systemet godt
                i organisasjonen.
              </li>
              <li>
                <strong>Vi videreutvikler.</strong> Gode systemer vokser med bedriften. Vi kan
                fortsette å forbedre og utvide etter behov.
              </li>
            </ol>

            <h2>Teknologi vi bruker</h2>
            <p>
              Vi bygger på moderne, velprøvde teknologier: TypeScript, React, Next.js og
              Python for hoveddelen av arbeidet. Database og infrastruktur på Vercel, Supabase,
              Microsoft Azure eller Google Cloud avhengig av hva som passer prosjektet.
              AI-komponenter bygges med OpenAI, Anthropic Claude eller egne finjusterte
              modeller.
            </p>
            <p>
              Du eier alltid koden og dataene. Ingen innlåsing, ingen skjulte kostnader, ingen
              avhengigheter som binder deg til oss om du en dag vil ta over selv.
            </p>

            <h2>Lokalt i Haugesund, leverer i hele Norge</h2>
            <p>
              Vi holder til i Haugesund og kjenner næringslivet på Haugalandet godt. Men vi
              jobber med bedrifter over hele Norge — subsea og offshore, industri, eiendom,
              helse, handel og tjenesteyting. Møter tas fysisk når det gir mening, digitalt
              når det ikke gjør det.
            </p>

            <h2>Se hva vi har bygget</h2>
            <p>
              Konkrete eksempler på skreddersydde løsninger:{" "}
              <Link href="/kunder/csub">CSUB</Link> (dashboard og AI-assistent for subsea),{" "}
              <Link href="/kunder/saga-subsea">Saga Subsea</Link> (maritim sporingsteknologi),
              og <Link href="/kunder/elementlab">ElementLab</Link> (bookingintegrasjon og
              AI-chatbot).
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Trenger du et system som faktisk passer dere?</h2>
            <p>Book en uforpliktende samtale. Vi finner ut sammen hva som kan bygges.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
