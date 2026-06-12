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
  AdminListeResponse,
  AdminProsjektPostResponse,
  AdminSlettResponse,
  AdminTilbudResponse,
  PortalAssessment,
  PortalGodkjennResponse,
  PortalKartlegging,
  PortalLikeResponse,
  PortalMeResponse,
  PortalResearchResponse,
  PortalSubmitResponse,
  PortalTilbud,
  ProsjektFilRef,
  ProsjektFilResponse,
  ProsjektInnlegg,
  ProsjektInnleggType,
  ProsjektPostResponse,
  ProsjektResponse,
  ResearchFunn,
} from "@/lib/portalTypes";

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
const MOCK_MOCKUP_URL = "/verksted/tj-flyter.webp";

/** Canned research funn — CSUB-like, realistic field shapes for the card. */
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
    uke: 2,
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
      answers: {
        bedrift: { navn: "CSUB AS", nettside: "csub.com" },
        research: MOCK_FUNN,
        storrelse: "50+",
        tidstyver: ["rapporter", "dobbeltregistrering"],
        systemer: ["m365", "fagsystem"],
        kundehenvendelser: "litt",
        dromen:
          "At fremdriftsrapporten til prosjektmøtet skrev seg selv fra timelistene og avviksloggen.",
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
      answers: {
        bedrift: { navn: "Håland Rør AS" },
        research: null,
        bransje: "bygg_industri",
        storrelse: "6_20",
        tidstyver: ["epost", "oppfolging", "annet"],
        tidstyver_tekst: "purring på befaringer som aldri blir booket",
        systemer: ["excel_sheets", "okonomisystem"],
        kundehenvendelser: "ja_mye",
        dromen: "At kundene kunne booke befaring selv uten ti telefoner frem og tilbake.",
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
        anbefaling: row.assessment?.anbefaling ?? null,
        status: row.status,
      };
    }),
  };
}

/** GET /api/portal/admin/liste?id= — one full row (or null). */
export async function mockAdminDetalj(id: string): Promise<AdminDetaljResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  return { kartlegging: adminRows.find((row) => row.id === id) ?? null };
}

/** DELETE /api/portal/admin/liste?id= — row out; no real storage in mock. */
export async function mockAdminSlett(
  id: string
): Promise<AdminSlettResponse | null> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const idx = adminRows.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  adminRows.splice(idx, 1);
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

type MockProsjekt = { uke: number | null; innlegg: ProsjektInnlegg[] };

const DAG_MS = 24 * HOUR_MS;

/** Six canned innlegg — a believable week-two thread in the room. */
function seedProsjektInnlegg(): MockProsjekt {
  const now = Date.now();
  return {
    uke: 2,
    innlegg: [
      {
        id: "pi-mock-status",
        fra: "workflows",
        type: "status",
        tekst:
          "Da er benken rigget. Vi starter i den enden vi ble enige om: røret fra innboksen til køen. Du hører fra oss her når det skjer noe — og du kan skrive når som helst.",
        lenke: null,
        filUrl: null,
        filNavn: null,
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
        filUrl: null,
        filNavn: null,
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
        filUrl: null,
        filNavn: null,
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
        filUrl: MOCK_MOCKUP_URL,
        filNavn: "eksempel-henvendelser.pdf",
        foresporselStatus: null,
        svarPa: "pi-mock-foresporsel-1",
        createdAt: new Date(now - 5 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-leveranse",
        fra: "workflows",
        type: "leveranse",
        tekst:
          "Første versjon av flyten kjører i testmiljøet. Lenka under viser køen med de tre eksemplene deres lagt inn — se om feltene havner der dere venter dem.",
        lenke: "https://demo.workflows.no/flyt-test",
        filUrl: null,
        filNavn: null,
        foresporselStatus: null,
        svarPa: null,
        createdAt: new Date(now - 2 * DAG_MS).toISOString(),
      },
      {
        id: "pi-mock-foresporsel-2",
        fra: "workflows",
        type: "foresporsel",
        tekst:
          "Neste steg er standardsvarene: vi trenger lista over svarene dere bruker i dag — Word, PDF eller bare en tekstfil, det dere har.",
        lenke: null,
        filUrl: null,
        filNavn: null,
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

/** GET /api/portal/prosjekt?id= AND admin variant — uke + the thread. */
export async function mockProsjekt(id: string): Promise<ProsjektResponse> {
  await delay(MOCK_ADMIN_DELAY_MS);
  const p = ensureProsjekt(id);
  return { uke: p.uke, ukeKilde: p.uke !== null ? "manuell" : null, innlegg: [...p.innlegg] };
}

/** POST /api/portal/prosjekt — customer message (fra=kunde, type=melding). */
export async function mockProsjektPost(
  id: string,
  innspill: { tekst: string; fil?: ProsjektFilRef; svarPa?: string }
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
    filUrl: innspill.fil ? MOCK_MOCKUP_URL : null,
    filNavn: innspill.fil?.navn ?? null,
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

/** POST /api/portal/admin/prosjekt — Petter posts; optional uke stamp. */
export async function mockAdminProsjektPost(
  id: string,
  innspill: {
    type: ProsjektInnleggType;
    tekst: string;
    lenke?: string;
    fil?: ProsjektFilRef;
    uke?: number;
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
    filUrl: innspill.fil ? MOCK_MOCKUP_URL : null,
    filNavn: innspill.fil?.navn ?? null,
    foresporselStatus: innspill.type === "foresporsel" ? "apen" : null,
    svarPa: null,
    createdAt: new Date().toISOString(),
  });
  if (typeof innspill.uke === "number") {
    p.uke = innspill.uke;
    if (state.row && state.row.id === id) {
      state.row = { ...state.row, uke: innspill.uke };
    }
  }
  console.log("[portalMock] e-post (nytt i prosjektet) ville gått til kunden — logget i stedet for sendt");
  return { ok: true };
}
