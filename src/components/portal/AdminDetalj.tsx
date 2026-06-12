"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "@/components/LanguageProvider";
import AdminBenken from "@/components/portal/AdminBenken";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import type { Lang } from "@/lib/translations";
import {
  TILBUD_LEVERANSE_MAX,
  TILBUD_PRIS_MAX,
  TILBUD_TEKST_MAX,
  type AdminKartlegging,
  type PortalTilbud,
  type ResearchFunn,
} from "@/lib/portalTypes";

/**
 * Verkstedkontoret — one kartlegging on the bench. Petters working view:
 * the answers (labelled from the wizard steps), the research findings, the
 * assessment exactly as the customer saw it (same vk-portal-f* classes as
 * Forslag), and THE QUOTE FORM — the whole point of the room.
 *
 * The parent owns the POST: onSendTilbud resolves true on success and flips
 * kartlegging.status optimistically, so the badge here updates by prop.
 */

interface AdminDetaljProps {
  kartlegging: AdminKartlegging;
  onBack: () => void;
  /** POSTs admin/tilbud — resolves true on success. */
  onSendTilbud: (tilbud: PortalTilbud) => Promise<boolean>;
  /** DELETEs the row — resolves true on success (parent leaves the view). */
  onSlett: () => Promise<boolean>;
}

/**
 * Status chip class — «videre» means delivered/agreed and earns the ONE
 * green in the shop (--drift-green); every other status stays amber.
 */
export function adminChipClass(status: AdminKartlegging["status"]): string {
  return status === "videre" ? "vk-adm-chip vk-adm-chip--godkjent" : "vk-adm-chip";
}

/** Quiet office date — «12.06.2026», optionally with the clock. */
export function formatDato(iso: string, lang: Lang, medTid = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(
    lang === "en" ? "en-GB" : "nb-NO",
    medTid ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }
  ).format(d);
}

const FEIL_ID = "vk-adm-tilbud-feil";

/* ── Answers → readable lines, labelled from the wizard steps ── */

interface SvarLinje {
  key: string;
  label: string;
  verdi: string;
}

function svarLinjer(
  answers: Record<string, unknown>,
  t: PortalContent
): SvarLinje[] {
  const linjer: SvarLinje[] = [];
  // research renders as its own section; bedrift folds into the heading
  // but keeps its line here so nothing the customer typed is hidden.
  const used = new Set<string>(["research"]);

  for (const step of t.steps) {
    used.add(step.id);

    if (step.id === "bedrift") {
      const b = answers.bedrift;
      if (typeof b === "object" && b !== null && !Array.isArray(b)) {
        const navn = (b as Record<string, unknown>).navn;
        const nettside = (b as Record<string, unknown>).nettside;
        const deler = [navn, nettside].filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0
        );
        if (deler.length > 0) {
          linjer.push({ key: "bedrift", label: step.sporsmal, verdi: deler.join(" — ") });
        }
      }
      continue;
    }

    const chipLabel = (id: string): string =>
      step.chips?.find((c) => c.id === id)?.label ?? id;

    const raw = answers[step.id];
    if (typeof raw === "string" && raw.trim()) {
      // Single chip id (or the BRREG størrelse bucket / pure fritekst).
      linjer.push({ key: step.id, label: step.sporsmal, verdi: chipLabel(raw) });
    } else if (Array.isArray(raw) && raw.length > 0) {
      const verdier = raw
        .filter((v): v is string => typeof v === "string")
        .map(chipLabel);
      if (verdier.length > 0) {
        linjer.push({ key: step.id, label: step.sporsmal, verdi: verdier.join(", ") });
      }
    }

    // The «annet»-companion free text on chips+fritekst steps.
    const tekstKey = `${step.id}_tekst`;
    used.add(tekstKey);
    const tekst = answers[tekstKey];
    if (typeof tekst === "string" && tekst.trim()) {
      linjer.push({
        key: tekstKey,
        label: `${step.sporsmal} ${t.admin.detalj.egneOrdSuffix}`,
        verdi: tekst.trim(),
      });
    }
  }

  // Anything the wizard didn't define (future keys) — raw, never dropped.
  for (const [key, value] of Object.entries(answers)) {
    if (used.has(key) || value === null || value === undefined) continue;
    linjer.push({
      key,
      label: key,
      verdi: typeof value === "string" ? value : JSON.stringify(value),
    });
  }

  return linjer;
}

