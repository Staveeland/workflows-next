import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  bedriftFraAnswers,
  epostAdminVarsel,
  lagPortalLenke,
  sendPortalEpost,
} from "@/lib/epost";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import {
  mockProsjekt,
  mockProsjektPost,
  mockProsjektSett,
  portalMockEnabled,
} from "@/lib/portalMock";
import type {
  ForesporselStatus,
  PortalStatus,
  ProsjektFaktura,
  ProsjektFakturaStatus,
  ProsjektFeedType,
  ProsjektFilRef,
  ProsjektFra,
  ProsjektInnlegg,
  ProsjektInnleggFil,
  ProsjektPostBody,
  ProsjektPostResponse,
  ProsjektResponse,
} from "@/lib/portalTypes";
import { effektivUke, erBildeFil } from "@/lib/portalTypes";
import {
  PROSJEKT_FIL_TYPER,
  PROSJEKT_FILER_MAX,
  PROSJEKT_FILNAVN_MAX,
  PROSJEKT_TEKST_MAX,
} from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { sendTelegramToPetter } from "@/lib/telegram";

export const runtime = "nodejs";

/**
 * «Benken» — GET + POST /api/portal/prosjekt (the customer side).
 *
 * GET ?id=<kartleggingId>: uke + every innlegg in the project, created_at
 * ascending. Files come back as SIGNED DOWNLOAD URLs (1h, attachment
 * disposition — an uploaded SVG/HTML must never render inline).
 * POST: one customer message (fra=kunde, type=melding — the RLS insert
 * policy enforces the same), optionally with a file reference produced by
 * /api/portal/prosjekt/fil and/or a svarPa pointing at the innlegg it
 * answers. Answering an open workflows-foresporsel flips it to «levert»
 * (the column-granted update — customers can touch nothing else).
 *
 * Auth: the user-token pattern (portalAuth) — RLS scopes every read and
 * write to the owner. No service key, ever.
 */

const SIGNED_URL_TTL_SECONDS = 3600;

// Reads are cheap but each one signs URLs; writes ping Petter's phone.
const RL_GET_MAX = 60;
const RL_POST_MAX = 20;
// The read marker (sett:true) is one row-update, no varsler — roomier cap.
const RL_SETT_MAX = 60;
const RL_WINDOW_MS = 10 * 60_000;

/** Malformed ids would be uuid cast errors (22P02 → 500) — answer honestly. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INNLEGG_TYPER: readonly string[] = [
  "melding",
  "leveranse",
  "foresporsel",
  "status",
  "faktura",
  "milepael",
];

/** fakturaer.status values a customer can ever see (RLS hides «utkast»). */
const FAKTURA_STATUSER: readonly string[] = [
  "sendt",
  "delbetalt",
  "betalt",
  "forfalt",
  "kreditert",
  "kansellert",
];

type InnleggRow = {
  id: string;
  fra: string;
  type: string;
  tekst: string | null;
  lenke: string | null;
  fil_path: string | null;
  fil_navn: string | null;
  /** jsonb array of {path, navn} — new multi-file rows. */
  filer: unknown;
  foresporsel_status: string | null;
  svar_pa: string | null;
  created_at: string;
};

const INNLEGG_SELECT =
  "id, fra, type, tekst, lenke, fil_path, fil_navn, filer, foresporsel_status, svar_pa, created_at";

function harKontrolltegn(s: string): boolean {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c < 32 || c === 127) return true;
  }
  return false;
}

/** The extension (after the last dot) must be a PROSJEKT_FIL_TYPER key. */
function tillattEtternavn(s: string): boolean {
  const dot = s.lastIndexOf(".");
  if (dot <= 0 || dot === s.length - 1) return false;
  return Boolean(PROSJEKT_FIL_TYPER[s.slice(dot + 1).toLowerCase()]);
}

/**
 * Validates a client-supplied file reference: the path MUST sit directly in
 * this project's folder (one path segment, no traversal) and the name must
 * be a sane filename. The storage RLS policy is the real wall — this keeps
 * garbage out of the row. Returns null when absent, "ugyldig" when broken.
 *
 * The type allowlist is re-checked HERE, on both the stored name and the
 * storage path: the /fil route can be skipped entirely (a direct storage
 * upload with the user's own token), so the row gate must hold the line
 * too — never accept an extension outside PROSJEKT_FIL_TYPER. Quotes and
 * semicolons are rejected because fil_navn becomes the Content-Disposition
 * filename on the signed download URL.
 */
