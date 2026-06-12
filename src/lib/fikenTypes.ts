/**
 * Fiken-integrasjonen — delte typer og API-kontrakter.
 *
 * BÅDE klienten (AdminFaktura) og API-rutene koder mot disse formene:
 *
 *   GET  /api/portal/admin/fiken/status
 *     → FikenStatusResponse (ett GET /companies-kall når konfigurert;
 *       authUrl + signert state-cookie når OAuth er mulig men ikke koblet)
 *   GET  /api/portal/admin/fiken/faktura?kartleggingId=<uuid>
 *     → AdminFakturaListeResponse (admin ser ALLE rader inkl. utkast)
 *   POST /api/portal/admin/fiken/faktura
 *     body AdminFakturaOpprettBody → AdminFakturaOpprettResponse
 *     (fakturaer-rad status 'utkast' + Fiken-UTKAST — aldri ekte faktura)
 *   POST /api/portal/admin/fiken/faktura/opprett
 *     body AdminFakturaTilFakturaBody → AdminFakturaEnkeltResponse
 *     (utkast → EKTE faktura i Fiken — bak eksplisitt admin-knapp)
 *   POST /api/portal/admin/fiken/faktura/send
 *     body AdminFakturaSendBody → AdminFakturaEnkeltResponse
 *     (sender via Fiken — bak eksplisitt admin-knapp m/ bekreftelse)
 *   POST /api/portal/admin/fiken/sync
 *     → AdminFikenSyncResponse (sekvensiell statussynk mot Fiken)
 *   GET  /api/cron/fiken-sync   — Authorization: Bearer ${CRON_SECRET}
 *     → AdminFikenSyncResponse (samme synk, service role)
 *   GET  /api/fiken/callback    — OAuth-retur fra Fiken (utenfor portal-auth;
 *     verifisert mot signert state-cookie, redirect til /start/admin)
 *
 * ── STATUSMODELLEN for fakturaer-radene (kanonisk, dokumentert her) ──
 *
 *   'utkast'     — rad opprettet; Fiken-UTKAST finnes når fiken_draft_id er
 *                  satt. Når fiken_invoice_id OGSÅ er satt betyr det «ekte
 *                  faktura finnes i Fiken, men er ikke sendt ennå» —
 *                  mellomtilstanden beholder bevisst navnet 'utkast' fordi
 *                  kunde-RLS skjuler status='utkast', og kunden skal ikke
 *                  se fakturaen før den faktisk er sendt.
 *   'sendt'      — settes av send-ruten ved vellykket send, ELLER av synken
 *                  når Fiken viser dispatches på fakturaen (sendt manuelt
 *                  fra Fiken-UI).
 *   'delbetalt'  — synk: sale.totalPaid > 0, ikke settled, ikke forfalt.
 *   'betalt'     — synk: sale.settled. Terminal (synkes ikke videre).
 *   'forfalt'    — synk: dueDate < i dag && ikke settled (også om delbetalt
 *                  — forfall trumfer delbetaling i visningen).
 *   'kansellert' — settes aldri automatisk; reservert for manuell bruk.
 *                  Terminal for synken.
 *
 *   Presedens i synken: betalt > forfalt > delbetalt > sendt > (behold).
 *   Synken NEDGRADERER aldri (en 'sendt' rad blir ikke 'utkast' igjen).
 *
 * Beløp er ALLTID i øre (feltnavn xxxOre) — 150000 = 1 500,00 kr.
 * Hold fila avhengighetsfri (typer + rene konstanter/funksjoner).
 */

/* ════════════════════════════════════════════
   Fiken-objekter (api.fiken.no/api/v2) — kun
   feltene vi leser; alt annet ignoreres trygt.
   ════════════════════════════════════════════ */

export interface FikenCompany {
  slug: string;
  name: string;
  organizationNumber?: string;
  hasApiAccess?: boolean;
  testCompany?: boolean;
}

export interface FikenContact {
  contactId: number;
  name?: string;
  email?: string;
  organizationNumber?: string;
  customer?: boolean;
  inactive?: boolean;
}

/** Én utkastlinje slik Fiken vil ha den. unitPrice er ØRE eks. mva. */
export interface FikenDraftLineRequest {
  description: string;
  quantity: number;
  /** Øre, eks. mva (Fiken: «in cents»). */
  unitPrice: number;
  vatType: FikenVatType;
  incomeAccount: string;
}

