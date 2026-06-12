import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { epostNyttIProsjektet, sendPortalEpost } from "@/lib/epost";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import {
  mockAdminProsjektPost,
  mockProsjekt,
  portalMockEnabled,
} from "@/lib/portalMock";
import type {
  AdminProsjektPostBody,
  AdminProsjektPostResponse,
  ForesporselStatus,
  ProsjektFilRef,
  ProsjektFra,
  ProsjektInnlegg,
  ProsjektInnleggType,
  ProsjektResponse,
} from "@/lib/portalTypes";
import {
  ADMIN_EMAIL,
  PROSJEKT_FIL_TYPER,
  PROSJEKT_FILNAVN_MAX,
  PROSJEKT_LENKE_MAX,
  PROSJEKT_TEKST_MAX,
  PROSJEKT_UKE_MAX,
  PROSJEKT_UKE_MIN,
} from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * «Benken», verkstedkontoret side — GET + POST /api/portal/admin/prosjekt.
 *
 * GET ?id=: the whole thread + uke (same ProsjektResponse shape as the
 * customer route) for the admin detail view.
 * POST: Petter posts into the room (fra=workflows, any type). A
 * «foresporsel» opens as «apen»; an optional uke (1–6) stamps
 * kartlegginger.uke. The CUSTOMER gets a deliberately content-free e-post
 * (event type only — never the message) in the row's language.
 *
 * Auth: user-token pattern + explicit ADMIN_EMAIL check; the admin RLS
 * policies carry the cross-user reads and writes. No service key.
 */

const SIGNED_URL_TTL_SECONDS = 3600;

const RL_MAX = 30;
// Reads mint one signed URL per innlegg — throttled like the customer GET.
const RL_GET_MAX = 60;
const RL_WINDOW_MS = 10 * 60_000;

/** Malformed ids would be uuid cast errors (22P02 → 500) — answer honestly. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INNLEGG_TYPER: readonly ProsjektInnleggType[] = [
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
 * Same file-reference gate as the customer route (path stays in <id>/).
 * The type allowlist is re-checked on BOTH the name and the path segment —
 * the /fil route can be skipped (direct storage upload), so the row gate
 * must hold the allowlist line itself. Quotes/semicolons are rejected
 * because fil_navn becomes the Content-Disposition download filename.
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
 * Links must be plain https, no smuggled credentials, ≤500 chars — parsed
 * with the URL parser, never a regex. Returns the normalized href.
 */
function parseLenke(raw: unknown): string | null | "ugyldig" {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return "ugyldig";
  const lenke = raw.trim();
  if (!lenke) return null;
  if (lenke.length > PROSJEKT_LENKE_MAX) return "ugyldig";
  let url: URL;
  try {
    url = new URL(lenke);
  } catch {
    return "ugyldig";
  }
  if (url.protocol !== "https:") return "ugyldig";
  if (url.username || url.password) return "ugyldig";
  if (url.href.length > PROSJEKT_LENKE_MAX) return "ugyldig";
  return url.href;
}

/** DB row → API shape, signing the file as a forced download (1h). */
async function tilInnlegg(
  supabase: SupabaseClient,
  row: InnleggRow
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
      console.error("[portal/admin/prosjekt] signed url failed", signError);
    }
    filUrl = signed?.signedUrl ?? null;
  }
  const lenke =
    row.lenke && row.lenke.startsWith("https://") ? row.lenke : null;
  return {
    id: row.id,
    fra: (row.fra === "workflows" ? "workflows" : "kunde") as ProsjektFra,
    type: (INNLEGG_TYPER as readonly string[]).includes(row.type)
      ? (row.type as ProsjektInnleggType)
      : "melding",
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

/* ── GET ?id= — the whole thread + uke for the admin detail ── */

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return NextResponse.json<ProsjektResponse>(await mockProsjekt(id));
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/prosjekt] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:prosjekt:get",
    identifier: user.id,
    max: RL_GET_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_GET_MAX);

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, uke")
    .eq("id", id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/admin/prosjekt] row select failed", rowError);
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
    console.error("[portal/admin/prosjekt] innlegg select failed", listError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  const innlegg = await Promise.all(
    ((rows ?? []) as InnleggRow[]).map((r) => tilInnlegg(supabase, r))
  );

  return NextResponse.json<ProsjektResponse>({
    uke: typeof row.uke === "number" ? row.uke : null,
    innlegg,
  });
}

