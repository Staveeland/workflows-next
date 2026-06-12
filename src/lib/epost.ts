/**
 * Kundeportalen — transactional e-post via Resend (plain fetch, no SDK).
 *
 * Same fail-silent philosophy as telegram.ts: an e-mail hiccup must NEVER
 * fail the route that triggered it. Missing env, timeouts and non-2xx all
 * log and return { ok: false } — nothing here throws.
 *
 * Templates: one per portal step the customer cares about — forslag_klart,
 * tilbud_sendt, godkjent, nytt-i-prosjektet + admin pings. The shell is the
 * verkstedsarket: bek (#171310) frame, cream (#F4EFE5) card, mono kicker,
 * ONE dark button with amber text — the same design language as the
 * Supabase login mails (docs/supabase-epostmaler.md), so every mail from
 * the shop reads as family. Bodies stay content-poor: nothing sensitive
 * beyond what each mail already carried (the quote mail quotes the price —
 * deliberate, unchanged).
 *
 * ENGANGS-DYPLENKE: lagPortalLenke() mints a one-time login link via
 * supabaseAdmin().auth.admin.generateLink — «Åpne verkstedet» logs the
 * customer straight in, no second e-mail round trip. This is the ONLY
 * service-role use anywhere near the portal (contract: portal routes stay
 * user-scoped via portalAuth; the admin client never leaves this module).
 * Fail-graceful by contract: ANY generateLink hiccup falls back to the
 * plain /start?innlogging=1 link, which still works — just slower.
 *
 * Logging is structured on purpose ([epost] sendt/FEILET + mottakertype)
 * so a dead Resend key or revoked service key is visible in Vercel logs
 * without an outbox table.
 */

import { supabaseAdmin } from "@/lib/supabase";

export type EpostLang = "no" | "en";

export interface EpostMal {
  emne: string;
  html: string;
  tekst: string;
}

type SendArgs = {
  to: string;
  emne: string;
  html: string;
  tekst: string;
};

// The login-intent param: arriving without a session opens the login gate
// directly instead of pretending the visitor is new (email links say
// «something is waiting» — the page must act like it). This is the FALLBACK
// destination whenever a one-time deep link can't be minted.
const PORTAL_URL = "https://workflows.no/start?innlogging=1";
const ADMIN_URL = "https://workflows.no/start/admin";
// Where the one-time links land AFTER Supabase verifies them. /start is in
// the auth redirect allowlist already (emailRedirectTo uses it).
const PORTAL_REDIRECT = "https://workflows.no/start";
const ADMIN_REDIRECT = "https://workflows.no/start/admin";

const FROM = "Workflows <verkstedet@workflows.no>";
const ADMIN_EPOST = "petter@workflows.no";
const REPLY_TO = ADMIN_EPOST;
const SEND_TIMEOUT_MS = 5000;
// generateLink is one extra HTTP hop before the mail — bounded so a slow
// Supabase admin API can never stall the route that triggered the mail.
const LENKE_TIMEOUT_MS = 5000;