/** POST /companies/{slug}/invoices/drafts — 201 + Location, TOM body. */
export interface FikenDraftRequest {
  type: "invoice";
  /** Klient-generert idempotensnøkkel — vi bruker fakturaer.fiken_uuid. */
  uuid: string;
  customerId: number;
  /** Heltall, påkrevd. */
  daysUntilDueDate: number;
  issueDate?: string;
  invoiceText?: string;
  /** «Vår referanse» — Fiken: ourReference. */
  ourReference?: string;
  /** «Deres referanse» — Fiken: yourReference. */
  yourReference?: string;
  /** Bankkontonummer (11 siffer) pengene skal til — påkrevd for å fakturere. */
  bankAccountNumber?: string;
  lines: FikenDraftLineRequest[];
}

/** GET /companies/{slug}/bankAccounts — kun det vi trenger. */
export interface FikenBankAccount {
  bankAccountNumber?: string;
  accountCode?: string;
  name?: string;
  inactive?: boolean;
}

/** Fiken-utkast slik lista returnerer det (kun det vi trenger). */
export interface FikenDraftResult {
  draftId: number;
  uuid?: string;
  daysUntilDueDate?: number;
}

export interface FikenSale {
  settled?: boolean;
  settledDate?: string | null;
  /** Øre. */
  totalPaid?: number;
  /** Øre. */
  outstandingBalance?: number;
}

/** GET /companies/{slug}/invoices/{id} — kun feltene synken leser. */
export interface FikenInvoice {
  invoiceId: number;
  invoiceNumber?: number;
  invoiceDraftUuid?: string;
  kid?: string | null;
  issueDate?: string;
  dueDate?: string;
  /** Øre. */
  gross?: number;
  /** Øre. */
  net?: number;
  /** Øre. */
  vat?: number;
  sale?: FikenSale | null;
  /** Sendingsforsøk — minst ett element betyr at fakturaen er sendt. */
  dispatches?: unknown[];
}

/** POST /companies/{slug}/invoices/send. */
export interface FikenSendRequest {
  invoiceId: number;
  method: ("auto" | "email")[];
  /** PÅKREVD felt i Fiken — vi sender alltid false. */
  includeDocumentAttachments: boolean;
  recipientEmail?: string;
  message?: string;
  emailSendOption?: "document_link" | "attachment";
}

/** POST https://fiken.no/oauth/token — begge grant-typene svarer slik. */
export interface FikenTokenResponse {
  access_token: string;
  /** Kan være ROTERT ved refresh — lagre alltid det returnerte. */
  refresh_token?: string;
  token_type?: string;
  /** Sekunder (≈86400). */
  expires_in?: number;
}

/* ════════════════════════════════════════════
   MVA — norske satser → Fikens vatType.
   ════════════════════════════════════════════ */

export type FikenVatType = "HIGH" | "MEDIUM" | "LOW" | "EXEMPT";

/** Gyldige mva-satser i skjema/API. 25 er standard. */
export const MVA_SATSER = [25, 15, 12, 0] as const;
export type MvaSats = (typeof MVA_SATSER)[number];

export function erMvaSats(n: unknown): n is MvaSats {
  return typeof n === "number" && (MVA_SATSER as readonly number[]).includes(n);
}

/** 25 % = HIGH (standard), 15 % = MEDIUM (mat), 12 % = LOW, 0 % = EXEMPT. */
export function mvaSatsTilVatType(sats: MvaSats): FikenVatType {
  switch (sats) {
    case 25:
      return "HIGH";
    case 15:
      return "MEDIUM";
    case 12:
      return "LOW";
    case 0:
      return "EXEMPT";
  }
}

/**
 * Inntektskonto for utkastlinjene. Default 3000 (kjent aktiv i Fiken —
 * 3100 «egenprodusert» finnes ikke i alle kontoplaner og gir 400). Sett
 * FIKEN_INNTEKTSKONTO i env til den egenprodusert-kontoen som faktisk er
 * AKTIV i foretaket (Fiken: Regnskap → Kontoplan), så slipper du ny deploy.
 */
export const FIKEN_INNTEKTSKONTO = process.env.FIKEN_INNTEKTSKONTO?.trim() || "3000";

/* ════════════════════════════════════════════
   Våre API-kontrakter (admin-rutene)
   ════════════════════════════════════════════ */

/** Speiler public.fakturaer.status. */
export type FakturaStatus =
  | "utkast"
  | "sendt"
  | "delbetalt"
  | "betalt"
  | "forfalt"
  | "kansellert";

export const FAKTURA_STATUSER: readonly FakturaStatus[] = [
  "utkast",
  "sendt",
  "delbetalt",
  "betalt",
  "forfalt",
  "kansellert",
];

