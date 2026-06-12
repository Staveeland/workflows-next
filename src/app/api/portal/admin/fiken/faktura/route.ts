import { NextResponse } from "next/server";
import {
  createDraftInvoice,
  deleteDraftInvoice,
  ensureContact,
  fikenFeilKort,
  FikenApiError,
  FikenConfigError,
  finnFakturaMedUuid,
  finnUtkastMedUuid,
} from "@/lib/fiken";
import {
  erMvaSats,
  FAKTURA_BESKRIVELSE_MAX,
  FAKTURA_ANTALL_MAX,
  FAKTURA_DAGER_FORFALL_MAX,
  FAKTURA_DAGER_FORFALL_MIN,
  FAKTURA_ENHETSPRIS_ORE_MAX,
  FAKTURA_LINJE_BESKRIVELSE_MAX,
  FAKTURA_LINJER_MAX,
  FAKTURA_REFERANSE_MAX,
  FAKTURA_SELECT,
  FAKTURA_DAGER_FORFALL_DEFAULT,
  regnBelop,
  tilFakturaRad,
  type AdminFakturaForslagResponse,
  type AdminFakturaListeResponse,
  type AdminFakturaOpprettBody,
  type AdminFakturaOpprettResponse,
  type FakturaDbRow,
  type FakturaLinjeInput,
} from "@/lib/fikenTypes";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import {
  mockFakturaUtkast,
  mockFakturaer,
  mockFakturaSlett,
  portalMockEnabled,
} from "@/lib/portalMock";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Fakturaer for et kartlegging-løp — verkstedkontoret.
 *
 * GET ?kartleggingId= — alle fakturaer-rader for løpet, nyeste først
 * (admin ser ALLE inkl. 'utkast'; kunde-RLS skjuler utkast i kundeflaten).
 *
 * POST — oppretter fakturaer-rad (status 'utkast') + Fiken-UTKAST. Aldri
 * en ekte faktura herfra: createInvoice og send er egne ruter bak egne
 * knapper. Admin-UI-et sender EKSPLISITTE linjer/beløp i body (tilbudets
 * pris er fritekst og parses aldri). Beløpene regnes server-side.
 *
 * Idempotens (Fiken har ingen duplikatbeskyttelse — vernet bor her):
 *   1. En halvferdig rad (status 'utkast', uten fiken_draft_id) gjenbrukes
 *      i stedet for å sås på nytt — fiken_uuid er radens idempotensnøkkel.
 *   2. Før POST: GET /invoices?invoiceDraftUuid=<uuid> — ble forrige
 *      forsøk allerede faktura, adopteres den.
 *   3. Før POST: utkastlista sjekkes for uuid-en — finnes utkastet,
 *      adopteres draftId i stedet for å POSTe et duplikat.
 *   4. Kontakt: ALLTID søk (e-post, så orgnr) før opprettelse.
 * Verste utfall ved kræsj midt i: et ekstra UTKAST i Fiken (aldri datatap,
 * aldri endring av eksisterende data).
 *
 * Auth: user-token + ADMIN_EMAIL; fakturaer-skriving går via den bruker-
 * scopede klienten (admin-RLS-policyen bærer den). Service role rører kun
 * fiken_tokens, isolert i fiken.ts.
 */

const RL_GET_MAX = 60;
const RL_POST_MAX = 20;
const RL_WINDOW_MS = 10 * 60_000;

/** Malformede ids ville blitt uuid-cast-feil (22P02 → 500) — svar ærlig. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type KartleggingRad = {
  id: string;
  email: string | null;
  status: string;
  answers: Record<string, unknown> | null;
};

/** Kundenavn til Fiken-kontakten: bedrift → research → e-post. */
function kontaktNavn(k: KartleggingRad): string {
  const answers = k.answers ?? {};
  const bedrift = answers.bedrift;
  if (typeof bedrift === "object" && bedrift !== null && !Array.isArray(bedrift)) {
    const navn = (bedrift as Record<string, unknown>).navn;
    if (typeof navn === "string" && navn.trim()) return navn.trim();
  }
  const research = answers.research;
  if (typeof research === "object" && research !== null && !Array.isArray(research)) {
    const navn = (research as Record<string, unknown>).navn;
    if (typeof navn === "string" && navn.trim()) return navn.trim();
  }
  return k.email ?? "Ukjent kunde";
}