/** POST https://api.resend.com/emails — fail-silent, never throws. */
export async function sendPortalEpost({
  to,
  emne,
  html,
  tekst,
}: SendArgs): Promise<{ ok: boolean; error?: string }> {
  // Outbox light: mottakertype (never the address itself) + subject in every
  // line, so Vercel logs answer «did the customer mails go out?» at a glance.
  const mottaker = to === ADMIN_EPOST ? "admin" : "kunde";
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error(
      `[epost] FEILET mottaker=${mottaker} årsak=RESEND_API_KEY-mangler emne="${emne}"`
    );
    return { ok: false, error: "Missing Resend env" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject: emne,
        html,
        text: tekst,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[epost] FEILET mottaker=${mottaker} årsak=resend-${res.status} emne="${emne}" body=${body}`
      );
      return { ok: false, error: `Resend ${res.status}` };
    }
    console.log(`[epost] sendt mottaker=${mottaker} emne="${emne}"`);
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error(
      `[epost] FEILET mottaker=${mottaker} årsak=${error} emne="${emne}"`
    );
    return { ok: false, error };
  }
}

/* ════════════════════════════════════════════
   Engangs innloggings-dyplenke
   ════════════════════════════════════════════ */

/**
 * One-time login deep link for a notification mail. Mints a magic-link
 * action_link via the service-role admin API — clicking it both logs the
 * recipient in AND lands them on /start (or /start/admin for Petter).
 *
 * Fail-graceful BY CONTRACT: missing email, unknown user, slow admin API,
 * missing env — every failure path returns the plain login-gate URL and
 * logs why. Callers never need to try/catch.
 *
 * NOTE: the action_link is a live one-time credential — the templates that
 * embed it stay content-poor, and forwarding the mail forwards the key.
 * Same trade-off as the magic-link mails themselves.
 */
export async function lagPortalLenke(
  email: string | null | undefined,
  til: "start" | "admin" = "start"
): Promise<string> {
  const fallback = til === "admin" ? ADMIN_URL : PORTAL_URL;
  const address = (email ?? "").trim();
  if (!address) return fallback;
  try {
    const resultat = await Promise.race([
      supabaseAdmin().auth.admin.generateLink({
        type: "magiclink",
        email: address,
        options: {
          redirectTo: til === "admin" ? ADMIN_REDIRECT : PORTAL_REDIRECT,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`generateLink timeout etter ${LENKE_TIMEOUT_MS}ms`)),
          LENKE_TIMEOUT_MS
        )
      ),
    ]);
    const lenke = resultat.data?.properties?.action_link;
    if (resultat.error || !lenke) {
      console.error(
        `[epost] generateLink feilet (mål=${til}) — bruker fallback-lenke:`,
        resultat.error?.message ?? "tomt action_link"
      );
      return fallback;
    }
    return lenke;
  } catch (e) {
    console.error(
      `[epost] generateLink kastet (mål=${til}) — bruker fallback-lenke:`,
      e instanceof Error ? e.message : e
    );
    return fallback;
  }
}

/* ════════════════════════════════════════════
   Templates — shared shell + the portal steps
   ════════════════════════════════════════════ */

/** User-adjacent strings (pris is Petter's, but escape on principle). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const KNAPP: Record<EpostLang, string> = {
  no: "Åpne verkstedet",
  en: "Open the workshop",
};

/** The one-time-link safety valve — always true, link or fallback. */
const NODUTGANG: Record<EpostLang, string> = {
  no: "Knappen logger deg rett inn og virker én gang. Funker den ikke? Gå til workflows.no/start og logg inn der.",
  en: "The button signs you straight in and works once. Not working? Go to workflows.no/start and sign in there.",
};

const FOOTER: Record<EpostLang, string> = {
  no: "Workflows AS · Haugesund — du får denne fordi du har en kartlegging hos oss",
  en: "Workflows AS · Haugesund — you're getting this because you have a mapping with us",
};

const ADMIN_FOOTER =
  "Workflows AS · intern varsling fra verkstedet — detaljene ligger i portalen";

/**
 * The one shell, same sheet as the Supabase login mails: bek #171310 frame,
 * amber mono wordmark, cream #F4EFE5 card (radius 10), mono kicker, Georgia
 * headline in ink, ONE dark button with amber text and a B8741A edge.
 * Tables + inline styles only — email clients earn nothing fancier.
 */
function byggHtml(args: {
  lang: EpostLang;
  tittel: string;
  avsnitt: string[];
  prisLinje: string | null;
  lenke: string;
  footer?: string;
}): string {
  const { lang, tittel, avsnitt, prisLinje, lenke } = args;
  const footer = args.footer ?? FOOTER[lang];
  const avsnittHtml = avsnitt
    .map(
      (a) =>
        `<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#3d362e;padding-bottom:16px;">${escapeHtml(a)}</td></tr>`
    )
    .join("\n            ");
  const prisHtml = prisLinje
    ? `<tr><td style="font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;color:#171310;padding-bottom:20px;">${escapeHtml(prisLinje)}</td></tr>\n            `
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(tittel)}</title>
</head>
<body style="margin:0;padding:0;background-color:#171310;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#171310;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr><td style="padding:0 8px 18px;font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;color:#FFB454;">workflows.no</td></tr>
          <tr><td style="background-color:#F4EFE5;border-radius:10px;padding:40px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:14px;">VERKSTEDET &middot; HAUGESUND</td></tr>
              <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#171310;font-weight:600;padding-bottom:16px;">${escapeHtml(tittel)}</td></tr>
              ${avsnittHtml}
            ${prisHtml}<tr><td style="padding:6px 0 22px;">
                <a href="${escapeHtml(lenke)}" style="display:inline-block;background-color:#171310;color:#FFB454;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:600;text-decoration:none;padding:15px 36px;border-radius:10px;border:2px solid #B8741A;">${escapeHtml(KNAPP[lang])} &rarr;</a>
              </td></tr>
              <tr><td style="border-top:1px solid #ddd3c2;padding-top:16px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#8a8071;">${escapeHtml(NODUTGANG[lang])}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:18px 8px 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#C9BBA8;">${escapeHtml(footer)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text twin — same content, zero markup. */
