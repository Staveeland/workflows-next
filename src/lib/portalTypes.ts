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
 *     (SOFT delete: stamps slettet_at — row, mockup and files all stay)
 *   POST /api/portal/admin/tilbud — body: AdminTilbudBody
 *     response: AdminTilbudResponse (row → tilbud, tilbud_sendt_at,
 *     status='tilbud_sendt'; refuses rows the customer already approved)
 *   PATCH /api/portal/admin/prosjekt — body: AdminLeverBody
 *     response: AdminLeverResponse (videre ⇄ levert — the lever-flow)
 *
 * Keep this file dependency-free (types + plain constants only).
 */

export type PortalAnbefaling =
  | "chatbot"
  | "flyt"
  | "agent"
  | "software"
  | "nettside"
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
  | "levert"
  | "feilet";

/** Legal VAT rates for the structured quote price (mirrors Fiken). */
export const TILBUD_MVA_SATSER: readonly number[] = [25, 15, 12, 0];

/** Upper bound for the structured price — 100 mill. kr in øre. */
export const TILBUD_BELOP_MAX_ORE = 100_000_000_00;

/**
 * The quote Petter writes by hand (kartlegginger.tilbud jsonb).
 * pris is a free-form string («fra 45 000 kr eks. mva») — never a number.
 *
 * prisBelopOre/mvaSats are ADDITIVE structured fields (the Fiken bridge):
 * old rows without them keep working everywhere. When prisBelopOre is set
 * the client shows the formatted amount instead of the free-form pris.
 */
export interface PortalTilbud {
  /** 1–3 short paragraphs separated by "\n\n". Petters own words. */
  tekst: string;
  pris: string;
  leveranse: string;
  /** Structured amount ex. VAT, in øre (integer ≥ 0). Optional. */
  prisBelopOre?: number;
  /** VAT rate — one of TILBUD_MVA_SATSER. Defaults to 25 when belop is set. */
  mvaSats?: number;
}

/**
 * The closing report Petter writes when marking a project «levert»
 * (kartlegginger.sluttrapport jsonb). Open shape — tekst is the contract.
 */
export interface PortalSluttrapport {
  /** 1–4 short paragraphs separated by "\n\n". */
  tekst: string;
}

/** Cap for the sluttrapport text (route + form). */
export const SLUTTRAPPORT_TEKST_MAX = 4000;

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
  /** Stamped when Petter marks the project «levert» (level 5 SKJØTET). */
  levertAt?: string | null;
  /** Petters closing report — written when the project is delivered. */
  sluttrapport?: PortalSluttrapport | null;
  /** The canonical terms text the customer approved (kvittering/print). */
  godkjentVilkar?: string | null;
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

/** One crawled subpage from the company's own website (research). */
export interface ResearchUnderside {
  /** Final URL after redirects, capped at 200 chars. */
  url: string;
  /** <title>, capped at 120 chars. */
  tittel?: string;
  /** Meta description or tag-stripped text excerpt, capped at 400 chars. */
  tekst?: string;
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
  /** Up to 4 crawled subpages (om/tjenester/priser-ish) — partial on timeout. */
  undersider?: ResearchUnderside[];
  /**
   * Regnskapsregisteret, latest filed year — sum driftsinntekter. A price
   * signal for Petter in the back office; the wizard never shows it.
   */
  omsetning?: number;
  /** Årsresultat from the same filing. */
  resultat?: number;
  /** The year the filing covers (regnskapsperiode.tilDato). */
  regnskapsAar?: number;
  /** Reporting currency — ONLY set when not NOK (e.g. "USD"). */
  valuta?: string;
}

/** POST /api/portal/research — navn is required (2–80 chars). */
export interface PortalResearchBody {
  navn: string;
  nettside?: string;
}

export interface PortalResearchResponse {
  funn: ResearchFunn | null;
}

/**
 * POST /api/portal/oppfolging — UNAUTHENTICATED (like /research), strictly
 * rate limited per IP. Takes the answers so far and asks a cheap model for
 * ONE sharp follow-up question in the answer language. Failure is never the
 * visitor's problem: anything but a clean question returns sporsmal: null
 * and the wizard silently skips the step.
 */
export interface PortalOppfolgingBody {
  answers: Record<string, unknown>;
  lang: "no" | "en";
}

export interface PortalOppfolgingResponse {
  sporsmal: string | null;
}

/**
 * answers.oppfolging as the wizard stores it — the generated question rides
 * along with the answer so Petter (and the assessment model) sees BOTH.
 * null = generation was tried and skipped; absent = never tried.
 */
