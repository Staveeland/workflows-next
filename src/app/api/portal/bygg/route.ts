import { NextResponse } from "next/server";
import { portalAuth, unauthorized } from "@/lib/portalAuth";
import { hentSisteDeploy } from "@/lib/fabrikk";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import type { KundeByggResponse } from "@/lib/byggTypes";

export const runtime = "nodejs";

/**
 * GET /api/portal/bygg — kundens Forhåndsvisning-fane.
 *
 * Svarer KUN med delt forhåndsvisning for kundens eget løp: eksplisitt
 * user_id-filter (dagens lærepenge: admin-RLS ser alle rader — kundeflater
 * filtrerer alltid selv) + RLS-policyen som uansett krever delt_med_kunde_at.
 * Bevisst minimal respons — repo, logg og prosjekt-id-er er bakrom.
 */

export async function GET(req: Request) {
  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/bygg] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  const { supabase, user } = auth;

  const rl = rateLimit({
    key: "portal:bygg",
    identifier: user.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl, 60);

  // Kundens siste løp (eksplisitt eierskap), så det delte bygget for det.
  const { data: kart, error: kartError } = await supabase
    .from("kartlegginger")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (kartError) {
    console.error("[portal/bygg] kartlegging select failed", kartError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!kart) {
    return NextResponse.json<KundeByggResponse>({ forhandsvisning: null });
  }

  const { data: bygg, error: byggError } = await supabase
    .from("byggeprosjekter")
    .select("preview_url, siste_deploy_at, vercel_project_id, delt_med_kunde_at")
    .eq("kartlegging_id", kart.id)
    .maybeSingle();
  if (byggError) {
    console.error("[portal/bygg] bygg select failed", byggError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!bygg || !bygg.delt_med_kunde_at || !bygg.preview_url) {
    return NextResponse.json<KundeByggResponse>({ forhandsvisning: null });
  }

  // Ferskhet: Petter kan ha pushet etter delingen — vis siste grønne deploy.
  let url = bygg.preview_url as string;
  let sist = (bygg.siste_deploy_at as string | null) ?? null;
  if (bygg.vercel_project_id) {
    const deploy = await hentSisteDeploy(bygg.vercel_project_id as string);
    if (deploy) {
      url = deploy.url;
      sist = deploy.readyAt ?? sist;
    }
  }

  return NextResponse.json<KundeByggResponse>({
    forhandsvisning: { url, sistOppdatert: sist },
  });
}