function byggTekst(args: {
  lang: EpostLang;
  tittel: string;
  avsnitt: string[];
  prisLinje: string | null;
  lenke: string;
  footer?: string;
}): string {
  const { lang, tittel, avsnitt, prisLinje, lenke } = args;
  return [
    tittel,
    "",
    ...avsnitt.flatMap((a) => [a, ""]),
    ...(prisLinje ? [prisLinje, ""] : []),
    `${KNAPP[lang]}: ${lenke}`,
    "",
    NODUTGANG[lang],
    "",
    "—",
    args.footer ?? FOOTER[lang],
  ].join("\n");
}

/** html + tekst from the same ingredients — every template ends here. */
function byggMal(args: {
  lang: EpostLang;
  emne: string;
  tittel: string;
  avsnitt: string[];
  prisLinje: string | null;
  lenke: string;
  footer?: string;
}): EpostMal {
  return {
    emne: args.emne,
    html: byggHtml(args),
    tekst: byggTekst(args),
  };
}

/**
 * Status «forslag_klart» — the drawing is done, come look.
 * data.lenke: one-time deep link from lagPortalLenke() — omitted, the
 * button falls back to the plain login gate. Same for every template below.
 */
export function epostForslagKlart(
  lang: EpostLang,
  data?: { lenke?: string }
): EpostMal {
  const innhold: Record<EpostLang, { emne: string; tittel: string; avsnitt: string[] }> = {
    no: {
      emne: "Forslaget ditt ligger på benken",
      tittel: "Forslaget ligger på benken.",
      avsnitt: [
        "Verkstedet har tegnet ferdig. Vurderingen og skissen ligger klar i portalen — også hvis konklusjonen ble at dere ikke trenger AI. Det hender.",
        "Knappen under logger deg rett inn — ingen ny e-postrunde.",
      ],
    },
    en: {
      emne: "Your proposal is on the bench",
      tittel: "The proposal is on the bench.",
      avsnitt: [
        "The workshop has finished drawing. The assessment and the sketch are waiting in the portal — even if the conclusion turned out to be that you don't need AI. It happens.",
        "The button below signs you straight in — no second email round trip.",
      ],
    },
  };
  const c = innhold[lang];
  return byggMal({
    lang,
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: c.avsnitt,
    prisLinje: null,
    lenke: data?.lenke ?? PORTAL_URL,
  });
}

