import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bedriftFraAnswers, epostAdminVarsel, sendPortalEpost } from "@/lib/epost";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockProsjekt, mockProsjektPost, portalMockEnabled } from "@/lib/portalMock";
import type {
  ForesporselStatus,
  ProsjektFilRef,
  ProsjektFra,
  ProsjektInnlegg,
  ProsjektInnleggType,
  ProsjektPostBody,
  ProsjektPostResponse,
  ProsjektResponse,
} from "@/lib/portalTypes";
import { effektivUke } from "@/lib/portalTypes";
import {
  PROSJEKT_FIL_TYPER,
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
const RL_WINDOW_MS = 10 * 60_000;

/** Malformed ids would be uuid cast errors (22P02 → 500) — answer honestly. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INNLEGG_TYPER: readonly string[] = [
  "melding",
  "leveranse",
  "foresporsel",
  "status",
];

type InnleggRow = {
  id: string;
  fra: string;
  type: string;
  tekst: string | null;
  lenke: string | null;
  fil_path: string | null;
  fil_navn: string | null;
  foresporsel_status: string | null;
  svar_pa: string | null;
  created_at: string;
};

const INNLEGG_SELECT =
  "id, fra, type, tekst, lenke, fil_path, fil_navn, foresporsel_status, svar_pa, created_at";

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

/** DB row → API shape, signing the file as a forced download (1h). */
async function tilInnlegg(
  supabase: SupabaseClient,
  row: InnleggRow,
  loggKilde: string
): Promise<ProsjektInnlegg> {
  let filUrl: string | null = null;
  if (row.fil_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from("prosjektfiler")
      .createSignedUrl(row.fil_path, SIGNED_URL_TTL_SECONDS, {
        // Attachment disposition with the human filename — NEVER inline.
        download: row.fil_navn || true,
      });
    if (signError) {
      // The text still carries the thread — degrade softly.
      console.error(`[${loggKilde}] signed url failed`, signError);
    }
    filUrl = signed?.signedUrl ?? null;
  }
  // Belt and suspenders: the write side validated, but only https leaves.
  const lenke =
    row.lenke && row.lenke.startsWith("https://") ? row.lenke : null;
  return {
    id: row.id,
    fra: (row.fra === "workflows" ? "workflows" : "kunde") as ProsjektFra,
    type: (INNLEGG_TYPER.includes(row.type)
      ? row.type
      : "melding") as ProsjektInnleggType,
    tekst: row.tekst ?? "",
    lenke,
    filUrl,
    filNavn: row.fil_navn ?? null,
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

  // The kartlegging row doubles as the ownership check (RLS hides other
  // users' rows) and carries uke.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, uke, godkjent_at")
    .eq("id", id)
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

  const u = effektivUke(
    (row.godkjent_at ?? null) as string | null,
    typeof row.uke === "number" ? row.uke : null
  );
  return NextResponse.json<ProsjektResponse>({
    uke: u.uke,
    ukeKilde: u.kilde,
    innlegg,
  });
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
  const tekst = typeof body.tekst === "string" ? body.tekst.trim() : "";
  if (tekst.length > PROSJEKT_TEKST_MAX) {
    return NextResponse.json({ error: "Meldingen er for lang" }, { status: 400 });
  }
  const fil = parseFilRef(body.fil, id);
  if (fil === "ugyldig") {
    return NextResponse.json({ error: "Ugyldig filreferanse" }, { status: 400 });
  }
  // The contract: tekst (1–4000) OR a file — an empty innlegg says nothing.
  if (!tekst && !fil) {
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

  // Ownership (RLS) + the gate: only a project that went «videre» has a
  // bench. The RLS insert policy enforces the same — this answers honestly.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, status, email, answers")
    .eq("id", id)
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
  const { error: insertError } = await supabase.from("prosjekt_innlegg").insert({
    kartlegging_id: id,
    fra: "kunde",
    type: "melding",
    tekst,
    fil_path: fil?.path ?? null,
    fil_navn: fil?.navn ?? null,
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
    }),
  });
  if (!adminEp.ok) {
    console.log(`[portal/prosjekt] admin-e-post ikke sendt: ${adminEp.error}`);
  }

  return NextResponse.json<ProsjektPostResponse>({ ok: true });
}
