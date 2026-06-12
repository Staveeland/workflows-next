/**
 * Nattevakten-chat — «Petter har svart deg»-e-post via Resend.
 *
 * Innfrir løftet i arbeidsordre-kopien («han svarer deg her i chatten — og
 * på e-posten du oppga»). Mønsteret er KOPIERT fra src/lib/epost.ts (den
 * fila eies av portalen og røres ikke herfra): plain fetch mot Resend,
 * samme avsenderdomene, samme krem-ark-shell, samme fail-silent-filosofi —
 * en e-posthikke skal ALDRI velte ruten som utløste den.
 *
 * Innholdet røper aldri hva Petter skrev (samme prinsipp som Benken-
 * varslene — meldingen kan nevne systemer og forretningsdetaljer, og
 * e-post er en mindre lukket kanal enn chatten). Kun «han har svart» +
 * én knapp tilbake til chatten.
 *
 * Språk: chat_users lagrer ikke språkvalg, og telegram-reply-ruten har
 * ingen klientkontekst — derfor norsk. (Chatten selv er tospråklig, men
 * besøkende som skriver til Petter gjør det i praksis på norsk.)
 */

const FROM = "Workflows <verkstedet@workflows.no>";
const REPLY_TO = "petter@workflows.no";
const SEND_TIMEOUT_MS = 5000;
// ?chat=1 — VerkstedChat åpner panelet når parameteren er satt.
const CHAT_URL = "https://workflows.no/?chat=1";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** POST https://api.resend.com/emails — fail-silent, kaster aldri. */
async function sendChatEpost(args: {
  to: string;
  emne: string;
  html: string;
  tekst: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[chatEpost] RESEND_API_KEY mangler — e-post ikke sendt:", args.emne);
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
        to: [args.to],
        reply_to: REPLY_TO,
        subject: args.emne,
        html: args.html,
        text: args.tekst,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[chatEpost] Resend svarte ${res.status}: ${body}`);
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("[chatEpost] sending feilet:", error);
    return { ok: false, error };
  }
}

/**
 * «Petter har svart deg» — sendes fra telegram-reply-ruten når kunden ikke
 * har vært innom chatten de siste minuttene. Krem-ark, blekk, én amber
 * knapp — samme visuelle shell som portal-e-postene.
 */
export async function sendPetterHarSvart(args: {
  to: string;
  name?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const fornavn = (args.name || "").trim().split(/\s+/)[0] || "";
  const hilsen = fornavn ? `Hei ${fornavn}.` : "Hei.";
  const emne = "Petter har svart deg i chatten";
  const tittel = "Petter har svart deg.";
  const avsnitt = [
    `${hilsen} Det ligger et svar fra Petter i chatten på workflows.no. Åpne luka, så står det der.`,
  ];
  const knapp = "Åpne chatten";
  const footer =
    "Workflows AS · Haugesund — du får denne fordi du skrev til oss i chatten";

  const avsnittHtml = avsnitt
    .map(
      (a) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#171310;">${escapeHtml(a)}</p>`
    )
    .join("\n          ");

  const html = `<!DOCTYPE html>
<html lang="no">
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
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
                <tr>
                  <td style="background-color:#B8741A;border-radius:6px;">
                    <a href="${CHAT_URL}" style="display:inline-block;padding:13px 26px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#171310;text-decoration:none;">${escapeHtml(knapp)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;padding-top:16px;border-top:1px solid #d9cfbe;font-size:12px;line-height:1.6;color:#5c5347;font-family:ui-monospace,'Courier New',monospace;">${escapeHtml(footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const tekst = [
    tittel,
    "",
    ...avsnitt.flatMap((a) => [a, ""]),
    `${knapp}: ${CHAT_URL}`,
    "",
    "—",
    footer,
  ].join("\n");

  return sendChatEpost({ to: args.to, emne, html, tekst });
}