/** Status «tilbud_sendt» — Petters hand-written quote is up, price quoted. */
export function epostTilbudSendt(
  lang: EpostLang,
  data: { pris: string; lenke?: string }
): EpostMal {
  const innhold: Record<
    EpostLang,
    { emne: string; tittel: string; avsnitt: string[]; prisLinje: string }
  > = {
    no: {
      emne: "Pristilbudet er klart i portalen",
      tittel: "Pristilbudet er klart.",
      avsnitt: [
        "Petter har sett på vurderingen og lagt et konkret pristilbud på benken. Hele tilbudet — tekst, pris og leveranse — ligger i portalen, og knappen under logger deg rett inn.",
      ],
      prisLinje: `Pris: ${data.pris}`,
    },
    en: {
      emne: "The quote is ready in the portal",
      tittel: "The quote is ready.",
      avsnitt: [
        "Petter has reviewed the assessment and put a concrete quote on the bench. The full quote — text, price and delivery — is in the portal, and the button below signs you straight in.",
      ],
      prisLinje: `Price: ${data.pris}`,
    },
  };
  const c = innhold[lang];
  return byggMal({
    lang,
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: c.avsnitt,
    prisLinje: c.prisLinje,
    lenke: data.lenke ?? PORTAL_URL,
  });
}

/** Status «videre» — receipt on the approval; the bench is being rigged. */
export function epostGodkjent(
  lang: EpostLang,
  data: { pris: string | null; lenke?: string }
): EpostMal {
  const innhold: Record<
    EpostLang,
    { emne: string; tittel: string; avsnitt: string[] }
  > = {
    no: {
      emne: "Da setter vi i gang — kvittering på godkjenningen",
      tittel: "Da setter vi i gang.",
      avsnitt: [
        "Dette er kvitteringen på at tilbudet er godkjent. Petter tar kontakt om oppstart — verkstedet rigger benken. Prosjektrommet i portalen er åpent for deg hele veien.",
      ],
    },
    en: {
      emne: "Then we get to work — receipt of your approval",
      tittel: "Then we get to work.",
      avsnitt: [
        "This is the receipt confirming the quote is approved. Petter will be in touch about kick-off — the workshop is rigging the bench. The project room in the portal is open to you all the way.",
      ],
    },
  };
  const c = innhold[lang];
  const prisLinje = data.pris
    ? lang === "en"
      ? `Approved quote: ${data.pris}`
      : `Godkjent tilbud: ${data.pris}`
    : null;
  return byggMal({
    lang,
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: c.avsnitt,
    prisLinje,
    lenke: data.lenke ?? PORTAL_URL,
  });
}

/* ── «Benken» — something new in the project room. The body NEVER echoes
      message content (it may mention systems, logins, whatever the customer
      typed) — only the event type and a button into the portal. ── */

/* ── Levert — the Skjøtet moment. The project is done; the deed is on the
      bench. Content-free beyond the occasion itself. ── */
export function epostLevert(lang: EpostLang, data?: { lenke?: string }): EpostMal {
  const innhold: Record<EpostLang, { emne: string; tittel: string; avsnitt: string[] }> = {
    no: {
      emne: "Skjøtet er klart — prosjektet ditt er levert",
      tittel: "Prosjektet er levert.",
      avsnitt: [
        "Verkstedet har feid benken og lagt skjøtet klart til deg: sluttrapporten, det godkjente tilbudet og hele prosjektrommet står der — ditt å beholde.",
        "Knappen under logger deg rett inn. Takk for at du bygde med oss.",
      ],
    },
    en: {
      emne: "The deed is ready — your project is delivered",
      tittel: "Your project is delivered.",
      avsnitt: [
        "The workshop has swept the bench and laid out the deed for you: the final report, the approved quote and the whole project room are there — yours to keep.",
        "The button below signs you straight in. Thank you for building with us.",
      ],
    },
  };
  const c = innhold[lang];
  return byggMal({
    lang,
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: c.avsnitt,
    prisLinje: null,
    lenke: data?.lenke ?? PORTAL_URL,
  });
}

