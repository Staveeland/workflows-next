/**
 * Kundeportalen — DEV MOCK. Everything fake lives in THIS file, nowhere else.
 *
 * Enabled ONLY when PORTAL_DEV_MOCK=1 AND NODE_ENV !== "production".
 * That check runs server-side (env is not NEXT_PUBLIC): the /start page
 * (server component) calls portalMockEnabled() and passes the flag down to
 * PortalApp as a prop. With the flag on:
 *
 *   - the authgate auto-passes with MOCK_SESSION_LABEL (no Supabase call)
 *   - mockSubmit() returns a canned, realistic assessment after ~4s
 *   - mockMe()/mockLike() keep state in module memory
 *
 * The functions are environment-agnostic (no imports beyond types) so they
 * work both client-side (PortalApp short-circuits fetch) and server-side
 * (API routes short-circuit before touching Supabase/OpenAI).
 */

import type {
  AdminDetaljResponse,
  AdminKartlegging,
  AdminLeverResponse,
  AdminListeResponse,
  AdminProsjektPostResponse,
  AdminSlettResponse,
  AdminTilbudResponse,
  PortalSluttrapport,
  PortalAssessment,
  PortalGodkjennResponse,
  PortalKartlegging,
  PortalLikeResponse,
  PortalMeResponse,
  PortalOppfolgingResponse,
  PortalResearchResponse,
  PortalSubmitResponse,
  PortalTilbud,
  ProsjektFilRef,
  ProsjektFilResponse,
  ProsjektInnlegg,
  ProsjektFaktura,
  ProsjektInnleggFil,
  ProsjektInnleggType,
  ProsjektPostResponse,
  ProsjektResponse,
  ResearchFunn,
} from "@/lib/portalTypes";
import { effektivUke, erBildeFil } from "@/lib/portalTypes";
import { portalContent } from "@/lib/portalContent";
import type {
  AdminFakturaEnkeltResponse,
  AdminFakturaListeResponse,
  AdminFakturaOpprettResponse,
  AdminFikenSyncResponse,
  FakturaLinjeInput,
  FakturaRad,
  FikenStatusResponse,
} from "@/lib/fikenTypes";
import { FAKTURA_BESKRIVELSE_MAX, regnBelop } from "@/lib/fikenTypes";

/** Server-side check — env var is deliberately NOT NEXT_PUBLIC. */
export function portalMockEnabled(): boolean {
  return (
    process.env.PORTAL_DEV_MOCK === "1" &&
    process.env.NODE_ENV !== "production"
  );
}

/** Shown in the authgate instead of a real session when the mock is on. */
export const MOCK_SESSION_LABEL = "dev-mock@workflows.no (falsk sesjon)";

const MOCK_DELAY_MS = 4000;
const MOCK_RESEARCH_DELAY_MS = 800;
const MOCK_OPPFOLGING_DELAY_MS = 900;
const MOCK_MOCKUP_URL = "/verksted/tj-flyter.webp";

/** Canned research funn — CSUB-like, realistic field shapes for the card,
 *  incl. the crawled subpages and Regnskapsregisteret key figures. */
const MOCK_FUNN: ResearchFunn = {
  navn: "CSUB AS",
  orgnr: "986532135",
  orgform: "AS",
  bransje: "Produksjon av andre plastprodukter",
  ansatte: 85,
  sted: "FÆRVIK",
  nettside: "https://www.csub.com",
  sideTittel: "CSUB — GRP solutions for harsh environments",
  sideBeskrivelse:
    "CSUB designs and delivers glass-fibre composite products for subsea, aquaculture and infrastructure projects.",
  undersider: [
    {
      url: "https://www.csub.com/products",
      tittel: "Products — CSUB",
      tekst:
        "Subsea protection structures, manholes and custom GRP solutions engineered for harsh environments. Designed in-house, produced with vacuum infusion.",
    },
    {
      url: "https://www.csub.com/about",
      tittel: "About us — CSUB",
      tekst:
        "Founded in 2003 in Arendal, Norway. CSUB delivers composite structures to energy, aquaculture and infrastructure customers worldwide.",
    },
  ],
  omsetning: 226_000_000,
  resultat: 12_400_000,
  regnskapsAar: 2025,
};

/** Canned but realistic: a flyt recommendation in the verksted voice. */
const MOCK_ASSESSMENT: PortalAssessment = {
  anbefaling: "flyt",
  tittel: "Én flyt fra innboks til faktura",
  vurdering:
    "Dere bruker mest tid på å flytte den samme informasjonen mellom innboksen, regnearket og økonomisystemet. Det er ikke et AI-problem — det er et rørleggerproblem. Informasjonen finnes allerede; den mangler bare rør.\n\n" +
    "Vi ville bygget en automatisert flyt som leser henvendelsene når de kommer inn, registrerer dem ett sted, og fyller ut det som kan fylles ut — slik at folkene deres bare ser på det som faktisk krever et menneske.\n\n" +
    "Ærlig forbehold: en chatbot ut mot kundene ville vi ventet med. Først rydder man bak disken, så åpner man luka.",
  losningsskisse: [
    "Innkommende e-post og skjema samles i én kø — ingenting faller mellom stoler.",
    "Flyten leser henvendelsen og legger den inn i systemet dere allerede har.",
    "Standardsvar og bekreftelser går ut automatisk — med deres ordlyd, ikke robotspråk.",
    "Det som trenger et menneske, havner hos riktig person med alt vedlagt.",
    "Ukerapporten skriver seg selv fra det som faktisk skjedde.",
  ],
  tidslinje: "3–4 uker fra oppstart til første versjon i drift.",
  neste:
    "Petter ser på vurderingen og kommer med et konkret pristilbud — innen én arbeidsdag.",
};

