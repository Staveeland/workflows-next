import type { Metadata } from "next";
import { urlFor } from "@/lib/site";
import {
  buildBreadcrumb,
  buildService,
  HAUGESUND_AREA_SERVED,
} from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import AiHaugesundClient from "@/components/verksted/pages/AiHaugesundClient";

export const metadata: Metadata = {
  title: "AI i Haugesund — kunstig intelligens og skreddersydd software",
  description:
    "Workflows er et lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge.",
  alternates: {
    canonical: "/ai-haugesund",
    languages: {
      "nb-NO": "/ai-haugesund",
      "x-default": "/ai-haugesund",
    },
  },
  openGraph: {
    title:
      "AI i Haugesund — kunstig intelligens og skreddersydd software | Workflows",
    description:
      "Praktisk AI, kunstig intelligens og skreddersydd software bygget av et team i Haugesund. For bedrifter på Haugalandet og i hele Norge.",
    url: urlFor("/ai-haugesund"),
    type: "article",
  },
  keywords: [
    "AI Haugesund",
    "AI-selskap Haugesund",
    "AI-byrå Haugesund",
    "AI-konsulent Haugesund",
    "AI-agenter Haugesund",
    "kunstig intelligens Haugesund",
    "KI Haugesund",
    "AI-løsninger Haugesund",
    "maskinlæring Haugesund",
    "software utvikling Haugesund",
    "softwareutvikling Haugesund",
    "programvareutvikling Haugesund",
    "skreddersydd software Haugesund",
    "systemutvikling Haugesund",
    "utviklingsselskap Haugesund",
    "AI Haugalandet",
    "AI Rogaland",
    "kunstig intelligens Haugalandet",
    "kunstig intelligens Rogaland",
    "software Haugalandet",
  ],
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "AI i Haugesund", path: "/ai-haugesund" },
]);

const serviceJsonLd = buildService({
  name: "AI, kunstig intelligens og softwareutvikling i Haugesund",
  path: "/ai-haugesund",
  serviceType: "AI- og softwareutvikling",
  description:
    "Lokalt AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, AI-agenter, chatboter, RAG-assistenter, dokumentforståelse, integrasjoner og skreddersydd programvare for bedrifter på Haugalandet, i Rogaland og i resten av Norge.",
  areaServed: HAUGESUND_AREA_SERVED,
});

export default function AiHaugesundPage() {
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
      <VerkstedShell>
        <AiHaugesundClient />
      </VerkstedShell>
    </>
  );
}
