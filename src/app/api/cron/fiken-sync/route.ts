import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FikenConfigError, syncAlleFakturaer } from "@/lib/fiken";
import type { AdminFikenSyncResponse } from "@/lib/fikenTypes";

export const runtime = "nodejs";

/**
 * GET /api/cron/fiken-sync — daglig statussynk (vercel.json: 0 6 * * *).
 *
 * Vercel cron kaller med Authorization: Bearer ${CRON_SECRET} når env-en
 * er satt — alt annet avvises med 401. Kjører samme syncAlleFakturaer()
 * som admin-knappen (service role, sekvensielle Fiken-kall, innlegg i
 * Benken på → 'betalt'). Idempotent: en replay av en allerede synket dag
 * endrer ingenting og poster ingen dubletter (statusskiftet er gardet
 * i synken).
 *
 * Fiken har ingen webhooks — denne pollingen ER ferskheten; admin har i
 * tillegg en manuell «Synk status»-knapp.
 */

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Uten secret kan hvem som helst trigge N Fiken-kall — nekt alt.
    console.error("[cron/fiken-sync] CRON_SECRET mangler i env");
    return NextResponse.json({ error: "Ikke konfigurert." }, { status: 503 });
  }
  const gitt = Buffer.from(req.headers.get("authorization") ?? "");
  const ventet = Buffer.from(`Bearer ${secret}`);
  if (gitt.length !== ventet.length || !timingSafeEqual(gitt, ventet)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  try {
    const resultat = await syncAlleFakturaer();
    console.log(
      `[cron/fiken-sync] ${resultat.totalt} synket, ${resultat.oppdatert} endret, ${resultat.nyBetalte} nybetalte, ${resultat.feil.length} feil`
    );
    return NextResponse.json<AdminFikenSyncResponse>(resultat);
  } catch (err) {
    if (err instanceof FikenConfigError) {
      // Fiken ikke koblet til ennå — cron skal ikke alarmere for det.
      console.log(`[cron/fiken-sync] hoppet over: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[cron/fiken-sync] synk feilet", err);
    return NextResponse.json({ error: "Synken feilet." }, { status: 500 });
  }
}
