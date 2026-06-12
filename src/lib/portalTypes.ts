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
  /** Project week 1–6 (kartlegginger.uke) — set by Petter once «videre». */
  uke: number | null;
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

/* ════════════════════════════════════════════
   «Benken» — the post-approval project room.

   Customer (owner via RLS):
     GET  /api/portal/prosjekt?id=<kartleggingId> → ProsjektResponse
     POST /api/portal/prosjekt      — body ProsjektPostBody (fra=kunde,
       type=melding only; row must sit in «videre» — RLS agrees)
     POST /api/portal/prosjekt/fil  — body ProsjektFilBody → safe storage
       path; the client uploads DIRECTLY to the private «prosjektfiler»
       bucket with its own token (the storage policy scopes writes to the
       project folder — a fabricated path outside it fails RLS).

   Admin (ADMIN_EMAIL + admin RLS):
     GET  /api/portal/admin/prosjekt?id=<id> → ProsjektResponse (same shape)
     POST /api/portal/admin/prosjekt — body AdminProsjektPostBody (fra=
       workflows, all types; optional uke 1–6 stamps kartlegginger.uke)

   Files are ALWAYS delivered as downloads (signed URL, 1h, attachment
   disposition) — never inline, so an uploaded SVG/HTML can't script.
   ════════════════════════════════════════════ */

/** Mirrors public.prosjekt_innlegg.fra. */
export type ProsjektFra = "kunde" | "workflows";

/** Mirrors public.prosjekt_innlegg.type. */
export type ProsjektInnleggType =
  | "melding"
  | "leveranse"
  | "foresporsel"
  | "status";

/** Mirrors public.prosjekt_innlegg.foresporsel_status. */
export type ForesporselStatus = "apen" | "levert";

/** Validation caps — routes + composers code against the same numbers. */
export const PROSJEKT_TEKST_MAX = 4000;
export const PROSJEKT_LENKE_MAX = 500;
export const PROSJEKT_FILNAVN_MAX = 200;
export const PROSJEKT_FIL_MAX_BYTES = 25 * 1024 * 1024;
export const PROSJEKT_UKE_MIN = 1;
export const PROSJEKT_UKE_MAX = 6;

/**
 * Upload allowlist — extension AND the declared MIME type must both match.
 * (The declared type is the browser's word, not proof — the real safety is
 * download-only delivery — but it stops casual smuggling for free.)
 */
export const PROSJEKT_FIL_TYPER: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
  csv: ["text/csv", "application/csv", "application/vnd.ms-excel"],
  json: ["application/json"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  zip: ["application/zip", "application/x-zip-compressed"],
  svg: ["image/svg+xml"],
};

/** One innlegg as BOTH clients see it (file paths already signed). */
export interface ProsjektInnlegg {
  id: string;
  fra: ProsjektFra;
  type: ProsjektInnleggType;
  tekst: string;
  /** Validated https-URL — or null. Render as <a rel="noopener noreferrer">. */
  lenke: string | null;
  /** Signed download URL (1h, attachment disposition) — or null. */
  filUrl: string | null;
  filNavn: string | null;
  /** Set only on type «foresporsel». */
  foresporselStatus: ForesporselStatus | null;
  /** id of the innlegg this one answers — or null. */
  svarPa: string | null;
  createdAt: string;
}

/** GET /api/portal/prosjekt?id= AND /api/portal/admin/prosjekt?id=. */
export interface ProsjektResponse {
  /** Effective week — auto from godkjent_at unless manually overridden. */
  uke: number | null;
  ukeKilde: "auto" | "manuell" | null;
  /** created_at ascending — the room reads top-to-bottom. */
  innlegg: ProsjektInnlegg[];
}

/** Storage object reference produced by POST /api/portal/prosjekt/fil. */
export interface ProsjektFilRef {
  /** "<kartleggingId>/<uuid>-<safeName>" — the ONLY accepted shape. */
  path: string;
  navn: string;
}

/** POST /api/portal/prosjekt — tekst (1–4000) OR fil required. */
export interface ProsjektPostBody {
  id: string;
  tekst?: string;
  fil?: ProsjektFilRef;
  /** Answering a workflows-foresporsel flips it to «levert». */
  svarPa?: string;
}

export interface ProsjektPostResponse {
  ok: true;
}

/** POST /api/portal/prosjekt/fil — validate BEFORE the direct upload. */
export interface ProsjektFilBody {
  id: string;
  navn: string;
  size: number;
  mime: string;
}

export interface ProsjektFilResponse {
  /** "<kartleggingId>/<uuid>-<safeName>" — upload to exactly this path. */
  path: string;
  /** The sanitized filename — store this as fil.navn on the innlegg. */
  navn: string;
}

/** POST /api/portal/admin/prosjekt — Petter posts into the room. */
export interface AdminProsjektPostBody {
  id: string;
  type: ProsjektInnleggType;
  tekst: string;
  lenke?: string;
  fil?: ProsjektFilRef;
  /** 1–6 — also stamps kartlegginger.uke. */
  /** 1-6 sets a manual override; "auto" clears it (week follows godkjent_at). */
  uke?: number | "auto";
}

export interface AdminProsjektPostResponse {
  ok: true;
}

/* ── Week derivation: auto from godkjent_at, manual override wins ──
   The rail must never lie: weeks slip in real projects, so the stored
   uke column is an OVERRIDE (null = automatic). Computed server-side so
   every consumer shows the same number. Capped at 6 — long tails stay
   «uke 6», they don't invent a week 7. */
export function effektivUke(
  godkjentAt: string | null,
  override: number | null
): { uke: number | null; kilde: "auto" | "manuell" | null } {
  if (typeof override === "number" && override >= 1 && override <= 6) {
    return { uke: override, kilde: "manuell" };
  }
  if (!godkjentAt) return { uke: null, kilde: null };
  const start = Date.parse(godkjentAt);
  if (!Number.isFinite(start)) return { uke: null, kilde: null };
  const dager = Math.floor((Date.now() - start) / 86_400_000);
  if (dager < 0) return { uke: 1, kilde: "auto" };
  return { uke: Math.min(6, Math.floor(dager / 7) + 1), kilde: "auto" };
}
