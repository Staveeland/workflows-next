import { NextResponse } from "next/server";
import { epostTilbudSendt, lagPortalLenke, sendPortalEpost } from "@/lib/epost";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockAdminTilbud, portalMockEnabled } from "@/lib/portalMock";
import type { AdminTilbudBody, AdminTilbudResponse, PortalTilbud } from "@/lib/portalTypes";
import {
  ADMIN_EMAIL,
  TILBUD_BELOP_MAX_ORE,
  TILBUD_LEVERANSE_MAX,
  TILBUD_MVA_SATSER,
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
 * The CUSTOMER gets an e-post (their quote just landed) — fail-silent,
 * a mail hiccup never fails the save.
 * Auth: user-token pattern + explicit ADMIN_EMAIL check; the admin RLS
 * update policy is what actually lets the write touch other users' rows.
 */

/**
 * All three text fields required (trimmed), hard caps mirror the form.
 * The STRUCTURED price (prisBelopOre/mvaSats) is additive and optional:
 * old clients that never send it keep working, and rows without it keep
 * rendering everywhere. When prisBelopOre is present it must be an integer
 * amount in øre ≥ 0; mvaSats must be a legal rate (defaults to 25).
 */
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
  const ut: PortalTilbud = { tekst, pris, leveranse };
  if (t.prisBelopOre !== undefined && t.prisBelopOre !== null) {
    if (
      typeof t.prisBelopOre !== "number" ||
      !Number.isInteger(t.prisBelopOre) ||
      t.prisBelopOre < 0 ||
      t.prisBelopOre > TILBUD_BELOP_MAX_ORE
    ) {
      return null;
    }
    ut.prisBelopOre = t.prisBelopOre;
    const sats = t.mvaSats === undefined || t.mvaSats === null ? 25 : t.mvaSats;
    if (typeof sats !== "number" || !TILBUD_MVA_SATSER.includes(sats)) {
      return null;
    }
    ut.mvaSats = sats;
  } else if (t.mvaSats !== undefined && t.mvaSats !== null) {
    // A VAT rate without an amount is meaningless — reject loudly rather
    // than store half a structured price.
    return null;
  }
  return ut;
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

  // Statusvakt: et godkjent løp (videre/levert) skal ALDRI regrederes til
  // tilbud_sendt — det skjulte Benken for begge parter og endret et tilbud
  // kunden juridisk har godkjent. DB-triggeren håndhever det samme; guarden
  // her gir et forståelig svar i stedet for en 500.
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
    .in("status", ["forslag_klart", "likt", "tilbud_sendt"])
    .select("id, email, lang");
  if (error) {
    console.error("[portal/admin/tilbud] update failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "Tilbudet er låst — kartleggingen finnes ikke, eller kunden har allerede godkjent." },
      { status: 409 }
    );
  }

  // Tell the customer the quote is on the bench — in THEIR language (the
  // row's lang, stamped at submit). Fail-silent: never fails the save.
  const row = updated[0] as { email: string | null; lang: string | null };
  if (row.email) {
    const lang = row.lang === "en" ? "en" : "no";
    const ep = await sendPortalEpost({
      to: row.email,
      // One-time login deep link — falls back to the plain gate link
      // inside lagPortalLenke (fail-graceful by contract).
      ...epostTilbudSendt(lang, {
        pris: tilbud.pris,
        lenke: await lagPortalLenke(row.email),
      }),
    });
    if (!ep.ok) {
      console.log(`[portal/admin/tilbud] e-post (tilbud sendt) ikke sendt: ${ep.error}`);
    }
  }

  return NextResponse.json<AdminTilbudResponse>({ ok: true });
}
