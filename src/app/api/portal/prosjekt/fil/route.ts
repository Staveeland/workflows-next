import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockProsjektFil, portalMockEnabled } from "@/lib/portalMock";
import type { ProsjektFilBody, ProsjektFilResponse } from "@/lib/portalTypes";
import {
  ADMIN_EMAIL,
  PROSJEKT_FIL_MAX_BYTES,
  PROSJEKT_FIL_TYPER,
} from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * «Benken» — POST /api/portal/prosjekt/fil (customer AND admin).
 *
 * The client uploads DIRECTLY to the private «prosjektfiler» bucket with
 * its own token — the storage policies scope writes to the project folder,
 * so a fabricated path outside it fails RLS. What the policies can NOT do
 * is taste the filename: this route is the gate that turns a user-chosen
 * name into a safe storage path. It validates the extension+declared-MIME
 * allowlist and the size cap, sanitizes the name (no slashes, no control
 * chars, ≤180 chars, extension kept) and answers with the ONE path the
 * client must upload to: "<kartleggingId>/<uuid>-<safeName>".
 *
 * The declared MIME is the browser's word, not proof — the real safety is
 * that every file leaves the portal as a forced download, never inline.
 *
 * NOTE — size + MIME are only DECLARED here; the bytes never pass through
 * this route. The hard enforcement lives on the bucket itself:
 * storage.buckets «prosjektfiler» carries file_size_limit = 26214400
 * (= PROSJEKT_FIL_MAX_BYTES) and allowed_mime_types = the union of
 * PROSJEKT_FIL_TYPER. Keep bucket and allowlist in sync when types move —
 * this route's checks are the friendly UX layer, the bucket is the wall.
 */

// The name cap is 180 here so the row's fil_navn (≤200) keeps headroom.
const FILNAVN_MAX = 180;

const RL_MAX = 30;
const RL_WINDOW_MS = 10 * 60_000;

/** Malformed ids would be uuid cast errors (22P02 → 500) — answer honestly. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function harKontrolltegn(s: string): boolean {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c < 32 || c === 127) return true;
  }
  return false;
}

/**
 * Strip slashes, quotes/semicolons and control characters, refuse
 * hidden/extension-less names, cap at 180 chars with the extension intact.
 * Returns null when nothing sane remains.
 */
function sanitizeFilnavn(raw: string): string | null {
  let navn = "";
  for (const ch of raw) {
    if (ch === "/" || ch === "\\") continue;
    // fil_navn becomes the Content-Disposition filename on the signed
    // download URL — quotes/semicolons could perturb that header. Strip.
    if (ch === '"' || ch === ";") continue;
    if (harKontrolltegn(ch)) continue;
    navn += ch;
  }
  navn = navn.trim().replace(/^\.+/, "");
  const dot = navn.lastIndexOf(".");
  if (dot <= 0 || dot === navn.length - 1) return null;
  const ext = navn.slice(dot + 1).toLowerCase();
  let base = navn.slice(0, dot).trim();
  if (!base) return null;
  const maxBase = FILNAVN_MAX - (ext.length + 1);
  if (maxBase < 1) return null;
  if (base.length > maxBase) {
    base = base.slice(0, maxBase).trimEnd() || "fil";
  }
  return `${base}.${ext}`;
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
      ? (raw as Partial<ProsjektFilBody>)
      : {};

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  const navn = typeof body.navn === "string" ? sanitizeFilnavn(body.navn) : null;
  if (!navn) {
    return NextResponse.json({ error: "Ugyldig filnavn" }, { status: 400 });
  }

  // Allowlist: the extension AND the declared MIME must both match.
  const ext = navn.slice(navn.lastIndexOf(".") + 1);
  const tillattMime = PROSJEKT_FIL_TYPER[ext];
  const mime = typeof body.mime === "string" ? body.mime.trim().toLowerCase() : "";
  if (!tillattMime || !mime || !tillattMime.includes(mime)) {
    return NextResponse.json(
      { error: "Filtypen støttes ikke" },
      { status: 400 }
    );
  }

  const size = body.size;
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Ugyldig filstørrelse" }, { status: 400 });
  }
  if (size > PROSJEKT_FIL_MAX_BYTES) {
    return NextResponse.json(
      { error: "Fila er for stor — maks 25 MB" },
      { status: 400 }
    );
  }

  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<ProsjektFilResponse>(
      await mockProsjektFil(id, navn)
    );
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/prosjekt/fil] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:prosjekt:fil",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }

  // RLS doubles as the ownership check: the owner sees their own row, the
  // admin (admin policies) sees every row — anyone else gets a 404. Only a
  // project that went «videre» has a bench to put files on.
  const { data: row, error: rowError } = await supabase
    .from("kartlegginger")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (rowError) {
    console.error("[portal/prosjekt/fil] row select failed", rowError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke prosjektet" }, { status: 404 });
  }
  if (row.status !== "videre" && user.email !== ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Prosjektet er ikke i gang ennå" },
      { status: 409 }
    );
  }

  // The uuid prefix makes the path unguessable and collision-free; the
  // client must upload to EXACTLY this path with its own token.
  return NextResponse.json<ProsjektFilResponse>({
    path: `${id}/${randomUUID()}-${navn}`,
    navn,
  });
}
