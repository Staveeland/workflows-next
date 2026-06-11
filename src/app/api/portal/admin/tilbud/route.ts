import { NextResponse } from "next/server";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockAdminTilbud, portalMockEnabled } from "@/lib/portalMock";
import type { AdminTilbudBody, AdminTilbudResponse, PortalTilbud } from "@/lib/portalTypes";
import {
  ADMIN_EMAIL,
  TILBUD_LEVERANSE_MAX,
  TILBUD_PRIS_MAX,
  TILBUD_TEKST_MAX,
} from "@/lib/portalTypes";

export const runtime = "nodejs";

/**
 * Verkstedkontoret — POST /api/portal/admin/tilbud.
 *
 * Petter writes the quote by hand; this stamps it onto the row:
 * tilbud (jsonb), tilbud_sendt_at, status='tilbud_sendt'. Re-posting
 * updates the quote in place (the form says «Oppdater tilbud»).
 *
 * No Telegram here — Petter is the actor, pinging himself would be noise.
 * Auth: user-token pattern + explicit ADMIN_EMAIL check; the admin RLS
 * update policy is what actually lets the write touch other users' rows.
 */

/** All three fields required (trimmed), hard caps mirror the form. */
function parseTilbud(raw: unknown): PortalTilbud | null {
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as Partial<PortalTilbud>;
  const tekst = typeof t.tekst === "string" ? t.tekst.trim() : "";
  const pris = typeof t.pris === "string" ? t.pris.trim() : "";
  const leveranse = typeof t.leveranse === "string" ? t.leveranse.trim() : "";
  if (!tekst || !pris || !leveranse) return null;
  if (
    tekst.length > TILBUD_TEKST_MAX ||
    pris.length > TILBUD_PRIS_MAX ||
    leveranse.length > TILBUD_LEVERANSE_MAX
  ) {
    return null;
  }
  return { tekst, pris, leveranse };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<AdminTilbudBody>;
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;
  const tilbud = parseTilbud(body.tilbud);
  if (!id || !tilbud) {
    return NextResponse.json({ error: "Ugyldig tilbud" }, { status: 400 });
  }

  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    const mocked = await mockAdminTilbud(id, tilbud);
    if (!mocked) {
      return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
    }
    return NextResponse.json<AdminTilbudResponse>(mocked);
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/tilbud] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();
  const { supabase } = auth;

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("kartlegginger")
    .update({
      tilbud,
      tilbud_sendt_at: now,
      status: "tilbud_sendt",
      updated_at: now,
    })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[portal/admin/tilbud] update failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  return NextResponse.json<AdminTilbudResponse>({ ok: true });
}
