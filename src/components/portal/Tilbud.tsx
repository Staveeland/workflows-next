"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import type { Lang } from "@/lib/translations";
import type { PortalKartlegging, PortalTilbud } from "@/lib/portalTypes";

/**
 * Level 3 — PRISTILBUDET (status «tilbud_sendt»). New component rather than
 * more branches in Forslag: the quote is a different document with a
 * different surface (cream .vk-paper deed — same skjøte-language as the
 * Eierskap panel: paper, hairline, stamp-style heading), while Forslag stays
 * the dark-bench reveal. The parent owns the godkjenn call (same contract as
 * Forslag/onLike) and flips to phase «videre» on success.
 *
 * Also exports:
 *   Kvittering — the approved quote as a printable cream receipt
 *                (phase «videre», inside a <details>).
 *   Skjotet    — the level 5 handover sheet (status «levert»): closing
 *                report + the approved quote + print, with the maintenance
 *                CTA. Print CSS in portal.css prints ONLY the sheet.
 */

const EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

export const TILBUD_HEADING_ID = "vk-portal-ttittel";
/** The collapsed assessment <details> — rail-back to level 2 opens it. */
export const TILBUD_VURDERING_ID = "vk-portal-tvurdering";

/** The binding terms checkbox + its text — the text is the checkbox's
    <label> AND the aria-describedby target of the approve button. */
const VILKAR_BOKS_ID = "vk-portal-vilkar-boks";
const VILKAR_TEKST_ID = "vk-portal-vilkar-tekst";

/** «45 000 kr» — structured øre amount, whole kroner unless øre matter. */
function formatBelop(ore: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "no" ? "nb-NO" : "en-GB", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: ore % 100 === 0 ? 0 : 2,
    maximumFractionDigits: ore % 100 === 0 ? 0 : 2,
  }).format(ore / 100);
}

