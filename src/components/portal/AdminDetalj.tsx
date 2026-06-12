"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLang } from "@/components/LanguageProvider";
import AdminBenken from "@/components/portal/AdminBenken";
import AdminFaktura from "@/components/portal/AdminFaktura";
import Faner, { FanePanel, type FaneDef } from "@/components/portal/Faner";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import type { Lang } from "@/lib/translations";
import {
  SLUTTRAPPORT_TEKST_MAX,
  TILBUD_BELOP_MAX_ORE,
  TILBUD_LEVERANSE_MAX,
  TILBUD_MVA_SATSER,
  TILBUD_PRIS_MAX,
  TILBUD_TEKST_MAX,
  type AdminKartlegging,
  type AdminListItem,
  type PortalOppfolgingAnswer,
  type PortalSluttrapport,
  type PortalTilbud,
  type ResearchFunn,
  type ResearchUnderside,
} from "@/lib/portalTypes";

/**
 * Verkstedkontoret — one kartlegging on the bench. Petters working view:
 * the price signals up top (budget answer + Regnskapsregisteret figures),
 * the answers (labelled from the wizard steps, incl. the AI follow-up),
 * the research findings (now with crawled subpages and key figures), the
 * assessment exactly as the customer saw it (same vk-portal-f* classes as
 * Forslag), THE QUOTE FORM (with the structured price for Fiken), the
 * lever-flow to level 5 SKJØTET, fakturering (AdminFaktura) and Benken.
 *
 * The parent owns all POSTs: onSendTilbud/onLever/onAngreLever resolve true
 * on success and flip kartlegging optimistically, so badges update by prop.
 *
 * After the customer approves (videre/levert) the quote is FROZEN in the
 * database — the form gives way to a locked, read-only view with the why.
 */

/** The detail's tabs — Oversikt first; the project tabs join on «videre». */
type AdmFane =
  | "oversikt"
  | "kartlegging"
  | "tilbud"
  | "meldinger"
  | "fakturering"
  | "bygging";

interface AdminDetaljProps {
  kartlegging: AdminKartlegging;
  /**
   * The matching LIST row — carries the unread counters (NYTT FRA KUNDE →
   * the Meldinger badge), open requests and last activity. Optional: the
   * detail stands on its own when the list hasn't loaded it.
   */
  listeRad?: AdminListItem | null;
  /** The venter-på-deg/SLA reason — computed by AdminApp's list logic. */
  venterTekst?: string | null;
  /** Future: byggefabrikken mounts its UI here (the Bygging tab). */
  bygging?: ReactNode;
  onBack: () => void;
  /** POSTs admin/tilbud — resolves true on success. */
  onSendTilbud: (tilbud: PortalTilbud) => Promise<boolean>;
  /** PATCHes admin/prosjekt {handling:"lever"} — resolves true on success. */
  onLever: (sluttrapport: PortalSluttrapport) => Promise<boolean>;
  /** PATCHes admin/prosjekt {handling:"angre"} — levert → videre. */
  onAngreLever: () => Promise<boolean>;
  /** Soft-DELETEs the row — resolves true on success (parent leaves). */
  onSlett: () => Promise<boolean>;
}

/**
 * Status chip class — «videre»/«levert» mean agreed/delivered and earn the
 * ONE green in the shop (--drift-green); every other status stays amber.
 */
export function adminChipClass(status: AdminKartlegging["status"]): string {
  return status === "videre" || status === "levert"
    ? "vk-adm-chip vk-adm-chip--godkjent"
    : "vk-adm-chip";
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

/** «45 000 kr» from øre — the structured quote price. */
export function formatBelopOre(ore: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: ore % 100 === 0 ? 0 : 2,
    maximumFractionDigits: ore % 100 === 0 ? 0 : 2,
  }).format(ore / 100);
}