/** Valideringstak — rutene og skjemaet koder mot de samme tallene. */
export const FAKTURA_LINJER_MAX = 20;
export const FAKTURA_LINJE_BESKRIVELSE_MAX = 200;
export const FAKTURA_BESKRIVELSE_MAX = 500;
export const FAKTURA_DAGER_FORFALL_MIN = 1;
export const FAKTURA_DAGER_FORFALL_MAX = 365;
export const FAKTURA_DAGER_FORFALL_DEFAULT = 30;
/** Maks lengde på referansefeltene (vår/deres referanse). */
export const FAKTURA_REFERANSE_MAX = 100;
/** Maks antall per linje (romslig; fanger tastefeil). */
export const FAKTURA_ANTALL_MAX = 10_000;
/** Maks enhetspris i øre (10 mill. kr) — fanger tastefeil, ikke ambisjoner. */
export const FAKTURA_ENHETSPRIS_ORE_MAX = 1_000_000_000;

/** Én fakturalinje slik admin-UI-et sender den. Enhetspris i ØRE eks. mva. */
export interface FakturaLinjeInput {
  beskrivelse: string;
  /** > 0, maks to desimaler. */
  antall: number;
  /** Heltall øre, eks. mva. */
  enhetsprisOre: number;
  /** 25 | 15 | 12 | 0 — default i UI er 25. */
  mvaSats: MvaSats;
}

/**
 * POST /api/portal/admin/fiken/faktura — oppretter fakturaer-rad (status
 * 'utkast') + Fiken-UTKAST. Krever at kartleggingen står i «videre»
 * (godkjent tilbud). Idempotent: en halvferdig rad (utkast uten
 * fiken_draft_id) gjenbrukes, og fiken_uuid sjekkes mot Fiken før noe
 * nytt opprettes. Beløpene regnes server-side fra linjene.
 */
export interface AdminFakturaOpprettBody {
  kartleggingId: string;
  linjer: FakturaLinjeInput[];
  /** Heltall 1–365 — default 30 i UI. */
  dagerTilForfall: number;
  /** Valgfri fakturatekst (≤500) — vises på fakturaen i Fiken. */
  fakturatekst?: string;
  /** «Vår referanse» (≤100). */
  varReferanse?: string;
  /** «Deres referanse» (≤100). */
  deresReferanse?: string;
}

/**
 * GET /api/portal/admin/fiken/faktura/forslag?kartleggingId= — autoutfylt
 * fakturautkast fra det godkjente tilbudet, så admin bare trykker «Lag
 * utkast». Tomt forslag (null-felter) når tilbudet mangler strukturert pris.
 */
export interface AdminFakturaForslagResponse {
  forslag: {
    linjer: FakturaLinjeInput[];
    dagerTilForfall: number;
    fakturatekst: string;
    varReferanse: string;
    deresReferanse: string;
  };
}

/** Én fakturaer-rad slik admin-UI-et (og senere kundevisningen) ser den. */
export interface FakturaRad {
  id: string;
  kartleggingId: string;
  fikenDraftId: number | null;
  fikenInvoiceId: number | null;
  invoiceNumber: number | null;
  kid: string | null;
  /** Brutto (inkl. mva), øre. */
  belopOre: number | null;
  /** Netto (eks. mva), øre. */
  nettoOre: number | null;
  /** Mva, øre. */
  mvaOre: number | null;
  valuta: string;
  beskrivelse: string | null;
  /** Settes av Fiken når utkast blir faktura; estimat før det. */
  issueDate: string | null;
  dueDate: string | null;
  status: FakturaStatus;
  settledAt: string | null;
  sendtVia: string | null;
  sistSynketAt: string | null;
  createdAt: string;
}

export interface AdminFakturaOpprettResponse {
  faktura: FakturaRad;
}

/** GET /api/portal/admin/fiken/faktura?kartleggingId= (nyeste først). */
export interface AdminFakturaListeResponse {
  fakturaer: FakturaRad[];
}

/** POST /api/portal/admin/fiken/faktura/opprett — utkast → EKTE faktura. */
export interface AdminFakturaTilFakturaBody {
  fakturaId: string;
}

/**
 * POST /api/portal/admin/fiken/faktura/send.
 * metode 'auto' lar Fiken velge kanal (EHF/e-post); 'email' tvinger e-post.
 * mottakerEpost overstyrer kontaktens adresse (ellers bruker Fiken den).
 */
export interface AdminFakturaSendBody {
  fakturaId: string;
  metode?: "auto" | "email";
  mottakerEpost?: string;
}