/**
 * Mock state — on globalThis, NOT module scope: in dev (Turbopack) each API
 * route bundles its own instance of this module, so plain module variables
 * are invisible across submit/me/like. globalThis is shared per process.
 */
type MockState = { row: PortalKartlegging | null; counter: number };
const g = globalThis as typeof globalThis & { __vkPortalMockState?: MockState };
const state: MockState = (g.__vkPortalMockState ??= { row: null, counter: 0 });

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** POST /api/portal/research — canned funn after a believable beat. */
export async function mockResearch(): Promise<PortalResearchResponse> {
  await delay(MOCK_RESEARCH_DELAY_MS);
  return { funn: MOCK_FUNN };
}

/** POST /api/portal/oppfolging — canned sharp question after a beat. */
export async function mockOppfolging(
  lang: "no" | "en"
): Promise<PortalOppfolgingResponse> {
  await delay(MOCK_OPPFOLGING_DELAY_MS);
  return {
    sporsmal:
      lang === "en"
        ? "You mentioned reports steal time — which report takes the longest today, and where does the data it needs live?"
        : "Dere nevnte at rapporter stjeler tid — hvilken rapport tar lengst tid i dag, og hvor ligger tallene den henter fra?",
  };
}

/** POST /api/portal/submit — canned assessment after ~4s. */
export async function mockSubmit(
  answers: Record<string, unknown>
): Promise<PortalSubmitResponse> {
  state.counter += 1;
  const id = `mock-${state.counter}`;
  state.row = {
    id,
    status: "genererer",
    answers,
    assessment: null,
    mockupUrl: null,
    createdAt: new Date().toISOString(),
    tilbud: null,
    tilbudSendtAt: null,
    godkjentAt: null,
    uke: null,
  };
  await delay(MOCK_DELAY_MS);
  state.row = {
    ...state.row,
    status: "forslag_klart",
    assessment: MOCK_ASSESSMENT,
    mockupUrl: MOCK_MOCKUP_URL,
  };
  // Mock mode sends no real mail — log what production would have sent.
  console.log("[portalMock] e-post (forslag klart) ville gått til kunden — logget i stedet for sendt");
  return { id };
}

/** GET /api/portal/me — latest (only) row from mock memory. */
export async function mockMe(): Promise<PortalMeResponse> {
  // Canned tilbud_sendt state — boot straight into level 3 with
  // PORTAL_DEV_MOCK=1 PORTAL_DEV_MOCK_STATE=tilbud_sendt (server-side env,
  // read here because mockMe only ever runs inside the API route).
  if (!state.row && process.env.PORTAL_DEV_MOCK_STATE === "tilbud_sendt") {
    state.row = seedTilbudSendt();
  }
  // Canned videre state — boot straight onto Benken (the project room)
  // with PORTAL_DEV_MOCK_STATE=videre; the room itself seeds lazily on
  // the first GET /api/portal/prosjekt (see ensureProsjekt below).
  if (!state.row && process.env.PORTAL_DEV_MOCK_STATE === "videre") {
    state.row = seedVidere();
  }
  // Canned levert state — boot straight onto Skjøtet (level 5) with
  // PORTAL_DEV_MOCK_STATE=levert.
  if (!state.row && process.env.PORTAL_DEV_MOCK_STATE === "levert") {
    state.row = seedLevert();
  }
  return { kartlegging: state.row };
}

/** POST /api/portal/like — flips status, no Telegram in mock mode. */
export async function mockLike(id: string): Promise<PortalLikeResponse> {
  if (state.row && state.row.id === id) {
    state.row = { ...state.row, status: "likt" };
  }
  return { ok: true };
}

/** Canned but realistic quote — Petters voice, free-form pris string. */
const MOCK_TILBUD: PortalTilbud = {
  tekst:
    "Vi bygger flyten fra forslaget: innboks → kø → system, med automatiske bekreftelser i deres ordlyd.\n\n" +
    "Prisen dekker oppsett, tilpasning til systemene dere har, og to ukers innkjøring der vi justerer til det sitter. Ingen lisens til oss etterpå — dere eier alt.",
  pris: "fra 45 000 kr eks. mva",
  leveranse: "3–4 uker fra oppstart",
  // Structured price — exercises the formatted display + Fiken bridge.
  prisBelopOre: 45_000_00,
  mvaSats: 25,
};

/** A finished row sitting in «tilbud_sendt» — assessment + quote present. */
function seedTilbudSendt(): PortalKartlegging {
  state.counter += 1;
  return {
    id: `mock-${state.counter}`,
    status: "tilbud_sendt",
    answers: {},
    assessment: MOCK_ASSESSMENT,
    mockupUrl: MOCK_MOCKUP_URL,
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    tilbud: MOCK_TILBUD,
    tilbudSendtAt: new Date().toISOString(),
    godkjentAt: null,
    uke: null,
  };
}