/* ── POST — Petter posts into the room ── */

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<AdminProsjektPostBody>)
      : {};

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }
  const type = body.type;
  if (typeof type !== "string" || !INNLEGG_TYPER.includes(type as ProsjektInnleggType)) {
    return NextResponse.json({ error: "Ugyldig type" }, { status: 400 });
  }
  const tekst = typeof body.tekst === "string" ? body.tekst.trim() : "";
  if (!tekst || tekst.length > PROSJEKT_TEKST_MAX) {
    return NextResponse.json({ error: "Ugyldig tekst" }, { status: 400 });
  }
  const lenke = parseLenke(body.lenke);
  if (lenke === "ugyldig") {
    return NextResponse.json(
      { error: "Lenka må være en gyldig https-adresse" },
      { status: 400 }
    );
  }
  const fil = parseFilRef(body.fil, id);
  if (fil === "ugyldig") {
    return NextResponse.json({ error: "Ugyldig filreferanse" }, { status: 400 });
  }
  let uke: number | null = null;
  if (body.uke !== undefined && body.uke !== null) {
    if (
      typeof body.uke !== "number" ||
      !Number.isInteger(body.uke) ||
      body.uke < PROSJEKT_UKE_MIN ||
      body.uke > PROSJEKT_UKE_MAX
    ) {
      return NextResponse.json({ error: "Ugyldig uke (1–6)" }, { status: 400 });
    }
    uke = body.uke;
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return NextResponse.json<AdminProsjektPostResponse>(
      await mockAdminProsjektPost(id, {
        type: type as ProsjektInnleggType,
        tekst,
        lenke: lenke ?? undefined,
        fil: fil ?? undefined,
        uke: uke ?? undefined,
      })
    );
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/prosjekt] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:admin:prosjekt",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  // Fetch first: 404 honestly, and the notification needs email + lang.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, email, lang")
    .eq("id", id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/admin/prosjekt] row select failed", rowError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("prosjekt_innlegg").insert({
    kartlegging_id: id,
    fra: "workflows",
    type,
    tekst,
    lenke,
    fil_path: fil?.path ?? null,
    fil_navn: fil?.navn ?? null,
    foresporsel_status: type === "foresporsel" ? "apen" : null,
  });
  if (insertError) {
    console.error("[portal/admin/prosjekt] insert failed", insertError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  // Stamp the week on the kartlegging. The innlegg already landed — a
  // hiccup here is logged, not fatal (Petter sees the old week and retries).
  if (uke !== null) {
    const { error: ukeError } = await supabase
      .from("kartlegginger")
      .update({ uke, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (ukeError) {
      console.error("[portal/admin/prosjekt] uke update failed", ukeError);
    }
  }

  // Tell the customer — in THEIR language, content-free by design (the
  // message itself stays behind the login). Fail-silent: a mail hiccup
  // never fails the post.
  const kundeEpost = (row.email ?? null) as string | null;
  if (kundeEpost) {
    const lang = row.lang === "en" ? "en" : "no";
    const ep = await sendPortalEpost({
      to: kundeEpost,
      ...epostNyttIProsjektet(lang, { type: type as ProsjektInnleggType }),
    });
    if (!ep.ok) {
      console.log(
        `[portal/admin/prosjekt] e-post (nytt i prosjektet) ikke sendt: ${ep.error}`
      );
    }
  }

  return NextResponse.json<AdminProsjektPostResponse>({ ok: true });
}
