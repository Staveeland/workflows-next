/**
 * Kundeportalen — transactional e-post via Resend (plain fetch, no SDK).
 *
 * Same fail-silent philosophy as telegram.ts: an e-mail hiccup must NEVER
 * fail the route that triggered it. Missing env, timeouts and non-2xx all
 * log to console.error and return { ok: false } — nothing here throws.
 *
 * Templates: one per portal step the customer cares about —
 * forslag_klart, tilbud_sendt, godkjent. Simple single-column email-HTML
 * (inline styles, max-width 560, cream ground, ink text, ONE amber button
 * to /start) + a plain-text twin. Voice: verkstedsstemmen, kort.
 */

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
// «something is waiting» — the page must act like it).
const PORTAL_URL = "https://workflows.no/start?innlogging=1";
const FROM = "Workflows <verkstedet@workflows.no>";
const REPLY_TO = "petter@workflows.no";
const SEND_TIMEOUT_MS = 5000;

/** POST https://api.resend.com/emails — fail-silent, never throws. */
export async function sendPortalEpost({
  to,
  emne,
  html,
  tekst,
}: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[epost] RESEND_API_KEY mangler — e-post ikke sendt:", emne);
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
      console.error(`[epost] Resend svarte ${res.status}: ${body}`);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("[epost] sending feilet:", error);
    return { ok: false, error };
  }
}

/* ════════════════════════════════════════════
   Templates — shared shell + three steps
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

const FOOTER: Record<EpostLang, string> = {
  no: "Workflows AS · Haugesund — du får denne fordi du har en kartlegging hos oss",
  en: "Workflows AS · Haugesund — you're getting this because you have a mapping with us",
};

/**
 * The one shell: cream #F4EFE5 ground, ink #171310 text, single column
 * capped at 560, ONE amber #B8741A button (ink text — ≥4.5:1 on the fill).
 * Tables + inline styles only — email clients earn nothing fancier.
 */