/** An approved row two weeks into the build — Benken is open. */
function seedVidere(): PortalKartlegging {
  const now = Date.now();
  return {
    ...seedTilbudSendt(),
    status: "videre",
    createdAt: new Date(now - 14 * 24 * 60 * 60_000).toISOString(),
    tilbudSendtAt: new Date(now - 10 * 24 * 60 * 60_000).toISOString(),
    godkjentAt: new Date(now - 9 * 24 * 60 * 60_000).toISOString(),
    godkjentVilkar:
      "Jeg godkjenner tilbudet som en bindende bestilling av arbeidet, prisen og leveransen slik de er beskrevet over. Oppstart og detaljer avtales direkte med Workflows AS.",
    uke: 2,
  };
}

/** A delivered row — level 5 SKJØTET with the closing report. */
function seedLevert(): PortalKartlegging {
  const now = Date.now();
  return {
    ...seedVidere(),
    status: "levert",
    levertAt: new Date(now - 2 * 24 * 60 * 60_000).toISOString(),
    sluttrapport: {
      tekst:
        "Flyten er i drift: henvendelser går fra innboksen til køen, bekreftelsene går ut i deres ordlyd, og ukerapporten skriver seg selv hver fredag.\n\n" +
        "Alt kjører på deres egen konto — tilganger, dokumentasjon og en kort video-gjennomgang ligger på benken under. Si ifra om noe skurrer, så ser vi på det.",
    },
  };
}

/**
 * POST /api/portal/godkjenn — idempotent flip; no Telegram/e-post in mock.
 * Validates the vilkår flag like production (the route 400s first, but the
 * mock never flips on a missing consent either — belt and suspenders).
 */
export async function mockGodkjenn(
  id: string,
  vilkarGodtatt: boolean
): Promise<PortalGodkjennResponse> {
  if (
    vilkarGodtatt === true &&
    state.row &&
    state.row.id === id &&
    state.row.status === "tilbud_sendt"
  ) {
    state.row = {
      ...state.row,
      status: "videre",
      godkjentAt: new Date().toISOString(),
      // Like production: stamp the canonical vilkår text the customer saw
      // (the mock is Norwegian-default; rows carry no language).
      godkjentVilkar: portalContent.no.tilbud.vilkar,
    };
    console.log("[portalMock] e-post (godkjent-kvittering) ville gått til kunden — logget i stedet for sendt");
  }
  return { ok: true };
}

/* ════════════════════════════════════════════
   ADMIN MOCK — verkstedkontoret (/start/admin).
   Auto-admin: the routes short-circuit before any auth, so the office
   opens with four canned kartlegginger in different statuses.
   ════════════════════════════════════════════ */

const MOCK_ADMIN_DELAY_MS = 400;

/** A second canned assessment so the list isn't three copies of one row. */
const MOCK_ASSESSMENT_CHATBOT: PortalAssessment = {
  anbefaling: "chatbot",
  tittel: "En chatbot som kan vaktlista",
  vurdering:
    "Det meste som kommer inn hos dere er de samme tjue spørsmålene — åpningstider, befaring, pris på standardjobbene. Det er akkurat det en chatbot er god til, og akkurat det folkene deres er for dyre til.\n\n" +
    "Vi ville trent den på deres egne svar, koblet den til kalenderen, og latt alt som er uvanlig gå rett til et menneske — uten omveier.",
  losningsskisse: [
    "Chatboten svarer på de vanlige spørsmålene — med deres ordlyd.",
    "Befaringsforespørsler lander rett i kalenderen.",
    "Alt uvanlig sendes videre til riktig person, med samtalen vedlagt.",
  ],
  tidslinje: "2–3 uker fra oppstart til den svarer kundene deres.",
  neste:
    "Petter ser på vurderingen og kommer med et konkret pristilbud — innen én arbeidsdag.",
};

const HOUR_MS = 60 * 60_000;