/** Orgnr fra research-funnet — 9 sifre eller ingenting. */
function kontaktOrgnr(k: KartleggingRad): string | null {
  const research = (k.answers ?? {}).research;
  if (typeof research !== "object" || research === null || Array.isArray(research)) {
    return null;
  }
  const orgnr = (research as Record<string, unknown>).orgnr;
  if (typeof orgnr !== "string") return null;
  const rent = orgnr.replace(/\s/g, "");
  return /^\d{9}$/.test(rent) ? rent : null;
}

/** Maks to desimaler — «2,5 timer» er greit, flyttallsstøy er det ikke.
 * Epsilon-sammenligning: 1.1 * 100 er 110.00000000000001 i IEEE 754, og
 * et strengt likhetskrav ville avvist helt gyldige antall. */
function gyldigAntall(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    n > 0 &&
    n <= FAKTURA_ANTALL_MAX &&
    Math.abs(n * 100 - Math.round(n * 100)) < 1e-9
  );
}

function parseLinjer(raw: unknown): FakturaLinjeInput[] | string {
  if (!Array.isArray(raw) || raw.length === 0) {
    return "Minst én fakturalinje kreves.";
  }
  if (raw.length > FAKTURA_LINJER_MAX) {
    return `Maks ${FAKTURA_LINJER_MAX} linjer.`;
  }
  const linjer: FakturaLinjeInput[] = [];
  for (const rawLinje of raw) {
    if (typeof rawLinje !== "object" || rawLinje === null) {
      return "Ugyldig linje.";
    }
    const l = rawLinje as Partial<FakturaLinjeInput>;
    const beskrivelse =
      typeof l.beskrivelse === "string" ? l.beskrivelse.trim() : "";
    if (!beskrivelse || beskrivelse.length > FAKTURA_LINJE_BESKRIVELSE_MAX) {
      return `Hver linje trenger en beskrivelse (≤${FAKTURA_LINJE_BESKRIVELSE_MAX} tegn).`;
    }
    if (!gyldigAntall(l.antall)) {
      return "Ugyldig antall på en linje (større enn 0, maks to desimaler).";
    }
    if (
      typeof l.enhetsprisOre !== "number" ||
      !Number.isInteger(l.enhetsprisOre) ||
      l.enhetsprisOre < 0 ||
      l.enhetsprisOre > FAKTURA_ENHETSPRIS_ORE_MAX
    ) {
      return "Ugyldig enhetspris på en linje (heltall øre).";
    }
    if (!erMvaSats(l.mvaSats)) {
      return "Ugyldig mva-sats på en linje (25, 15, 12 eller 0).";
    }
    linjer.push({
      beskrivelse,
      // Normaliser bort flyttallsstøyen før beløpsregning og Fiken-kall.
      antall: Math.round(l.antall * 100) / 100,
      enhetsprisOre: l.enhetsprisOre,
      mvaSats: l.mvaSats,
    });
  }
  return linjer;
}

/** «YYYY-MM-DD» i dag + n dager — forfallsestimat på utkast-stadiet. */
function isoOmDager(dager: number): string {
  return new Date(Date.now() + dager * 86_400_000).toISOString().slice(0, 10);
}