export interface PortalOppfolgingAnswer {
  sporsmal: string;
  svar: string;
}

/** Free-text caps shared by the wizard UI and the prompt rendering. */
export const DROMEN_MAX = 2000;
export const OPPFOLGING_SPORSMAL_MAX = 240;
export const OPPFOLGING_SVAR_MAX = 1000;

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
  /** Customer activity (innlegg/likt/godkjent) newer than admin_sett_at. */
  nyttFraKunde: boolean;
  /** Customer INNLEGG newer than admin_sett_at — the cheap unread count. */
  nyttAntall: number;
  /** Latest of created/liked/tilbud/godkjent/levert/customer post — ISO. */
  sistAktivitet: string;
  /** liked_at — the SLA clock for «likt uten tilbud». */
  liktAt: string | null;
  /** Open workflows-forespørsler waiting on the CUSTOMER side feed. */
  apneForesporsler: number;
  /** Structured quote price (øre ex. VAT) when Petter set one. */
  prisBelopOre: number | null;
  mvaSats: number | null;
  /** Soft delete stamp — the list hides these by default. */
  slettetAt: string | null;
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
  /** Level 5 SKJØTET — stamped by the lever-flow (admin/prosjekt PATCH). */
  levertAt?: string | null;
  sluttrapport?: PortalSluttrapport | null;
  /** Soft delete stamp — set by DELETE admin/liste?id=. */
  slettetAt?: string | null;
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

/**
 * DELETE /api/portal/admin/liste?id= — SOFT delete: stamps slettet_at on
 * the row (approved runs can never be hard-deleted; the DB trigger agrees).
 * The customer select policy filters deleted rows automatically; the admin
 * list hides them behind a «vis slettede»-toggle.
 */
export interface AdminSlettResponse {
  ok: true;
}

/**
 * PATCH /api/portal/admin/prosjekt — the lever-flow (level 5 SKJØTET).
 *
 *   handling "lever": row must sit in «videre» → status='levert',
 *     levert_at=now(), sluttrapport (required, tekst 1–SLUTTRAPPORT_TEKST_MAX).
 *   handling "angre": row must sit in «levert» → status='videre',
 *     levert_at=null (the sluttrapport draft is kept on the row).
 *
 * The DB statusmaskin enforces the same transitions; the route answers 409
 * with a readable message instead of a trigger error.
 */
export interface AdminLeverBody {
  id: string;
  handling: "lever" | "angre";
  sluttrapport?: PortalSluttrapport;
}

export interface AdminLeverResponse {
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
   ONE nuance: raster images (PROSJEKT_BILDE_ETTERNAVN) may render as
   <img> previews in the feeds — browsers never execute script in <img>.
   SVG stays download-only regardless.
   ════════════════════════════════════════════ */

/** Mirrors public.prosjekt_innlegg.fra. */
export type ProsjektFra = "kunde" | "workflows";

/**
 * The types a composer can POST (the routes validate against exactly
 * these — the kunde-RLS allows only fra=kunde/type=melding regardless).
 * «milepael» is admin-postable: the quiet celebration line in the feed.
 */
export type ProsjektInnleggType =
  | "melding"
  | "leveranse"
  | "foresporsel"
  | "status"
  | "milepael";

/**
 * Everything the FEED can carry — the postable types PLUS «faktura»,
 * which only the Fiken-synk posts (service role): «Faktura nr. X er
 * betalt — takk!». Render-only; the DB check-constraint is the
 * write-side gate.
 */
export type ProsjektFeedType = ProsjektInnleggType | "faktura";

/** Mirrors public.prosjekt_innlegg.foresporsel_status. */
export type ForesporselStatus = "apen" | "levert";

/**
 * Mirrors public.fakturaer.status MINUS «utkast» — the customer SELECT
 * policy hides drafts, so they never reach a client.
 */
export type ProsjektFakturaStatus =
  | "sendt"
  | "delbetalt"
  | "betalt"
  | "forfalt"
  | "kreditert"
  | "kansellert";

/**
 * One invoice as the customer sees it in the room (GET /api/portal/prosjekt).
 * Admin writing happens in the Fiken routes — this shape is read-only.
 */
export interface ProsjektFaktura {
  id: string;
  /** Fiken invoice number — null until Fiken assigns one. */
  nummer: number | null;
  kid: string | null;
  /** Gross amount in øre — null until the invoice is priced. */
  belopOre: number | null;
  /** ISO 4217 — "NOK" unless Fiken says otherwise. */
  valuta: string;
  beskrivelse: string;
  /** issue_date / due_date / settled_at — ISO dates, or null. */
  utstedt: string | null;
  forfall: string | null;
  betalt: string | null;
  status: ProsjektFakturaStatus;
}

/** Validation caps — routes + composers code against the same numbers. */
export const PROSJEKT_TEKST_MAX = 4000;
export const PROSJEKT_LENKE_MAX = 500;
export const PROSJEKT_FILNAVN_MAX = 200;
export const PROSJEKT_FIL_MAX_BYTES = 25 * 1024 * 1024;
/** Max file references per innlegg (filer[] on the POST bodies). */
export const PROSJEKT_FILER_MAX = 6;
export const PROSJEKT_UKE_MIN = 1;
export const PROSJEKT_UKE_MAX = 6;

/**
 * RASTER extensions eligible for inline <img> preview in the feeds.
 * Browsers never execute script inside <img> — but SVG stays download-only
 * anyway (consistency + content-sniffing paranoia), and so does everything
 * else on the allowlist. This list gates PREVIEW only; delivery is still
 * the signed download URL.
 */
export const PROSJEKT_BILDE_ETTERNAVN: readonly string[] = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
];