function researchOf(answers: Record<string, unknown>): ResearchFunn | null {
  const r = answers.research;
  if (typeof r !== "object" || r === null || Array.isArray(r)) return null;
  const navn = (r as Record<string, unknown>).navn;
  if (typeof navn !== "string" || !navn.trim()) return null;
  return r as unknown as ResearchFunn;
}

const RESEARCH_FELT_REKKEFOLGE: (keyof ResearchFunn)[] = [
  "navn",
  "orgnr",
  "orgform",
  "bransje",
  "ansatte",
  "sted",
  "nettside",
  "sideTittel",
  "sideBeskrivelse",
];

export default function AdminDetalj({
  kartlegging,
  onBack,
  onSendTilbud,
  onSlett,
}: AdminDetaljProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const k = kartlegging;

  const [tekst, setTekst] = useState(k.tilbud?.tekst ?? "");
  const [pris, setPris] = useState(k.tilbud?.pris ?? "");
  const [leveranse, setLeveranse] = useState(k.tilbud?.leveranse ?? "");
  const [sender, setSender] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [bekreftet, setBekreftet] = useState(false);
  // Two-stage delete: first press arms (5s window), second press deletes.
  const [slettArmed, setSlettArmed] = useState(false);
  const [sletter, setSletter] = useState(false);
  const [slettFeil, setSlettFeil] = useState(false);
  const disarmTimer = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The list row that was pressed just unmounted — land focus here.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (disarmTimer.current !== null) window.clearTimeout(disarmTimer.current);
    };
  }, []);

  const linjer = svarLinjer(k.answers, t);
  const bedriftNavn =
    linjer.find((l) => l.key === "bedrift")?.verdi.split(" — ")[0] ??
    t.admin.liste.ukjentBedrift;
  const research = researchOf(k.answers);
  const a = k.assessment;
  const harTilbud = !!k.tilbud;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sender) return;
    const tilbud: PortalTilbud = {
      tekst: tekst.trim(),
      pris: pris.trim(),
      leveranse: leveranse.trim(),
    };
    // noValidate — say what's missing instead of a silent native bubble.
    if (!tilbud.tekst || !tilbud.pris || !tilbud.leveranse) {
      setFeil(t.admin.tilbudForm.mangler);
      setBekreftet(false);
      return;
    }
    setFeil(null);
    setBekreftet(false);
    setSender(true);
    const ok = await onSendTilbud(tilbud);
    setSender(false);
    if (ok) setBekreftet(true);
    else setFeil(t.admin.tilbudForm.feil);
  }

  /** First press arms; a second press inside 5s deletes for good. */
  async function slett() {
    if (sletter) return;
    if (!slettArmed) {
      setSlettArmed(true);
      setSlettFeil(false);
      disarmTimer.current = window.setTimeout(() => {
        setSlettArmed(false);
        disarmTimer.current = null;
      }, 5000);
      return;
    }
    if (disarmTimer.current !== null) {
      window.clearTimeout(disarmTimer.current);
      disarmTimer.current = null;
    }
    setSletter(true);
    const ok = await onSlett();
    // On success the parent navigates back to the list and unmounts us —
    // only the failure path needs local state.
    if (!ok) {
      setSletter(false);
      setSlettArmed(false);
      setSlettFeil(true);
    }
  }

  return (
    <section className="vk-adm-detalj">
      <button type="button" className="vk-portal-back" onClick={onBack}>
        <span aria-hidden="true">←</span> {t.admin.detalj.tilbake}
      </button>

      <header className="vk-adm-dhode">
        <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-adm-h1">
          {bedriftNavn}
        </h1>
        <p className="vk-mono vk-adm-dmeta">
          <span>{k.email}</span>
          <span aria-hidden="true"> · </span>
          <span>{formatDato(k.createdAt, lang, true)}</span>
          <span aria-hidden="true"> · </span>
          <span className={adminChipClass(k.status)}>{t.admin.status[k.status]}</span>
          {k.tilbudSendtAt ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>
                {t.admin.detalj.tilbudSendtTemplate.replace(
                  "{dato}",
                  formatDato(k.tilbudSendtAt, lang, true)
                )}
              </span>
            </>
          ) : null}
          {k.godkjentAt ? (
            <>
              <span aria-hidden="true"> · </span>
              <span className="vk-adm-godkjentdato">
                {t.admin.detalj.godkjentTemplate.replace(
                  "{dato}",
                  formatDato(k.godkjentAt, lang, true)
                )}
              </span>
            </>
          ) : null}
        </p>
      </header>

      {/* ── The answers ── */}
      <section className="vk-adm-seksjon" aria-label={t.admin.detalj.svarTittel}>
        <h2 className="vk-mono vk-adm-stittel">{t.admin.detalj.svarTittel}</h2>
        <dl className="vk-adm-svar">
          {linjer.map((linje) => (
            <div key={linje.key} className="vk-adm-svarrad">
              <dt>{linje.label}</dt>
              <dd>{linje.verdi}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Research findings (only when the lookup landed) ── */}
      {research ? (
        <section className="vk-adm-seksjon" aria-label={t.admin.detalj.researchTittel}>
          <h2 className="vk-mono vk-adm-stittel">{t.admin.detalj.researchTittel}</h2>
          <dl className="vk-adm-svar">
            {RESEARCH_FELT_REKKEFOLGE.map((felt) => {
              const verdi = research[felt];
              if (verdi === undefined || verdi === null || verdi === "") return null;
              return (
                <div key={felt} className="vk-adm-svarrad">
                  <dt>{t.admin.detalj.researchFelter[felt]}</dt>
                  <dd>{String(verdi)}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      ) : null}

      {/* ── The assessment — the customer's view, verbatim classes ── */}
      <section className="vk-adm-seksjon" aria-label={t.admin.detalj.vurderingTittel}>
        <h2 className="vk-mono vk-adm-stittel">{t.admin.detalj.vurderingTittel}</h2>
        {a ? (
          <>
            <p className="vk-display vk-adm-atittel">
              {a.anbefaling === "ikke_ai" ? t.forslag.ikkeAiTittel : a.tittel}
            </p>
            <div
              className={`vk-portal-fgrid${k.mockupUrl ? "" : " vk-portal-fgrid--solo"}`}
            >
              {k.mockupUrl ? (
                <figure className="vk-portal-sheet vk-rot-b">
                  {/* Signed URL rotates hourly — plain img, same as Forslag. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={k.mockupUrl}
                    alt={t.admin.detalj.mockupAlt}
                    className="vk-portal-mockup"
                    width={1024}
                    height={1024}
                    loading="lazy"
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
                <h3 className="vk-mono vk-portal-flabel">{t.forslag.skisseLabel}</h3>
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
          </>
        ) : (
          <p className="vk-mono vk-adm-tomt">{t.admin.detalj.ingenVurdering}</p>
        )}
      </section>

      {/* ── THE QUOTE FORM — Petters benk ── */}
      <section className="vk-adm-seksjon" aria-label={t.admin.tilbudForm.tittel}>
        <h2 className="vk-mono vk-adm-stittel">{t.admin.tilbudForm.tittel}</h2>
        {k.tilbudSendtAt ? (
          <p className="vk-mono vk-adm-sendt">
            {t.admin.tilbudForm.sendtTemplate.replace(
              "{dato}",
              formatDato(k.tilbudSendtAt, lang, true)
            )}
          </p>
        ) : null}

        <form className="vk-adm-form" onSubmit={send} noValidate>
          <div className="vk-portal-felt">
            <label className="vk-portal-label" htmlFor="vk-adm-tekst">
              {t.admin.tilbudForm.tekstLabel}
            </label>
            <textarea
              id="vk-adm-tekst"
              className="vk-portal-textarea"
              rows={6}
              maxLength={TILBUD_TEKST_MAX}
              value={tekst}
              placeholder={t.admin.tilbudForm.tekstPlassholder}
              aria-invalid={feil ? true : undefined}
              aria-describedby={feil ? FEIL_ID : undefined}
              onChange={(e) => setTekst(e.target.value)}
            />
          </div>
          <div className="vk-adm-formrad">
            <div className="vk-portal-felt">
              <label className="vk-portal-label" htmlFor="vk-adm-pris">
                {t.admin.tilbudForm.prisLabel}
              </label>
              <input
                id="vk-adm-pris"
                type="text"
                className="vk-portal-input"
                maxLength={TILBUD_PRIS_MAX}
                value={pris}
                placeholder={t.admin.tilbudForm.prisPlassholder}
                aria-invalid={feil ? true : undefined}
                aria-describedby={feil ? FEIL_ID : undefined}
                onChange={(e) => setPris(e.target.value)}
              />
            </div>
            <div className="vk-portal-felt">
              <label className="vk-portal-label" htmlFor="vk-adm-leveranse">
                {t.admin.tilbudForm.leveranseLabel}
              </label>
              <input
                id="vk-adm-leveranse"
                type="text"
                className="vk-portal-input"
                maxLength={TILBUD_LEVERANSE_MAX}
                value={leveranse}
                placeholder={t.admin.tilbudForm.leveransePlassholder}
                aria-invalid={feil ? true : undefined}
                aria-describedby={feil ? FEIL_ID : undefined}
                onChange={(e) => setLeveranse(e.target.value)}
              />
            </div>
          </div>
          <div className="vk-adm-formrad vk-adm-formrad--send">
            <button
              type="submit"
              className="vk-btn vk-btn--cta"
              disabled={sender}
              aria-busy={sender || undefined}
            >
              {harTilbud ? t.admin.tilbudForm.oppdaterKnapp : t.admin.tilbudForm.sendKnapp}
            </button>
            {bekreftet ? (
              <p className="vk-adm-bekreftelse" role="status">
                {t.admin.tilbudForm.bekreftelse}
              </p>
            ) : null}
          </div>
          {feil ? (
            <p className="vk-portal-feilmelding" role="alert" id={FEIL_ID}>
              {feil}
            </p>
          ) : null}
        </form>
      </section>

      {/* ── Benken — the project room, only once the customer went videre.
          Self-contained: fetches and posts with its own admin token. ── */}
      {k.status === "videre" ? <AdminBenken kartleggingId={k.id} /> : null}

      {/* ── Slett — destructive, two-stage, at the very bottom ── */}
      <section className="vk-adm-seksjon">
        <button
          type="button"
          className="vk-adm-slett"
          data-armed={slettArmed ? "true" : undefined}
          disabled={sletter}
          aria-busy={sletter || undefined}
          onClick={() => void slett()}
        >
          {slettArmed ? t.admin.slett.bekreft : t.admin.slett.knapp}
        </button>
        {/* The label flip happens on the focused button — mirror it in a
            live region so the armed state is announced reliably. */}
        <p className="vk-sr" role="status">
          {slettArmed ? t.admin.slett.bekreft : ""}
        </p>
        {slettFeil ? (
          <p className="vk-portal-feilmelding" role="alert">
            {t.admin.slett.feil}
          </p>
        ) : null}
      </section>
    </section>
  );
}