function formatDato(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "no" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** The price block — structured amount when present, free text otherwise. */
function PrisBlokk({ tilbud, t, lang }: { tilbud: PortalTilbud; t: PortalContent; lang: Lang }) {
  const strukturert = typeof tilbud.prisBelopOre === "number";
  return (
    <div className="vk-portal-tprisblokk">
      <p className="vk-mono vk-portal-tlabel">{t.tilbud.prisLabel}</p>
      {strukturert ? (
        <>
          <p className="vk-portal-tpris">
            {formatBelop(tilbud.prisBelopOre as number, lang)}
          </p>
          <p className="vk-mono vk-portal-tprismva">{t.tilbud.belopEksMva}</p>
        </>
      ) : (
        <p className="vk-portal-tpris">{tilbud.pris}</p>
      )}
    </div>
  );
}

/**
 * «Skriv ut / lagre som PDF» — hidden in the printout itself.
 *
 * The ark-only print rules in portal.css are scoped behind body.vk-print-ark
 * so a manual Cmd+P never produces a blank page: only THIS button arms the
 * «print only the sheet»-mode, and afterprint disarms it again.
 */
function skrivUtArk() {
  document.body.classList.add("vk-print-ark");
  const cleanup = () => {
    document.body.classList.remove("vk-print-ark");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

function SkrivUtKnapp({ t }: { t: PortalContent }) {
  return (
    <button
      type="button"
      className="vk-portal-printknapp vk-mono vk-portal-printskjul"
      onClick={skrivUtArk}
    >
      {t.tilbud.skrivUt}
    </button>
  );
}

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
  // The binding step — the approve button stays muted until this is ticked.
  const [vilkarGodtatt, setVilkarGodtatt] = useState(false);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  const tilbud = kartlegging.tilbud;
  if (!tilbud) return null;

  const a = kartlegging.assessment;
  const sendtDato = kartlegging.tilbudSendtAt
    ? formatDato(kartlegging.tilbudSendtAt, lang)
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

        <PrisBlokk tilbud={tilbud} t={t} lang={lang} />

        <p className="vk-mono vk-portal-tleveranse">
          <span className="vk-portal-tlabel-inline">{t.tilbud.leveranseLabel}</span>
          {tilbud.leveranse}
        </p>

        {/* The binding line — a real checkbox whose <label> IS the locked
            vilkår text (44px touch area via label padding; the sheet's
            ink-on-cream focus ring covers the box). */}
        <div
          className="vk-portal-vilkar"
          role="group"
          aria-label={t.tilbud.vilkarLabel}
        >
          <input
            id={VILKAR_BOKS_ID}
            type="checkbox"
            className="vk-portal-vilkar-boks"
            checked={vilkarGodtatt}
            onChange={(e) => setVilkarGodtatt(e.target.checked)}
          />
          <label
            id={VILKAR_TEKST_ID}
            htmlFor={VILKAR_BOKS_ID}
            className="vk-portal-vilkar-tekst"
          >
            {t.tilbud.vilkar}
          </label>
        </div>

        <div className="vk-portal-tactions">
          {/* aria-disabled (not display:none, not disabled-attr) while the
              terms are unticked — focusable and discoverable, click guarded;
              the describedby points at the vilkår text so the WHY is read. */}
          <button
            type="button"
            className="vk-btn vk-btn--cta"
            disabled={godkjenner}
            aria-disabled={!vilkarGodtatt || godkjenner || undefined}
            aria-busy={godkjenner || undefined}
            aria-describedby={VILKAR_TEKST_ID}
            onClick={() => {
              if (!vilkarGodtatt || godkjenner) return;
              onGodkjenn();
            }}
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
            {t.tilbud.godkjennFeil}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ── The approved-quote body — shared by Kvittering and Skjotet ──
   Renders the quote text, the price, the delivery line, the EXACT terms
   the customer accepted (godkjentVilkar from the row — never the current
   portalContent copy, which may have been reworded since), the approval
   date and the Workflows AS signature. */

function KvitteringInnhold({
  kartlegging,
  t,
  lang,
}: {
  kartlegging: PortalKartlegging;
  t: PortalContent;
  lang: Lang;
}) {
  const tilbud = kartlegging.tilbud;
  if (!tilbud) return null;
  const godkjentDato = kartlegging.godkjentAt
    ? formatDato(kartlegging.godkjentAt, lang)
    : null;
  // The row's canonical text is authoritative; the locked content string is
  // only a fallback for rows approved before godkjent_vilkar was returned.
  const vilkar = kartlegging.godkjentVilkar ?? t.tilbud.vilkar;
  return (
    <>
      {tilbud.tekst.split("\n\n").map((avsnitt, i) => (
        <p key={i} className="vk-portal-tavsnitt">
          {avsnitt}
        </p>
      ))}

      <PrisBlokk tilbud={tilbud} t={t} lang={lang} />

      <p className="vk-mono vk-portal-tleveranse">
        <span className="vk-portal-tlabel-inline">{t.tilbud.leveranseLabel}</span>
        {tilbud.leveranse}
      </p>

      <div className="vk-portal-kvittvilkar">
        <p className="vk-mono vk-portal-tlabel">{t.tilbud.kvittering.vilkarTittel}</p>
        <p className="vk-portal-tavsnitt">{vilkar}</p>
      </div>

      <footer className="vk-portal-kvittfot">
        {godkjentDato ? (
          <p className="vk-mono vk-portal-tdato">
            {t.tilbud.kvittering.godkjentTemplate.replace("{dato}", godkjentDato)}
          </p>
        ) : null}
        <p className="vk-portal-signatur">{t.tilbud.kvittering.signatur}</p>
      </footer>
    </>
  );
}

/* ── Kvittering — the printable receipt behind status «videre» ── */

export function Kvittering({ kartlegging }: { kartlegging: PortalKartlegging }) {
  const { lang } = useLang();
  const t = portalContent[lang];
  if (!kartlegging.tilbud) return null;

  return (
    <div className="vk-paper vk-portal-tark vk-portal-printark">
      <header className="vk-portal-tark-head">
        <p className="vk-mono vk-portal-tstempel">{t.tilbud.kvittering.stempel}</p>
        <SkrivUtKnapp t={t} />
      </header>
      <KvitteringInnhold kartlegging={kartlegging} t={t} lang={lang} />
    </div>
  );
}

/* ── Level 5 — SKJØTET (status «levert»): the handover ── */

export function Skjotet({
  kartlegging,
  autoFocus = false,
}: {
  kartlegging: PortalKartlegging;
  autoFocus?: boolean;
}) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  const levertDato = kartlegging.levertAt
    ? formatDato(kartlegging.levertAt, lang)
    : null;
  const rapport = kartlegging.sluttrapport;

  return (
    <section className="vk-portal-skjotet">
      <p className="vk-kicker vk-portal-fkicker">{t.levels[4].navn}</p>
      <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
        {t.skjotet.tittel}
      </h1>
      <p className="vk-portal-lead">{t.skjotet.tekst}</p>

      {/* The deed — cream sheet; the print button prints ONLY this. */}
      <div className="vk-paper vk-portal-tark vk-portal-printark">
        <header className="vk-portal-tark-head">
          <p className="vk-mono vk-portal-tstempel">{t.skjotet.stempel}</p>
          {levertDato ? (
            <p className="vk-mono vk-portal-tdato">
              {t.skjotet.levertTemplate.replace("{dato}", levertDato)}
            </p>
          ) : null}
        </header>

        {rapport?.tekst ? (
          <>
            <p className="vk-mono vk-portal-tlabel">{t.skjotet.sluttrapportTittel}</p>
            {rapport.tekst.split("\n\n").map((avsnitt, i) => (
              <p key={i} className="vk-portal-tavsnitt">
                {avsnitt}
              </p>
            ))}
          </>
        ) : null}

        {kartlegging.tilbud ? (
          <div className="vk-portal-kvittdel">
            <p className="vk-mono vk-portal-tlabel">{t.skjotet.kvitteringTittel}</p>
            <KvitteringInnhold kartlegging={kartlegging} t={t} lang={lang} />
          </div>
        ) : null}

        <div className="vk-portal-tactions vk-portal-printskjul">
          <SkrivUtKnapp t={t} />
        </div>
      </div>

      {/* The quiet maintenance / next-project CTA. */}
      <div className="vk-portal-videre">
        <p className="vk-portal-videre-tekst">{t.skjotet.ctaTekst}</p>
        <div className="vk-portal-introrow">
          <a href={`mailto:${EMAIL}`} className="vk-btn vk-btn--cta">
            {t.skjotet.ctaKnapp}
          </a>
          <a href={PHONE_HREF} className="vk-portal-quietlink vk-mono">
            {PHONE_DISPLAY}
          </a>
        </div>
      </div>

      <p className="vk-mono vk-portal-arkivlinje">{t.skjotet.arkivTekst}</p>
    </section>
  );
}