/** «226 000 000 kr» / «12 400 000 USD» — Regnskapsregisteret figures. */
function formatRegnskapstall(n: number, valuta?: string): string {
  return `${new Intl.NumberFormat("nb-NO").format(n)} ${valuta ?? "kr"}`;
}

/** «45 000», «45000,50» → øre — or null when it isn't an amount. */
function krTilOre(raw: string): number | null {
  const s = raw.replace(/[\s ]/g, "").replace(",", ".");
  if (!s || !/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const kr = Number(s);
  if (!Number.isFinite(kr)) return null;
  const ore = Math.round(kr * 100);
  // Mirror the route's cap — over-the-top sums say belopUgyldig here
  // instead of bouncing as a generic server error.
  return ore > TILBUD_BELOP_MAX_ORE ? null : ore;
}

const FEIL_ID = "vk-adm-tilbud-feil";
const LEVER_FEIL_ID = "vk-adm-lever-feil";

/* ── Answers → readable lines, labelled from the wizard steps ── */

interface SvarLinje {
  key: string;
  label: string;
  verdi: string;
}

function oppfolgingOf(
  answers: Record<string, unknown>
): PortalOppfolgingAnswer | null {
  const o = answers.oppfolging;
  if (typeof o !== "object" || o === null || Array.isArray(o)) return null;
  const sporsmal = (o as Record<string, unknown>).sporsmal;
  const svar = (o as Record<string, unknown>).svar;
  if (typeof sporsmal !== "string" || typeof svar !== "string") return null;
  if (!sporsmal.trim() || !svar.trim()) return null;
  return { sporsmal: sporsmal.trim(), svar: svar.trim() };
}

function svarLinjer(
  answers: Record<string, unknown>,
  t: PortalContent
): SvarLinje[] {
  const linjer: SvarLinje[] = [];
  // research renders as its own section; bedrift folds into the heading
  // but keeps its line here so nothing the customer typed is hidden.
  // oppfolging gets its own pretty rendering below (never raw JSON).
  const used = new Set<string>(["research", "oppfolging"]);

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

    // The AI follow-up rides right after «dromen» — the question it asked
    // IS the label, so Petter reads it like any other wizard line.
    if (step.id === "dromen") {
      const oppf = oppfolgingOf(answers);
      if (oppf) {
        linjer.push({
          key: "oppfolging",
          label: `${oppf.sporsmal} ${t.admin.detalj.oppfolgingSuffix}`,
          verdi: oppf.svar,
        });
      }
    }
  }

  // The diagnose-samtale (new flow): the intent + the adaptive Q&A. Each
  // question IS its label, so Petter reads it like any other wizard line.
  // (Transient wizard state never reaches the back office as raw JSON.)
  used.add("samtale");
  used.add("_fase");
  used.add("_innsikt");
  const samtale = answers.samtale;
  if (typeof samtale === "object" && samtale !== null && !Array.isArray(samtale)) {
    const s = samtale as Record<string, unknown>;
    const intent = s.intent;
    if (typeof intent === "string" && intent in t.veivalg.kort) {
      linjer.push({
        key: "samtale-intent",
        label: t.samtale.veivalgLabel,
        verdi: t.veivalg.kort[intent as keyof PortalContent["veivalg"]["kort"]].tittel,
      });
    }
    if (Array.isArray(s.utvekslinger)) {
      s.utvekslinger.forEach((u, i) => {
        if (typeof u !== "object" || u === null || Array.isArray(u)) return;
        const o = u as Record<string, unknown>;
        const sp = typeof o.sporsmal === "string" ? o.sporsmal.trim() : "";
        const sv = typeof o.svar === "string" ? o.svar.trim() : "";
        if (!sp || !sv) return;
        linjer.push({ key: `samtale-${i}`, label: sp, verdi: sv });
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
  "omsetning",
  "resultat",
  "regnskapsAar",
  "valuta",
  "nettside",
  "sideTittel",
  "sideBeskrivelse",
  "undersider",
];

/** One research value → display text (numbers formatted; arrays handled
    by the dedicated undersider-renderer, never here). */
function researchVerdi(felt: keyof ResearchFunn, research: ResearchFunn): string {
  const verdi = research[felt];
  if (felt === "omsetning" || felt === "resultat") {
    return typeof verdi === "number"
      ? formatRegnskapstall(verdi, research.valuta)
      : String(verdi);
  }
  return String(verdi);
}

/* ── The price-signal box — budget answer + key figures, up top ── */

function Prislapp({
  answers,
  research,
  t,
}: {
  answers: Record<string, unknown>;
  research: ResearchFunn | null;
  t: PortalContent;
}) {
  const budsjettStep = t.steps.find((s) => s.id === "budsjett");
  const budsjettSvar =
    typeof answers.budsjett === "string" && answers.budsjett
      ? budsjettStep?.chips?.find((c) => c.id === answers.budsjett)?.label ??
        (answers.budsjett as string)
      : null;
  const omsetning =
    typeof research?.omsetning === "number" ? research.omsetning : null;
  const resultat =
    typeof research?.resultat === "number" ? research.resultat : null;

  if (!budsjettSvar && omsetning === null && resultat === null) return null;

  const aar =
    typeof research?.regnskapsAar === "number" ? ` (${research.regnskapsAar})` : "";

  return (
    <aside className="vk-adm-prislapp" aria-label={t.admin.detalj.prislappTittel}>
      <h2 className="vk-mono vk-adm-prislapp-tittel">
        {t.admin.detalj.prislappTittel}
      </h2>
      <dl className="vk-adm-prislapp-liste">
        {budsjettSvar ? (
          <div className="vk-adm-prislapp-rad">
            <dt>{t.admin.detalj.prislappBudsjett}</dt>
            <dd>{budsjettSvar}</dd>
          </div>
        ) : null}
        {omsetning !== null ? (
          <div className="vk-adm-prislapp-rad">
            <dt>
              {t.admin.detalj.researchFelter.omsetning}
              {aar}
            </dt>
            <dd>{formatRegnskapstall(omsetning, research?.valuta)}</dd>
          </div>
        ) : null}
        {resultat !== null ? (
          <div className="vk-adm-prislapp-rad">
            <dt>
              {t.admin.detalj.researchFelter.resultat}
              {aar}
            </dt>
            <dd>{formatRegnskapstall(resultat, research?.valuta)}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

export default function AdminDetalj({
  kartlegging,
  listeRad = null,
  venterTekst = null,
  bygging = null,
  onBack,
  onSendTilbud,
  onLever,
  onAngreLever,
  onSlett,
}: AdminDetaljProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const k = kartlegging;

  const [tekst, setTekst] = useState(k.tilbud?.tekst ?? "");
  const [pris, setPris] = useState(k.tilbud?.pris ?? "");
  const [leveranse, setLeveranse] = useState(k.tilbud?.leveranse ?? "");
  // Structured price — kroner as typed; parsed to øre on submit.
  const [belop, setBelop] = useState(
    typeof k.tilbud?.prisBelopOre === "number"
      ? String(k.tilbud.prisBelopOre / 100).replace(".", ",")
      : ""
  );
  const [mvaSats, setMvaSats] = useState<number>(
    typeof k.tilbud?.mvaSats === "number" ? k.tilbud.mvaSats : 25
  );
  const [sender, setSender] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [bekreftet, setBekreftet] = useState(false);
  // The lever-flow — two-stage like delete (arm → 5s → deliver).
  const [sluttrapportTekst, setSluttrapportTekst] = useState(
    k.sluttrapport?.tekst ?? ""
  );
  const [leverArmed, setLeverArmed] = useState(false);
  const [leverer, setLeverer] = useState(false);
  const [leverFeil, setLeverFeil] = useState<string | null>(null);
  const [angreArmed, setAngreArmed] = useState(false);
  const [angrer, setAngrer] = useState(false);
  const [angreFeil, setAngreFeil] = useState(false);
  // Two-stage delete: first press arms (5s window), second press deletes.
  const [slettArmed, setSlettArmed] = useState(false);
  const [sletter, setSletter] = useState(false);
  const [slettFeil, setSlettFeil] = useState(false);
  const disarmTimer = useRef<number | null>(null);
  const leverDisarmTimer = useRef<number | null>(null);
  const angreDisarmTimer = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The list row that was pressed just unmounted — land focus here.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of [disarmTimer, leverDisarmTimer, angreDisarmTimer]) {
        if (timer.current !== null) window.clearTimeout(timer.current);
      }
    };
  }, []);

  const linjer = svarLinjer(k.answers, t);
  const bedriftNavn =
    linjer.find((l) => l.key === "bedrift")?.verdi.split(" — ")[0] ??
    t.admin.liste.ukjentBedrift;
  const research = researchOf(k.answers);
  const a = k.assessment;
  const harTilbud = !!k.tilbud;
  // After approval the quote is frozen in the DB (also for admin) — the
  // form gives way to the locked view.
  const tilbudLaast = k.status === "videre" || k.status === "levert";
  // The route only accepts these statuses (409 otherwise) — don't render
  // a form for innsendt/genererer/feilet whose save is doomed.
  const tilbudKlar =
    k.status === "forslag_klart" ||
    k.status === "likt" ||
    k.status === "tilbud_sendt";

  /* ── Faner — re-housing only: every section keeps its data flow,
        it just lives behind a tab instead of further down the scroll. ── */
  const [valgtFane, setValgtFane] = useState<AdmFane>("oversikt");
  const fdef = t.admin.detalj.faner;
  // Meldinger/Fakturering finnes først når løpet er et PROSJEKT (godkjent).
  const harProsjekt = k.status === "videre" || k.status === "levert";
  // Bygging vises alt fra forslags-/tilbudsstadiet, så Autobygg kan armes
  // FØR kunden godkjenner (selve byggingen krever fortsatt godkjenning).
  const harBygg =
    k.status === "forslag_klart" ||
    k.status === "likt" ||
    k.status === "tilbud_sendt" ||
    harProsjekt;
  const nyttAntall = listeRad?.nyttAntall ?? 0;
  const nyttFraKunde = listeRad?.nyttFraKunde ?? false;
  const faner: FaneDef[] = [
    { id: "oversikt", label: fdef.oversikt },
    { id: "kartlegging", label: fdef.kartlegging },
    { id: "tilbud", label: fdef.tilbud },
    ...(harProsjekt
      ? [
          {
            id: "meldinger",
            label: fdef.meldinger,
            // The list's NYTT FRA KUNDE counter — count when known,
            // plain dot when only the flag is set (e.g. a godkjenning).
            badge:
              nyttAntall > 0
                ? nyttAntall
                : nyttFraKunde
                  ? ("dot" as const)
                  : undefined,
            badgeSr:
              nyttAntall > 0
                ? fdef.nyttTemplate.replace("{n}", String(nyttAntall))
                : nyttFraKunde
                  ? t.admin.liste.nyttFraKunde
                  : undefined,
          },
          { id: "fakturering", label: fdef.fakturering },
        ]
      : []),
    ...(harBygg ? [{ id: "bygging" as const, label: fdef.bygging }] : []),
  ];
  // Statuses only move forward, but never select a ghost tab regardless.
  const fane: AdmFane = faner.some((f) => f.id === valgtFane)
    ? valgtFane
    : "oversikt";

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sender || tilbudLaast) return;
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
    // The structured price is optional — but when typed it must parse.
    const belopTrim = belop.trim();
    if (belopTrim) {
      const ore = krTilOre(belopTrim);
      if (ore === null) {
        setFeil(t.admin.tilbudForm.belopUgyldig);
        setBekreftet(false);
        return;
      }
      tilbud.prisBelopOre = ore;
      tilbud.mvaSats = mvaSats;
    }
    setFeil(null);
    setBekreftet(false);
    setSender(true);
    const ok = await onSendTilbud(tilbud);
    setSender(false);
    if (ok) setBekreftet(true);
    else setFeil(t.admin.tilbudForm.feil);
  }

  /** Two-stage lever: first press arms; second inside 5s delivers. */
  async function lever() {
    if (leverer) return;
    const rapport = sluttrapportTekst.trim();
    if (!rapport) {
      setLeverFeil(t.admin.lever.mangler);
      setLeverArmed(false);
      return;
    }
    if (!leverArmed) {
      setLeverArmed(true);
      setLeverFeil(null);
      leverDisarmTimer.current = window.setTimeout(() => {
        setLeverArmed(false);
        leverDisarmTimer.current = null;
      }, 5000);
      return;
    }
    if (leverDisarmTimer.current !== null) {
      window.clearTimeout(leverDisarmTimer.current);
      leverDisarmTimer.current = null;
    }
    setLeverer(true);
    const ok = await onLever({ tekst: rapport });
    setLeverer(false);
    setLeverArmed(false);
    if (!ok) setLeverFeil(t.admin.lever.feil);
  }

  /** Two-stage undo: levert → videre (the report stays as a draft). */
  async function angreLever() {
    if (angrer) return;
    if (!angreArmed) {
      setAngreArmed(true);
      setAngreFeil(false);
      angreDisarmTimer.current = window.setTimeout(() => {
        setAngreArmed(false);
        angreDisarmTimer.current = null;
      }, 5000);
      return;
    }
    if (angreDisarmTimer.current !== null) {
      window.clearTimeout(angreDisarmTimer.current);
      angreDisarmTimer.current = null;
    }
    setAngrer(true);
    const ok = await onAngreLever();
    setAngrer(false);
    setAngreArmed(false);
    if (!ok) setAngreFeil(true);
  }

  /** First press arms; a second press inside 5s soft-deletes. */
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
          {k.levertAt ? (
            <>
              <span aria-hidden="true"> · </span>
              <span className="vk-adm-godkjentdato">
                {t.admin.detalj.levertTemplate.replace(
                  "{dato}",
                  formatDato(k.levertAt, lang, true)
                )}
              </span>
            </>
          ) : null}
          {k.slettetAt ? (
            <>
              <span aria-hidden="true"> · </span>
              <span className="vk-adm-slettetdato">
                {t.admin.detalj.slettetTemplate.replace(
                  "{dato}",
                  formatDato(k.slettetAt, lang, true)
                )}
              </span>
            </>
          ) : null}
        </p>
      </header>

      <Faner
        faner={faner}
        aktiv={fane}
        label={fdef.label}
        idPrefix="vk-adm-detalj"
        className="vk-adm-faner"
        onVelg={(id) => setValgtFane(id as AdmFane)}
      />

      {/* ── OVERSIKT — key signals: venter-på-deg, pris, prislapp ── */}
      <FanePanel
        idPrefix="vk-adm-detalj"
        id="oversikt"
        aktiv={fane}
        className="vk-adm-fanepanel"
      >
        {venterTekst ? (
          <div className="vk-adm-ovventer">
            <p className="vk-mono vk-adm-ovventer-tittel">
              {t.admin.detalj.oversikt.venterTittel}
            </p>
            <p className="vk-adm-ovventer-tekst">{venterTekst}</p>
          </div>
        ) : null}

        {/* ── Price signals — the first thing Petter needs for the quote ── */}
        <Prislapp answers={k.answers} research={research} t={t} />

        <dl className="vk-adm-svar">
          <div className="vk-adm-svarrad">
            <dt>{t.admin.detalj.oversikt.prisLabel}</dt>
            <dd>
              {k.tilbud
                ? typeof k.tilbud.prisBelopOre === "number"
                  ? `${formatBelopOre(k.tilbud.prisBelopOre)} ${t.tilbud.belopEksMva}`
                  : k.tilbud.pris
                : t.admin.detalj.oversikt.prisIkkeSatt}
            </dd>
          </div>
          {listeRad ? (
            <div className="vk-adm-svarrad">
              <dt>{t.admin.detalj.oversikt.apneForesporslerLabel}</dt>
              <dd>{listeRad.apneForesporsler}</dd>
            </div>
          ) : null}
          {listeRad ? (
            <div className="vk-adm-svarrad">
              <dt>{t.admin.detalj.oversikt.sistAktivitetLabel}</dt>
              <dd>{formatDato(listeRad.sistAktivitet, lang, true)}</dd>
            </div>
          ) : null}
        </dl>
      </FanePanel>

      {/* ── KARTLEGGING — answers, research, the assessment ── */}
      <FanePanel
        idPrefix="vk-adm-detalj"
        id="kartlegging"
        aktiv={fane}
        className="vk-adm-fanepanel"
      >
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
              if (felt === "undersider") {
                const sider = Array.isArray(verdi)
                  ? (verdi as ResearchUnderside[]).filter(
                      (s) => s && typeof s.url === "string"
                    )
                  : [];
                if (sider.length === 0) return null;
                return (
                  <div key={felt} className="vk-adm-svarrad">
                    <dt>{t.admin.detalj.researchFelter.undersider}</dt>
                    <dd>
                      <ul className="vk-adm-undersider">
                        {sider.map((side, i) => (
                          <li key={i}>
                            <span className="vk-mono vk-adm-underside-url">
                              {side.url}
                            </span>
                            {side.tittel ? (
                              <span className="vk-adm-underside-tittel">
                                {" "}
                                — {side.tittel}
                              </span>
                            ) : null}
                            {side.tekst ? (
                              <span className="vk-adm-underside-tekst">
                                {" "}
                                {side.tekst}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                );
              }
              return (
                <div key={felt} className="vk-adm-svarrad">
                  <dt>{t.admin.detalj.researchFelter[felt]}</dt>
                  <dd>{researchVerdi(felt, research)}</dd>
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
      </FanePanel>

      {/* ── TILBUD — the quote AND the lever-flow that closes it ── */}
      <FanePanel
        idPrefix="vk-adm-detalj"
        id="tilbud"
        aktiv={fane}
        className="vk-adm-fanepanel"
      >
      {/* ── THE QUOTE — Petters benk. Editable until the customer approves;
            after that the DB freezes it and the form yields to the locked
            read-only view with the explanation. ── */}
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

        {tilbudLaast && k.tilbud ? (
          <div className="vk-adm-tilbudlaast">
            <p className="vk-mono vk-adm-laastlinje">
              {t.admin.tilbudForm.laastTemplate.replace(
                "{dato}",
                k.godkjentAt ? formatDato(k.godkjentAt, lang, true) : "—"
              )}
            </p>
            {k.tilbud.tekst.split("\n\n").map((avsnitt, i) => (
              <p key={i} className="vk-adm-innlegg-tekst">
                {avsnitt}
              </p>
            ))}
            <dl className="vk-adm-svar">
              <div className="vk-adm-svarrad">
                <dt>{t.admin.tilbudForm.prisLabel}</dt>
                <dd>
                  {typeof k.tilbud.prisBelopOre === "number" ? (
                    <>
                      {formatBelopOre(k.tilbud.prisBelopOre)}{" "}
                      <span className="vk-mono">
                        ({t.tilbud.belopEksMva}, {k.tilbud.mvaSats ?? 25} %)
                      </span>
                      {" — "}
                      {k.tilbud.pris}
                    </>
                  ) : (
                    k.tilbud.pris
                  )}
                </dd>
              </div>
              <div className="vk-adm-svarrad">
                <dt>{t.admin.tilbudForm.leveranseLabel}</dt>
                <dd>{k.tilbud.leveranse}</dd>
              </div>
            </dl>
          </div>
        ) : tilbudLaast ? (
          /* Frozen but no quote on the row (should not happen) — say why
             the form is gone rather than offering a doomed save. */
          <p className="vk-mono vk-adm-laastlinje">
            {t.admin.tilbudForm.laastTemplate.replace(
              "{dato}",
              k.godkjentAt ? formatDato(k.godkjentAt, lang, true) : "—"
            )}
          </p>
        ) : !tilbudKlar ? (
          /* innsendt/genererer/feilet — the route would 409 a save, so
             explain instead of offering a doomed form. */
          <p className="vk-mono vk-adm-laastlinje">
            {t.admin.tilbudForm.ikkeKlar}
          </p>
        ) : (
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
            {/* Structured price — the Fiken bridge. Optional, additive. */}
            <div className="vk-adm-formrad">
              <div className="vk-portal-felt">
                <label className="vk-portal-label" htmlFor="vk-adm-belop">
                  {t.admin.tilbudForm.belopLabel}
                </label>
                <input
                  id="vk-adm-belop"
                  type="text"
                  inputMode="decimal"
                  className="vk-portal-input"
                  maxLength={14}
                  value={belop}
                  placeholder={t.admin.tilbudForm.belopPlassholder}
                  aria-invalid={feil ? true : undefined}
                  aria-describedby={feil ? FEIL_ID : "vk-adm-belop-hint"}
                  onChange={(e) => setBelop(e.target.value)}
                />
                <p id="vk-adm-belop-hint" className="vk-mono vk-adm-komp-hint">
                  {t.admin.tilbudForm.belopHint}
                </p>
              </div>
              <div className="vk-portal-felt">
                <label className="vk-portal-label" htmlFor="vk-adm-mva">
                  {t.admin.tilbudForm.mvaLabel}
                </label>
                <select
                  id="vk-adm-mva"
                  className="vk-portal-input vk-adm-mvavelger"
                  value={mvaSats}
                  onChange={(e) => setMvaSats(Number(e.target.value))}
                >
                  {TILBUD_MVA_SATSER.map((sats) => (
                    <option key={sats} value={sats}>
                      {sats} %
                    </option>
                  ))}
                </select>
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
        )}
      </section>

      {/* ── The lever-flow — close the circle to level 5 SKJØTET ── */}
      {k.status === "videre" ? (
        <section className="vk-adm-seksjon" aria-label={t.admin.lever.tittel}>
          <h2 className="vk-mono vk-adm-stittel">{t.admin.lever.tittel}</h2>
          <p className="vk-adm-tomt">{t.admin.lever.forklaring}</p>
          <div className="vk-portal-felt vk-adm-leverfelt">
            <label className="vk-portal-label" htmlFor="vk-adm-sluttrapport">
              {t.admin.lever.sluttrapportLabel}
            </label>
            <textarea
              id="vk-adm-sluttrapport"
              className="vk-portal-textarea"
              rows={5}
              maxLength={SLUTTRAPPORT_TEKST_MAX}
              value={sluttrapportTekst}
              placeholder={t.admin.lever.sluttrapportPlassholder}
              aria-invalid={leverFeil ? true : undefined}
              aria-describedby={leverFeil ? LEVER_FEIL_ID : undefined}
              onChange={(e) => setSluttrapportTekst(e.target.value)}
            />
          </div>
          <div className="vk-adm-formrad vk-adm-formrad--send">
            <button
              type="button"
              className="vk-btn vk-btn--cta"
              data-armed={leverArmed ? "true" : undefined}
              disabled={leverer}
              aria-busy={leverer || undefined}
              onClick={() => void lever()}
            >
              {leverArmed ? t.admin.lever.bekreft : t.admin.lever.knapp}
            </button>
          </div>
          {/* Mirror the armed flip in a live region (same as delete). */}
          <p className="vk-sr" role="status">
            {leverArmed ? t.admin.lever.bekreft : ""}
          </p>
          {leverFeil ? (
            <p className="vk-portal-feilmelding" role="alert" id={LEVER_FEIL_ID}>
              {leverFeil}
            </p>
          ) : null}
        </section>
      ) : null}

      {k.status === "levert" ? (
        <section className="vk-adm-seksjon" aria-label={t.admin.lever.tittel}>
          <h2 className="vk-mono vk-adm-stittel">{t.admin.lever.tittel}</h2>
          {k.levertAt ? (
            <p className="vk-mono vk-adm-sendt">
              {t.admin.lever.levertTemplate.replace(
                "{dato}",
                formatDato(k.levertAt, lang, true)
              )}
            </p>
          ) : null}
          {k.sluttrapport?.tekst ? (
            <>
              <h3 className="vk-mono vk-adm-stittel">
                {t.admin.lever.sluttrapportTittel}
              </h3>
              {k.sluttrapport.tekst.split("\n\n").map((avsnitt, i) => (
                <p key={i} className="vk-adm-innlegg-tekst">
                  {avsnitt}
                </p>
              ))}
            </>
          ) : null}
          <div>
            <button
              type="button"
              className="vk-adm-slett"
              data-armed={angreArmed ? "true" : undefined}
              disabled={angrer}
              aria-busy={angrer || undefined}
              onClick={() => void angreLever()}
            >
              {angreArmed ? t.admin.lever.angreBekreft : t.admin.lever.angreKnapp}
            </button>
          </div>
          <p className="vk-sr" role="status">
            {angreArmed ? t.admin.lever.angreBekreft : ""}
          </p>
          {angreFeil ? (
            <p className="vk-portal-feilmelding" role="alert">
              {t.admin.lever.angreFeil}
            </p>
          ) : null}
        </section>
      ) : null}
      </FanePanel>

      {/* ── MELDINGER — Benken seen from the office. Mounted (hidden)
            whenever the project exists: realtime + the NYTT-counters
            keep working across tab switches. ── */}
      {harProsjekt ? (
        <FanePanel
          idPrefix="vk-adm-detalj"
          id="meldinger"
          aktiv={fane}
          className="vk-adm-fanepanel"
        >
          <AdminBenken kartleggingId={k.id} kundeEpost={k.email} />
        </FanePanel>
      ) : null}

      {/* ── FAKTURERING — Fiken. Self-contained; meaningful once the
            customer has approved (videre) or the project is delivered. ── */}
      {harProsjekt ? (
        <FanePanel
          idPrefix="vk-adm-detalj"
          id="fakturering"
          aktiv={fane}
          className="vk-adm-fanepanel"
        >
          <AdminFaktura
            kartleggingId={k.id}
            kundeEpost={k.email}
            kundeNavn={bedriftNavn}
            orgnr={research?.orgnr}
          />
        </FanePanel>
      ) : null}

      {/* ── BYGGING — byggefabrikken plugs in via the prop; synlig alt fra
            forslags-/tilbudsstadiet så Autobygg kan armes før godkjenning. ── */}
      {harBygg ? (
        <FanePanel
          idPrefix="vk-adm-detalj"
          id="bygging"
          aktiv={fane}
          className="vk-adm-fanepanel"
        >
          {bygging ?? (
            <div className="vk-adm-byggtomt">
              <p className="vk-display vk-adm-byggtomt-tittel">
                {t.admin.detalj.bygging.tomTittel}
              </p>
              <p>{t.admin.detalj.bygging.tomTekst}</p>
            </div>
          )}
        </FanePanel>
      ) : null}

      {/* ── Slett — destructive (soft), two-stage, at the very bottom ── */}
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
        <p className="vk-mono vk-adm-komp-hint">{t.admin.slett.forklaring}</p>
        {slettFeil ? (
          <p className="vk-portal-feilmelding" role="alert">
            {t.admin.slett.feil}
          </p>
        ) : null}
      </section>
    </section>
  );
}
