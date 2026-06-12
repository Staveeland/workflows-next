import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifiserFabrikkSecret } from "@/lib/fabrikk";
import { rateLimit, tooManyRequests, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/fabrikk/brief?byggId= — fabrikkens første stopp: hele
 * byggegrunnlaget for et løp. Autentisert med X-Fabrikk-Secret (timing-safe)
 * og lest med service role — denne ruta er fabrikk-infrastruktur, IKKE
 * kundeflate (samme isolerte klasse som chat/cron).
 *
 * Svaret er alt Fable 5 trenger for å bygge i KUNDENS uttrykk: svarene,
 * researchen (undersider + regnskap), den ærlige vurderingen og tilbudets
 * scope. Fabrikken destillerer dette til designbrief + byggeoppdrag.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const rl = rateLimit({
    key: "fabrikk:brief",
    identifier: getClientIp(req),
    max: 30,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl, 30);

  if (!verifiserFabrikkSecret(req)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  const byggId = new URL(req.url).searchParams.get("byggId") ?? "";
  if (!UUID_RE.test(byggId)) {
    return NextResponse.json({ error: "Ugyldig byggId" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: bygg, error: byggError } = await supabase
    .from("byggeprosjekter")
    .select(
      "id, kartlegging_id, status, kansellert_at, byggenotat, endringsonske, github_repo"
    )
    .eq("id", byggId)
    .maybeSingle();
  if (byggError) {
    console.error("[fabrikk/brief] bygg select failed", byggError);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!bygg) {
    return NextResponse.json({ error: "Fant ikke bygget" }, { status: 404 });
  }

  const { data: kart, error: kartError } = await supabase
    .from("kartlegginger")
    .select("id, email, answers, assessment, tilbud, lang, godkjent_at, status")
    .eq("id", bygg.kartlegging_id)
    .maybeSingle();
  if (kartError || !kart) {
    console.error("[fabrikk/brief] kartlegging select failed", kartError);
    return NextResponse.json({ error: "Fant ikke kartleggingen" }, { status: 404 });
  }
  // Fabrikken bygger kun godkjente løp — siste skanse også her.
  if (kart.status !== "videre" && kart.status !== "levert") {
    return NextResponse.json({ error: "Løpet er ikke godkjent" }, { status: 409 });
  }

  const answers = (kart.answers ?? {}) as Record<string, unknown>;
  const bedrift = (answers.bedrift ?? null) as {
    navn?: string;
    orgnr?: string;
    nettside?: string;
  } | null;

  return NextResponse.json({
    byggId: bygg.id,
    kartleggingId: kart.id,
    kansellert: bygg.kansellert_at !== null,
    lang: kart.lang === "en" ? "en" : "no",
    bedrift: {
      navn: bedrift?.navn ?? null,
      orgnr: bedrift?.orgnr ?? null,
      nettside: bedrift?.nettside ?? null,
    },
    // Rådata med vilje: fabrikken er vår egen infrastruktur, og briefen
    // destilleres der (designbrief → byggeoppdrag) — ikke her.
    svar: answers,
    research: (answers.research ?? null) as unknown,
    vurdering: kart.assessment,
    tilbud: kart.tilbud,
    godkjentAt: kart.godkjent_at,
    // Petters egne føringer + ev. endringsønske + repo for revisjonsbygg.
    byggenotat: (bygg.byggenotat as string | null) ?? "",
    endringsonske: (bygg.endringsonske as string | null) ?? "",
    githubRepo: (bygg.github_repo as string | null) ?? "",
  });
}
