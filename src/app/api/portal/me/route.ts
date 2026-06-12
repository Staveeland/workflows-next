import { NextResponse } from "next/server";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockMe, portalMockEnabled } from "@/lib/portalMock";
import type {
  PortalAssessment,
  PortalMeResponse,
  PortalStatus,
  PortalTilbud,
} from "@/lib/portalTypes";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 3600;

// A row stuck in «genererer» (function killed at maxDuration before the
// feilet-fallback could run) must not trap the client on the generating
// screen forever: older than this ⇒ report (and persist) «feilet» so the
// error screen with its retry button becomes reachable.
const STALE_GENERATING_MS = 3 * 60_000;

export async function GET(req: Request) {
  // DEV MOCK — everything fake lives in portalMock.ts.
  if (portalMockEnabled()) {
    return NextResponse.json<PortalMeResponse>(await mockMe());
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/me] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase } = auth;

  // Latest row for this user — RLS scopes the select to the owner.
  const { data: row, error } = await supabase
    .from("kartlegginger")
    .select(
      "id, status, answers, assessment, mockup_path, created_at, tilbud, tilbud_sendt_at, godkjent_at, uke"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[portal/me] select failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json<PortalMeResponse>({ kartlegging: null });
  }

  let status = row.status as PortalStatus;
  if (
    (status === "genererer" || status === "innsendt") &&
    Date.now() - Date.parse(row.created_at as string) > STALE_GENERATING_MS
  ) {
    status = "feilet";
    // Best effort write-back so every isolate agrees from now on.
    const { error: staleError } = await supabase
      .from("kartlegginger")
      .update({ status: "feilet", updated_at: new Date().toISOString() })
      .eq("id", row.id as string);
    if (staleError) {
      console.error("[portal/me] stale write-back failed", staleError);
    }
  }

  let mockupUrl: string | null = null;
  if (row.mockup_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from("mockups")
      .createSignedUrl(row.mockup_path as string, SIGNED_URL_TTL_SECONDS);
    if (signError) {
      // The proposal text is still useful without the image — degrade softly.
      console.error("[portal/me] signed url failed", signError);
    }
    mockupUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json<PortalMeResponse>({
    kartlegging: {
      id: row.id as string,
      status,
      answers: (row.answers ?? {}) as Record<string, unknown>,
      assessment: (row.assessment ?? null) as PortalAssessment | null,
      mockupUrl,
      createdAt: row.created_at as string,
      tilbud: (row.tilbud ?? null) as PortalTilbud | null,
      tilbudSendtAt: (row.tilbud_sendt_at ?? null) as string | null,
      godkjentAt: (row.godkjent_at ?? null) as string | null,
      uke: typeof row.uke === "number" ? row.uke : null,
    },
  });
}
