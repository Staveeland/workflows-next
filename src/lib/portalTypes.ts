/**
 * Kundeportalen («Verkstedet» /start) — shared API-contract types.
 *
 * BOTH the client (PortalApp) and the API routes code against these shapes.
 * They mirror the locked contract:
 *
 *   POST /api/portal/submit  — Authorization: Bearer <supabase access_token>
 *     body:     PortalSubmitBody
 *     response: PortalSubmitResponse
 *   GET  /api/portal/me      — same auth header
 *     response: PortalMeResponse (latest row, mockupUrl is a 1h signed URL)
 *   POST /api/portal/like    — same auth header
 *     body:     PortalLikeBody
 *     response: PortalLikeResponse
 *   POST /api/portal/research — UNAUTHENTICATED (public data, near-zero cost)
 *     body:     PortalResearchBody
 *     response: PortalResearchResponse (funn: null on no reasonable match)
 *
 * Keep this file dependency-free (types + one string constant only).
 */

export type PortalAnbefaling =
  | "chatbot"
  | "flyt"
  | "agent"
  | "software"
  | "kombinasjon"
  | "ikke_ai";

/** Strict JSON shape the text model must return. Never contains price. */
export interface PortalAssessment {
  anbefaling: PortalAnbefaling;
  tittel: string;
  /** 2–3 short paragraphs separated by "\n\n". Honest, verkstedsstemme. */
  vurdering: string;
  /** 3–5 bullet lines. */
  losningsskisse: string[];
  tidslinje: string;
  neste: string;
}

/** Mirrors public.kartlegginger.status. */
export type PortalStatus =
  | "innsendt"
  | "genererer"
  | "forslag_klart"
  | "likt"
  | "videre"
  | "feilet";

/** The row as the client sees it (GET /api/portal/me). */
export interface PortalKartlegging {
  id: string;
  status: PortalStatus;
  answers: Record<string, unknown>;
  assessment: PortalAssessment | null;
  /** Signed URL (1h) — or a local path when the dev mock is active. */
  mockupUrl: string | null;
  createdAt: string;
}

export interface PortalSubmitBody {
  answers: Record<string, unknown>;
  lang: "no" | "en";
}

export interface PortalSubmitResponse {
  id: string;
}

export interface PortalMeResponse {
  kartlegging: PortalKartlegging | null;
}

export interface PortalLikeBody {
  id: string;
}

export interface PortalLikeResponse {
  ok: true;
}

/**
 * Company-research findings — public data only (Brønnøysundregistrene +
 * the company's own website). Stored verbatim as answers.research (or null
 * when the lookup found nothing / the visitor said «ikke oss»).
 */
export interface ResearchFunn {
  navn: string;
  orgnr?: string;
  /** organisasjonsform.kode, e.g. "AS". */
  orgform?: string;
  /** naeringskode1.beskrivelse, e.g. "Rørleggerarbeid". */
  bransje?: string;
  ansatte?: number;
  /** forretningsadresse.poststed. */
  sted?: string;
  nettside?: string;
  /** <title> of the company website, capped at 120 chars. */
  sideTittel?: string;
  /** meta description / og:description, capped at 300 chars. */
  sideBeskrivelse?: string;
}

/** POST /api/portal/research — navn is required (2–80 chars). */
export interface PortalResearchBody {
  navn: string;
  nettside?: string;
}

export interface PortalResearchResponse {
  funn: ResearchFunn | null;
}

/** answers.bedrift as the wizard stores it (first step, id "bedrift"). */
export interface PortalBedriftAnswer {
  navn: string;
  nettside?: string;
}

/**
 * localStorage key for in-progress wizard answers — they must survive the
 * magic-link round trip (user leaves for their inbox, returns to /start).
 */
export const PORTAL_DRAFT_KEY = "vk-portal-draft";
