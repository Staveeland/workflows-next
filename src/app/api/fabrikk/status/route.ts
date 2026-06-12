import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifiserFabrikkSecret } from "@/lib/fabrikk";
import { sendTelegramToPetter } from "@/lib/telegram";
import { rateLimit, tooManyRequests, getClientIp } from "@/lib/rateLimit";
import {
  BYGG_LOGG_MAX,
  type ByggLoggLinje,
  type FabrikkStatusBody,
} from "@/lib/byggTypes";

export const runtime = "nodejs";

/**
 * Fabrikkens telefonlinje hjem.
 *
 * GET ?byggId= — «skal jeg fortsatt bygge?» Fabrikken spør etter
 * angrefristen og før hver dyre fase; svaret {fortsett: boolean} leser
 * kansellert_at. POST — fremdrift og resultater: logglinjer, statusflipp,
 * repo/prosjekt/preview-referanser. Ved status 'klar' pinges Petter på
 * Telegram med lenkene.
 *
 * Auth: X-Fabrikk-Secret (timing-safe). Service role — fabrikk-infrastruktur,
 * aldri kundeflate. Statusmodellen håndheves her (fabrikken kan aldri flippe
 * et stoppet løp tilbake til bygger).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const rl = rateLimit({
    key: "fabrikk:sjekk",
    identifier: getClientIp(req),
    max: 120,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl, 120);

  if (!verifiserFabrikkSecret(req)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }
  const byggId = new URL(req.url).searchParams.get("byggId") ?? "";
  if (!UUID_RE.test(byggId)) {
    return NextResponse.json({ error: "Ugyldig byggId" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("byggeprosjekter")
    .select("id, status, kansellert_at")
    .eq("id", byggId)
    .maybeSingle();
  if (error) {
    console.error("[fabrikk/status] sjekk failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Fant ikke bygget" }, { status: 404 });
  const fortsett =
    data.kansellert_at === null &&
    (data.status === "venter" || data.status === "bygger");
  return NextResponse.json({ fortsett });
}

export async function POST(req: Request) {
  const rl = rateLimit({
    key: "fabrikk:status",
    identifier: getClientIp(req),
    max: 120,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl, 120);

  if (!verifiserFabrikkSecret(req)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<FabrikkStatusBody>;
  const byggId =
    typeof body.byggId === "string" && UUID_RE.test(body.byggId) ? body.byggId : null;
  if (!byggId) {
    return NextResponse.json({ error: "Ugyldig byggId" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: rad, error: selectError } = await supabase
    .from("byggeprosjekter")
    .select("id, kartlegging_id, status, logg, github_repo, preview_url")
    .eq("id", byggId)
    .maybeSingle();
  if (selectError) {
    console.error("[fabrikk/status] select failed", selectError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!rad) return NextResponse.json({ error: "Fant ikke bygget" }, { status: 404 });

  const now = new Date().toISOString();
  const oppdatering: Record<string, unknown> = { updated_at: now };

  // Logglinje (alltid lov, også uten statusflipp).
  if (typeof body.melding === "string" && body.melding.trim()) {
    const logg: ByggLoggLinje[] = Array.isArray(rad.logg)
      ? (rad.logg as ByggLoggLinje[])
      : [];
    logg.push({ tid: now, melding: body.melding.trim().slice(0, 300) });
    oppdatering.logg = logg.slice(-BYGG_LOGG_MAX);
  }

  if (typeof body.githubRepo === "string" && /^[\w.-]+\/[\w.-]+$/.test(body.githubRepo)) {
    oppdatering.github_repo = body.githubRepo;
  }
  if (typeof body.vercelProjectId === "string" && body.vercelProjectId.length < 100) {
    oppdatering.vercel_project_id = body.vercelProjectId;
  }
  if (
    typeof body.previewUrl === "string" &&
    body.previewUrl.startsWith("https://") &&
    body.previewUrl.length < 500
  ) {
    oppdatering.preview_url = body.previewUrl;
    oppdatering.siste_deploy_at = now;
  }
  if (typeof body.commitSha === "string" && /^[0-9a-f]{7,40}$/i.test(body.commitSha)) {
    oppdatering.siste_commit_sha = body.commitSha;
  }
  if (typeof body.nettstedBruker === "string" && body.nettstedBruker.length < 100) {
    oppdatering.nettsted_bruker = body.nettstedBruker;
  }
  if (typeof body.nettstedPassord === "string" && body.nettstedPassord.length < 200) {
    oppdatering.nettsted_passord = body.nettstedPassord;
  }

  // Statusflipp med vakter: et stoppet/ferdig løp kan ikke gjenopplives av
  // en etternølende fabrikk-jobb.
  let nyStatus: string | null = null;
  if (body.status === "bygger" && (rad.status === "venter" || rad.status === "bygger")) {
    nyStatus = "bygger";
  } else if (body.status === "klar" && rad.status === "bygger") {
    nyStatus = "klar";
    oppdatering.ferdig_at = now;
  } else if (body.status === "feilet" && (rad.status === "venter" || rad.status === "bygger")) {
    nyStatus = "feilet";
  } else if (body.status === "stoppet" && (rad.status === "venter" || rad.status === "bygger")) {
    nyStatus = "stoppet";
  }
  if (nyStatus) oppdatering.status = nyStatus;

  const { error: updateError } = await supabase
    .from("byggeprosjekter")
    .update(oppdatering)
    .eq("id", byggId);
  if (updateError) {
    console.error("[fabrikk/status] update failed", updateError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  // Telegram til Petter på de tre øyeblikkene som betyr noe.
  if (nyStatus === "klar") {
    const repo = (oppdatering.github_repo as string) ?? rad.github_repo ?? "";
    const preview = (oppdatering.preview_url as string) ?? rad.preview_url ?? "";
    const tg = await sendTelegramToPetter({
      text: `🏗️ Førsteversjonen er klar! ${preview}\nRepo: https://github.com/${repo}\nÅpne Bygging-fanen i admin for å dele med kunden.`,
    });
    if (!tg.ok) console.log(`[fabrikk/status] Telegram (klar) ikke sendt: ${tg.error}`);
  } else if (nyStatus === "feilet") {
    const tg = await sendTelegramToPetter({
      text: `🧨 Byggefabrikken feilet (bygg ${byggId.slice(0, 8)}…). Se loggen i admin → Bygging.`,
    });
    if (!tg.ok) console.log(`[fabrikk/status] Telegram (feilet) ikke sendt: ${tg.error}`);
  }

  return NextResponse.json({ ok: true });
}