/** Four canned rows in different statuses — seeded once per process. */
function seedAdminRows(): AdminKartlegging[] {
  const now = Date.now();
  return [
    {
      id: "adm-mock-1",
      status: "likt",
      email: "kari.nordmann@csub.com",
      // NEW answers format: tidsbruk/rolle/budsjett/oppfolging present,
      // systemer with the split økonomichips.
      answers: {
        bedrift: { navn: "CSUB AS", nettside: "csub.com" },
        research: MOCK_FUNN,
        storrelse: "50_pluss",
        tidstyver: ["rapporter", "dobbeltregistrering"],
        tidsbruk: "5_15t",
        systemer: ["m365", "fagsystem", "tripletex"],
        systemer_tekst: "fagsystemet er egenutviklet prosjektarkiv (CWP)",
        kundehenvendelser: "litt",
        dromen:
          "At fremdriftsrapporten til prosjektmøtet skrev seg selv fra timelistene og avviksloggen.",
        oppfolging: {
          sporsmal:
            "Dere nevnte at rapporter stjeler tid — hvilken rapport tar lengst tid i dag, og hvor ligger tallene den henter fra?",
          svar: "Ukesrapporten til prosjektmøtet. Timene ligger i CWP, avvikene i Excel — vi klipper og limer hver fredag.",
        },
        rolle: "leder",
        budsjett: "75_200k",
        tempo: "fort",
      },
      assessment: MOCK_ASSESSMENT,
      mockupUrl: MOCK_MOCKUP_URL,
      tilbud: null,
      tilbudSendtAt: null,
      godkjentAt: null,
      createdAt: new Date(now - 2 * HOUR_MS).toISOString(),
    },
    {
      id: "adm-mock-2",
      status: "forslag_klart",
      email: "post@halandror.no",
      // MIXED: a couple of new keys, but systemer still carries the LEGACY
      // "okonomisystem" samlechip — exercises the hidden-chip label lookup.
      answers: {
        bedrift: { navn: "Håland Rør AS" },
        research: null,
        bransje: "bygg_industri",
        storrelse: "6_20",
        tidstyver: ["epost", "oppfolging", "annet"],
        tidstyver_tekst: "purring på befaringer som aldri blir booket",
        tidsbruk: "mer_enn_dag",
        systemer: ["excel_sheets", "okonomisystem"],
        kundehenvendelser: "ja_mye",
        dromen: "At kundene kunne booke befaring selv uten ti telefoner frem og tilbake.",
        oppfolging: null,
        rolle: "eier",
        budsjett: "vet_ikke",
        tempo: "noen_maneder",
      },
      assessment: MOCK_ASSESSMENT_CHATBOT,
      mockupUrl: MOCK_MOCKUP_URL,
      tilbud: null,
      tilbudSendtAt: null,
      godkjentAt: null,
      createdAt: new Date(now - 26 * HOUR_MS).toISOString(),
    },
    {
      id: "adm-mock-3",
      status: "tilbud_sendt",
      email: "drift@fjordfrakt.no",
      answers: {
        bedrift: { navn: "Fjordfrakt AS", nettside: "fjordfrakt.no" },
        research: null,
        bransje: "tjenester",
        storrelse: "21_50",
        tidstyver: ["dobbeltregistrering", "lete_info"],
        systemer: ["excel_sheets", "google", "fagsystem"],
        kundehenvendelser: "litt",
        dromen: "At fraktbrevene gikk rett fra bestilling til fagsystemet uten omtasting.",
        tempo: "fort",
      },
      assessment: MOCK_ASSESSMENT,
      mockupUrl: MOCK_MOCKUP_URL,
      tilbud: MOCK_TILBUD,
      tilbudSendtAt: new Date(now - 70 * HOUR_MS).toISOString(),
      godkjentAt: null,
      createdAt: new Date(now - 96 * HOUR_MS).toISOString(),
    },
    {
      id: "adm-mock-4",
      status: "videre",
      email: "post@bryggekaia.no",
      answers: {
        bedrift: { navn: "Bryggekaia Drift AS" },
        research: null,
        bransje: "tjenester",
        storrelse: "6_20",
        tidstyver: ["epost", "vaktplaner"],
        systemer: ["google", "excel_sheets"],
        kundehenvendelser: "ja_mye",
        dromen: "At vaktplanen la seg selv og svarte på bytteforespørslene.",
        tempo: "fort",
      },
      assessment: MOCK_ASSESSMENT,
      mockupUrl: MOCK_MOCKUP_URL,
      tilbud: MOCK_TILBUD,
      tilbudSendtAt: new Date(now - 120 * HOUR_MS).toISOString(),
      godkjentAt: new Date(now - 30 * HOUR_MS).toISOString(),
      createdAt: new Date(now - 140 * HOUR_MS).toISOString(),
    },
  ];
}

/** Admin rows live beside the customer row on globalThis (same reason). */
const ga = globalThis as typeof globalThis & {
  __vkPortalAdminMockRows?: AdminKartlegging[];
};
const adminRows: AdminKartlegging[] = (ga.__vkPortalAdminMockRows ??= seedAdminRows());

/** GET /api/portal/admin/liste — trimmed rows, created_at desc. */
export async function mockAdminListe(): Promise<AdminListeResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  return {
    kartlegginger: adminRows.map((row) => {
      const bedrift = row.answers.bedrift as { navn?: string } | undefined;
      return {
        id: row.id,
        createdAt: row.createdAt,
        email: row.email,
        bedriftNavn: bedrift?.navn ?? null,
        // The videre row demos the NYTT FRA KUNDE-tag in dev-mock.
        nyttFraKunde: row.status === "videre",
        nyttAntall: row.status === "videre" ? 2 : 0,
        anbefaling: row.assessment?.anbefaling ?? null,
        status: row.status,
        sistAktivitet:
          row.levertAt ??
          row.godkjentAt ??
          row.tilbudSendtAt ??
          row.createdAt,
        // The likt row demos the SLA pulse (created 2h ago in the seed).
        liktAt: row.status === "likt" ? row.createdAt : null,
        apneForesporsler: row.status === "videre" ? 1 : 0,
        prisBelopOre:
          typeof row.tilbud?.prisBelopOre === "number"
            ? row.tilbud.prisBelopOre
            : null,
        mvaSats:
          typeof row.tilbud?.mvaSats === "number" ? row.tilbud.mvaSats : null,
        slettetAt: row.slettetAt ?? null,
      };
    }),
  };
}

/** GET /api/portal/admin/liste?id= — one full row (or null). */
export async function mockAdminDetalj(id: string): Promise<AdminDetaljResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  return { kartlegging: adminRows.find((row) => row.id === id) ?? null };
}

/** DELETE /api/portal/admin/liste?id= — SOFT delete (slettetAt stamp). */
export async function mockAdminSlett(
  id: string
): Promise<AdminSlettResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const idx = adminRows.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  adminRows[idx] = { ...adminRows[idx], slettetAt: new Date().toISOString() };
  return { ok: true };
}

