import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  epostNyttIProsjektet,
  lagPortalLenke,
  sendPortalEpost,
} from "@/lib/epost";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import {
  BYGG_LOGG_MAX,
  type AdminBygg,
  type AdminByggBody,
  type AdminByggResponse,
  type ByggLoggLinje,
  type ByggStatus,
} from "@/lib/byggTypes";
import { dispatchFabrikk, hentSisteDeploy } from "@/lib/fabrikk";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Byggefabrikken, verkstedkontoret side — GET/POST /api/portal/admin/bygg.
 *
 * GET ?kartleggingId=: byggeløpet for et kundeløp, med ferskt deploy-oppslag
 * mot Vercel når prosjektet finnes (portalen viser alltid siste utgave).
 * POST {kartleggingId, handling}:
 *   autobygg — slå på/av «bygg automatisk når kunden godkjenner»
 *   start    — start bygget nå (angrefrist 0 — Petter trykket selv)
 *   stopp    — kanseller (fabrikken sjekker flagget før hver fase)
 *   del      — del forhåndsvisningen med kunden (leveranse-innlegg + e-post)
 *
 * Auth: user-token + hard ADMIN_EMAIL-sjekk; admin-RLS bærer skrivingene.
 * Fabrikkens egne oppdateringer kommer via /api/fabrikk/status (service
 * role bak delt hemmelighet) — aldri her.
 */

const RL_MAX = 30;
const RL_WINDOW_MS = 10 * 60_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Rad = {
  id: string;
  kartlegging_id: string;
  status: ByggStatus;
  autobygg: boolean;
  github_repo: string | null;
  vercel_project_id: string | null;
  preview_url: string | null;
  siste_commit_sha: string | null;
  siste_deploy_at: string | null;
  logg: unknown;
  delt_med_kunde_at: string | null;
  startet_at: string | null;
  ferdig_at: string | null;
};

const RAD_SELECT =
  "id, kartlegging_id, status, autobygg, github_repo, vercel_project_id, preview_url, siste_commit_sha, siste_deploy_at, logg, delt_med_kunde_at, startet_at, ferdig_at";

function tilLogg(raw: unknown): ByggLoggLinje[] {
  if (!Array.isArray(raw)) return [];
  const ut: ByggLoggLinje[] = [];
  for (const l of raw as Array<Record<string, unknown>>) {
    if (l && typeof l.tid === "string" && typeof l.melding === "string") {
      ut.push({ tid: l.tid, melding: l.melding });
    }
  }
  return ut.slice(-BYGG_LOGG_MAX);
}

function tilAdminBygg(rad: Rad): AdminBygg {
  return {
    id: rad.id,
    kartleggingId: rad.kartlegging_id,
    status: rad.status,
    autobygg: rad.autobygg,
    githubRepo: rad.github_repo,
    githubUrl: rad.github_repo ? `https://github.com/${rad.github_repo}` : null,
    previewUrl: rad.preview_url,
    sisteCommitSha: rad.siste_commit_sha,
    sisteDeployAt: rad.siste_deploy_at,
    deltMedKundeAt: rad.delt_med_kunde_at,
    startetAt: rad.startet_at,
    ferdigAt: rad.ferdig_at,
    logg: tilLogg(rad.logg),
  };
}

async function adminAuth(req: Request) {
  const auth = await portalAuth(req);
  if (!auth) return { feil: unauthorized() } as const;
  if (auth.user.email !== ADMIN_EMAIL) return { feil: forbidden() } as const;
  return { auth } as const;
}

async function loggFør(
  supabase: SupabaseClient,
  rad: Rad,
  melding: string
): Promise<ByggLoggLinje[]> {
  const logg = tilLogg(rad.logg);
  logg.push({ tid: new Date().toISOString(), melding });
  return logg.slice(-BYGG_LOGG_MAX);
}

