"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import type { PortalKartlegging } from "@/lib/portalTypes";

/**
 * Level 3 — PRISTILBUDET (status «tilbud_sendt»). New component rather than
 * more branches in Forslag: the quote is a different document with a
 * different surface (cream .vk-paper deed — same skjøte-language as the
 * Eierskap panel: paper, hairline, stamp-style heading), while Forslag stays
 * the dark-bench reveal. The parent owns the godkjenn call (same contract as
 * Forslag/onLike) and flips to phase «videre» on success.
 *
 * Also exports Godkjent — the level 4 confirmation shown after approval
 * (and on boot when status is already «videre»).
 */

const EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

export const TILBUD_HEADING_ID = "vk-portal-ttittel";
/** The collapsed assessment <details> — rail-back to level 2 opens it. */
export const TILBUD_VURDERING_ID = "vk-portal-tvurdering";

interface TilbudProps {
  kartlegging: PortalKartlegging;
  godkjenner: boolean;
  godkjennError: boolean;
  /** Focus the heading on mount (phase change — established pattern). */
  autoFocus?: boolean;
  onGodkjenn: () => void;
}

export default function Tilbud({
  kartlegging,
  godkjenner,
  godkjennError,
  autoFocus = false,
  onGodkjenn,
}: TilbudProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  const tilbud = kartlegging.tilbud;
  if (!tilbud) return null;

  const a = kartlegging.assessment;
  const sendtDato = kartlegging.tilbudSendtAt
    ? new Date(kartlegging.tilbudSendtAt).toLocaleDateString(
        lang === "no" ? "nb-NO" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  return (
    <section className="vk-portal-tilbud">
      <p className="vk-kicker vk-portal-fkicker">{t.tilbud.kicker}</p>
      <h1
        id={TILBUD_HEADING_ID}
        ref={headingRef}
        tabIndex={-1}
        className="vk-display vk-portal-h1"
      >
        {t.tilbud.tittel}
      </h1>

      {/* The level 2 assessment, collapsed — native <details> keeps the
          expanded/collapsed state announced for free. */}
      {a ? (
        <details id={TILBUD_VURDERING_ID} className="vk-portal-tsammendrag">
          <summary className="vk-mono vk-portal-tsummary">
            {t.tilbud.seVurdering} — «{a.tittel}»
          </summary>
          <div className="vk-portal-tsammendrag-body">
            {a.vurdering.split("\n\n").map((avsnitt, i) => (
              <p key={i} className="vk-portal-avsnitt">
                {avsnitt}
              </p>
            ))}
            <ul className="vk-portal-skisse">
              {a.losningsskisse.map((punkt, i) => (
                <li key={i}>{punkt}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {/* The deed itself — cream paper sheet, skjøte-language. */}
      <div className="vk-paper vk-portal-tark">
        <header className="vk-portal-tark-head">
          <p className="vk-mono vk-portal-tstempel">{t.tilbud.arkOverskrift}</p>
          {sendtDato ? (
            <p className="vk-mono vk-portal-tdato">
              {t.tilbud.sendtTemplate.replace("{dato}", sendtDato)}
            </p>
          ) : null}
        </header>

        {tilbud.tekst.split("\n\n").map((avsnitt, i) => (
          <p key={i} className="vk-portal-tavsnitt">
            {avsnitt}
          </p>
        ))}

        <div className="vk-portal-tprisblokk">
          <p className="vk-mono vk-portal-tlabel">{t.tilbud.prisLabel}</p>
          <p className="vk-portal-tpris">{tilbud.pris}</p>
        </div>

        <p className="vk-mono vk-portal-tleveranse">
          <span className="vk-portal-tlabel-inline">{t.tilbud.leveranseLabel}</span>
          {tilbud.leveranse}
        </p>

        <div className="vk-portal-tactions">
          <button
            type="button"
            className="vk-btn vk-btn--cta"
            disabled={godkjenner}
            aria-busy={godkjenner || undefined}
            onClick={onGodkjenn}
          >
            {t.tilbud.godkjennKnapp}
          </button>
          <a
            href={`mailto:${EMAIL}`}
            className="vk-portal-quietlink vk-portal-quietlink--paper vk-mono"
          >
            {t.tilbud.sporsmalLenke}
          </a>
        </div>

        {godkjennError ? (
          <p className="vk-portal-feilmelding vk-portal-feilmelding--paper" role="alert">
            {t.feil.tekst}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ── Level 4 — BYGGES: the warm confirmation after approval ── */

export function Godkjent({ autoFocus = false }: { autoFocus?: boolean }) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The godkjenn button just unmounted with the whole Tilbud subtree — focus
  // the heading so keyboard/SR users aren't dropped on <body>.
  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  return (
    <section className="vk-portal-godkjent">
      <p className="vk-kicker vk-portal-fkicker">{t.levels[3].navn}</p>
      <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
        {t.tilbud.godkjentTittel}
      </h1>
      <p className="vk-portal-lead" role="status">
        {t.tilbud.godkjentTekst}
      </p>
      <div className="vk-portal-kort">
        <div className="vk-portal-kort-item">
          <span className="vk-mono vk-portal-kort-label">{t.forslag.epostLabel}</span>
          <a className="vk-portal-kort-link" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </div>
        <div className="vk-portal-kort-item">
          <span className="vk-mono vk-portal-kort-label">{t.forslag.telefonLabel}</span>
          <a className="vk-portal-kort-link" href={PHONE_HREF}>
            {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