/** PATCH /api/portal/admin/prosjekt — the lever-flow (videre ⇄ levert). */
export async function mockAdminLever(
  id: string,
  handling: "lever" | "angre",
  sluttrapport?: PortalSluttrapport
): Promise<AdminLeverResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const idx = adminRows.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  const row = adminRows[idx];
  if (handling === "lever") {
    if (row.status !== "videre" || !sluttrapport) return null;
    adminRows[idx] = {
      ...row,
      status: "levert",
      levertAt: new Date().toISOString(),
      sluttrapport,
    };
  } else {
    if (row.status !== "levert") return null;
    // The sluttrapport stays as a draft — mirrors production.
    adminRows[idx] = { ...row, status: "videre", levertAt: null };
  }
  // Mirror onto the customer-side row when it's the same id (mock quirk).
  if (state.row && state.row.id === id) {
    state.row = {
      ...state.row,
      status: adminRows[idx].status,
      levertAt: adminRows[idx].levertAt ?? null,
      sluttrapport: adminRows[idx].sluttrapport ?? null,
    };
  }
  return { ok: true };
}

/** POST /api/portal/admin/tilbud — row update, no Telegram (Petter acts). */
export async function mockAdminTilbud(
  id: string,
  tilbud: PortalTilbud
): Promise<AdminTilbudResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const idx = adminRows.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  // Mirror production's status guard (.in("status", [...])) — an approved
  // or delivered run must never regress to tilbud_sendt. null = mock-409.
  const status = adminRows[idx].status;
  if (
    status !== "forslag_klart" &&
    status !== "likt" &&
    status !== "tilbud_sendt"
  ) {
    return null;
  }
  adminRows[idx] = {
    ...adminRows[idx],
    tilbud,
    tilbudSendtAt: new Date().toISOString(),
    status: "tilbud_sendt",
  };
  console.log("[portalMock] e-post (tilbud sendt) ville gått til kunden — logget i stedet for sendt");
  return { ok: true };
}

/* ════════════════════════════════════════════
   BENKEN MOCK — the project room (status «videre»).
   Lazily seeded per kartlegging id with 6 canned innlegg covering all
   types — incl. an OPEN foresporsel and a leveranse with a link — so
   both the customer room and the admin detail have something to show.
   ════════════════════════════════════════════ */

type MockProsjekt = {
  uke: number | null;
  /** The customer's read marker — mockProsjektSett stamps it. */
  kundeSettAt: string | null;
  fakturaer: ProsjektFaktura[];
  innlegg: ProsjektInnlegg[];
};

const DAG_MS = 24 * HOUR_MS;

/** A fil ref → the unified ProsjektInnleggFil shape, mock-signed. */
function mockInnleggFil(navn: string): ProsjektInnleggFil {
  return { navn, url: MOCK_MOCKUP_URL, bilde: erBildeFil(navn) };
}

/**
 * Canned innlegg — a believable week-two thread in the room, incl. a
 * faktura note and a milepæl. kundeSettAt sits at −3 days so everything
 * newer demos the «── nytt ──» divider; the two canned fakturaer exercise
 * the panel (betalt + sendt).
 */
function seedProsjektInnlegg(): MockProsjekt {
  const now = Date.now();
  return {
    uke: 2,
    kundeSettAt: new Date(now - 3 * DAG_MS).toISOString(),
    fakturaer: [
      {
        id: "fa-mock-1",
        nummer: 10041,
        kid: "0020124563",
        belopOre: 2_812_500,
        valuta: "NOK",
        beskrivelse: "Oppstart — 50 % av avtalt pris",
        utstedt: new Date(now - 8 * DAG_MS).toISOString().slice(0, 10),
        forfall: new Date(now - 1 * DAG_MS).toISOString().slice(0, 10),
        betalt: new Date(now - 4 * DAG_MS).toISOString().slice(0, 10),
        status: "betalt",
      },
      {
        id: "fa-mock-2",
        nummer: 10052,
        kid: "0020124571",
        belopOre: 2_812_500,
        valuta: "NOK",
        beskrivelse: "Leveranse — resterende 50 %",
        utstedt: new Date(now - 1 * DAG_MS).toISOString().slice(0, 10),
        forfall: new Date(now + 13 * DAG_MS).toISOString().slice(0, 10),
        betalt: null,
        status: "sendt",
      },
    ],
    innlegg: [
      {
        id: "pi-mock-status",
        fra: "workflows",
        type: "status",
        tekst:
          "Da er benken rigget. Vi starter i den enden vi ble enige om: røret fra innboksen til køen. Du hører fra oss her når det skjer noe — og du kan skrive når som helst.",
        lenke: null,
        filer: [],
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 8 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-hei",
        fra: "kunde",
        type: "melding",
        tekst: "Flott! Si fra om dere trenger noe fra oss underveis.",
        lenke: null,
        filer: [],
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 8 * DAG_MS + 2 * HOUR_MS).toISOString(),
      },
      {
        id: "pi-mock-foresporsel-1",
        fra: "workflows",
        type: "foresporsel",
        tekst:
          "Vi trenger to-tre eksempler på typiske henvendelser dere får — gjerne e-poster, anonymisert. Da treffer flyten ordlyden deres fra dag én.",
        lenke: null,
        filer: [],
        foresporselStatus: "levert",
        svarPa: null,
        createdAt: new Date(now - 6 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-svar",
        fra: "kunde",
        type: "melding",
        tekst: "Her er tre stykker — anonymisert som avtalt.",
        lenke: null,
        filer: [mockInnleggFil("eksempel-henvendelser.pdf")],
        foresporselStatus: null,
        svarPa: "pi-mock-foresporsel-1",
        createdAt: new Date(now - 5 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-faktura",
        fra: "workflows",
        type: "faktura",
        tekst: "Faktura nr. 10041 er betalt — takk!",
        lenke: null,
        filer: [],
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 4 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-leveranse",
        fra: "workflows",
        type: "leveranse",
        tekst:
          "Første versjon av flyten kjører i testmiljøet. Lenka under viser køen med de tre eksemplene deres lagt inn — se om feltene havner der dere venter dem.",
        lenke: "https://demo.workflows.no/flyt-test",
        // Two raster previews — exercises the thumbnail grid + lysbordet
        // in dev (the webp resolves; bilde=true by extension).
        filer: [
          mockInnleggFil("ko-skjermbilde.webp"),
          mockInnleggFil("felt-mapping.webp"),
        ],
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 2 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-milepael",
        fra: "workflows",
        type: "milepael",
        tekst: "Første flyt kjører i testmiljøet — halvveis i løpet.",
        lenke: null,
        filer: [],
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 2 * DAG_MS + 3 * HOUR_MS).toISOString(),
      },
      {
        id: "pi-mock-foresporsel-2",
        fra: "workflows",
        type: "foresporsel",
        tekst:
          "Neste steg er standardsvarene: vi trenger lista over svarene dere bruker i dag — Word, PDF eller bare en tekstfil, det dere har.",
        lenke: null,
        filer: [],
        foresporselStatus: "apen",
        svarPa: null,
        createdAt: new Date(now - 1 * DAG_MS).toISOString(),
      },
    ],
  };
}