export function epostNyttIProsjektet(
  lang: EpostLang,
  data: {
    type: "melding" | "leveranse" | "foresporsel" | "status" | "milepael";
    lenke?: string;
  }
): EpostMal {
  const innhold: Record<
    EpostLang,
    Record<"standard" | "leveranse" | "foresporsel", { emne: string; tittel: string; avsnitt: string[] }>
  > = {
    no: {
      standard: {
        emne: "Nytt fra verkstedet i prosjektet ditt",
        tittel: "Nytt fra verkstedet.",
        avsnitt: [
          "Det har skjedd noe på benken i prosjektet ditt. Knappen under logger deg rett inn, så ser du hva.",
        ],
      },
      leveranse: {
        emne: "Noe å se på i portalen",
        tittel: "Noe ligger klart på benken.",
        avsnitt: [
          "Verkstedet har lagt en leveranse på benken til deg. Knappen under logger deg rett inn — ta en titt, og si gjerne fra hva du synes.",
        ],
      },
      foresporsel: {
        emne: "Vi trenger noe fra deg",
        tittel: "Vi trenger noe fra deg.",
        avsnitt: [
          "Verkstedet mangler noe for å komme videre i prosjektet ditt. Knappen under logger deg rett inn, så står det hva.",
        ],
      },
    },
    en: {
      standard: {
        emne: "News from the workshop on your project",
        tittel: "News from the workshop.",
        avsnitt: [
          "Something happened on the bench in your project. The button below signs you straight in, and you'll see what.",
        ],
      },
      leveranse: {
        emne: "Something to look at in the portal",
        tittel: "Something is ready on the bench.",
        avsnitt: [
          "The workshop has put a delivery on the bench for you. The button below signs you straight in — have a look, and do tell us what you think.",
        ],
      },
      foresporsel: {
        emne: "We need something from you",
        tittel: "We need something from you.",
        avsnitt: [
          "The workshop is missing something to move your project forward. The button below signs you straight in — it says what.",
        ],
      },
    },
  };
  const variant =
    data.type === "leveranse" || data.type === "foresporsel"
      ? data.type
      : "standard";
  const c = innhold[lang][variant];
  return byggMal({
    lang,
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: c.avsnitt,
    prisLinje: null,
    lenke: data.lenke ?? PORTAL_URL,
  });
}

/* ── Admin notifications — Petter wants customer events in the inbox too,
      not only Telegram. Short, factual, one link to the back room. ── */

export type AdminHendelse = "ny" | "likt" | "godkjent" | "prosjekt";

export function epostAdminVarsel(
  hendelse: AdminHendelse,
  data: { email: string; bedrift?: string | null; pris?: string | null; lenke?: string }
): EpostMal {
  const hvem = data.bedrift ? `${data.bedrift} (${data.email})` : data.email;
  const innhold: Record<AdminHendelse, { emne: string; tittel: string; linje: string }> = {
    ny: {
      emne: `Ny kartlegging: ${hvem}`,
      tittel: "Noen banket på.",
      linje: `${hvem} har fullført kartleggingen og fått forslaget sitt.`,
    },
    likt: {
      emne: `Forslag likt: ${hvem}`,
      tittel: "De vil se mer.",
      linje: `${hvem} likte forslaget. Pristilbud innen én arbeidsdag — klokka tikker.`,
    },
    godkjent: {
      emne: `Tilbud godkjent: ${hvem}`,
      tittel: "På tide å rigge benken.",
      linje: data.pris
        ? `${hvem} godkjente tilbudet (${data.pris}).`
        : `${hvem} godkjente tilbudet.`,
    },
    // Deliberately content-free — the message itself stays in the portal.
    prosjekt: {
      emne: `Nytt i prosjektet: ${hvem}`,
      tittel: "Noe nytt på benken.",
      linje: `${hvem} la igjen noe i prosjektrommet. Det ligger i portalen.`,
    },
  };
  const c = innhold[hendelse];
  // Same cream sheet — the button goes to the back room instead.
  return byggMal({
    lang: "no",
    emne: c.emne,
    tittel: c.tittel,
    avsnitt: [c.linje],
    prisLinje: null,
    lenke: data.lenke ?? ADMIN_URL,
    footer: ADMIN_FOOTER,
  });
}

/** Pull the company name out of a kartlegging's answers (best effort). */
export function bedriftFraAnswers(answers: unknown): string | null {
  if (typeof answers !== "object" || answers === null) return null;
  const b = (answers as Record<string, unknown>).bedrift;
  if (typeof b !== "object" || b === null) return null;
  const navn = (b as Record<string, unknown>).navn;
  return typeof navn === "string" && navn.trim() ? navn.trim().slice(0, 80) : null;
}
