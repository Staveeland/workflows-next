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
  PortalAssessment,
  PortalKartlegging,
  PortalLikeResponse,
  PortalMeResponse,
  PortalResearchResponse,
  PortalSubmitResponse,
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
  };
  await delay(MOCK_DELAY_MS);
  state.row = {
    ...state.row,
    status: "forslag_klart",
    assessment: MOCK_ASSESSMENT,
    mockupUrl: MOCK_MOCKUP_URL,
  };
  return { id };
}

/** GET /api/portal/me — latest (only) row from mock memory. */
export async function mockMe(): Promise<PortalMeResponse> {
  return { kartlegging: state.row };
}

/** POST /api/portal/like — flips status, no Telegram in mock mode. */
export async function mockLike(id: string): Promise<PortalLikeResponse> {
  if (state.row && state.row.id === id) {
    state.row = { ...state.row, status: "likt" };
  }
  return { ok: true };
}
