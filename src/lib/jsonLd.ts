/**
 * Typed JSON-LD helpers for the site. Designed for the specific shapes we
 * actually emit today — not a generic schema.org DSL. If a new variant is
 * needed, prefer adding a focused helper over generalising these.
 */
import { ORG_ID, urlFor } from "./site";

type JsonLdObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  /** Path relative to site root, e.g. "/kunder" or "/" for Hjem. */
  path: string;
}

/**
 * BreadcrumbList JSON-LD. Pass items in order from Hjem down to the current page.
 */
export function buildBreadcrumb(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: urlFor(item.path),
    })),
  };
}

type AreaServed =
  | { "@type": "City"; name: string }
  | { "@type": "AdministrativeArea"; name: string }
  | { "@type": "Country"; name: string };

/** Default area served for service pages without a more specific locality. */
export const DEFAULT_AREA_SERVED: AreaServed[] = [
  { "@type": "City", name: "Haugesund" },
  { "@type": "Country", name: "Norge" },
];

/** Extended area served used by Haugesund-local pages. */
export const HAUGESUND_AREA_SERVED: AreaServed[] = [
  { "@type": "City", name: "Haugesund" },
  { "@type": "AdministrativeArea", name: "Haugalandet" },
  { "@type": "AdministrativeArea", name: "Rogaland" },
  { "@type": "Country", name: "Norge" },
];

export interface ServiceParams {
  /** Display name of the service. */
  name: string;
  /** Path to the canonical page for the service, e.g. "/chatboter". */
  slug: string;
  /** schema.org serviceType value. */
  serviceType: string;
  description: string;
  areaServed?: AreaServed[];
  /** Defaults to BusinessAudience "Bedrifter". Pass null to omit. */
  audience?: JsonLdObject | null;
}

const DEFAULT_AUDIENCE: JsonLdObject = {
  "@type": "BusinessAudience",
  name: "Bedrifter",
};

/**
 * Service JSON-LD bound to the site's Organization as provider.
 */
export function buildService({
  name,
  slug,
  serviceType,
  description,
  areaServed = DEFAULT_AREA_SERVED,
  audience = DEFAULT_AUDIENCE,
}: ServiceParams): JsonLdObject {
  const result: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType,
    name,
    description,
    provider: { "@id": ORG_ID },
    areaServed,
  };
  if (audience) result.audience = audience;
  result.url = urlFor(slug);
  return result;
}

export interface ArticleParams {
  headline: string;
  description: string;
  /** Path to the image, e.g. "/kunder-csub.svg". */
  image: string;
  /** Path to the canonical page for the article, e.g. "/kunder/csub". */
  slug: string;
  /** Defaults to "nb-NO". */
  inLanguage?: string;
  /** Optional `about` subject, e.g. `{ "@type": "Thing", name: "CSUB" }`. */
  about?: JsonLdObject;
}

/**
 * Article JSON-LD with the site's Organization as both author and publisher.
 * Used by /kunder/* case pages.
 */
export function buildArticle({
  headline,
  description,
  image,
  slug,
  inLanguage = "nb-NO",
  about,
}: ArticleParams): JsonLdObject {
  const result: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: urlFor(image),
    mainEntityOfPage: urlFor(slug),
    inLanguage,
  };
  if (about) result.about = about;
  return result;
}
