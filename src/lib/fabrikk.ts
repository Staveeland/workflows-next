import { timingSafeEqual } from "node:crypto";

/**
 * Byggefabrikken — server-side hjelpere for å snakke med fabrikk-repoet
 * (GitHub Actions i Staveeland/workflows-fabrikk) og Vercel-API-et.
 *
 * Sikkerhetsmodell:
 *  - Utgående (dispatch): GH_FABRIKK_TOKEN, kun fra admin-gatede ruter.
 *  - Innkommende (brief/status): fabrikken autentiserer seg med
 *    FABRIKK_WEBHOOK_SECRET i X-Fabrikk-Secret-headeren — verifisert
 *    timing-safe her. Disse rutene bruker service role (supabaseAdmin)
 *    og er dermed i samme isolerte klasse som chat/cron — ALDRI
 *    importér disse hjelperne fra kundeflate-ruter.
 */

const FABRIKK_REPO = "Staveeland/workflows-fabrikk";
const VERCEL_TEAM_ID = "team_Qu5JrmkCpgQD36JsAaF8yMNZ";

export class FabrikkConfigError extends Error {}

function ghToken(): string {
  const token = process.env.GH_FABRIKK_TOKEN;
  if (!token) {
    throw new FabrikkConfigError(
      "GH_FABRIKK_TOKEN mangler i env — fabrikken kan ikke trigges. Se docs/byggefabrikken.md."
    );
  }
  return token;
}

/**
 * Trigger byggejobben i fabrikk-repoet (repository_dispatch). graceSeconds
 * er angrefristen fabrikken sover før den spør portalen om løpet fortsatt
 * skal bygges (0 ved manuell start — Petter trykket selv).
 */
export async function dispatchFabrikk(args: {
  byggId: string;
  kartleggingId: string;
  graceSeconds: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let token: string;
  try {
    token = ghToken();
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  const res = await fetch(`https://api.github.com/repos/${FABRIKK_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "bygg",
      client_payload: {
        byggId: args.byggId,
        kartleggingId: args.kartleggingId,
        graceSeconds: args.graceSeconds,
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 204) return { ok: true };
  const body = await res.text().catch(() => "");
  console.error(`[fabrikk] dispatch feilet ${res.status}: ${body.slice(0, 300)}`);
  return { ok: false, error: `GitHub svarte ${res.status}` };
}

/** Timing-safe verifisering av fabrikkens innkommende kall. */
export function verifiserFabrikkSecret(req: Request): boolean {
  const ventet = process.env.FABRIKK_WEBHOOK_SECRET ?? "";
  if (!ventet) return false;
  const gitt = req.headers.get("x-fabrikk-secret") ?? "";
  const a = Buffer.from(gitt);
  const b = Buffer.from(ventet);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Auto-start ved kundens godkjenning: hvis Petter har slått på autobygg for
 * løpet, flippes byggeraden til 'venter' og fabrikken trigges med 10 min
 * angrefrist (fabrikken sover, og spør /api/fabrikk/status?byggId= før den
 * rører noe — «Stopp bygget» i admin innen fristen avlyser alt).
 *
 * Kjøres med service role fra godkjenn-ruta (kunden kan ikke skrive til
 * byggeprosjekter — det er hele poenget). Fail-silent: et byggeproblem skal
 * aldri ødelegge selve godkjenningen.
 */
export async function startAutobyggVedGodkjenning(kartleggingId: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { sendTelegramToPetter } = await import("@/lib/telegram");
    const supabase = supabaseAdmin();
    const now = new Date().toISOString();
    const { data: flippet, error } = await supabase
      .from("byggeprosjekter")
      .update({
        status: "venter",
        startet_at: now,
        logg: [{ tid: now, melding: "Autostart: kunden godkjente tilbudet (10 min angrefrist)" }],
        updated_at: now,
      })
      .eq("kartlegging_id", kartleggingId)
      .eq("autobygg", true)
      .eq("status", "ikke_startet")
      .select("id");
    if (error) {
      console.error("[fabrikk] autobygg-flipp feilet", error);
      return;
    }
    if (!flippet || flippet.length === 0) return; // autobygg av, eller alt i gang
    const byggId = flippet[0].id as string;
    const dispatch = await dispatchFabrikk({ byggId, kartleggingId, graceSeconds: 600 });
    if (!dispatch.ok) {
      await supabase
        .from("byggeprosjekter")
        .update({ status: "feilet", updated_at: new Date().toISOString() })
        .eq("id", byggId);
      console.error(`[fabrikk] autobygg-dispatch feilet: ${dispatch.error}`);
      return;
    }
    const tg = await sendTelegramToPetter({
      text: "🏗️ Kunden godkjente — byggefabrikken starter om 10 minutter. «Stopp bygget» i admin → Bygging hvis du vil avlyse.",
    });
    if (!tg.ok) console.log(`[fabrikk] Telegram (autostart) ikke sendt: ${tg.error}`);
  } catch (err) {
    console.error("[fabrikk] autobygg uventet feil", err);
  }
}

export type VercelDeploy = {
  url: string;
  sha: string | null;
  readyAt: string | null;
};

/**
 * Siste grønne produksjonsdeploy for et Vercel-prosjekt — «portalen viser
 * alltid siste utgave». Returnerer null uten token/prosjekt eller ved feil
 * (visningen faller da tilbake til sist lagrede preview_url i raden).
 */
export async function hentSisteDeploy(
  vercelProjectId: string
): Promise<VercelDeploy | null> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(
        vercelProjectId
      )}&teamId=${VERCEL_TEAM_ID}&state=READY&target=production&limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!res.ok) {
      console.error(`[fabrikk] vercel deployments svarte ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      deployments?: Array<{
        url?: string;
        meta?: { githubCommitSha?: string };
        ready?: number;
        createdAt?: number;
      }>;
    };
    const d = json.deployments?.[0];
    if (!d?.url) return null;
    const readyMs = d.ready ?? d.createdAt;
    return {
      url: `https://${d.url}`,
      sha: d.meta?.githubCommitSha ?? null,
      readyAt: readyMs ? new Date(readyMs).toISOString() : null,
    };
  } catch (err) {
    console.error("[fabrikk] vercel deploy-oppslag feilet", err);
    return null;
  }
}
