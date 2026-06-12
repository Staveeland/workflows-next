import { NextResponse } from "next/server";
import {
  byggAuthorizeUrl,
  FIKEN_STATE_COOKIE,
  FIKEN_STATE_MAX_AGE_S,
  hentFikenStatus,
  lagOAuthState,
} from "@/lib/fiken";
import { forbidden, portalAuth, unauthorized } from "@/lib/portalAuth";
import { mockFikenStatus, portalMockEnabled } from "@/lib/portalMock";
import { ADMIN_EMAIL } from "@/lib/portalTypes";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import type { FikenStatusResponse } from "@/lib/fikenTypes";

export const runtime = "nodejs";

/**
 * GET /api/portal/admin/fiken/status — tilkoblingsstatus for verksted-
 * kontoret. Gjør ETT GET /companies-kall når en auth-vei er konfigurert
 * (personal token eller OAuth-tokens i fiken_tokens).
 *
 * Når IKKE koblet og OAuth-klienten er konfigurert, bærer svaret også
 * authUrl (Fikens authorize-URL) og setter samtidig den signerte state-
 * cookien — UI-et navigerer hele vinduet til authUrl, og callbacken
 * verifiserer cookien. Cookien er scopet til /api/fiken/callback.
 *
 * Auth: user-token-mønsteret + hard ADMIN_EMAIL-sjekk (som alle admin-
 * ruter). Ingen Fiken-detaljer lekker til ikke-admin.
 */

const RL_MAX = 60;
const RL_WINDOW_MS = 10 * 60_000;

export async function GET(req: Request) {
  // DEV MOCK — everything fake lives in portalMock.ts (auto-admin).
  if (portalMockEnabled()) {
    return NextResponse.json<FikenStatusResponse>(mockFikenStatus());
  }

  let auth;
  try {
    auth = await portalAuth(req);
  } catch (err) {
    console.error("[portal/admin/fiken/status] auth setup failed", err);
    return NextResponse.json({ error: "Noe gikk galt." }, { status: 500 });
  }
  if (!auth) return unauthorized();
  if (auth.user.email !== ADMIN_EMAIL) return forbidden();

  const rl = rateLimit({
    key: "portal:admin:fiken:status",
    identifier: auth.user.id,
    max: RL_MAX,
    windowMs: RL_WINDOW_MS,
  });
  if (!rl.ok) return tooManyRequests(rl, RL_MAX);

  const status = await hentFikenStatus();
  const svar: FikenStatusResponse = {
    koblet: status.koblet,
    via: status.via,
    ...(status.selskap ? { selskap: status.selskap } : {}),
    ...(status.selskapSlug ? { selskapSlug: status.selskapSlug } : {}),
    ...(status.testCompany !== undefined
      ? { testCompany: status.testCompany }
      : {}),
    ...(status.feil ? { feil: status.feil } : {}),
    authUrl: null,
  };

  // Ikke koblet + OAuth-klient i env → tilby en ny tilkoblingsrunde.
  // IKKE når via='token': en personlig nøkkel vinner alltid over OAuth-
  // tokens, så en ny OAuth-runde ville ikke hjulpet — bytt nøkkelen i env.
  if (
    !status.koblet &&
    status.via !== "token" &&
    process.env.FIKEN_CLIENT_ID &&
    process.env.FIKEN_CLIENT_SECRET
  ) {
    try {
      const { state, cookieVerdi } = lagOAuthState();
      svar.authUrl = byggAuthorizeUrl(state);
      const res = NextResponse.json<FikenStatusResponse>(svar);
      res.cookies.set(FIKEN_STATE_COOKIE, cookieVerdi, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/fiken/callback",
        maxAge: FIKEN_STATE_MAX_AGE_S,
      });
      return res;
    } catch (err) {
      console.error("[portal/admin/fiken/status] authUrl-bygging feilet", err);
      // Statusen er fortsatt gyldig — bare uten tilkoblingslenke.
    }
  }

  return NextResponse.json<FikenStatusResponse>(svar);
}
