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
 * Admin («verkstedkontoret», /start/admin) — Petter only. Same user-token
 * pattern; the routes additionally require user.email === ADMIN_EMAIL and
 * the admin RLS policies carry the cross-user reads:
 *
 *   GET  /api/portal/admin/liste          — response: AdminListeResponse
 *   GET  /api/portal/admin/liste?id=<id>  — response: AdminDetaljResponse
 *     (one full row + 1h signed mockup URL — no separate detail route)
 *   DELETE /api/portal/admin/liste?id=<id> — response: AdminSlettResponse
 *     (removes the mockup storage object when set, then the row)
 *   POST /api/portal/admin/tilbud — body: AdminTilbudBody
 *     response: AdminTilbudResponse (row → tilbud, tilbud_sendt_at,
 *     status='tilbud_sendt')
 *
 * Keep this file dependency-free (types + plain constants only).
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
  | "tilbud_sendt"
  | "videre"
  | "feilet";

/**
 * The quote Petter writes by hand (kartlegginger.tilbud jsonb).
 * pris is a free-form string («fra 45 000 kr eks. mva») — never a number.
 */
export interface PortalTilbud {
  /** 1–3 short paragraphs separated by "\n\n". Petters own words. */
  tekst: string;
  pris: string;
  leveranse: string;
}

/** The row as the client sees it (GET /api/portal/me). */
export interface PortalKartlegging {
  id: string;
  status: PortalStatus;
  answers: Record<string, unknown>;
  assessment: PortalAssessment | null;
  /** Signed URL (1h) — or a local path when the dev mock is active. */
  mockupUrl: string | null;
  createdAt: string;
  /** Petters hand-written quote — set when status reaches «tilbud_sendt». */
  tilbud: PortalTilbud | null;
  tilbudSendtAt: string | null;
  godkjentAt: string | null;
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

/**
 * localStorage flag stamped when a returning-user login link is sent
 * (AuthGate in loginOnly mode) — consumed by the draft-less boot after the
 * magic-link reload, so an address without rows lands on wizard step 1 with
 * the «benken er ledig»-notice instead of a silent intro. Value: Date.now().
 */
export const PORTAL_LOGIN_INTENT_KEY = "vk-portal-login";

/**
 * POST /api/portal/godkjenn — same auth header as /like. Idempotent: only a
 * row sitting in «tilbud_sendt» transitions to «videre» (+ godkjent_at +
 * godkjent_vilkar). vilkarGodtatt must be literally true — the terms
 * checkbox is a binding step; the server stores its OWN canonical vilkår
 * text (portalContent[row.lang].tilbud.vilkar), never a client string.
 */
export interface PortalGodkjennBody {
  id: string;
  vilkarGodtatt: true;
}

export interface PortalGodkjennResponse {
  ok: true;
}

/* ── Admin («verkstedkontoret», /start/admin) — Petter only ── */

/** The ONE admin identity. Server routes verify against this; RLS agrees. */
export const ADMIN_EMAIL = "petter@workflows.no";

/** Validation caps for POST /api/portal/admin/tilbud (route + form). */
export const TILBUD_TEKST_MAX = 4000;
export const TILBUD_PRIS_MAX = 200;
export const TILBUD_LEVERANSE_MAX = 200;

/** GET /api/portal/admin/liste — one trimmed row in the list view. */
export interface AdminListItem {
  id: string;
  createdAt: string;
  email: string;
  /** answers.bedrift.navn (fallback: answers.research.navn) — or null. */
  bedriftNavn: string | null;
  anbefaling: PortalAnbefaling | null;
  status: PortalStatus;
}

export interface AdminListeResponse {
  kartlegginger: AdminListItem[];
}

/** GET /api/portal/admin/liste?id= — the full row as the admin sees it. */
export interface AdminKartlegging {
  id: string;
  status: PortalStatus;
  email: string;
  answers: Record<string, unknown>;
  assessment: PortalAssessment | null;
  /** Signed URL (1h) — or a local path when the dev mock is active. */
  mockupUrl: string | null;
  tilbud: PortalTilbud | null;
  tilbudSendtAt: string | null;
  godkjentAt: string | null;
  createdAt: string;
}

export interface AdminDetaljResponse {
  kartlegging: AdminKartlegging | null;
}

export interface AdminTilbudBody {
  id: string;
  tilbud: PortalTilbud;
}

export interface AdminTilbudResponse {
  ok: true;
}

/** DELETE /api/portal/admin/liste?id= — mockup object + row removed. */
export interface AdminSlettResponse {
  ok: true;
}