/** Project rooms live beside the rows on globalThis (same isolate reason). */
const gp = globalThis as typeof globalThis & {
  __vkPortalProsjektMock?: Map<string, MockProsjekt>;
};
const prosjekter: Map<string, MockProsjekt> = (gp.__vkPortalProsjektMock ??=
  new Map());

function ensureProsjekt(id: string): MockProsjekt {
  let p = prosjekter.get(id);
  if (!p) {
    p = seedProsjektInnlegg();
    prosjekter.set(id, p);
  }
  return p;
}

/** GET /api/portal/prosjekt?id= AND admin variant — uke + the thread.
 *  The week mirrors production: p.uke is the manual OVERRIDE (null =
 *  automatic from godkjentAt) — same effektivUke as the real routes. */
export async function mockProsjekt(id: string): Promise<ProsjektResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const p = ensureProsjekt(id);
  const godkjentAt =
    state.row && state.row.id === id
      ? state.row.godkjentAt
      : (adminRows.find((r) => r.id === id)?.godkjentAt ?? null);
  const u = effektivUke(godkjentAt, p.uke);
  return {
    uke: u.uke,
    ukeKilde: u.kilde,
    // The customer mock row carries the authoritative status (T's levert
    // mock state rides through); admin mock ids fall back to «videre».
    status: state.row && state.row.id === id ? state.row.status : "videre",
    kundeSettAt: p.kundeSettAt,
    fakturaer: [...p.fakturaer],
    innlegg: [...p.innlegg],
  };
}

/** POST /api/portal/prosjekt {sett:true} — stamps the read marker. */
export async function mockProsjektSett(id: string): Promise<ProsjektPostResponse> {
  const p = ensureProsjekt(id);
  p.kundeSettAt = new Date().toISOString();
  return { ok: true };
}

/** POST /api/portal/prosjekt — customer message (fra=kunde, type=melding). */
export async function mockProsjektPost(
  id: string,
  innspill: {
    tekst: string;
    fil?: ProsjektFilRef;
    filer?: ProsjektFilRef[];
    svarPa?: string;
  }
): Promise<ProsjektPostResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const p = ensureProsjekt(id);
  state.counter += 1;
  p.innlegg.push({
    id: `pi-mock-${state.counter}`,
    fra: "kunde",
    type: "melding",
    tekst: innspill.tekst,
    lenke: null,
    // Same merge as production: legacy fil first, then filer[].
    filer: [
      ...(innspill.fil ? [innspill.fil] : []),
      ...(innspill.filer ?? []),
    ].map((f) => mockInnleggFil(f.navn)),
    foresporselStatus: null,
    svarPa: innspill.svarPa ?? null,
    createdAt: new Date().toISOString(),
  });
  // Answering an open workflows-foresporsel flips it — like production.
  if (innspill.svarPa) {
    const target = p.innlegg.find((i) => i.id === innspill.svarPa);
    if (
      target &&
      target.fra === "workflows" &&
      target.type === "foresporsel" &&
      target.foresporselStatus === "apen"
    ) {
      target.foresporselStatus = "levert";
    }
  }
  console.log("[portalMock] varsel (nytt i prosjektet) ville gått til Petter — logget i stedet for sendt");
  return { ok: true };
}