function fikenFeilTilSvar(err: unknown): NextResponse {
  if (err instanceof FikenConfigError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (err instanceof FikenApiError) {
    // Rå body ligger i loggen; vis et lesbart utdrag til admin også.
    return NextResponse.json(
      { error: `Fiken avviste forespørselen: ${fikenFeilKort(err)}` },
      { status: 502 }
    );
  }
  console.error("[portal/admin/fiken/faktura] uventet feil", err);
  return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
}

/* ── GET ?kartleggingId= — fakturalista for løpet ── */

export async function GET(req: Request) {
  const kartleggingId = new URL(req.url).searchParams.get("kartleggingId");
  if (!kartleggingId) {
    return NextResponse.json({ error: "Mangler kartleggingId" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return NextResponse.json<AdminFakturaListeResponse>(
      await mockFakturaer(kartleggingId)
    );
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/faktura] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();

  const rl = rateLimit({
    key: "portal:admin:fiken:faktura:get",
    identifier: auth.user.id,
    max: RL_GET_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_GET_MAX);

  if (!UUID_RE.test(kartleggingId)) {
    return NextResponse.json({ error: "Fant ikke løpet" }, { status: 404 });
  }

  // ?forslag=1 — autoutfylt utkast fra det godkjente tilbudet.
  if (new URL(req.url).searchParams.get("forslag") === "1") {
    const { data: kart, error: kErr } = await auth.supabase
      .from("kartlegginger")
      .select("tilbud, answers")
      .eq("id", kartleggingId)
      .maybeSingle();
    if (kErr) {
      console.error("[portal/admin/fiken/faktura] forslag-select feilet", kErr);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    return NextResponse.json<AdminFakturaForslagResponse>({
      forslag: byggForslag(kart?.tilbud),
    });
  }

  const { data, error } = await auth.supabase
    .from("fakturaer")
    .select(FAKTURA_SELECT)
    .eq("kartlegging_id", kartleggingId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[portal/admin/fiken/faktura] select feilet", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  return NextResponse.json<AdminFakturaListeResponse>({
    fakturaer: ((data ?? []) as unknown as FakturaDbRow[]).map(tilFakturaRad),
  });
}

/**
 * Autoutfylt fakturaforslag fra det godkjente tilbudet. Har tilbudet
 * strukturert pris (prisBelopOre/mvaSats), lager vi én ferdig linje så
 * Petter bare trykker «Lag utkast». Mangler den, kommer en tom linje med
 * leveransebeskrivelsen som hint.
 */
function byggForslag(tilbud: unknown): AdminFakturaForslagResponse["forslag"] {
  const t =
    tilbud && typeof tilbud === "object"
      ? (tilbud as { prisBelopOre?: unknown; mvaSats?: unknown })
      : null;
  const harPris =
    typeof t?.prisBelopOre === "number" && Number.isFinite(t.prisBelopOre) && t.prisBelopOre > 0;
  const mvaSats = erMvaSats(t?.mvaSats) ? t.mvaSats : 25;
  // Kun forfall og pris autoutfylles — beskrivelse/fakturatekst skriver
  // Petter selv (per ønske).
  return {
    linjer: [{ beskrivelse: "", antall: 1, enhetsprisOre: harPris ? (t!.prisBelopOre as number) : 0, mvaSats }],
    dagerTilForfall: FAKTURA_DAGER_FORFALL_DEFAULT,
    fakturatekst: "",
    varReferanse: "",
    deresReferanse: "",
  };
}

/* ── POST — fakturaer-rad + Fiken-UTKAST ── */

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<AdminFakturaOpprettBody>)
      : {};

  const kartleggingId =
    typeof body.kartleggingId === "string" ? body.kartleggingId.trim() : "";
  if (!kartleggingId) {
    return NextResponse.json({ error: "Mangler kartleggingId" }, { status: 400 });
  }
  const linjer = parseLinjer(body.linjer);
  if (typeof linjer === "string") {
    return NextResponse.json({ error: linjer }, { status: 400 });
  }
  const dager = body.dagerTilForfall;
  if (
    typeof dager !== "number" ||
    !Number.isInteger(dager) ||
    dager < FAKTURA_DAGER_FORFALL_MIN ||
    dager > FAKTURA_DAGER_FORFALL_MAX
  ) {
    return NextResponse.json(
      {
        error: `Dager til forfall må være et heltall ${FAKTURA_DAGER_FORFALL_MIN}–${FAKTURA_DAGER_FORFALL_MAX}.`,
      },
      { status: 400 }
    );
  }
  let fakturatekst: string | null = null;
  if (body.fakturatekst !== undefined && body.fakturatekst !== null) {
    if (
      typeof body.fakturatekst !== "string" ||
      body.fakturatekst.length > FAKTURA_BESKRIVELSE_MAX
    ) {
      return NextResponse.json(
        { error: `Fakturateksten kan være maks ${FAKTURA_BESKRIVELSE_MAX} tegn.` },
        { status: 400 }
      );
    }
    fakturatekst = body.fakturatekst.trim() || null;
  }
  const parseRef = (verdi: unknown): string | null | "ugyldig" => {
    if (verdi === undefined || verdi === null) return null;
    if (typeof verdi !== "string" || verdi.length > FAKTURA_REFERANSE_MAX) return "ugyldig";
    return verdi.trim() || null;
  };
  const varReferanse = parseRef(body.varReferanse);
  const deresReferanse = parseRef(body.deresReferanse);
  if (varReferanse === "ugyldig" || deresReferanse === "ugyldig") {
    return NextResponse.json(
      { error: `Referansene kan være maks ${FAKTURA_REFERANSE_MAX} tegn.` },
      { status: 400 }
    );
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    const mocked = await mockFakturaUtkast(kartleggingId, {
      linjer,
      dagerTilForfall: dager,
      fakturatekst,
    });
    if (!mocked) {
      return NextResponse.json(
        {
          error:
            "Løpet må stå i «videre» eller «levert» (godkjent tilbud) før fakturering.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json<AdminFakturaOpprettResponse>(mocked);
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/faktura] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:fiken:faktura:post",
    identifier: user.id,
    max: RL_POST_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_POST_MAX);

  if (!UUID_RE.test(kartleggingId)) {
    return NextResponse.json({ error: "Fant ikke løpet" }, { status: 404 });
  }

  // Løpet må finnes og stå i «videre» eller «levert» — faktura følger
  // godkjent tilbud (også restfakturering etter levering).
  const { data: kartlegging, error: kartError } = await supabase
    .from("kartlegginger")
    .select("id, email, status, answers")
    .eq("id", kartleggingId)
    .maybeSingle();
  if (kartError) {
    console.error("[portal/admin/fiken/faktura] kartlegging select feilet", kartError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!kartlegging) {
    return NextResponse.json({ error: "Fant ikke løpet" }, { status: 404 });
  }
  const k = kartlegging as KartleggingRad;
  // «levert» er også lov — restfakturering etter levering skal gå.
  if (k.status !== "videre" && k.status !== "levert") {
    return NextResponse.json(
      {
        error:
          "Løpet må stå i «videre» eller «levert» (godkjent tilbud) før fakturering.",
      },
      { status: 409 }
    );
  }

  const belop = regnBelop(linjer);
  const beskrivelse = (
    fakturatekst ?? linjer.map((l) => l.beskrivelse).join("; ")
  ).slice(0, FAKTURA_BESKRIVELSE_MAX);
  const naIso = new Date().toISOString();
  const radFelter = {
    belop_ore: belop.belopOre,
    netto_ore: belop.nettoOre,
    mva_ore: belop.mvaOre,
    beskrivelse,
    // Estimat på utkast-stadiet — Fiken setter fasit ved createInvoice.
    due_date: isoOmDager(dager),
    updated_at: naIso,
  };

  // Idempotens-steg 1: gjenbruk en halvferdig rad fremfor å så en ny —
  // dens fiken_uuid er nøkkelen som finner igjen forrige forsøk i Fiken.
  const { data: halvferdig, error: halvFeil } = await supabase
    .from("fakturaer")
    .select(FAKTURA_SELECT)
    .eq("kartlegging_id", kartleggingId)
    .eq("status", "utkast")
    .is("fiken_draft_id", null)
    .is("fiken_invoice_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (halvFeil) {
    console.error("[portal/admin/fiken/faktura] halvferdig-sjekk feilet", halvFeil);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  let rad: FakturaDbRow;
  if (halvferdig) {
    const { data: oppdatert, error } = await supabase
      .from("fakturaer")
      .update(radFelter)
      .eq("id", (halvferdig as unknown as FakturaDbRow).id)
      .select(FAKTURA_SELECT)
      .single();
    if (error || !oppdatert) {
      console.error("[portal/admin/fiken/faktura] rad-gjenbruk feilet", error);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    rad = oppdatert as unknown as FakturaDbRow;
  } else {
    const { data: ny, error } = await supabase
      .from("fakturaer")
      .insert({ kartlegging_id: kartleggingId, status: "utkast", ...radFelter })
      .select(FAKTURA_SELECT)
      .single();
    if (error || !ny) {
      console.error("[portal/admin/fiken/faktura] rad-insert feilet", error);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    rad = ny as unknown as FakturaDbRow;
  }

  try {
    // Idempotens-steg 2: ble forrige forsøk allerede til FAKTURA?
    const eksisterende = await finnFakturaMedUuid(rad.fiken_uuid);
    if (eksisterende) {
      const { data: adoptert, error } = await supabase
        .from("fakturaer")
        .update({
          fiken_invoice_id: eksisterende.invoiceId,
          invoice_number: eksisterende.invoiceNumber ?? null,
          kid: eksisterende.kid ?? null,
          issue_date: eksisterende.issueDate ?? null,
          due_date: eksisterende.dueDate ?? rad.due_date,
          sist_synket_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rad.id)
        .select(FAKTURA_SELECT)
        .single();
      if (error || !adoptert) {
        console.error("[portal/admin/fiken/faktura] adopsjon feilet", error);
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
      console.log(
        `[portal/admin/fiken/faktura] uuid ${rad.fiken_uuid} var alt faktura ${eksisterende.invoiceId} — adoptert`
      );
      return NextResponse.json<AdminFakturaOpprettResponse>({
        faktura: tilFakturaRad(adoptert as unknown as FakturaDbRow),
      });
    }

    // Idempotens-steg 3: finnes UTKASTET fra et avbrutt forsøk?
    let draftId: number | null = null;
    const utkast = await finnUtkastMedUuid(rad.fiken_uuid);
    if (utkast) {
      draftId = utkast.draftId;
      console.log(
        `[portal/admin/fiken/faktura] uuid ${rad.fiken_uuid} hadde alt utkast ${draftId} — adoptert`
      );
    } else {
      // Steg 4: kontakt — alltid søk (e-post, så orgnr) før POST.
      const customerId = await ensureContact({
        navn: kontaktNavn(k),
        epost: k.email,
        orgnr: kontaktOrgnr(k),
      });
      draftId = await createDraftInvoice({
        customerId,
        uuid: rad.fiken_uuid,
        dagerTilForfall: dager,
        fakturatekst,
        varReferanse,
        deresReferanse,
        linjer,
      });
    }

    const { data: ferdig, error } = await supabase
      .from("fakturaer")
      .update({ fiken_draft_id: draftId, updated_at: new Date().toISOString() })
      .eq("id", rad.id)
      .select(FAKTURA_SELECT)
      .single();
    if (error || !ferdig) {
      // Utkastet FINNES i Fiken; raden er halvferdig — neste POST adopterer
      // det via uuid-en (steg 3). Logg nok til å se det om et halvår.
      console.error(
        `[portal/admin/fiken/faktura] draft ${draftId} laget, men rad-update feilet`,
        error
      );
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    return NextResponse.json<AdminFakturaOpprettResponse>({
      faktura: tilFakturaRad(ferdig as unknown as FakturaDbRow),
    });
  } catch (err) {
    // Raden står igjen som halvferdig 'utkast' uten fiken_draft_id —
    // neste forsøk gjenbruker den (steg 1) i stedet for å duplisere.
    return fikenFeilTilSvar(err);
  }
}

/* ── DELETE — slett et fakturaUTKAST (nettsiden → Fiken) ──
   KUN utkast: en rad som har blitt en ekte faktura (fiken_invoice_id satt)
   nektes (409). Sletter utkastet i Fiken (hvis det finnes der) og fjerner
   raden. Idempotent: et utkast som alt er borte i Fiken (404) håndteres
   som vellykket av deleteDraftInvoice. */
export async function DELETE(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as { fakturaId?: unknown };
  const fakturaId = typeof body.fakturaId === "string" && body.fakturaId.trim() ? body.fakturaId.trim() : null;
  if (!fakturaId || !UUID_RE.test(fakturaId)) {
    return NextResponse.json({ error: "Ugyldig fakturaId" }, { status: 400 });
  }

  // DEV MOCK.
  if (portalMockEnabled()) {
    const ok = await mockFakturaSlett(fakturaId);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Bare utkast kan slettes." }, { status: 409 });
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/faktura] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:fiken:faktura:delete",
    identifier: user.id,
    max: RL_POST_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_POST_MAX);

  const { data, error } = await supabase
    .from("fakturaer")
    .select(FAKTURA_SELECT)
    .eq("id", fakturaId)
    .maybeSingle();
  if (error) {
    console.error("[portal/admin/fiken/faktura] DELETE select feilet", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Fant ikke fakturaen" }, { status: 404 });
  }
  const rad = data as unknown as FakturaDbRow;

  // Hard grense: en ekte/sendt faktura kan ALDRI slettes (verken her eller
  // i Fiken) — kun rene utkast.
  if (rad.fiken_invoice_id !== null || rad.status !== "utkast") {
    return NextResponse.json(
      { error: "Bare utkast kan slettes. En opprettet faktura må eventuelt krediteres i Fiken." },
      { status: 409 }
    );
  }

  // Slett i Fiken først (hvis utkastet faktisk ble lagt der), så raden.
  if (rad.fiken_draft_id !== null) {
    try {
      await deleteDraftInvoice(rad.fiken_draft_id);
    } catch (err) {
      return fikenFeilTilSvar(err);
    }
  }
  const { error: slettFeil } = await supabase.from("fakturaer").delete().eq("id", rad.id);
  if (slettFeil) {
    console.error("[portal/admin/fiken/faktura] rad-sletting feilet", slettFeil);
    return NextResponse.json({ error: "Utkastet ble slettet i Fiken, men raden lot seg ikke fjerne." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