export async function GET(req: Request) {
  const gate = await adminAuth(req);
  if ("feil" in gate) return gate.feil;
  const { supabase, user } = gate.auth;

  const rl = rateLimit({
    key: "admin:bygg:get",
    identifier: user.id,
    max: 60,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, 60);

  const kartleggingId = new URL(req.url).searchParams.get("kartleggingId") ?? "";
  if (!UUID_RE.test(kartleggingId)) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("byggeprosjekter")
    .select(RAD_SELECT)
    .eq("kartlegging_id", kartleggingId)
    .maybeSingle();
  if (error) {
    console.error("[admin/bygg] select failed", error);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!data) return NextResponse.json<AdminByggResponse>({ bygg: null });

  let rad = data as Rad;

  // Ferskt deploy-oppslag — Petter kan ha pushet selv utenfor portalen.
  if (rad.vercel_project_id && (rad.status === "klar" || rad.status === "delt")) {
    const deploy = await hentSisteDeploy(rad.vercel_project_id);
    if (
      deploy &&
      (deploy.sha !== rad.siste_commit_sha || deploy.url !== rad.preview_url)
    ) {
      const { data: oppdatert } = await supabase
        .from("byggeprosjekter")
        .update({
          preview_url: deploy.url,
          siste_commit_sha: deploy.sha,
          siste_deploy_at: deploy.readyAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rad.id)
        .select(RAD_SELECT)
        .maybeSingle();
      if (oppdatert) rad = oppdatert as Rad;
    }
  }

  return NextResponse.json<AdminByggResponse>({ bygg: tilAdminBygg(rad) });
}

export async function POST(req: Request) {
  const gate = await adminAuth(req);
  if ("feil" in gate) return gate.feil;
  const { supabase, user } = gate.auth;

  const rl = rateLimit({
    key: "admin:bygg:post",
    identifier: user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<AdminByggBody>;
  const kartleggingId =
    typeof body.kartleggingId === "string" && UUID_RE.test(body.kartleggingId)
      ? body.kartleggingId
      : null;
  const handling = body.handling;
  if (
    !kartleggingId ||
    (handling !== "start" && handling !== "stopp" && handling !== "del" && handling !== "autobygg")
  ) {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  // Byggelinjen gjelder kun godkjente løp (videre/levert) — bortsett fra
  // autobygg-bryteren, som settes FØR kunden godkjenner.
  const { data: kart, error: kartError } = await supabase
    .from("kartlegginger")
    .select("id, status, email, lang")
    .eq("id", kartleggingId)
    .maybeSingle();
  if (kartError) {
    console.error("[admin/bygg] kartlegging select failed", kartError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!kart) {
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }

  // Hent (eller opprett) byggeraden.
  const { data: eksisterende, error: byggError } = await supabase
    .from("byggeprosjekter")
    .select(RAD_SELECT)
    .eq("kartlegging_id", kartleggingId)
    .maybeSingle();
  if (byggError) {
    console.error("[admin/bygg] bygg select failed", byggError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }

  const now = new Date().toISOString();

  if (handling === "autobygg") {
    const autobygg = body.autobygg === true;
    if (eksisterende) {
      const { error } = await supabase
        .from("byggeprosjekter")
        .update({ autobygg, updated_at: now })
        .eq("id", (eksisterende as Rad).id);
      if (error) {
        console.error("[admin/bygg] autobygg update failed", error);
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("byggeprosjekter")
        .insert({ kartlegging_id: kartleggingId, autobygg });
      if (error) {
        console.error("[admin/bygg] autobygg insert failed", error);
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
    }
    return hentOgSvar(supabase, kartleggingId);
  }

  if (kart.status !== "videre" && kart.status !== "levert") {
    return NextResponse.json(
      { error: "Byggelinjen åpner når kunden har godkjent tilbudet." },
      { status: 409 }
    );
  }

  if (handling === "start") {
    const rad = eksisterende as Rad | null;
    if (rad && (rad.status === "venter" || rad.status === "bygger")) {
      return NextResponse.json({ error: "Bygget er allerede i gang." }, { status: 409 });
    }
    if (rad && (rad.status === "klar" || rad.status === "delt")) {
      return NextResponse.json(
        { error: "Førsteversjonen er allerede bygget — jobb videre i repoet, portalen følger med." },
        { status: 409 }
      );
    }
    let byggId: string;
    if (rad) {
      const logg = await loggFør(supabase, rad, "Manuell start fra verkstedkontoret");
      const { data: oppdatert, error } = await supabase
        .from("byggeprosjekter")
        .update({
          status: "venter",
          startet_at: now,
          kansellert_at: null,
          ferdig_at: null,
          logg,
          updated_at: now,
        })
        .eq("id", rad.id)
        .in("status", ["ikke_startet", "stoppet", "feilet"])
        .select("id");
      if (error || !oppdatert || oppdatert.length === 0) {
        console.error("[admin/bygg] start update failed", error);
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
      byggId = rad.id;
    } else {
      const { data: ny, error } = await supabase
        .from("byggeprosjekter")
        .insert({
          kartlegging_id: kartleggingId,
          status: "venter",
          startet_at: now,
          logg: [{ tid: now, melding: "Manuell start fra verkstedkontoret" }],
        })
        .select("id")
        .single();
      if (error || !ny) {
        console.error("[admin/bygg] start insert failed", error);
        return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
      }
      byggId = ny.id as string;
    }
    const dispatch = await dispatchFabrikk({ byggId, kartleggingId, graceSeconds: 0 });
    if (!dispatch.ok) {
      await supabase
        .from("byggeprosjekter")
        .update({ status: "feilet", updated_at: new Date().toISOString() })
        .eq("id", byggId);
      return NextResponse.json({ error: dispatch.error }, { status: 502 });
    }
    return hentOgSvar(supabase, kartleggingId);
  }

  if (handling === "stopp") {
    const rad = eksisterende as Rad | null;
    if (!rad || (rad.status !== "venter" && rad.status !== "bygger")) {
      return NextResponse.json({ error: "Det er ikke noe bygg å stoppe." }, { status: 409 });
    }
    const logg = await loggFør(supabase, rad, "Stoppet fra verkstedkontoret");
    const { error } = await supabase
      .from("byggeprosjekter")
      .update({ status: "stoppet", kansellert_at: now, logg, updated_at: now })
      .eq("id", rad.id)
      .in("status", ["venter", "bygger"]);
    if (error) {
      console.error("[admin/bygg] stopp failed", error);
      return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
    }
    return hentOgSvar(supabase, kartleggingId);
  }

  // handling === "del" — forhåndsvisningen ut til kunden som leveranse.
  const rad = eksisterende as Rad | null;
  if (!rad || !rad.preview_url || (rad.status !== "klar" && rad.status !== "delt")) {
    return NextResponse.json(
      { error: "Ingen ferdig forhåndsvisning å dele ennå." },
      { status: 409 }
    );
  }
  const logg = await loggFør(supabase, rad, "Forhåndsvisningen delt med kunden");
  const { error: delError } = await supabase
    .from("byggeprosjekter")
    .update({ status: "delt", delt_med_kunde_at: now, logg, updated_at: now })
    .eq("id", rad.id);
  if (delError) {
    console.error("[admin/bygg] del failed", delError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  // Leveranse-innlegg i prosjektrommet (admin-RLS) + samme e-post som andre
  // leveranser — kunden møter lenken der samtalen allerede bor.
  const { error: innleggError } = await supabase.from("prosjekt_innlegg").insert({
    kartlegging_id: kartleggingId,
    fra: "workflows",
    type: "leveranse",
    tekst:
      kart.lang === "en"
        ? "First version of your solution is live — have a look, and tell us what you think."
        : "Førsteversjonen av løsningen din er live — ta en titt, og si hva du tenker.",
    lenke: rad.preview_url,
  });
  if (innleggError) {
    console.error("[admin/bygg] leveranse-innlegg failed", innleggError);
  }
  if (kart.email) {
    const lang = kart.lang === "en" ? "en" : "no";
    const ep = await sendPortalEpost({
      to: kart.email,
      ...epostNyttIProsjektet(lang, {
        type: "leveranse",
        lenke: await lagPortalLenke(kart.email),
      }),
    });
    if (!ep.ok) {
      console.log(`[admin/bygg] e-post (delt) ikke sendt: ${ep.error}`);
    }
  }
  return hentOgSvar(supabase, kartleggingId);
}

async function hentOgSvar(supabase: SupabaseClient, kartleggingId: string) {
  const { data } = await supabase
    .from("byggeprosjekter")
    .select(RAD_SELECT)
    .eq("kartlegging_id", kartleggingId)
    .maybeSingle();
  return NextResponse.json<AdminByggResponse>({
    bygg: data ? tilAdminBygg(data as Rad) : null,
  });
}
