import { NextResponse } from "next/server";
import { fikenFeilKort, FikenApiError, FikenConfigError, sendInvoice } from "@/lib/fiken";
import {
  FAKTURA_SELECT,
  tilFakturaRad,
  type AdminFakturaEnkeltResponse,
  type AdminFakturaSendBody,
  type FakturaDbRow,
} from "@/lib/fikenTypes";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockFakturaSend, portalMockEnabled } from "@/lib/portalMock";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * POST /api/portal/admin/fiken/faktura/send {fakturaId, metode?,
 * mottakerEpost?} — sender fakturaen via Fiken. KUN bak den eksplisitte
 * «Send faktura»-knappen (med bekreftelse) i verkstedkontoret.
 *
 * metode 'auto' (default) lar Fiken velge kanal; 'email' tvinger e-post.
 * mottakerEpost overstyrer kontaktens adresse — uten den bruker Fiken
 * adressen som ligger på kontakten.
 *
 * Status: 'utkast' → 'sendt' (første gang). Re-send er lov (purring/ny
 * adresse) men NEDGRADERER aldri — delbetalt/betalt/forfalt står.
 * Fra nå ser kunden fakturaraden i Benken (kunde-RLS slipper gjennom
 * status<>'utkast').
 *
 * Feilmodi vurdert: send OK men rad-update feiler (fanges av synken:
 * dispatches → 'sendt'); dobbeltklikk (to send-forsøk = to e-poster i
 * verste fall — bekreftelsesknappen i UI-et demper, og Fiken dedupliserer
 * ikke; aldri datatap); faktura uten fiken_invoice_id → 409.
 */

const RL_MAX = 20;
const RL_WINDOW_MS = 10 * 60_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EPOST_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<AdminFakturaSendBody>)
      : {};

  const fakturaId =
    typeof body.fakturaId === "string" ? body.fakturaId.trim() : "";
  if (!fakturaId) {
    return NextResponse.json({ error: "Mangler/ugyldig fakturaId" }, { status: 400 });
  }
  const metode = body.metode ?? "auto";
  if (metode !== "auto" && metode !== "email") {
    return NextResponse.json(
      { error: "Ugyldig metode (auto eller email)" },
      { status: 400 }
    );
  }
  let mottakerEpost: string | null = null;
  if (body.mottakerEpost !== undefined && body.mottakerEpost !== null) {
    const e =
      typeof body.mottakerEpost === "string" ? body.mottakerEpost.trim() : "";
    if (!e || e.length > 200 || !EPOST_RE.test(e)) {
      return NextResponse.json(
        { error: "Ugyldig mottaker-e-post" },
        { status: 400 }
      );
    }
    mottakerEpost = e;
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  // Before the UUID check: mock-ids («fak-mock-N») are not UUIDs.
  if (portalMockEnabled()) {
    const mocked = await mockFakturaSend(fakturaId, metode);
    if (!mocked) {
      return NextResponse.json({ error: "Fant ikke fakturaen" }, { status: 404 });
    }
    return NextResponse.json<AdminFakturaEnkeltResponse>(mocked);
  }

  if (!UUID_RE.test(fakturaId)) {
    return NextResponse.json({ error: "Mangler/ugyldig fakturaId" }, { status: 400 });
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/faktura/send] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:fiken:faktura:send",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  const { data, error } = await supabase
    .from("fakturaer")
    .select(FAKTURA_SELECT)
    .eq("id", fakturaId)
    .maybeSingle();
  if (error) {
    console.error("[portal/admin/fiken/faktura/send] select feilet", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Fant ikke fakturaen" }, { status: 404 });
  }
  const rad = data as unknown as FakturaDbRow;

  if (!rad.fiken_invoice_id) {
    return NextResponse.json(
      { error: "Fakturaen er ikke opprettet i Fiken ennå — lag den først." },
      { status: 409 }
    );
  }
  if (rad.status === "kansellert") {
    return NextResponse.json(
      { error: "Fakturaen er kansellert — sender ikke." },
      { status: 409 }
    );
  }

  try {
    await sendInvoice({
      invoiceId: rad.fiken_invoice_id,
      metode,
      mottakerEpost,
    });
  } catch (err) {
    if (err instanceof FikenConfigError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof FikenApiError) {
      return NextResponse.json(
        { error: `Fiken avviste sendingen: ${fikenFeilKort(err)}` },
        { status: 502 }
      );
    }
    console.error("[portal/admin/fiken/faktura/send] uventet feil", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  // Aldri nedgrader: kun 'utkast' løftes til 'sendt'; resten står.
  const nyStatus = rad.status === "utkast" ? "sendt" : rad.status;
  const naIso = new Date().toISOString();
  const { data: oppdatert, error: updateError } = await supabase
    .from("fakturaer")
    .update({
      status: nyStatus,
      sendt_via: metode,
      sist_synket_at: naIso,
      updated_at: naIso,
    })
    .eq("id", rad.id)
    .select(FAKTURA_SELECT)
    .single();
  if (updateError || !oppdatert) {
    // Sendingen GIKK — logg tydelig; synken retter status via dispatches.
    console.error(
      `[portal/admin/fiken/faktura/send] faktura ${rad.fiken_invoice_id} sendt, men rad-update feilet`,
      updateError
    );
    return NextResponse.json(
      { error: "Fakturaen ble sendt, men statusen hang seg — kjør «Synk status»." },
      { status: 500 }
    );
  }

  console.log(
    `[portal/admin/fiken/faktura/send] faktura ${rad.fiken_invoice_id} sendt via ${metode}`
  );
  return NextResponse.json<AdminFakturaEnkeltResponse>({
    faktura: tilFakturaRad(oppdatert as unknown as FakturaDbRow),
  });
}
