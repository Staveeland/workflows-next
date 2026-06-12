import { NextResponse } from "next/server";
import {
  createInvoiceFromDraft,
  fakturaCounterFinnes,
  FikenApiError,
  FikenConfigError,
  finnFakturaMedUuid,
  getInvoiceStatus,
} from "@/lib/fiken";
import {
  FAKTURA_SELECT,
  tilFakturaRad,
  type AdminFakturaEnkeltResponse,
  type AdminFakturaTilFakturaBody,
  type FakturaDbRow,
  type FikenInvoice,
} from "@/lib/fikenTypes";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockFakturaOpprett, portalMockEnabled } from "@/lib/portalMock";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/portal/admin/fiken/faktura/opprett {fakturaId} — utkast →
 * EKTE faktura i Fiken (createInvoice). KUN bak den eksplisitte
 * «Lag faktura i Fiken»-knappen i verkstedkontoret.
 *
 * STATUSVALG (dokumentert også i fikenTypes.ts): createInvoice gjør IKKE
 * fakturaen sendt, så raden BEHOLDER status 'utkast' med fiken_invoice_id
 * satt — mellomtilstanden «ekte faktura finnes, ikke sendt». Det er
 * bevisst: kunde-RLS skjuler status='utkast', og kunden skal først se
 * fakturaen når den er sendt. Status 'sendt' settes av send-ruten (eller
 * av synken hvis dispatches viser at den ble sendt fra Fiken-UI).
 *
 * Idempotens: allerede opprettet (fiken_invoice_id satt) → frisk Fiken-
 * status og 200 med raden. Avbrutt forrige forsøk → uuid-oppslaget
 * (GET ?invoiceDraftUuid=) finner fakturaen og adopterer den i stedet
 * for å fakturere utkastet to ganger.
 *
 * Fakturanummer-serien: GET /invoices/counter sjekkes FØRST — finnes den
 * ikke, svarer vi 409 med beskjed om å opprette serien i Fiken-UI. Vi
 * POSTer ALDRI counter selv (det er en endring i Petters Fiken).
 */

const RL_MAX = 20;
const RL_WINDOW_MS = 10 * 60_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Skriv Fiken-fasit (nummer/kid/beløp/datoer) på raden — status urørt. */
async function lagreFakturaFelter(
  supabase: SupabaseClient,
  radId: string,
  faktura: FikenInvoice
): Promise<FakturaDbRow | null> {
  const naIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("fakturaer")
    .update({
      fiken_invoice_id: faktura.invoiceId,
      invoice_number: faktura.invoiceNumber ?? null,
      kid: faktura.kid ?? null,
      belop_ore: faktura.gross ?? null,
      netto_ore: faktura.net ?? null,
      mva_ore: faktura.vat ?? null,
      issue_date: faktura.issueDate ?? null,
      due_date: faktura.dueDate ?? null,
      sist_synket_at: naIso,
      updated_at: naIso,
    })
    .eq("id", radId)
    .select(FAKTURA_SELECT)
    .single();
  if (error || !data) {
    console.error("[portal/admin/fiken/faktura/opprett] rad-update feilet", error);
    return null;
  }
  return data as unknown as FakturaDbRow;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<AdminFakturaTilFakturaBody>)
      : {};
  const fakturaId =
    typeof body.fakturaId === "string" ? body.fakturaId.trim() : "";
  if (!fakturaId) {
    return NextResponse.json({ error: "Mangler/ugyldig fakturaId" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  // Before the UUID check: mock-ids («fak-mock-N») are not UUIDs.
  if (portalMockEnabled()) {
    const mocked = await mockFakturaOpprett(fakturaId);
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
    console.error("[portal/admin/fiken/faktura/opprett] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:fiken:faktura:opprett",
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
    console.error("[portal/admin/fiken/faktura/opprett] select feilet", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Fant ikke fakturaen" }, { status: 404 });
  }
  const rad = data as unknown as FakturaDbRow;

  try {
    // Idempotent: allerede faktura → frisk status og svar 200.
    if (rad.fiken_invoice_id) {
      const faktura = await getInvoiceStatus(rad.fiken_invoice_id);
      const oppdatert = await lagreFakturaFelter(supabase, rad.id, faktura);
      if (!oppdatert) {
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
      return NextResponse.json<AdminFakturaEnkeltResponse>({
        faktura: tilFakturaRad(oppdatert),
      });
    }

    if (!rad.fiken_draft_id) {
      return NextResponse.json(
        { error: "Raden har ikke noe Fiken-utkast å fakturere fra ennå." },
        { status: 409 }
      );
    }

    // Avbrutt forrige forsøk? uuid-oppslaget finner fakturaen uten ny POST.
    let faktura = await finnFakturaMedUuid(rad.fiken_uuid);

    if (!faktura) {
      // Fakturanummer-serien må finnes — vi oppretter den ALDRI selv.
      if (!(await fakturaCounterFinnes())) {
        return NextResponse.json(
          {
            error:
              "Fiken mangler fakturanummer-serie for selskapet. Opprett den i " +
              "Fiken (lag første faktura der, eller sett start-nummer under " +
              "faktura-innstillingene) og prøv igjen. Integrasjonen oppretter " +
              "den med vilje ikke selv.",
          },
          { status: 409 }
        );
      }

      const invoiceId = await createInvoiceFromDraft(rad.fiken_draft_id);
      if (invoiceId !== null) {
        faktura = await getInvoiceStatus(invoiceId);
      } else {
        // Location lot seg ikke parse — fakturaen finnes; finn den på uuid.
        console.log(
          "[portal/admin/fiken/faktura/opprett] Location uparselig — uuid-oppslag"
        );
        faktura = await finnFakturaMedUuid(rad.fiken_uuid);
      }
      if (!faktura) {
        // createInvoice svarte 201, men fakturaen lot seg ikke slå opp —
        // raden står med draft-id; synk/nytt forsøk adopterer via uuid.
        console.error(
          `[portal/admin/fiken/faktura/opprett] faktura fra utkast ${rad.fiken_draft_id} (uuid ${rad.fiken_uuid}) lot seg ikke slå opp`
        );
        return NextResponse.json(
          { error: "Fakturaen ble opprettet, men lot seg ikke lese tilbake. Prøv «Synk status»." },
          { status: 502 }
        );
      }
    } else {
      console.log(
        `[portal/admin/fiken/faktura/opprett] uuid ${rad.fiken_uuid} var alt faktura ${faktura.invoiceId} — adoptert`
      );
    }

    const oppdatert = await lagreFakturaFelter(supabase, rad.id, faktura);
    if (!oppdatert) {
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    return NextResponse.json<AdminFakturaEnkeltResponse>({
      faktura: tilFakturaRad(oppdatert),
    });
  } catch (err) {
    if (err instanceof FikenConfigError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof FikenApiError) {
      return NextResponse.json(
        { error: `Fiken svarte ${err.status}. Detaljer i serverloggen.` },
        { status: 502 }
      );
    }
    console.error("[portal/admin/fiken/faktura/opprett] uventet feil", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
}
