import { NextResponse } from "next/server";
import { FikenConfigError, syncAlleFakturaer } from "@/lib/fiken";
import type { AdminFikenSyncResponse } from "@/lib/fikenTypes";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockFikenSync, portalMockEnabled } from "@/lib/portalMock";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * POST /api/portal/admin/fiken/sync — manuell statussynk («Synk status»-
 * knappen). Samme synk som cron-ruta: alle fakturaer-rader med
 * fiken_invoice_id hentes SEKVENSIELT fra Fiken (rate limit: maks én
 * samtidig request) og statusene oppdateres (sendt/delbetalt/betalt/
 * forfalt + settled_at, sist_synket_at). Statusovergang → 'betalt' poster
 * et prosjekt_innlegg i Benken-feeden.
 *
 * Selve synken kjører via service role (syncAlleFakturaer i fiken.ts) —
 * én kodelinje for cron og knapp, innlegget postes med samme rettigheter
 * begge steder. Adgangskontrollen her er den vanlige harde admin-sjekken.
 *
 * Fiken har INGEN webhooks — polling (denne + daglig cron) er modellen.
 */

const RL_MAX = 10;
const RL_WINDOW_MS = 10 * 60_000;

export async function POST(req: Request) {
  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return NextResponse.json<AdminFikenSyncResponse>(await mockFikenSync());
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/sync] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();

  // Hver synk er N Fiken-kall — stram grense; cronen tar hverdagsjobben.
  const rl = rateLimit({
    key: "portal:admin:fiken:sync",
    identifier: auth.user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  try {
    const resultat = await syncAlleFakturaer();
    console.log(
      `[portal/admin/fiken/sync] ${resultat.totalt} synket, ${resultat.oppdatert} endret, ${resultat.nyBetalte} nybetalte, ${resultat.feil.length} feil`
    );
    return NextResponse.json<AdminFikenSyncResponse>(resultat);
  } catch (err) {
    if (err instanceof FikenConfigError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[portal/admin/fiken/sync] synk feilet", err);
    return NextResponse.json({ error: "Synken feilet." }, { status: 500 });
  }
}