/** POST /api/portal/prosjekt/fil — fabricates a safe-looking path. */
export async function mockProsjektFil(
  id: string,
  navn: string
): Promise<ProsjektFilResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  state.counter += 1;
  return { path: `${id}/mock-${state.counter}-${navn}`, navn };
}

/** POST /api/portal/admin/prosjekt — Petter posts; optional uke stamp
 *  (1–6 sets the manual override, "auto" clears it — like production). */
export async function mockAdminProsjektPost(
  id: string,
  innspill: {
    type: ProsjektInnleggType;
    tekst: string;
    lenke?: string;
    fil?: ProsjektFilRef;
    filer?: ProsjektFilRef[];
    uke?: number | "auto";
  }
): Promise<AdminProsjektPostResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const p = ensureProsjekt(id);
  state.counter += 1;
  p.innlegg.push({
    id: `pi-mock-${state.counter}`,
    fra: "workflows",
    type: innspill.type,
    tekst: innspill.tekst,
    lenke: innspill.lenke ?? null,
    // Same merge as production: legacy fil first, then filer[].
    filer: [
      ...(innspill.fil ? [innspill.fil] : []),
      ...(innspill.filer ?? []),
    ].map((f) => mockInnleggFil(f.navn)),
    foresporselStatus: innspill.type === "foresporsel" ? "apen" : null,
    svarPa: null,
    createdAt: new Date().toISOString(),
  });
  if (innspill.uke === "auto") {
    // Clear the manual override — the week follows godkjentAt again.
    p.uke = null;
    if (state.row && state.row.id === id) {
      state.row = { ...state.row, uke: null };
    }
  } else if (typeof innspill.uke === "number") {
    p.uke = innspill.uke;
    if (state.row && state.row.id === id) {
      state.row = { ...state.row, uke: innspill.uke };
    }
  }
  console.log("[portalMock] e-post (nytt i prosjektet) ville gått til kunden — logget i stedet for sendt");
  return { ok: true };
}

/* ════════════════════════════════════════════
   FIKEN MOCK — Fakturering-seksjonen i verkstedkontoret.
   Lazily seeded per kartlegging id (only for rows in videre/levert) with
   two FakturaRad rows mirroring the canned ProsjektFaktura pair in the
   Benken seed (10041 betalt + 10052 sendt). Utkast → faktura → send → sync
   all mutate this state plausibly — no Fiken anywhere near dev-mock.
   ════════════════════════════════════════════ */

/** GET /api/portal/admin/fiken/status — always happily connected. */
export function mockFikenStatus(): FikenStatusResponse {
  return {
    koblet: true,
    via: "token",
    selskap: "Workflows AS (mock)",
    testCompany: true,
    authUrl: null,
  };
}

/** Faktura rows per kartlegging id — globalThis for the same isolate reason. */
const gfk = globalThis as typeof globalThis & {
  __vkPortalFakturaMock?: Map<string, FakturaRad[]>;
};
const fakturaRader: Map<string, FakturaRad[]> = (gfk.__vkPortalFakturaMock ??=
  new Map());

/** The row's status as the mock knows it — customer row first, then admin. */
function mockKartleggingStatus(id: string): string | null {
  if (state.row && state.row.id === id) return state.row.status;
  return adminRows.find((row) => row.id === id)?.status ?? null;
}

/** Two canned rows — mirrors the Benken seed's faktura panel (betalt+sendt). */
function seedFakturaRader(kartleggingId: string): FakturaRad[] {
  const now = Date.now();
  state.counter += 1;
  const betalt: FakturaRad = {
    id: `fak-mock-${state.counter}`,
    kartleggingId,
    fikenDraftId: 9001,
    fikenInvoiceId: 70041,
    invoiceNumber: 10041,
    kid: "0020124563",
    belopOre: 2_812_500,
    nettoOre: 2_250_000,
    mvaOre: 562_500,
    valuta: "NOK",
    beskrivelse: "Oppstart — 50 % av avtalt pris",
    issueDate: new Date(now - 8 * DAG_MS).toISOString().slice(0, 10),
    dueDate: new Date(now - 1 * DAG_MS).toISOString().slice(0, 10),
    status: "betalt",
    settledAt: new Date(now - 4 * DAG_MS).toISOString(),
    sendtVia: "auto",
    sistSynketAt: new Date(now - 4 * DAG_MS).toISOString(),
    createdAt: new Date(now - 8 * DAG_MS).toISOString(),
  };
  state.counter += 1;
  const sendt: FakturaRad = {
    id: `fak-mock-${state.counter}`,
    kartleggingId,
    fikenDraftId: 9002,
    fikenInvoiceId: 70052,
    invoiceNumber: 10052,
    kid: "0020124571",
    belopOre: 2_812_500,
    nettoOre: 2_250_000,
    mvaOre: 562_500,
    valuta: "NOK",
    beskrivelse: "Leveranse — resterende 50 %",
    issueDate: new Date(now - 1 * DAG_MS).toISOString().slice(0, 10),
    dueDate: new Date(now + 13 * DAG_MS).toISOString().slice(0, 10),
    status: "sendt",
    settledAt: null,
    sendtVia: "auto",
    sistSynketAt: new Date(now - 1 * DAG_MS).toISOString(),
    createdAt: new Date(now - 1 * DAG_MS).toISOString(),
  };
  return [sendt, betalt]; // nyeste først — som ruta sorterer
}

