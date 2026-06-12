import { NextResponse } from "next/server";
import {
  byttKodeMotTokens,
  FIKEN_STATE_COOKIE,
  lagreNyeTokens,
  oppdaterLagretCompanySlug,
  verifiserOAuthState,
} from "@/lib/fiken";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/fiken/callback — OAuth-returen fra Fiken.
 *
 * UTENFOR portal-auth: Fiken redirecter nettleseren hit uten Bearer-token.
 * Vernet er den SIGNERTE state-cookien (HMAC m/ FIKEN_CLIENT_SECRET) som
 * admin-status-ruta satte da runden startet — signaturen OG state-
 * parameteren må stemme før koden byttes mot tokens. Tokens lagres i
 * fiken_tokens (deny-all RLS, service role — isolert i fiken.ts).
 *
 * Registrert redirect-URI hos Fiken er https://www.workflows.no/api/fiken/
 * callback; www 308-er til apex med path+query bevart, så requesten lander
 * her på workflows.no. Brukeren sendes alltid videre til /start/admin —
 * ?fiken=tilkoblet ved suksess, ?fiken=feil ellers (detaljene bor i loggen,
 * aldri i URL-en).
 *
 * Feilmodi vurdert: avvist samtykke (error-param), manglende/falsk state
 * (CSRF), utløpt cookie, kodebytte-feil, dobbel-callback (Fiken avviser
 * gjenbrukt code → feil-redirect, første runde vant og står).
 */

const RL_MAX = 10;
const RL_WINDOW_MS = 10 * 60_000;

/** Enkel cookie-plukker — vi trenger bare én verdi fra headeren. */
function lesCookie(req: Request, navn: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const del of header.split(";")) {
    const [k, ...rest] = del.trim().split("=");
    if (k === navn) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function tilAdmin(req: Request, resultat: "tilkoblet" | "feil"): NextResponse {
  const res = NextResponse.redirect(
    new URL(`/start/admin?fiken=${resultat}`, new URL(req.url).origin),
    { status: 303 }
  );
  // Engangscookie — rydd alltid, uansett utfall.
  res.cookies.set(FIKEN_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/fiken/callback",
    maxAge: 0,
  });
  return res;
}

export async function GET(req: Request) {
  const rl = rateLimit({
    key: "fiken:callback",
    identifier: getClientIp(req),
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthFeil = url.searchParams.get("error");

  if (oauthFeil) {
    // Avvist samtykke o.l. — Fikens feilkode er trygg å logge, ikke å vise.
    console.log(`[fiken/callback] Fiken svarte med error=${oauthFeil}`);
    return tilAdmin(req, "feil");
  }
  if (!code || !state) {
    console.log("[fiken/callback] mangler code/state i returen");
    return tilAdmin(req, "feil");
  }

  const cookieVerdi = lesCookie(req, FIKEN_STATE_COOKIE);
  if (!verifiserOAuthState(cookieVerdi, state)) {
    // Falsk/utløpt state — mulig CSRF eller en runde eldre enn 10 min.
    console.error("[fiken/callback] state-verifisering feilet");
    return tilAdmin(req, "feil");
  }

  try {
    const tokens = await byttKodeMotTokens(code, state);
    await lagreNyeTokens(tokens);
  } catch (err) {
    console.error("[fiken/callback] kodebytte/lagring feilet", err);
    return tilAdmin(req, "feil");
  }

  // Best-effort: noter company_slug på token-raden (feiler stille).
  await oppdaterLagretCompanySlug();

  console.log("[fiken/callback] Fiken koblet til via OAuth");
  return tilAdmin(req, "tilkoblet");
}
