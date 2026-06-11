import { NextResponse } from "next/server";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockAdminDetalj, mockAdminListe, portalMockEnabled } from "@/lib/portalMock";
import type {
  AdminDetaljResponse,
  AdminListeResponse,
  PortalAnbefaling,
  PortalAssessment,
  PortalStatus,
  PortalTilbud,
} from "@/lib/portalTypes";
import { ADMIN_EMAIL } from "@/lib/portalTypes";

export const runtime = "nodejs";

/**
 * Verkstedkontoret — GET /api/portal/admin/liste.
 *
 * Without ?id: ALL kartlegginger, trimmed for the list, created_at desc.
 * With ?id=<uuid>: ONE full row + a 1h signed mockup URL — the detail view
 * reuses this route instead of a separate admin/kartlegging endpoint (one
 * door into the same RLS-guarded table is enough).
 *
 * Auth: the user-token pattern (portalAuth) + an explicit ADMIN_EMAIL check.
 * The admin RLS policies (is_portal_admin()) carry the cross-user select;
 * a non-admin token would see zero rows even if this check were bypassed.
 */

const SIGNED_URL_TTL_SECONDS = 3600;

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
    // A malformed id would be a uuid cast error (22P02 → 500) — answer the
    // honest «finnes ikke» instead.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json<AdminDetaljResponse>({ kartlegging: null });
    }
    const { data: row, error } = await supabase
      .from("kartlegginger")
      .select(
        "id, status, email, answers, assessment, mockup_path, tilbud, tilbud_sendt_at, created_at"
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
        createdAt: row.created_at as string,
      },
    });
  }

  /* ── The list — trimmed rows, no signed URLs (the list shows none) ── */
  const { data: rows, error } = await supabase
    .from("kartlegginger")
    .select("id, status, email, answers, assessment, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[portal/admin/liste] list select failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
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
      };
    }),
  });
}