/** Preview-eligible by extension (after the last dot) — never SVG. */
export function erBildeFil(navn: string): boolean {
  const dot = navn.lastIndexOf(".");
  if (dot <= 0 || dot === navn.length - 1) return false;
  return PROSJEKT_BILDE_ETTERNAVN.includes(navn.slice(dot + 1).toLowerCase());
}

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

/**
 * One attached file as the clients see it. The server merges legacy
 * fil_path/fil_navn rows AND the filer jsonb array into this ONE shape.
 */
export interface ProsjektInnleggFil {
  navn: string;
  /** Signed download URL (1h, attachment disposition) — null if signing hiccuped. */
  url: string | null;
  /** Raster preview-eligible (erBildeFil) — the feeds may render <img>. */
  bilde: boolean;
}

/** One innlegg as BOTH clients see it (file paths already signed). */
export interface ProsjektInnlegg {
  id: string;
  fra: ProsjektFra;
  type: ProsjektFeedType;
  tekst: string;
  /** Validated https-URL — or null. Render as <a rel="noopener noreferrer">. */
  lenke: string | null;
  /** Unified attachment list — legacy single-file rows arrive here too. */
  filer: ProsjektInnleggFil[];
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
  /**
   * Row status — «levert» renders the room read-only. Optional: the admin
   * route predates the field (the client falls back to its own props).
   */
  status?: PortalStatus;
  /**
   * kartlegginger.kunde_sett_at — the customer's read marker. The kunde-GET
   * always sets it; the «── nytt ──» divider freezes on the FIRST value of
   * the session so later marks don't move the line under the reader.
   */
  kundeSettAt?: string | null;
  /**
   * The customer's invoices, created_at ascending — kunde-GET only. RLS
   * hides «utkast» rows; an empty array still renders the (empty) panel.
   */
  fakturaer?: ProsjektFaktura[];
  /** created_at ascending — the room reads top-to-bottom. */
  innlegg: ProsjektInnlegg[];
}

/** Storage object reference produced by POST /api/portal/prosjekt/fil. */
export interface ProsjektFilRef {
  /** "<kartleggingId>/<uuid>-<safeName>" — the ONLY accepted shape. */
  path: string;
  navn: string;
}

/** POST /api/portal/prosjekt — tekst (1–4000) OR file(s) required. */
export interface ProsjektPostBody {
  id: string;
  tekst?: string;
  /** Legacy single-file shape — still accepted (old clients). */
  fil?: ProsjektFilRef;
  /** Up to PROSJEKT_FILER_MAX refs — every one validated like fil. */
  filer?: ProsjektFilRef[];
  /** Answering a workflows-foresporsel flips it to «levert». */
  svarPa?: string;
}

export interface ProsjektPostResponse {
  ok: true;
}

/**
 * POST /api/portal/prosjekt with sett:true — stamps kunde_sett_at = now()
 * with the CUSTOMER's own token (the kartlegging-vakt trigger allows
 * exactly this column without a status transition). Sent when the reader
 * actually reaches the bottom of the feed — never on mere mount.
 */
export interface ProsjektSettBody {
  id: string;
  sett: true;
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
  /** Legacy single-file shape — still accepted (old clients). */
  fil?: ProsjektFilRef;
  /** Up to PROSJEKT_FILER_MAX refs — every one validated like fil. */
  filer?: ProsjektFilRef[];
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
