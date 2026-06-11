"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { portalContent } from "@/lib/portalContent";
import type { PortalKartlegging } from "@/lib/portalTypes";

/**
 * The reveal — mockup as a pinned blueprint sheet, the honest assessment
 * beside it. anbefaling=ikke_ai renders WITHOUT the mockup celebration:
 * honest framing, taPrat CTA prominent.
 *
 * After «lik»: level 3 waiting state (videreTekst + kontaktkort-light) —
 * the parent owns the like call and flips kartlegging.status to "likt".
 */

const EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

export const FORSLAG_HEADING_ID = "vk-portal-ftittel";

interface ForslagProps {
  kartlegging: PortalKartlegging;
  liking: boolean;
  likeError: boolean;
  /** Focus the heading on mount (the reveal after generating). */
  autoFocus?: boolean;
  onLike: () => void;
  /** Quiet restart — back to the wizard, seeded with the old answers. */
  onRestart: () => void;
}

export default function Forslag({
  kartlegging,
  liking,
  likeError,
  autoFocus = false,
  onLike,
  onRestart,
}: ForslagProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const [avslatt, setAvslatt] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const videreRef = useRef<HTMLDivElement>(null);
  const pratRef = useRef<HTMLAnchorElement>(null);

  const liked = kartlegging.status === "likt" || kartlegging.status === "videre";
  // Don't steal focus when the proposal is restored already-liked on boot.
  const likedAtMount = useRef(liked);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  // The action blocks unmount the button the user just pressed — move focus
  // to what replaced it, so keyboard/SR users aren't dropped on <body>.
  useEffect(() => {
    if (liked && !likedAtMount.current) videreRef.current?.focus();
  }, [liked]);

  useEffect(() => {
    if (avslatt) pratRef.current?.focus();
  }, [avslatt]);

  const a = kartlegging.assessment;
  if (!a) return null;

  const ikkeAi = a.anbefaling === "ikke_ai";
  const showMockup = !ikkeAi && !!kartlegging.mockupUrl;

  return (
    <section className={`vk-portal-forslag${ikkeAi ? " vk-portal-forslag--ikkeai" : ""}`}>
      <p className="vk-kicker vk-portal-fkicker">{t.forslag.kicker}</p>
      <h1
        id={FORSLAG_HEADING_ID}
        ref={headingRef}
        tabIndex={-1}
        className="vk-display vk-portal-h1"
      >
        {ikkeAi ? t.forslag.ikkeAiTittel : a.tittel}
      </h1>
      {ikkeAi ? <p className="vk-chalk vk-portal-chalksub">{a.tittel}</p> : null}

      <div className={`vk-portal-fgrid${showMockup ? "" : " vk-portal-fgrid--solo"}`}>
        {showMockup ? (
          <figure className="vk-portal-sheet vk-rot-b">
            {/* Signed Supabase URL rotates hourly — next/image buys nothing
                here, so a plain img keeps it simple. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kartlegging.mockupUrl as string}
              alt={t.forslag.mockupAlt}
              className="vk-portal-mockup"
              width={1024}
              height={1024}
              decoding="async"
            />
          </figure>
        ) : null}

        <div className="vk-portal-fbody">
          {a.vurdering.split("\n\n").map((avsnitt, i) => (
            <p key={i} className="vk-portal-avsnitt">
              {avsnitt}
            </p>
          ))}

          <h2 className="vk-mono vk-portal-flabel">{t.forslag.skisseLabel}</h2>
          <ul className="vk-portal-skisse">
            {a.losningsskisse.map((punkt, i) => (
              <li key={i}>{punkt}</li>
            ))}
          </ul>

          <p className="vk-mono vk-portal-fline">
            <span className="vk-portal-flinelabel">{t.forslag.tidslinjeLabel}</span>
            {a.tidslinje}
          </p>
          <p className="vk-mono vk-portal-fline">
            <span className="vk-portal-flinelabel">{t.forslag.nesteLabel}</span>
            {a.neste}
          </p>
        </div>
      </div>

      {liked ? (
        <div className="vk-portal-videre" ref={videreRef} tabIndex={-1}>
          <p className="vk-portal-videre-tekst" role="status">
            {t.forslag.videreTekst}
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
        </div>
      ) : ikkeAi ? (
        <div className="vk-portal-actions">
          <Link href="/#kontakt" className="vk-btn vk-btn--cta">
            {t.forslag.taPrat}
          </Link>
          <button type="button" className="vk-portal-quietlink vk-mono" onClick={onRestart}>
            {t.forslag.startPaNytt}
          </button>
        </div>
      ) : avslatt ? (
        <div className="vk-portal-actions">
          <Link href="/#kontakt" className="vk-btn" ref={pratRef}>
            {t.forslag.taPrat}
          </Link>
          <button type="button" className="vk-portal-quietlink vk-mono" onClick={onRestart}>
            {t.forslag.startPaNytt}
          </button>
        </div>
      ) : (
        <div className="vk-portal-actions">
          <button
            type="button"
            className="vk-btn vk-btn--cta"
            disabled={liking}
            aria-busy={liking || undefined}
            onClick={onLike}
          >
            {t.forslag.likerKnapp}
          </button>
          <button
            type="button"
            className="vk-btn"
            onClick={() => setAvslatt(true)}
          >
            {t.forslag.ikkeKnapp}
          </button>
          {likeError ? (
            <p className="vk-portal-feilmelding" role="alert">
              {t.feil.tekst}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
