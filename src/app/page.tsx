import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  title: "AI-agenter og softwareutvikling i Haugesund",
  description:
    "AI-agenter, kunstig intelligens og skreddersydd software for bedrifter i Haugesund og Norge. Gratis første samtale, ingen forpliktelser.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: SITE_URL,
    title: "AI-agenter og softwareutvikling i Haugesund | Workflows",
    description:
      "AI-byrå i Haugesund. Vi bygger smarte agenter, kunstig intelligens og skreddersydde systemer for norske bedrifter.",
  },
};

const faqItems = [
  {
    q: "Hva slags bedrifter jobber dere med?",
    a: "Vi jobber med bedrifter i alle størrelser — fra småbedrifter med 5 ansatte til større selskaper med hundrevis. Fellesnevneren er at de har manuelle prosesser som tar for mye tid. Vi har erfaring fra bransjer som subsea, forskning, eiendom, handel og tjenesteyting.",
  },
  {
    q: "Hva er skreddersydd software?",
    a: "Skreddersydd software er programvare bygget spesifikt for din bedrift og dine prosesser. I motsetning til hyllevare som Salesforce eller HubSpot, får du et system som passer perfekt til måten du jobber på — uten unødvendige funksjoner eller begrensninger.",
  },
  {
    q: "Hva er en digital assistent?",
    a: "En digital assistent er et AI-drevet system som kan håndtere oppgaver som kundeservice, oppfølging, rapportering eller databehandling — automatisk og døgnets alle timer. Tenk på det som en kollega som aldri sover, aldri glemmer, og aldri gjør slurve-feil.",
  },
  {
    q: "Kan dere integrere med systemene vi allerede bruker?",
    a: "Ja. Vi spesialiserer oss på å koble sammen eksisterende verktøy. Enten du bruker Tripletex, Visma, Microsoft 365, Google Workspace, Slack eller bransjespesifikke systemer — vi bygger broer mellom dem slik at data flyter automatisk.",
  },
  {
    q: "Trenger vi teknisk kompetanse internt?",
    a: "Nei. Vi bygger systemer som er enkle å bruke for alle. Du trenger ikke forstå teknologien — bare resultatene. Vi tar oss av alt det tekniske, og gir grundig opplæring når systemet er klart.",
  },
  {
    q: "Hva koster det?",
    a: "Prisen avhenger av prosjektets omfang og størrelse. Vi gir alltid et fast pristilbud etter en uforpliktende første samtale — slik at du vet nøyaktig hva du betaler før du bestemmer deg.",
  },
  {
    q: "Hvor lang tid tar det?",
    a: "De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser deg demoer underveis slik at du kan gi tilbakemeldinger tidlig.",
  },
  {
    q: "Hva skjer etter lansering?",
    a: "Vi tilbyr support og vedlikehold så lenge du trenger det. Alle systemer leveres med dokumentasjon og opplæring. Hvis noe trenger justering eller du vil legge til nye funksjoner senere, er vi tilgjengelige.",
  },
  {
    q: "Er den første samtalen virkelig gratis?",
    a: "Ja, helt gratis og uforpliktende. Vi setter oss ned (fysisk eller digitalt) og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre — uten noen forpliktelser.",
  },
  {
    q: "Er dataene våre trygge?",
    a: "Absolutt. Vi følger beste praksis for datasikkerhet og personvern. Alle systemer bygges med kryptering, tilgangskontroll og sikker hosting. Vi er kjent med GDPR-kravene og sørger for at løsningene er i samsvar med norske og europeiske regelverk.",
  },
  {
    q: "Bruker dere kunstig intelligens (AI)?",
    a: "Ja, der det gir verdi. Vi bruker AI for oppgaver som tekstforståelse, automatisk kategorisering, chatboter og dataanalyse. Men vi bruker det ikke bare for å være hippe — AI er et verktøy, og vi bruker det kun når det faktisk løser et problem bedre enn alternativene.",
  },
  {
    q: "Kan systemet skalere når vi vokser?",
    a: "Ja. Vi bygger med skalering i tankene fra dag én. Enten du dobler antall ansatte, får ti ganger så mange kunder, eller ekspanderer til nye markeder — systemene våre vokser med deg uten at du trenger å bygge på nytt.",
  },
];

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: "Workflows – AI og softwareutvikling i Haugesund",
  description:
    "Workflows er et AI- og softwareutviklingsselskap i Haugesund. Vi bygger AI-agenter, kunstig intelligens og skreddersydde systemer for norske bedrifter.",
  inLanguage: "nb-NO",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  primaryImageOfPage: `${SITE_URL}/logo-square.jpg`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const servicesJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-ai-agents`,
      serviceType: "AI-agenter og smarte agenter",
      name: "AI-agenter og smarte agenter i Haugesund",
      description:
        "Autonome AI-agenter som får et mål, lager sin egen plan, henter data, bruker verktøy og utfører handlinger på vegne av bedriften din.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: [
        { "@type": "City", name: "Haugesund" },
        { "@type": "Country", name: "Norge" },
      ],
      audience: { "@type": "BusinessAudience", name: "Bedrifter" },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-ai`,
      serviceType: "Kunstig intelligens for bedrifter",
      name: "Kunstig intelligens og AI-løsninger i Haugesund",
      description:
        "Chatboter, RAG-assistenter, dokumentforståelse og AI-integrasjoner bygget på OpenAI, Anthropic Claude og Google Cloud.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: [
        { "@type": "City", name: "Haugesund" },
        { "@type": "Country", name: "Norge" },
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-software`,
      serviceType: "Softwareutvikling",
      name: "Skreddersydd softwareutvikling i Haugesund",
      description:
        "Skreddersydd programvareutvikling for norske bedrifter. Interne verktøy, kundeportaler og komplette forretningssystemer.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: [
        { "@type": "City", name: "Haugesund" },
        { "@type": "Country", name: "Norge" },
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-automation`,
      serviceType: "Automatisering og systemintegrasjon",
      name: "Automatisering og systemintegrasjon",
      description:
        "Automatiserte flyter som kobler sammen verktøyene dine (Tripletex, Visma, Microsoft 365, Google Workspace, Slack) og fjerner dobbeltarbeid.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: [
        { "@type": "City", name: "Haugesund" },
        { "@type": "Country", name: "Norge" },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