/** Felles svar for opprett- og send-rutene — raden etter operasjonen. */
export interface AdminFakturaEnkeltResponse {
  faktura: FakturaRad;
}

/** GET /api/portal/admin/fiken/status. */
export interface FikenStatusResponse {
  koblet: boolean;
  /** Hvilken auth-vei som er i bruk/konfigurert — null = ingen. */
  via: "token" | "oauth" | null;
  /** Selskapsnavn fra GET /companies når koblet. */
  selskap?: string;
  selskapSlug?: string;
  testCompany?: boolean;
  /** Menneskelig feilmelding når konfigurert men ikke koblet. */
  feil?: string;
  /**
   * Fikens authorize-URL når IKKE koblet og OAuth er konfigurert.
   * Svaret som bærer denne setter samtidig den signerte state-cookien —
   * UI-et skal navigere hele vinduet hit (ikke fetch).
   */
  authUrl?: string | null;
}

/** POST /api/portal/admin/fiken/sync OG GET /api/cron/fiken-sync. */
export interface AdminFikenSyncResponse {
  /** Antall rader med fiken_invoice_id som ble forsøkt synket. */
  totalt: number;
  /** Antall rader som faktisk endret seg. */
  oppdatert: number;
  /** Antall som gikk → 'betalt' i denne kjøringen (innlegg postet). */
  nyBetalte: number;
  /** Antall utkast-rader fjernet fordi utkastet var slettet i Fiken. */
  fjernet?: number;
  /** Per-rad-feil (fortsetter forbi enkeltfeil) — tom = alt vel. */
  feil: string[];
}

/* ════════════════════════════════════════════
   DB-rad ↔ API-form — delt mapping så alle
   ruter svarer med identisk FakturaRad.
   ════════════════════════════════════════════ */

/** public.fakturaer slik PostgREST leverer den (bigint → number). */
export interface FakturaDbRow {
  id: string;
  kartlegging_id: string;
  fiken_draft_id: number | null;
  fiken_invoice_id: number | null;
  fiken_uuid: string;
  invoice_number: number | null;
  kid: string | null;
  belop_ore: number | null;
  netto_ore: number | null;
  mva_ore: number | null;
  valuta: string | null;
  beskrivelse: string | null;
  issue_date: string | null;
  due_date: string | null;
  status: string;
  settled_at: string | null;
  sendt_via: string | null;
  sist_synket_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Kolonnelista alle rutene SELECTer — én kilde, ingen drift. */
export const FAKTURA_SELECT =
  "id, kartlegging_id, fiken_draft_id, fiken_invoice_id, fiken_uuid, " +
  "invoice_number, kid, belop_ore, netto_ore, mva_ore, valuta, beskrivelse, " +
  "issue_date, due_date, status, settled_at, sendt_via, sist_synket_at, " +
  "created_at, updated_at";

export function tilFakturaRad(row: FakturaDbRow): FakturaRad {
  return {
    id: row.id,
    kartleggingId: row.kartlegging_id,
    fikenDraftId: row.fiken_draft_id,
    fikenInvoiceId: row.fiken_invoice_id,
    invoiceNumber: row.invoice_number,
    kid: row.kid,
    belopOre: row.belop_ore,
    nettoOre: row.netto_ore,
    mvaOre: row.mva_ore,
    valuta: row.valuta || "NOK",
    beskrivelse: row.beskrivelse,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: (FAKTURA_STATUSER as readonly string[]).includes(row.status)
      ? (row.status as FakturaStatus)
      : "utkast",
    settledAt: row.settled_at,
    sendtVia: row.sendt_via,
    sistSynketAt: row.sist_synket_at,
    createdAt: row.created_at,
  };
}

/**
 * Linjesummer i øre — alltid regnet server-side, aldri tiltrodd klienten.
 * Per linje: netto = round(antall × enhetspris), mva = round(netto × sats).
 * Estimat frem til Fiken setter fasit (gross/net/vat) ved createInvoice.
 */
export function regnBelop(linjer: FakturaLinjeInput[]): {
  nettoOre: number;
  mvaOre: number;
  belopOre: number;
} {
  let nettoOre = 0;
  let mvaOre = 0;
  for (const l of linjer) {
    const linjeNetto = Math.round(l.antall * l.enhetsprisOre);
    nettoOre += linjeNetto;
    mvaOre += Math.round((linjeNetto * l.mvaSats) / 100);
  }
  return { nettoOre, mvaOre, belopOre: nettoOre + mvaOre };
}
