import { NextResponse } from "next/server";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import {
  mockAdminDetalj,
  mockAdminListe,
  mockAdminSlett,
  portalMockEnabled,
} from "@/lib/portalMock";
import type {
  AdminDetaljResponse,
  AdminListeResponse,
  AdminSlettResponse,
  PortalAnbefaling,
  PortalAssessment,
  PortalStatus,
  PortalTilbud,
} from "@/lib/portalTypes";
import { ADMIN_EMAIL } from "@/lib/portalTypes";

export const runtime = "nodejs";

/**
 * Verkstedkontoret — GET + DELETE /api/portal/admin/liste.
 *
 * GET without ?id: ALL kartlegginger, trimmed for the list, created_at desc.
 * GET with ?id=<uuid>: ONE full row + a 1h signed mockup URL — the detail
 * view reuses this route instead of a separate admin/kartlegging endpoint
 * (one door into the same RLS-guarded table is enough).
 * DELETE with ?id=<uuid>: removes the mockup storage object (when set),
 * then the row — same one door.
 *
 * Auth: the user-token pattern (portalAuth) + an explicit ADMIN_EMAIL check.
 * The admin RLS policies (is_portal_admin()) carry the cross-user select
 * and delete; a non-admin token would see zero rows even if this check
 * were bypassed.
 */

const SIGNED_URL_TTL_SECONDS = 3600;

/** Malformed ids would be uuid cast errors (22P02 → 500) — answer honestly. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bedriftNavnOf(answers: unknown): string | null {
  if (typeof answers !== "object" || answers === null) return null;
  const a = answers as Record<string, unknown>;
  for (const key of ["bedrift", "research"]) {
    const source = a[key];
    if (typeof source !== "object" || source === null) continue;
    const navn = (source as Record<string, unknown>).navn;
    if (typeof navn === "string" && navn.trim()) return navn.trim();
  }
  return null;
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return id
      ? NextResponse.json<AdminDetaljResponse>(await mockAdminDetalj(id))
      : NextResponse.json<AdminListeResponse>(await mockAdminListe());
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/liste] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase } = auth;

  /* ── ?id= — one full row + signed mockup URL ── */
  if (id) {
    if (!UUID_RE.test(id)) {
      return NextResponse.json<AdminDetaljResponse>({ kartlegging: null });
    }
    const { data: row, error } = await supabase
      .from("kartlegginger")
      .select(
        "id, status, email, answers, assessment, mockup_path, tilbud, tilbud_sendt_at, godkjent_at, created_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[portal/admin/liste] detail select failed", error);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json<AdminDetaljResponse>({ kartlegging: null });
    }

    let mockupUrl: string | null = null;
    if (row.mockup_path) {
      const { data: signed, error: signError } = await supabase.storage
        .from("mockups")
        .createSignedUrl(row.mockup_path as string, SIGNED_URL_TTL_SECONDS);
      if (signError) {
        // The answers + assessment are the point — degrade softly.
        console.error("[portal/admin/liste] signed url failed", signError);
      }
      mockupUrl = signed?.signedUrl ?? null;
    }

    // Opening the detail counts as «sett» — the list's NYTT-tag clears.
    // Fire-and-forget: a failed stamp only means the tag lingers.
    void supabase
      .from("kartlegginger")
      .update({ admin_sett_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error: settError }) => {
        if (settError) {
          console.error("[portal/admin/liste] admin_sett_at failed", settError);
        }
      });

    return NextResponse.json<AdminDetaljResponse>({
      kartlegging: {
        id: row.id as string,
        status: row.status as PortalStatus,
        email: (row.email ?? "") as string,
        answers: (row.answers ?? {}) as Record<string, unknown>,
        assessment: (row.assessment ?? null) as PortalAssessment | null,
        mockupUrl,
        tilbud: (row.tilbud ?? null) as PortalTilbud | null,
        tilbudSendtAt: (row.tilbud_sendt_at ?? null) as string | null,
        godkjentAt: (row.godkjent_at ?? null) as string | null,
        createdAt: row.created_at as string,
      },
    });
  }

  /* ── The list — trimmed rows, no signed URLs (the list shows none) ── */
  const { data: rows, error } = await supabase
    .from("kartlegginger")
    .select("id, status, email, answers, assessment, created_at, liked_at, godkjent_at, admin_sett_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[portal/admin/liste] list select failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  // Latest customer post per project — one aggregate query (admin RLS
  // sees all rows). Used for the NYTT FRA KUNDE-tag.
  const sisteKunde = new Map<string, number>();
  const { data: kundeInnlegg, error: innleggError } = await supabase
    .from("prosjekt_innlegg")
    .select("kartlegging_id, created_at")
    .eq("fra", "kunde")
    .order("created_at", { ascending: false });
  if (innleggError) {
    // The tag is a convenience — the list itself must never fail on it.
    console.error("[portal/admin/liste] kunde-innlegg select failed", innleggError);
  }
  for (const r of kundeInnlegg ?? []) {
    const kid = r.kartlegging_id as string;
    if (!sisteKunde.has(kid)) sisteKunde.set(kid, Date.parse(r.created_at as string));
  }

  return NextResponse.json<AdminListeResponse>({
    kartlegginger: (rows ?? []).map((row) => {
      const assessment = row.assessment as PortalAssessment | null;
      return {
        id: row.id as string,
        createdAt: row.created_at as string,
        email: (row.email ?? "") as string,
        bedriftNavn: bedriftNavnOf(row.answers),
        anbefaling: (assessment?.anbefaling ?? null) as PortalAnbefaling | null,
        status: row.status as PortalStatus,
        nyttFraKunde: harNyttFraKunde(row, sisteKunde),
      };
    }),
  });
}

/** Any customer activity newer than the admin's last look? */
function harNyttFraKunde(
  row: Record<string, unknown>,
  sisteKunde: Map<string, number>
): boolean {
  const sett = row.admin_sett_at ? Date.parse(row.admin_sett_at as string) : 0;
  const kandidater = [
    sisteKunde.get(row.id as string) ?? 0,
    row.liked_at ? Date.parse(row.liked_at as string) : 0,
    row.godkjent_at ? Date.parse(row.godkjent_at as string) : 0,
  ];
  return Math.max(...kandidater) > sett;
}

/* ── DELETE ?id= — mockup object first, then the row ── */

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    const mocked = await mockAdminSlett(id);
    if (!mocked) {
      return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
    }
    return NextResponse.json<AdminSlettResponse>(mocked);
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/liste] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase } = auth;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  // Fetch the row first for its mockup_path — the storage object must not
  // be orphaned behind a deleted row.
  const { data: row, error: selectError } = await supabase
    .from("kartlegginger")
    .select("id, mockup_path")
    .eq("id", id)
    .maybeSingle();
  if (selectError) {
    console.error("[portal/admin/liste] delete select failed", selectError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  // Storage first; a storage hiccup must not block the row delete — a
  // stray object is cheaper than a row Petter can't get rid of.
  if (row.mockup_path) {
    const { error: removeError } = await supabase.storage
      .from("mockups")
      .remove([row.mockup_path as string]);
    if (removeError) {
      console.error("[portal/admin/liste] mockup remove failed", removeError);
    }
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("kartlegginger")
    .delete()
    .eq("id", id)
    .select("id");
  if (deleteError) {
    console.error("[portal/admin/liste] delete failed", deleteError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    // The select saw the row but the delete touched nothing — RLS swallowed
    // it (missing admin delete policy). A server problem, not a 404.
    console.error("[portal/admin/liste] delete affected 0 rows", { id });
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  return NextResponse.json<AdminSlettResponse>({ ok: true });
}