function parseFilRef(
  raw: unknown,
  id: string
): ProsjektFilRef | null | "ugyldig" {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object") return "ugyldig";
  const f = raw as Partial<ProsjektFilRef>;
  const path = typeof f.path === "string" ? f.path : "";
  const navn = typeof f.navn === "string" ? f.navn.trim() : "";
  if (!path || !navn) return "ugyldig";
  if (
    navn.length > PROSJEKT_FILNAVN_MAX ||
    navn.includes("/") ||
    navn.includes("\\") ||
    navn.includes('"') ||
    navn.includes(";") ||
    harKontrolltegn(navn)
  ) {
    return "ugyldig";
  }
  if (path.length > 300 || !path.startsWith(`${id}/`)) return "ugyldig";
  const segment = path.slice(id.length + 1);
  if (
    !segment ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("..") ||
    harKontrolltegn(segment)
  ) {
    return "ugyldig";
  }
  if (!tillattEtternavn(navn) || !tillattEtternavn(segment)) return "ugyldig";
  return { path, navn };
}

/**
 * Legacy fil_path/fil_navn + the filer jsonb array, merged into ONE list
 * of storage refs. Old rows keep reading; new rows carry the array.
 */
function radFiler(row: InnleggRow): { path: string; navn: string }[] {
  const ut: { path: string; navn: string }[] = [];
  if (row.fil_path) {
    ut.push({
      path: row.fil_path,
      navn:
        row.fil_navn || row.fil_path.slice(row.fil_path.lastIndexOf("/") + 1),
    });
  }
  if (Array.isArray(row.filer)) {
    for (const f of row.filer as Array<Record<string, unknown>>) {
      if (
        f &&
        typeof f.path === "string" &&
        f.path &&
        typeof f.navn === "string" &&
        f.navn
      ) {
        ut.push({ path: f.path, navn: f.navn });
      }
    }
  }
  return ut;
}

/** DB row → API shape, signing every file as a forced download (1h). */
async function tilInnlegg(
  supabase: SupabaseClient,
  row: InnleggRow,
  loggKilde: string
): Promise<ProsjektInnlegg> {
  const filer: ProsjektInnleggFil[] = [];
  for (const ref of radFiler(row)) {
    const { data: signed, error: signError } = await supabase.storage
      .from("prosjektfiler")
      .createSignedUrl(ref.path, SIGNED_URL_TTL_SECONDS, {
        // Attachment disposition with the human filename — NEVER inline.
        download: ref.navn || true,
      });
    if (signError) {
      // The text still carries the thread — degrade softly (url: null).
      console.error(`[${loggKilde}] signed url failed`, signError);
    }
    filer.push({
      navn: ref.navn,
      url: signed?.signedUrl ?? null,
      // Raster-only preview flag — SVG is deliberately NOT on the list.
      bilde: erBildeFil(ref.navn),
    });
  }
  // Belt and suspenders: the write side validated, but only https leaves.
  const lenke =
    row.lenke && row.lenke.startsWith("https://") ? row.lenke : null;
  return {
    id: row.id,
    fra: (row.fra === "workflows" ? "workflows" : "kunde") as ProsjektFra,
    type: (INNLEGG_TYPER.includes(row.type)
      ? row.type
      : "melding") as ProsjektFeedType,
    tekst: row.tekst ?? "",
    lenke,
    filer,
    foresporselStatus: (row.foresporsel_status ??
      null) as ForesporselStatus | null,
    svarPa: row.svar_pa ?? null,
    createdAt: row.created_at,
  };
}