function byggHtml(
  lang: EpostLang,
  tittel: string,
  avsnitt: string[],
  prisLinje: string | null
): string {
  const avsnittHtml = avsnitt
    .map(
      (a) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#171310;">${escapeHtml(a)}</p>`
    )
    .join("\n          ");
  const prisHtml = prisLinje
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#171310;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.04em;">${escapeHtml(prisLinje)}</p>\n          `
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(tittel)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4EFE5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4EFE5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="font-family:Georgia,'Times New Roman',serif;text-align:left;">
              <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#171310;font-family:ui-monospace,'Courier New',monospace;">Workflows</p>
              <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;font-weight:600;color:#171310;">${escapeHtml(tittel)}</h1>
              ${avsnittHtml}
          ${prisHtml}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
                <tr>
                  <td style="background-color:#B8741A;border-radius:6px;">
                    <a href="${PORTAL_URL}" style="display:inline-block;padding:13px 26px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#171310;text-decoration:none;">${escapeHtml(KNAPP[lang])}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;padding-top:16px;border-top:1px solid #d9cfbe;font-size:12px;line-height:1.6;color:#5c5347;font-family:ui-monospace,'Courier New',monospace;">${escapeHtml(FOOTER[lang])}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text twin — same content, zero markup. */
function byggTekst(
  tittel: string,
  avsnitt: string[],
  prisLinje: string | null,
  lang: EpostLang
): string {
  return [
    tittel,
    "",
    ...avsnitt.flatMap((a) => [a, ""]),
    ...(prisLinje ? [prisLinje, ""] : []),
    `${KNAPP[lang]}: ${PORTAL_URL}`,
    "",
    "—",
    FOOTER[lang],
  ].join("\n");
}

/** Status «forslag_klart» — the drawing is done, come look. */
export function epostForslagKlart(lang: EpostLang): EpostMal {
  const innhold: Record<EpostLang, { emne: string; tittel: string; avsnitt: string[] }> = {
    no: {
      emne: "Forslaget ditt ligger på benken",
      tittel: "Forslaget ligger på benken.",
      avsnitt: [
        "Verkstedet har tegnet ferdig. Vurderingen og skissen ligger klar i portalen — også hvis konklusjonen ble at dere ikke trenger AI. Det hender.",
      ],
    },
    en: {
      emne: "Your proposal is on the bench",
      tittel: "The proposal is on the bench.",
      avsnitt: [
        "The workshop has finished drawing. The assessment and the sketch are waiting in the portal — even if the conclusion turned out to be that you don't need AI. It happens.",
      ],
    },
  };
  const c = innhold[lang];
  return {
    emne: c.emne,
    html: byggHtml(lang, c.tittel, c.avsnitt, null),
    tekst: byggTekst(c.tittel, c.avsnitt, null, lang),
  };
}

/** Status «tilbud_sendt» — Petters hand-written quote is up, price quoted. */
export function epostTilbudSendt(
  lang: EpostLang,
  data: { pris: string }
): EpostMal {
  const innhold: Record<
    EpostLang,
    { emne: string; tittel: string; avsnitt: string[]; prisLinje: string }
  > = {
    no: {
      emne: "Pristilbudet er klart i portalen",
      tittel: "Pristilbudet er klart.",
      avsnitt: [
        "Petter har sett på vurderingen og lagt et konkret pristilbud på benken. Hele tilbudet — tekst, pris og leveranse — ligger i portalen.",
      ],
      prisLinje: `Pris: ${data.pris}`,
    },
    en: {
      emne: "The quote is ready in the portal",
      tittel: "The quote is ready.",
      avsnitt: [
        "Petter has reviewed the assessment and put a concrete quote on the bench. The full quote — text, price and delivery — is in the portal.",
      ],
      prisLinje: `Price: ${data.pris}`,
    },
  };
  const c = innhold[lang];
  return {
    emne: c.emne,
    html: byggHtml(lang, c.tittel, c.avsnitt, c.prisLinje),
    tekst: byggTekst(c.tittel, c.avsnitt, c.prisLinje, lang),
  };
}

/** Status «videre» — receipt on the approval; the bench is being rigged. */
export function epostGodkjent(
  lang: EpostLang,
  data: { pris: string | null }
): EpostMal {
  const innhold: Record<
    EpostLang,
    { emne: string; tittel: string; avsnitt: string[] }
  > = {
    no: {
      emne: "Da setter vi i gang — kvittering på godkjenningen",
      tittel: "Da setter vi i gang.",
      avsnitt: [
        "Dette er kvitteringen på at tilbudet er godkjent. Petter tar kontakt om oppstart — verkstedet rigger benken.",
      ],
    },
    en: {
      emne: "Then we get to work — receipt of your approval",
      tittel: "Then we get to work.",
      avsnitt: [
        "This is the receipt confirming the quote is approved. Petter will be in touch about kick-off — the workshop is rigging the bench.",
      ],
    },
  };
  const c = innhold[lang];
  const prisLinje = data.pris
    ? lang === "en"
      ? `Approved quote: ${data.pris}`
      : `Godkjent tilbud: ${data.pris}`
    : null;
  return {
    emne: c.emne,
    html: byggHtml(lang, c.tittel, c.avsnitt, prisLinje),
    tekst: byggTekst(c.tittel, c.avsnitt, prisLinje, lang),
  };
}

/* ── Admin notifications — Petter wants customer events in the inbox too,
      not only Telegram. Short, factual, one link to the back room. ── */

const ADMIN_URL = "https://workflows.no/start/admin";

export type AdminHendelse = "ny" | "likt" | "godkjent";

export function epostAdminVarsel(
  hendelse: AdminHendelse,
  data: { email: string; bedrift?: string | null; pris?: string | null }
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
  };
  const c = innhold[hendelse];
  // Reuse the cream-sheet shell; the button goes to the back room instead.
  const html = byggHtml("no", c.tittel, [c.linje], null).replace(
    /https:\/\/workflows\.no\/start\?innlogging=1/g,
    ADMIN_URL
  );
  return {
    emne: c.emne,
    html,
    tekst: byggTekst(c.tittel, [c.linje], null, "no").replace(
      /https:\/\/workflows\.no\/start\?innlogging=1/g,
      ADMIN_URL
    ),
  };
}

/** Pull the company name out of a kartlegging's answers (best effort). */
export function bedriftFraAnswers(answers: unknown): string | null {
  if (typeof answers !== "object" || answers === null) return null;
  const b = (answers as Record<string, unknown>).bedrift;
  if (typeof b !== "object" || b === null) return null;
  const navn = (b as Record<string, unknown>).navn;
  return typeof navn === "string" && navn.trim() ? navn.trim().slice(0, 80) : null;
}
