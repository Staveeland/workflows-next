import type { Metadata } from "next";
import VerkstedHome from "@/components/verksted/VerkstedHome";
import { ORG_ID, SITE_URL, WEBSITE_ID, urlFor } from "@/lib/site";
import { DEFAULT_AREA_SERVED } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "AI-agenter og softwareutvikling i Haugesund",
  description:
    "AI-agenter, kunstig intelligens og skreddersydd software for bedrifter i Haugesund og Norge. Gratis første samtale, ingen forpliktelser.",
  alternates: {
    canonical: "/",
    languages: {
      "nb-NO": "/",
      "en": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    url: SITE_URL,
    title: "AI-agenter og softwareutvikling i Haugesund | Workflows",
    description:
      "AI-byrå i Haugesund. Vi bygger smarte agenter, kunstig intelligens og skreddersydde systemer for norske bedrifter.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Kaos inn. Flyt ut. — Workflows, AI og softwareutvikling i Haugesund",
      },
    ],
  },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: "Workflows – AI og softwareutvikling i Haugesund",
  description:
    "Workflows er et AI- og softwareutviklingsselskap i Haugesund. Vi bygger AI-agenter, kunstig intelligens og skreddersydde systemer for norske bedrifter.",
  inLanguage: "nb-NO",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORG_ID },
  primaryImageOfPage: urlFor("/logo-square.jpg"),
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
      provider: { "@id": ORG_ID },
      areaServed: DEFAULT_AREA_SERVED,
      audience: { "@type": "BusinessAudience", name: "Bedrifter" },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-ai`,
      serviceType: "Kunstig intelligens for bedrifter",
      name: "Kunstig intelligens og AI-løsninger i Haugesund",
      description:
        "Chatboter, RAG-assistenter, dokumentforståelse og AI-integrasjoner bygget på OpenAI, Anthropic Claude og Google Cloud.",
      provider: { "@id": ORG_ID },
      areaServed: DEFAULT_AREA_SERVED,
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-software`,
      serviceType: "Softwareutvikling",
      name: "Skreddersydd softwareutvikling i Haugesund",
      description:
        "Skreddersydd programvareutvikling for norske bedrifter. Interne verktøy, kundeportaler og komplette forretningssystemer.",
      provider: { "@id": ORG_ID },
      areaServed: DEFAULT_AREA_SERVED,
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-automation`,
      serviceType: "Automatisering og systemintegrasjon",
      name: "Automatisering og systemintegrasjon",
      description:
        "Automatiserte flyter som kobler sammen verktøyene dine (Tripletex, Visma, Microsoft 365, Google Workspace, Slack) og fjerner dobbeltarbeid.",
      provider: { "@id": ORG_ID },
      areaServed: DEFAULT_AREA_SERVED,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <VerkstedHome />
    </>
  );
}