function ensureFakturaer(kartleggingId: string): FakturaRad[] {
  let rader = fakturaRader.get(kartleggingId);
  if (!rader) {
    const status = mockKartleggingStatus(kartleggingId);
    rader =
      status === "videre" || status === "levert"
        ? seedFakturaRader(kartleggingId)
        : [];
    fakturaRader.set(kartleggingId, rader);
  }
  return rader;
}

function finnFakturaRad(fakturaId: string): FakturaRad | null {
  for (const rader of fakturaRader.values()) {
    const rad = rader.find((r) => r.id === fakturaId);
    if (rad) return rad;
  }
  return null;
}

/** GET /api/portal/admin/fiken/faktura?kartleggingId= — the list. */
export async function mockFakturaer(
  kartleggingId: string
): Promise<AdminFakturaListeResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  return { fakturaer: ensureFakturaer(kartleggingId).map((r) => ({ ...r })) };
}

/**
 * POST /api/portal/admin/fiken/faktura — new row (status 'utkast') with a
 * pretend Fiken draft attached right away. null → the route's 409 (the
 * production status guard: videre/levert only).
 */
export async function mockFakturaUtkast(
  kartleggingId: string,
  input: {
    linjer: FakturaLinjeInput[];
    dagerTilForfall: number;
    fakturatekst: string | null;
  }
): Promise<AdminFakturaOpprettResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const status = mockKartleggingStatus(kartleggingId);
  if (status !== "videre" && status !== "levert") return null;
  const rader = ensureFakturaer(kartleggingId);
  const belop = regnBelop(input.linjer);
  state.counter += 1;
  const rad: FakturaRad = {
    id: `fak-mock-${state.counter}`,
    kartleggingId,
    fikenDraftId: 9000 + state.counter,
    fikenInvoiceId: null,
    invoiceNumber: null,
    kid: null,
    belopOre: belop.belopOre,
    nettoOre: belop.nettoOre,
    mvaOre: belop.mvaOre,
    valuta: "NOK",
    beskrivelse: (
      input.fakturatekst ?? input.linjer.map((l) => l.beskrivelse).join("; ")
    ).slice(0, FAKTURA_BESKRIVELSE_MAX),
    issueDate: null,
    dueDate: new Date(Date.now() + input.dagerTilForfall * DAG_MS)
      .toISOString()
      .slice(0, 10),
    status: "utkast",
    settledAt: null,
    sendtVia: null,
    sistSynketAt: null,
    createdAt: new Date().toISOString(),
  };
  rader.unshift(rad);
  return { faktura: { ...rad } };
}

/**
 * POST /api/portal/admin/fiken/faktura/opprett — utkast → «ekte» faktura:
 * stamps invoice id/number/kid/issueDate; idempotent like production
 * (already a faktura → just a fresh synk stamp). null → route's 404.
 */
export async function mockFakturaOpprett(
  fakturaId: string
): Promise<AdminFakturaEnkeltResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const rad = finnFakturaRad(fakturaId);
  if (!rad || rad.fikenDraftId === null) return null;
  const naIso = new Date().toISOString();
  if (rad.fikenInvoiceId === null) {
    state.counter += 1;
    rad.fikenInvoiceId = 70_000 + state.counter;
    rad.invoiceNumber = 10_052 + state.counter;
    rad.kid = `00201246${String(state.counter % 100).padStart(2, "0")}`;
    rad.issueDate = naIso.slice(0, 10);
  }
  rad.sistSynketAt = naIso;
  return { faktura: { ...rad } };
}

/**
 * POST /api/portal/admin/fiken/faktura/send — 'utkast' → 'sendt', never a
 * downgrade (re-send keeps delbetalt/betalt/forfalt). null → route's 404.
 */
export async function mockFakturaSend(
  fakturaId: string,
  metode: "auto" | "email"
): Promise<AdminFakturaEnkeltResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const rad = finnFakturaRad(fakturaId);
  if (!rad || rad.fikenInvoiceId === null || rad.status === "kansellert") {
    return null;
  }
  if (rad.status === "utkast") rad.status = "sendt";
  rad.sendtVia = metode;
  rad.sistSynketAt = new Date().toISOString();
  console.log("[portalMock] faktura ville blitt sendt via Fiken — logget i stedet for sendt");
  return { faktura: { ...rad } };
}

/**
 * POST /api/portal/admin/fiken/sync — stamps sistSynketAt on every row with
 * an invoice id; flips overdue sendt/delbetalt → 'forfalt' (the production
 * precedence, minus Fiken).
 */
export async function mockFikenSync(): Promise<AdminFikenSyncResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const naIso = new Date().toISOString();
  const iDag = naIso.slice(0, 10);
  let totalt = 0;
  let oppdatert = 0;
  for (const rader of fakturaRader.values()) {
    for (const rad of rader) {
      if (rad.fikenInvoiceId === null) continue;
      if (rad.status === "betalt" || rad.status === "kansellert") continue;
      totalt += 1;
      rad.sistSynketAt = naIso;
      if (
        (rad.status === "sendt" || rad.status === "delbetalt") &&
        rad.dueDate !== null &&
        rad.dueDate < iDag
      ) {
        rad.status = "forfalt";
        oppdatert += 1;
      }
    }
  }
  return { totalt, oppdatert, nyBetalte: 0, feil: [] };
}