/* ── GET ?id= — uke + the whole thread, oldest first ── */

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<ProsjektResponse>(await mockProsjekt(id));
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/prosjekt] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:prosjekt:get",
    identifier: user.id,
    max: RL_GET_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_GET_MAX);

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  // Ownership is checked EXPLICITLY (user_id), not via RLS alone: the
  // admin's RLS policies see every row, so without this filter the admin
  // logged into the customer portal could read other customers' rooms.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, uke, godkjent_at, status, kunde_sett_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/prosjekt] row select failed", rowError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  const { data: rows, error: listError } = await supabase
    .from("prosjekt_innlegg")
    .select(INNLEGG_SELECT)
    .eq("kartlegging_id", id)
    .order("created_at", { ascending: true });
  if (listError) {
    console.error("[portal/prosjekt] innlegg select failed", listError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  const innlegg = await Promise.all(
    ((rows ?? []) as InnleggRow[]).map((r) =>
      tilInnlegg(supabase, r, "portal/prosjekt")
    )
  );

  // The invoice panel — RLS filters drafts AND ownership. A hiccup here
  // must not take the whole room down: the feed carries the thread.
  const fakturaer = await hentFakturaer(supabase, id);

  const u = effektivUke(
    (row.godkjent_at ?? null) as string | null,
    typeof row.uke === "number" ? row.uke : null
  );
  return NextResponse.json<ProsjektResponse>({
    uke: u.uke,
    ukeKilde: u.kilde,
    status: row.status as PortalStatus,
    kundeSettAt: (row.kunde_sett_at ?? null) as string | null,
    fakturaer,
    innlegg,
  });
}

/* ── fakturaer → the customer's invoice panel (RLS hides «utkast») ── */

type FakturaRow = {
  id: string;
  invoice_number: number | string | null;
  kid: string | null;
  belop_ore: number | string | null;
  valuta: string | null;
  beskrivelse: string | null;
  issue_date: string | null;
  due_date: string | null;
  status: string;
  settled_at: string | null;
};

async function hentFakturaer(
  supabase: SupabaseClient,
  id: string
): Promise<ProsjektFaktura[]> {
  const { data, error } = await supabase
    .from("fakturaer")
    .select(
      "id, invoice_number, kid, belop_ore, valuta, beskrivelse, issue_date, due_date, status, settled_at"
    )
    .eq("kartlegging_id", id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[portal/prosjekt] faktura select failed", error);
    return [];
  }
  return ((data ?? []) as FakturaRow[])
    .filter((r) => FAKTURA_STATUSER.includes(r.status))
    .map((r) => ({
      id: r.id,
      nummer: r.invoice_number === null ? null : Number(r.invoice_number),
      kid: r.kid ?? null,
      belopOre: r.belop_ore === null ? null : Number(r.belop_ore),
      valuta: r.valuta || "NOK",
      beskrivelse: r.beskrivelse ?? "",
      utstedt: r.issue_date ?? null,
      forfall: r.due_date ?? null,
      betalt: r.settled_at ?? null,
      status: r.status as ProsjektFakturaStatus,
    }));
}

/* ── POST — one customer message into the room ── */

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<ProsjektPostBody>)
      : {};

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  // sett:true — the read marker, not a message. Own flow, no varsler.
  if ((raw as { sett?: unknown }).sett === true) {
    return settLest(req, id);
  }

  const tekst = typeof body.tekst === "string" ? body.tekst.trim() : "";
  if (tekst.length > PROSJEKT_TEKST_MAX) {
    return NextResponse.json({ error: "Meldingen er for lang" }, { status: 400 });
  }
  const fil = parseFilRef(body.fil, id);
  if (fil === "ugyldig") {
    return NextResponse.json({ error: "Ugyldig filreferanse" }, { status: 400 });
  }
  // filer[] — EVERY ref through the same gate as the legacy fil, capped.
  const filer: ProsjektFilRef[] = [];
  if (body.filer !== undefined && body.filer !== null) {
    if (!Array.isArray(body.filer)) {
      return NextResponse.json({ error: "Ugyldig filreferanse" }, { status: 400 });
    }
    if (body.filer.length > PROSJEKT_FILER_MAX) {
      return NextResponse.json(
        { error: `Maks ${PROSJEKT_FILER_MAX} filer per melding` },
        { status: 400 }
      );
    }
    for (const rawRef of body.filer) {
      const ref = parseFilRef(rawRef, id);
      if (ref === "ugyldig" || ref === null) {
        return NextResponse.json(
          { error: "Ugyldig filreferanse" },
          { status: 400 }
        );
      }
      filer.push(ref);
    }
  }
  // Legacy fil + filer[] together must respect the same cap.
  if ((fil ? 1 : 0) + filer.length > PROSJEKT_FILER_MAX) {
    return NextResponse.json(
      { error: `Maks ${PROSJEKT_FILER_MAX} filer per melding` },
      { status: 400 }
    );
  }
  // The contract: tekst (1–4000) OR file(s) — an empty innlegg says nothing.
  if (!tekst && !fil && filer.length === 0) {
    return NextResponse.json(
      { error: "Skriv en melding eller legg ved en fil" },
      { status: 400 }
    );
  }
  const svarPa = typeof body.svarPa === "string" ? body.svarPa.trim() : "";

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<ProsjektPostResponse>(
      await mockProsjektPost(id, {
        tekst,
        fil: fil ?? undefined,
        filer: filer.length ? filer : undefined,
        svarPa: svarPa || undefined,
      })
    );
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/prosjekt] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:prosjekt:post",
    identifier: user.id,
    max: RL_POST_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_POST_MAX);

  if (!UUID_RE.test(id) || (svarPa && !UUID_RE.test(svarPa))) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  // Ownership EXPLICITLY on user_id (admin-RLS ser alle rader — uten dette
  // postet admin-i-kundeportalen inn i andre kunders rom) + the gate: only
  // a project that went «videre» has a bench.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, status, email, answers")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/prosjekt] row select failed", rowError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }
  if (row.status !== "videre") {
    return NextResponse.json(
      { error: "Prosjektet er ikke i gang ennå" },
      { status: 409 }
    );
  }

  // svarPa must point INTO this project — and only a workflows-foresporsel
  // that is still open gets flipped after the insert.
  let svarPaForesporsel = false;
  if (svarPa) {
    const { data: target, error: targetError } = await supabase
      .from("prosjekt_innlegg")
      .select("id, fra, type, foresporsel_status")
      .eq("id", svarPa)
      .eq("kartlegging_id", id)
      .maybeSingle();
    if (targetError) {
      console.error("[portal/prosjekt] svarPa select failed", targetError);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json(
        { error: "Fant ikke innlegget det svares på" },
        { status: 400 }
      );
    }
    svarPaForesporsel =
      target.fra === "workflows" &&
      target.type === "foresporsel" &&
      target.foresporsel_status === "apen";
  }

  // The insert — RLS allows exactly this shape (fra=kunde, type=melding).
  // Legacy fil keeps its columns; filer[] lands as jsonb [{path, navn}].
  const { error: insertError } = await supabase.from("prosjekt_innlegg").insert({
    kartlegging_id: id,
    fra: "kunde",
    type: "melding",
    tekst,
    fil_path: fil?.path ?? null,
    fil_navn: fil?.navn ?? null,
    filer: filer.length
      ? filer.map((f) => ({ path: f.path, navn: f.navn }))
      : null,
    svar_pa: svarPa || null,
  });
  if (insertError) {
    console.error("[portal/prosjekt] insert failed", insertError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  // Flip the answered foresporsel to «levert» — the ONLY update the
  // column grant lets a customer make. A hiccup here must not eat the
  // message that just landed: log and continue.
  if (svarPaForesporsel) {
    const { error: flipError } = await supabase
      .from("prosjekt_innlegg")
      .update({ foresporsel_status: "levert" })
      .eq("id", svarPa);
    if (flipError) {
      console.error("[portal/prosjekt] foresporsel flip failed", flipError);
    }
  }

  // Tell Petter — event only, NEVER the message content (it may hold
  // anything the customer typed). Both pings are fail-silent by contract.
  const kundeEpost = (row.email as string | null) || user.email || "ukjent e-post";
  const tg = await sendTelegramToPetter({
    text: `🪚 Portal: ${kundeEpost} la igjen noe i prosjektrommet.`,
  });
  if (!tg.ok) {
    console.log(`[portal/prosjekt] Telegram not sent (${tg.error})`);
  }
  const adminEp = await sendPortalEpost({
    to: "petter@workflows.no",
    ...epostAdminVarsel("prosjekt", {
      email: kundeEpost,
      bedrift: bedriftFraAnswers(row.answers),
      lenke: await lagPortalLenke("petter@workflows.no", "admin"),
    }),
  });
  if (!adminEp.ok) {
    console.log(`[portal/prosjekt] admin-e-post ikke sendt: ${adminEp.error}`);
  }

  return NextResponse.json<ProsjektPostResponse>({ ok: true });
}

/* ── sett:true — stamp kunde_sett_at = now() with the customer's token ──
   The kartlegging-vakt trigger lets a customer update EXACTLY this column
   without a status transition, and RLS scopes the write to their own row.
   Sent by the client when the reader reaches the bottom of the feed; the
   admin side reads the stamp back as «sett av kunden». No Telegram, no
   e-post — a read marker is not an event. */

async function settLest(req: Request, id: string) {
  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<ProsjektPostResponse>(await mockProsjektSett(id));
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/prosjekt] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:prosjekt:sett",
    identifier: user.id,
    max: RL_SETT_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_SETT_MAX);

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, status, user_id")
    .eq("id", id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/prosjekt] sett row select failed", rowError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }
  // The marker means «the CUSTOMER has seen this». The admin can read any
  // row through their policies — looking must never stamp it on their
  // behalf, so the owner check is explicit, not just RLS-implied.
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }
  // Only a room that exists can be read: videre (running) or levert (log).
  if (row.status !== "videre" && row.status !== "levert") {
    return NextResponse.json(
      { error: "Prosjektet er ikke i gang ennå" },
      { status: 409 }
    );
  }

  const { error: settError } = await supabase
    .from("kartlegginger")
    .update({ kunde_sett_at: new Date().toISOString() })
    .eq("id", id);
  if (settError) {
    console.error("[portal/prosjekt] sett update failed", settError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  return NextResponse.json<ProsjektPostResponse>({ ok: true });
}
