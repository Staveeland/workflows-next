"use client";

import "@/styles/verksted/benken.css";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useLang } from "@/components/LanguageProvider";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import type { Lang } from "@/lib/translations";
import {
  PROSJEKT_FIL_MAX_BYTES,
  PROSJEKT_FIL_TYPER,
  PROSJEKT_FILER_MAX,
  PROSJEKT_TEKST_MAX,
  type PortalKartlegging,
  type ProsjektFaktura,
  type ProsjektFilRef,
  type ProsjektFilResponse,
  type ProsjektInnlegg,
  type ProsjektInnleggFil,
  type ProsjektPostResponse,
  type ProsjektResponse,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Lysbord, { type LysbordBilde } from "@/components/portal/Lysbord";

/**
 * «Benken» — the customer's project room (status «videre», level 4 BYGGES;
 * read-only log once «levert»).
 *
 * One chronological feed with date dividers, one card shape per innlegg
 * type, and a composer at the bottom. LIVE: a realtime channel on
 * prosjekt_innlegg + fakturaer (RLS-scoped via realtime.setAuth) triggers
 * a quiet refetch, so new posts glide in without a reload. The refetch on
 * window focus stays as the fallback — and doubles as the re-mint for
 * signed file URLs (1h TTL; a quiet interval re-fetches a feed older than
 * ~50 min so thumbnails never die in a long-open tab). Files travel in
 * two hops: POST /prosjekt/fil validates name/size/MIME and answers with
 * the ONE safe path, then the browser uploads DIRECTLY to the private
 * «prosjektfiler» bucket with the user's own token (storage RLS scopes
 * the write to this project's folder). Files come back as forced-download
 * links only — never inline.
 *
 * Unread: kartlegginger.kunde_sett_at draws the «── nytt ──» divider
 * (frozen on the session's FIRST fetch so it never moves under the
 * reader); reaching the bottom of the feed POSTs {sett:true} so Petter's
 * side can show «sett av kunden».
 *
 * Customer text renders as escaped text (React default) — never HTML.
 * lenke renders as a link only when it is https (the server guarantees it;
 * the check here is belt and suspenders).
 */

class BenkenApiError extends Error {
  status: number;
  constructor(path: string, status: number) {
    super(`${path} → ${status}`);
    this.status = status;
  }
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new BenkenApiError(path, res.status);
  return (await res.json()) as T;
}

/* ── Files: allowlist by extension AND declared MIME (mirrors the route) ── */

const FIL_ACCEPT = Object.keys(PROSJEKT_FIL_TYPER)
  .map((ext) => `.${ext}`)
  .join(",");

function filEtternavn(navn: string): string {
  const dot = navn.lastIndexOf(".");
  return dot > 0 && dot < navn.length - 1 ? navn.slice(dot + 1).toLowerCase() : "";
}

function validerFil(fil: File): "filForStor" | "filType" | null {
  if (fil.size > PROSJEKT_FIL_MAX_BYTES) return "filForStor";
  const ext = filEtternavn(fil.name);
  if (!ext || !PROSJEKT_FIL_TYPER[ext]) return "filType";
  return null;
}

/**
 * The declared MIME is the browser's word — and on some platforms it is an
 * empty word for md/csv/json. Fall back to the canonical type for the
 * extension; download-only delivery is the real wall (see the /fil route).
 */
function filMime(fil: File): string {
  const oppgitt = fil.type.trim().toLowerCase();
  if (oppgitt) return oppgitt;
  return PROSJEKT_FIL_TYPER[filEtternavn(fil.name)]?.[0] ?? "";
}

function formatStorrelse(bytes: number, lang: Lang): string {
  if (bytes >= 1024 * 1024) {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${lang === "no" ? mb.replace(".", ",") : mb} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/* ── Dates: local-day grouping, relative labels, HH:mm, kroner ── */

function lokalDagKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dagKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return lokalDagKey(d);
}

/** Day divider: «I dag» / «I går», then the date (year only when it differs). */
function formatDag(iso: string, lang: Lang, t: PortalContent): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const naa = new Date();
  if (lokalDagKey(d) === lokalDagKey(naa)) return t.benken.iDag;
  const igaar = new Date(naa.getFullYear(), naa.getMonth(), naa.getDate() - 1);
  if (lokalDagKey(d) === lokalDagKey(igaar)) return t.benken.iGar;
  const medAar = d.getFullYear() !== naa.getFullYear();
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    ...(medAar ? { year: "numeric" as const } : {}),
  }).format(d);
}

/** «14:32» — every innlegg carries its clock now, not just a day. */
function formatKlokke(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** «26. juni» — short date for forfall/betalt on the invoice panel. */
function formatDatoKort(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const medAar = d.getFullYear() !== new Date().getFullYear();
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    ...(medAar ? { year: "numeric" as const } : {}),
  }).format(d);
}

/** Øre → «28 125 kr» (decimals only when the øre demand them). */
function formatBelop(ore: number | null, valuta: string, lang: Lang): string | null {
  if (typeof ore !== "number" || !Number.isFinite(ore)) return null;
  const kroner = ore / 100;
  try {
    return new Intl.NumberFormat(lang === "en" ? "en-GB" : "nb-NO", {
      style: "currency",
      currency: valuta || "NOK",
      minimumFractionDigits: ore % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(kroner);
  } catch {
    // An exotic currency code from Fiken must never take the panel down.
    return `${kroner} ${valuta}`;
  }
}

function reduserteBevegelser(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ── The composer — main (bottom) and inline (foresporsel answer) ── */

type SendResultat = "ok" | "sendFeil" | "forMange";
type FeilKey =
  | "tomMelding"
  | "filForStor"
  | "filType"
  | "forMangeFiler"
  | "sendFeil"
  | "forMange";

interface KomposerProps {
  t: PortalContent;
  /** Unique id prefix — several composers can live on one screen. */
  idPrefix: string;
  variant: "hoved" | "svar";
  onSend: (tekst: string, filer: File[]) => Promise<SendResultat>;
}

function Komposer({ t, idPrefix, variant, onSend }: KomposerProps) {
  const { lang } = useLang();
  const [tekst, setTekst] = useState("");
  const [filer, setFiler] = useState<File[]>([]);
  const [feil, setFeil] = useState<FeilKey | null>(null);
  const [sender, setSender] = useState(false);
  const filInputRef = useRef<HTMLInputElement>(null);

  const tekstId = `${idPrefix}-tekst`;
  const filId = `${idPrefix}-fil`;
  const feilId = `${idPrefix}-feil`;

  // File errors belong to the file control, the rest to the textarea — a
  // SR user re-querying the control they must re-operate needs the context.
  const filFeil =
    feil === "filForStor" || feil === "filType" || feil === "forMangeFiler";

  const velgFil = (e: ChangeEvent<HTMLInputElement>) => {
    const valgte = Array.from(e.target.files ?? []);
    // The File objects live in state — the input can always reset, so the
    // same file can be re-picked after a remove.
    e.target.value = "";
    if (valgte.length === 0) return;
    for (const f of valgte) {
      const brudd = validerFil(f);
      if (brudd) {
        setFeil(brudd);
        return;
      }
    }
    if (filer.length + valgte.length > PROSJEKT_FILER_MAX) {
      setFeil("forMangeFiler");
      return;
    }
    setFeil((f) =>
      f === "filForStor" || f === "filType" || f === "forMangeFiler" ? null : f
    );
    setFiler((fs) => [...fs, ...valgte]);
  };

  const fjernFil = (idx: number) => {
    setFiler((fs) => fs.filter((_, i) => i !== idx));
  };

  const fjernAlleFiler = () => {
    setFiler([]);
    if (filInputRef.current) filInputRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sender) return;
    const trimmet = tekst.trim();
    // noValidate — say what's missing instead of a silent native bubble.
    if (!trimmet && filer.length === 0) {
      setFeil("tomMelding");
      return;
    }
    setFeil(null);
    setSender(true);
    // Optimistic: the room shows the note the instant Send is pressed —
    // clear the controls NOW, put everything back if the send fails.
    const sendteFiler = filer;
    setTekst("");
    fjernAlleFiler();
    const res = await onSend(trimmet, sendteFiler);
    setSender(false);
    if (res !== "ok") {
      // Restore without trampling anything typed mid-flight — clamped to
      // maks-lengden (the textarea enforces it; state must agree), and the
      // failed attachments merge back IN ADDITION to newly picked files
      // (no duplicates, never past the file cap).
      setTekst((naa) =>
        (naa && naa !== trimmet ? `${trimmet}\n\n${naa}` : trimmet).slice(
          0,
          PROSJEKT_TEKST_MAX
        )
      );
      setFiler((naa) => {
        const manglende = sendteFiler.filter(
          (f) =>
            !naa.some(
              (n) =>
                n.name === f.name &&
                n.size === f.size &&
                n.lastModified === f.lastModified
            )
        );
        return manglende.length > 0
          ? [...naa, ...manglende].slice(0, PROSJEKT_FILER_MAX)
          : naa;
      });
      setFeil(res);
    }
  };

  return (
    <form className="vk-benk-skjema" onSubmit={(e) => void submit(e)} noValidate>
      <label className="vk-portal-label" htmlFor={tekstId}>
        {variant === "svar" ? t.benken.svarLabel : t.benken.skrivLabel}
      </label>
      <textarea
        id={tekstId}
        className="vk-benk-textarea"
        rows={variant === "svar" ? 2 : 3}
        maxLength={PROSJEKT_TEKST_MAX}
        value={tekst}
        placeholder={variant === "hoved" ? t.benken.skrivPlassholder : undefined}
        aria-invalid={feil === "tomMelding" ? true : undefined}
        aria-describedby={feil && !filFeil ? feilId : undefined}
        onChange={(e) => setTekst(e.target.value)}
      />
      {/* The picked files — name + size + a 44px remove per file. */}
      {filer.length > 0 ? (
        <ul className="vk-benk-filliste">
          {filer.map((f, idx) => (
            <li key={`${f.name}-${idx}`} className="vk-mono vk-benk-filvalgt">
              <span>{f.name}</span>
              <span className="vk-benk-filstr">
                {formatStorrelse(f.size, lang)}
              </span>
              <button
                type="button"
                className="vk-benk-fjernfil"
                aria-label={t.benken.fjernFilTemplate.replace("{navn}", f.name)}
                onClick={() => fjernFil(idx)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="vk-benk-skjemarad">
        {/* The visible «Legg ved filer» is the label of this visually-hidden
            input — keyboard focus lands on the input and the focus ring is
            drawn on the label (sibling selector in portal.css). */}
        <input
          ref={filInputRef}
          id={filId}
          type="file"
          multiple
          className="vk-sr vk-benk-filinput"
          accept={FIL_ACCEPT}
          aria-describedby={filFeil ? feilId : undefined}
          onChange={velgFil}
        />
        <label htmlFor={filId} className="vk-mono vk-benk-filknapp">
          {t.benken.velgFil}
        </label>
        {filer.length === 0 ? (
          <span className="vk-mono vk-benk-filhint">{t.benken.filHint}</span>
        ) : null}
        {/* Never disabled mid-flight: disabling the focused button drops
            keyboard focus to <body>. The `if (sender) return` guard in
            submit() stops double sends; aria-disabled + aria-busy tell AT. */}
        <button
          type="submit"
          className="vk-btn vk-benk-send"
          aria-disabled={sender || undefined}
          aria-busy={sender || undefined}
        >
          {variant === "svar" ? t.benken.svarSend : t.benken.sendKnapp}
        </button>
      </div>
      {feil ? (
        <p id={feilId} className="vk-portal-feilmelding" role="alert">
          {t.benken[feil]}
        </p>
      ) : null}
    </form>
  );
}

/* ── Feed pieces ── */

/**
 * Who wrote it — the visible byline on every feed card, now with the
 * clock. Workflows-innlegg carry the small lantern dot + «Workflows»;
 * the customer's own posts say «Deg».
 */
function Byline({
  fra,
  tid,
  t,
}: {
  fra: ProsjektInnlegg["fra"];
  tid?: string;
  t: PortalContent;
}) {
  return (
    <p className="vk-mono vk-benk-byline">
      {fra === "workflows" ? (
        <>
          <span className="vk-benk-byline-dot" aria-hidden="true" />
          {t.benken.fraWorkflows}
        </>
      ) : (
        t.benken.degSelv
      )}
      {tid ? <span className="vk-benk-tid">{tid}</span> : null}
    </p>
  );
}

/**
 * The attachments on one innlegg: raster previews (bilde=true) as
 * thumbnails that open lysbordet, everything else as the forced-download
 * link row. A file whose signing hiccuped keeps its name, link-less.
 */
function Filer({
  filer,
  t,
  onVis,
}: {
  filer: ProsjektInnleggFil[];
  t: PortalContent;
  onVis: (bilde: LysbordBilde) => void;
}) {
  if (filer.length === 0) return null;
  const bilder = filer.filter((f) => f.bilde && f.url);
  const andre = filer.filter((f) => !f.bilde || !f.url);
  return (
    <>
      {bilder.length > 0 ? (
        <div className="vk-benk-bilder" data-antall={Math.min(bilder.length, 3)}>
          {bilder.map((f, idx) => (
            <button
              key={`${f.navn}-${idx}`}
              type="button"
              className="vk-benk-bilde"
              aria-label={t.benken.visBildeTemplate.replace("{navn}", f.navn)}
              onClick={() => onVis({ navn: f.navn, url: f.url as string })}
            >
              {/* Raster only (bilde=true is server-set) — <img> never runs
                  script. alt lives on the button label; the lysbord repeats
                  the filename as proper alt text. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url as string} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {andre.map((f, idx) =>
        f.url ? (
          <a
            key={`${f.navn}-${idx}`}
            className="vk-mono vk-benk-fil"
            href={f.url}
            aria-label={t.benken.lastNedTemplate.replace("{navn}", f.navn)}
          >
            <span aria-hidden="true">↓</span>
            {f.navn}
          </a>
        ) : (
          // Signing hiccuped server-side — name the file without a dead link.
          <span
            key={`${f.navn}-${idx}`}
            className="vk-mono vk-benk-fil vk-benk-fil--dau"
          >
            {f.navn}
          </span>
        )
      )}
    </>
  );
}

/** Belt and suspenders — the server already filters to https-only. */
function httpsLenke(innlegg: ProsjektInnlegg): string | null {
  return innlegg.lenke && innlegg.lenke.startsWith("https://") ? innlegg.lenke : null;
}

/* ── The optimistic note — the post as it looks while in flight ── */

interface VenterInnlegg {
  tekst: string;
  filNavn: string[];
  /** Set when this answers a foresporsel — renders nested in that card. */
  svarPa: string | null;
  /** Per-file upload step — null once the innlegg POST itself runs. */
  opplasting: { navn: string; i: number; n: number } | null;
}

function VenterVisning({ venter, t }: { venter: VenterInnlegg; t: PortalContent }) {
  return (
    <>
      <p className="vk-mono vk-benk-byline">
        {t.benken.degSelv}
        <span className="vk-benk-tid vk-benk-venter-chip">
          {t.benken.senderChip}
        </span>
      </p>
      {venter.tekst ? <p className="vk-benk-tekst">{venter.tekst}</p> : null}
      {venter.filNavn.map((navn, idx) => (
        <p key={`${navn}-${idx}`} className="vk-mono vk-benk-venter-fil">
          {navn}
        </p>
      ))}
      {venter.opplasting ? (
        // Polite progress at file granularity (max 6 announcements) —
        // storage-js exposes no byte progress, so honest steps it is.
        <p className="vk-mono vk-benk-opplast" role="status">
          {t.benken.lasterOppTemplate
            .replace("{navn}", venter.opplasting.navn)
            .replace("{i}", String(venter.opplasting.i))
            .replace("{n}", String(venter.opplasting.n))}
          <span className="vk-benk-opplast-spor" aria-hidden="true">
            <span
              className="vk-benk-opplast-fyll"
              style={{
                width: `${Math.round(((venter.opplasting.i - 1) / venter.opplasting.n) * 100)}%`,
              }}
            />
          </span>
        </p>
      ) : null}
    </>
  );
}

interface ForesporselKortProps {
  innlegg: ProsjektInnlegg;
  /** The customer's answers (svar_pa → this innlegg), rendered beneath. */
  svar: ProsjektInnlegg[];
  /** An in-flight answer to THIS foresporsel — optimistic nested note. */
  venter: VenterInnlegg | null;
  /** «levert» room: the inline composer is retired with the main one. */
  laast: boolean;
  t: PortalContent;
  lang: Lang;
  onSvar: (tekst: string, filer: File[]) => Promise<SendResultat>;
  onVis: (bilde: LysbordBilde) => void;
}

function ForesporselKort({
  innlegg,
  svar,
  venter,
  laast,
  t,
  lang,
  onSvar,
  onVis,
}: ForesporselKortProps) {
  const apen = innlegg.foresporselStatus === "apen";
  const levertRef = useRef<HTMLSpanElement>(null);
  const svarte = useRef(false);

  // The inline composer unmounts when the flip to «levert» lands — keep
  // focus in the card (the chip) instead of dropping SR users on <body>.
  useEffect(() => {
    if (!apen && svarte.current) levertRef.current?.focus();
  }, [apen]);

  const send = async (tekst: string, filer: File[]): Promise<SendResultat> => {
    const res = await onSvar(tekst, filer);
    if (res === "ok") svarte.current = true;
    return res;
  };

  return (
    <>
      <div className="vk-benk-kortlabelrad">
        <p className="vk-mono vk-benk-kortlabel">{t.benken.foresporselLabel}</p>
        {!apen ? (
          <span
            ref={levertRef}
            tabIndex={-1}
            className="vk-mono vk-benk-levertchip"
          >
            {t.benken.levertChip}
          </span>
        ) : null}
      </div>
      <Byline fra={innlegg.fra} tid={formatKlokke(innlegg.createdAt, lang)} t={t} />
      {innlegg.tekst ? <p className="vk-benk-tekst">{innlegg.tekst}</p> : null}
      <Filer filer={innlegg.filer} t={t} onVis={onVis} />
      {apen && !laast ? (
        <Komposer
          t={t}
          idPrefix={`vk-benk-svar-${innlegg.id}`}
          variant="svar"
          onSend={send}
        />
      ) : null}
      {svar.length > 0 || venter ? (
        <ul className="vk-benk-svarliste">
          {svar.map((s) => (
            <li key={s.id} className="vk-benk-svar">
              <Byline fra={s.fra} tid={formatKlokke(s.createdAt, lang)} t={t} />
              {s.tekst ? <p className="vk-benk-tekst">{s.tekst}</p> : null}
              <Filer filer={s.filer} t={t} onVis={onVis} />
            </li>
          ))}
          {venter ? (
            <li className="vk-benk-svar vk-benk-venter">
              <VenterVisning venter={venter} t={t} />
            </li>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}

/* ── The room ── */

interface BenkenProps {
  kartlegging: PortalKartlegging;
  /** Mock mode skips the real storage upload (the path is fabricated). */
  devMock?: boolean;
  /** Focus the heading on mount (phase change — established pattern). */
  autoFocus?: boolean;
  /** Same token source as the rest of the portal (dev-mock aware). */
  getToken: () => Promise<string | null>;
}

/** Feed older than this re-fetches on the quiet timer (signed URLs: 1h). */
const URL_STALE_MS = 50 * 60_000;

export default function Benken({
  kartlegging,
  devMock = false,
  autoFocus = false,
  getToken,
}: BenkenProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [data, setData] = useState<ProsjektResponse | null>(null);
  const [lastefeil, setLastefeil] = useState(false);
  // Polite live region — keys, not strings, so hent() stays language-free.
  const [live, setLive] = useState<"" | "sendt" | "nytt">("");
  /** Lysbordet — the ONE lightbox instance both card types open into. */
  const [lysbilde, setLysbilde] = useState<LysbordBilde | null>(null);
  /**
   * The optimistic notes — keyed per composer (svarPa-id, or "hoved" for
   * the main one) so simultaneous sends from different composers never
   * overwrite or drop each other's note.
   */
  const [venter, setVenter] = useState<Record<string, VenterInnlegg>>({});
  /** Ids that arrived on the LAST fetch — they glide in (CSS, motion-gated). */
  const [nyeIds, setNyeIds] = useState<Set<string>>(() => new Set());

  const dataRef = useRef<ProsjektResponse | null>(null);
  const seqRef = useRef(0);
  const antallRef = useRef<number | null>(null);
  const sendteRef = useRef(false);
  const liveTimerRef = useRef<number | null>(null);
  /** Set by «Prøv igjen» — a successful retry must not drop focus on <body>. */
  const provIgjenRef = useRef(false);
  /** Ids known from the previous fetch — the diff gets the glide-in class. */
  const kjenteIdsRef = useRef<Set<string>>(new Set());
  /**
   * kunde_sett_at as it stood on the FIRST fetch of this session — the
   * «── nytt ──» divider freezes here so marking-as-read never yanks the
   * line out from under the reader. undefined = not fetched yet.
   */
  const nyttFraRef = useRef<string | null | undefined>(undefined);
  /** The bottom sentinel — scroll target AND read-marker trigger. */
  const bunnRef = useRef<HTMLDivElement>(null);
  const bunnSynligRef = useRef(false);
  /** Read-marker bookkeeping: newest createdAt already stamped. */
  const sistMarkertRef = useRef<string | null>(null);
  const settInFlightRef = useRef(false);
  /** Debounce for realtime-triggered refetches (bursts → one fetch). */
  const hentTimerRef = useRef<number | null>(null);
  /** Last successful fetch — the stale-URL timer reads this. */
  const sistHentetRef = useRef(0);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (liveTimerRef.current !== null) window.clearTimeout(liveTimerRef.current);
      if (hentTimerRef.current !== null) window.clearTimeout(hentTimerRef.current);
    };
  }, []);

  // Live regions announce *changes* — clear first, fill on the next beat,
  // so the same message can be announced twice in a row (two sends).
  const annonser = useCallback((hva: "sendt" | "nytt") => {
    setLive("");
    if (liveTimerRef.current !== null) window.clearTimeout(liveTimerRef.current);
    liveTimerRef.current = window.setTimeout(() => setLive(hva), 80);
  }, []);

  const scrollTilBunn = useCallback((myk: boolean) => {
    bunnRef.current?.scrollIntoView({
      block: "end",
      behavior: myk && !reduserteBevegelser() ? "smooth" : "auto",
    });
  }, []);

  /**
   * Stamp kunde_sett_at — fired when the reader actually reaches the
   * bottom sentinel (never on mere mount). Throttled: only when something
   * newer than the last stamp exists, never two in flight.
   */
  const markerLest = useCallback(async () => {
    const d = dataRef.current;
    if (!d || d.innlegg.length === 0) return;
    const nyeste = d.innlegg[d.innlegg.length - 1].createdAt;
    const terskel = sistMarkertRef.current ?? d.kundeSettAt ?? null;
    if (terskel && Date.parse(nyeste) <= Date.parse(terskel)) return;
    if (settInFlightRef.current) return;
    settInFlightRef.current = true;
    try {
      const token = await getToken();
      if (!token) return;
      await api<ProsjektPostResponse>("/api/portal/prosjekt", token, {
        method: "POST",
        body: JSON.stringify({ id: kartlegging.id, sett: true }),
      });
      sistMarkertRef.current = nyeste;
    } catch (err) {
      // A failed read marker is invisible to the reader — log and move on.
      console.error("[benken] sett failed", err);
    } finally {
      settInFlightRef.current = false;
    }
  }, [getToken, kartlegging.id]);

  /** One fetch of the whole room — last started wins (no polling). */
  const hent = useCallback(async () => {
    const seq = ++seqRef.current;
    try {
      const token = await getToken();
      if (!token) throw new BenkenApiError("/api/portal/prosjekt", 401);
      const res = await api<ProsjektResponse>(
        `/api/portal/prosjekt?id=${encodeURIComponent(kartlegging.id)}`,
        token
      );
      if (seq !== seqRef.current) return;
      // Freeze the unread divider on the session's FIRST answer.
      if (nyttFraRef.current === undefined) {
        nyttFraRef.current = res.kundeSettAt ?? null;
      }
      // The diff against the previous fetch glides in.
      if (kjenteIdsRef.current.size > 0) {
        const ferske = new Set<string>();
        for (const i of res.innlegg) {
          if (!kjenteIdsRef.current.has(i.id)) ferske.add(i.id);
        }
        if (ferske.size > 0) setNyeIds(ferske);
      }
      kjenteIdsRef.current = new Set(res.innlegg.map((i) => i.id));
      dataRef.current = res;
      sistHentetRef.current = Date.now();
      setData(res);
      setLastefeil(false);
      // Recovering via «Prøv igjen» unmounts the feilboks (and the focused
      // button) — land on the heading so the state change is perceivable.
      if (provIgjenRef.current) {
        provIgjenRef.current = false;
        headingRef.current?.focus();
      }
      const antall = res.innlegg.length;
      const forrige = antallRef.current;
      if (forrige === null) {
        // First load: land the reader by the composer and the newest post —
        // the established chat posture (history is one scroll up). NOT in
        // the levert archive: there Benken sits under the skjøte, and the
        // reader must meet the handover sheet, not the feed's tail.
        if (antall > 0 && res.status !== "levert") {
          window.requestAnimationFrame(() => scrollTilBunn(false));
        }
      } else if (antall > forrige) {
        if (!sendteRef.current) {
          annonser("nytt");
          // Glide along ONLY if the reader already sits at the bottom —
          // never yank someone reading back through the history.
          if (bunnSynligRef.current) {
            window.requestAnimationFrame(() => scrollTilBunn(true));
          }
        }
      }
      sendteRef.current = false;
      antallRef.current = antall;
      // Content changed under an already-visible sentinel fires no new
      // IntersectionObserver entry — re-check the marker by hand.
      if (bunnSynligRef.current) void markerLest();
    } catch (err) {
      console.error("[benken] fetch failed", err);
      // A refetch hiccup must not blank a feed that already reads fine.
      if (!dataRef.current) setLastefeil(true);
    }
  }, [annonser, getToken, kartlegging.id, markerLest, scrollTilBunn]);

  useEffect(() => {
    void hent();
  }, [hent]);

  /** Burst-safe refetch — realtime events within 250 ms become ONE fetch. */
  const planlagtHent = useCallback(() => {
    if (hentTimerRef.current !== null) return;
    hentTimerRef.current = window.setTimeout(() => {
      hentTimerRef.current = null;
      void hent();
    }, 250);
  }, [hent]);

  // Refresh when the visitor comes back to the tab — the fallback that
  // also re-mints signed URLs after an absence. No content polling.
  useEffect(() => {
    const onFocus = () => void hent();
    const onVisible = () => {
      if (document.visibilityState === "visible") void hent();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hent]);

  // Signed file URLs die after 1h. A tab that stays visible (second
  // monitor) never refires focus — this quiet check re-fetches at most
  // once per ~50 min, ONLY to keep thumbnails/links alive. Not polling.
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        sistHentetRef.current > 0 &&
        Date.now() - sistHentetRef.current > URL_STALE_MS
      ) {
        void hent();
      }
    }, 60_000);
    return () => window.clearInterval(iv);
  }, [hent]);

  /**
   * LIVE — postgres_changes on this project's innlegg + fakturaer. The
   * events are RLS-scoped: realtime.setAuth carries the user's own token
   * (supabase-js re-applies it on TOKEN_REFRESHED). Payloads carry raw
   * storage paths, never signed URLs — so every event funnels into the
   * same refetch, which signs properly and keeps ONE rendering path.
   */
  useEffect(() => {
    if (devMock) return;
    const sb = supabaseBrowser();
    let kanal: RealtimeChannel | null = null;
    let avbrutt = false;
    void (async () => {
      const token = await getToken();
      if (avbrutt || !token) return;
      await sb.realtime.setAuth(token);
      if (avbrutt) return;
      kanal = sb
        .channel(`benken:${kartlegging.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "prosjekt_innlegg",
            filter: `kartlegging_id=eq.${kartlegging.id}`,
          },
          () => planlagtHent()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "fakturaer",
            filter: `kartlegging_id=eq.${kartlegging.id}`,
          },
          () => planlagtHent()
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // The focus-refetch fallback still carries the room.
            console.error(`[benken] realtime ${status}`);
          }
        });
    })();
    return () => {
      avbrutt = true;
      if (kanal) void sb.removeChannel(kanal);
    };
  }, [devMock, getToken, kartlegging.id, planlagtHent]);

  // The bottom sentinel: watching it tells us (a) whether new posts may
  // auto-scroll and (b) when the reader has actually SEEN the bottom —
  // which is what stamps kunde_sett_at. rootMargin keeps the trigger a
  // bit above the sticky composer so «seen» means seen, not covered.
  const harData = data !== null;
  useEffect(() => {
    if (!harData) return;
    const el = bunnRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          bunnSynligRef.current = entry.isIntersecting;
          if (entry.isIntersecting) void markerLest();
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [harData, markerLest]);

  /**
   * One customer post: each file through /fil (the validated path), then
   * the DIRECT upload with the user's own token — sequentially, so one
   * failure stops the run before the innlegg POST. Then the innlegg POST
   * with filer[] — optionally answering a foresporsel (svarPa → «levert»).
   * The optimistic note lives through the whole run and is dropped only
   * AFTER the refetch that contains the real post (no flicker, no gap).
   */
  const send = useCallback(
    async (
      tekst: string,
      filer: File[],
      svarPa?: string
    ): Promise<SendResultat> => {
      // Each composer has its own optimistic slot — progress and cleanup
      // below all address THIS key, never a sibling composer's note.
      const nokkel = svarPa ?? "hoved";
      const fjernVenter = () =>
        setVenter((v) => {
          if (!(nokkel in v)) return v;
          const neste = { ...v };
          delete neste[nokkel];
          return neste;
        });
      setVenter((v) => ({
        ...v,
        [nokkel]: {
          tekst,
          filNavn: filer.map((f) => f.name),
          svarPa: svarPa ?? null,
          opplasting: null,
        },
      }));
      // Own post: always bring the reader to their note (chat posture).
      if (!svarPa) {
        window.requestAnimationFrame(() => scrollTilBunn(true));
      }
      try {
        const token = await getToken();
        if (!token) {
          fjernVenter();
          return "sendFeil";
        }

        const filRefs: ProsjektFilRef[] = [];
        for (let i = 0; i < filer.length; i += 1) {
          const fil = filer[i];
          setVenter((v) => {
            const slot = v[nokkel];
            return slot
              ? {
                  ...v,
                  [nokkel]: {
                    ...slot,
                    opplasting: { navn: fil.name, i: i + 1, n: filer.length },
                  },
                }
              : v;
          });
          const mime = filMime(fil);
          const ref = await api<ProsjektFilResponse>(
            "/api/portal/prosjekt/fil",
            token,
            {
              method: "POST",
              body: JSON.stringify({
                id: kartlegging.id,
                navn: fil.name,
                size: fil.size,
                mime,
              }),
            }
          );
          // Mock mode fabricates the path — no real bucket to upload to.
          if (!devMock) {
            const { error } = await supabaseBrowser()
              .storage.from("prosjektfiler")
              .upload(ref.path, fil, { contentType: mime, upsert: false });
            if (error) {
              console.error("[benken] upload failed", error);
              fjernVenter();
              return "sendFeil";
            }
          }
          filRefs.push({ path: ref.path, navn: ref.navn });
        }
        setVenter((v) => {
          const slot = v[nokkel];
          return slot ? { ...v, [nokkel]: { ...slot, opplasting: null } } : v;
        });

        await api<ProsjektPostResponse>("/api/portal/prosjekt", token, {
          method: "POST",
          body: JSON.stringify({
            id: kartlegging.id,
            ...(tekst ? { tekst } : {}),
            ...(filRefs.length ? { filer: filRefs } : {}),
            ...(svarPa ? { svarPa } : {}),
          }),
        });
        sendteRef.current = true;
        annonser("sendt");
        await hent();
        fjernVenter();
        if (!svarPa) {
          window.requestAnimationFrame(() => scrollTilBunn(true));
        }
        return "ok";
      } catch (err) {
        // The composer restores the text — ONE source of truth on failure.
        fjernVenter();
        if (err instanceof BenkenApiError && err.status === 429) return "forMange";
        console.error("[benken] send failed", err);
        return "sendFeil";
      }
    },
    [annonser, devMock, getToken, hent, kartlegging.id, scrollTilBunn]
  );

  /* ── Feed: nest foresporsel-answers, weave in date dividers ── */

  const innlegg = data?.innlegg ?? [];
  const foresporselIds = new Set(
    innlegg.filter((i) => i.type === "foresporsel").map((i) => i.id)
  );
  const svarMap = new Map<string, ProsjektInnlegg[]>();
  const topp: ProsjektInnlegg[] = [];
  for (const i of innlegg) {
    if (i.svarPa && foresporselIds.has(i.svarPa)) {
      const liste = svarMap.get(i.svarPa) ?? [];
      liste.push(i);
      svarMap.set(i.svarPa, liste);
    } else {
      topp.push(i);
    }
  }

  // «levert» — the room stays readable, the composers retire.
  const status = data?.status ?? kartlegging.status;
  const levert = status === "levert";

  const nyttFra = nyttFraRef.current ?? null;
  const nyttGrense = nyttFra ? Date.parse(nyttFra) : null;

  const rader: ReactElement[] = [];
  let forrigeDag = "";
  let nyttPlassert = false;
  for (const i of topp) {
    const dag = dagKey(i.createdAt);
    if (dag !== forrigeDag) {
      forrigeDag = dag;
      rader.push(
        <li key={`dag-${dag}`} className="vk-benk-dag">
          <span className="vk-mono">{formatDag(i.createdAt, lang, t)}</span>
        </li>
      );
    }
    // «── nytt ──» — over the first workflows-post since the last visit.
    if (
      !nyttPlassert &&
      nyttGrense !== null &&
      i.fra === "workflows" &&
      Date.parse(i.createdAt) > nyttGrense
    ) {
      nyttPlassert = true;
      rader.push(
        <li key="nytt-skille" className="vk-benk-nytt">
          <span className="vk-mono" aria-hidden="true">
            {t.benken.nyttSkille}
          </span>
          <span className="vk-sr">{t.benken.nyttSkilleSr}</span>
        </li>
      );
    }
    const glir = nyeIds.has(i.id) ? " vk-benk-glir" : "";
    const tid = formatKlokke(i.createdAt, lang);
    if (i.type === "status") {
      rader.push(
        <li key={i.id} className={`vk-benk-statuslinje${glir}`}>
          <p className="vk-mono">
            <span className="vk-benk-hake" aria-hidden="true">
              ✓{" "}
            </span>
            {i.tekst}
            <span className="vk-benk-tid">{tid}</span>
          </p>
        </li>
      );
    } else if (i.type === "milepael") {
      rader.push(
        <li key={i.id} className={`vk-benk-milepael${glir}`}>
          <span className="vk-benk-milepael-stjerne" aria-hidden="true">
            ✦
          </span>
          <span className="vk-mono vk-benk-milepael-label">
            {t.benken.milepaelLabel}
          </span>
          <p className="vk-benk-milepael-tekst">{i.tekst}</p>
          <span className="vk-mono vk-benk-tid">{tid}</span>
        </li>
      );
    } else if (i.type === "faktura") {
      rader.push(
        <li key={i.id} className={`vk-benk-kort vk-benk-kort--faktura${glir}`}>
          <p className="vk-mono vk-benk-kortlabel">{t.benken.fakturaLabel}</p>
          <Byline fra={i.fra} tid={tid} t={t} />
          {i.tekst ? <p className="vk-benk-tekst">{i.tekst}</p> : null}
        </li>
      );
    } else if (i.type === "leveranse") {
      const lenke = httpsLenke(i);
      rader.push(
        <li key={i.id} className={`vk-benk-kort vk-benk-kort--leveranse${glir}`}>
          <p className="vk-mono vk-benk-kortlabel">{t.benken.leveranseLabel}</p>
          <Byline fra={i.fra} tid={tid} t={t} />
          {i.tekst ? <p className="vk-benk-tekst">{i.tekst}</p> : null}
          <Filer filer={i.filer} t={t} onVis={setLysbilde} />
          {lenke ? (
            <div className="vk-benk-kortacts">
              <a
                className="vk-btn vk-benk-apne"
                href={lenke}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.benken.apneKnapp} <span aria-hidden="true">→</span>
              </a>
            </div>
          ) : null}
        </li>
      );
    } else if (i.type === "foresporsel") {
      rader.push(
        <li
          key={i.id}
          className={`vk-benk-kort vk-benk-kort--foresporsel${
            i.foresporselStatus === "apen" ? "" : " vk-benk-kort--levert"
          }${glir}`}
        >
          <ForesporselKort
            innlegg={i}
            svar={svarMap.get(i.id) ?? []}
            venter={venter[i.id] ?? null}
            laast={levert}
            t={t}
            lang={lang}
            onSvar={(tekst, filer) => send(tekst, filer, i.id)}
            onVis={setLysbilde}
          />
        </li>
      );
    } else {
      const kunde = i.fra === "kunde";
      const lenke = httpsLenke(i);
      rader.push(
        <li
          key={i.id}
          className={`vk-benk-note ${
            kunde ? "vk-benk-note--kunde" : "vk-benk-note--verksted"
          }${glir}`}
        >
          <Byline fra={i.fra} tid={tid} t={t} />
          {i.tekst ? <p className="vk-benk-tekst">{i.tekst}</p> : null}
          <Filer filer={i.filer} t={t} onVis={setLysbilde} />
          {lenke ? (
            <a
              className="vk-portal-quietlink vk-mono"
              href={lenke}
              target="_blank"
              rel="noopener noreferrer"
            >
              {lenke}
            </a>
          ) : null}
        </li>
      );
    }
  }

  const uke = data?.uke ?? kartlegging.uke;
  const fakturaer: ProsjektFaktura[] = data?.fakturaer ?? [];
  const venterHoved = venter["hoved"] ?? null;

  return (
    <section className="vk-benk">
      <header className="vk-benk-hode">
        <p className="vk-kicker vk-portal-fkicker">{t.levels[3].navn}</p>
        <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
          {t.benken.tittel}
        </h1>
        <p className="vk-portal-lead">{t.benken.undertekst}</p>
        {/* The project clock — six bench notches; drift-green once levert. */}
        {typeof uke === "number" || levert ? (
          <div
            className="vk-benk-fremdrift"
            data-levert={levert || undefined}
            role="img"
            aria-label={
              levert
                ? t.benken.levertChip
                : t.benken.ukeTemplate.replace("{n}", String(uke))
            }
          >
            <span className="vk-mono vk-benk-uke" aria-hidden="true">
              {levert
                ? t.benken.levertChip
                : t.benken.ukeTemplate.replace("{n}", String(uke))}
            </span>
            <span className="vk-benk-fremdrift-spor" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span
                  key={n}
                  className="vk-benk-fremdrift-steg"
                  data-fylt={levert || n <= (uke ?? 0) || undefined}
                />
              ))}
            </span>
          </div>
        ) : null}
      </header>

      {!data && !lastefeil ? (
        <p className="vk-mono vk-benk-henter" role="status">
          {t.benken.henter}
        </p>
      ) : null}

      {!data && lastefeil ? (
        <div className="vk-benk-feilboks">
          <p className="vk-portal-feilmelding" role="alert">
            {t.benken.feil}
          </p>
          <button
            type="button"
            className="vk-btn"
            onClick={() => {
              provIgjenRef.current = true;
              void hent();
            }}
          >
            {t.benken.provIgjen}
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          {/* The invoice panel — papers on the bench, drafts never leave
              Fiken (RLS). The empty state keeps the shelf honest. */}
          {data.fakturaer ? (
            <section
              className="vk-benk-fakturaer"
              aria-label={t.benken.fakturaTittel}
            >
              <h2 className="vk-mono vk-benk-fakturatittel">
                {t.benken.fakturaTittel}
              </h2>
              {fakturaer.length === 0 ? (
                <p className="vk-benk-fakturatomt">{t.benken.fakturaTom}</p>
              ) : (
                <ul className="vk-benk-fakturaliste">
                  {fakturaer.map((f) => {
                    const belop = formatBelop(f.belopOre, f.valuta, lang);
                    return (
                      <li
                        key={f.id}
                        className="vk-benk-faktura"
                        data-status={f.status}
                      >
                        <div className="vk-benk-faktura-rad">
                          <span className="vk-mono vk-benk-faktura-nr">
                            {f.nummer !== null
                              ? t.benken.fakturaNrTemplate.replace(
                                  "{nr}",
                                  String(f.nummer)
                                )
                              : t.benken.fakturaUtenNr}
                          </span>
                          {belop ? (
                            <span className="vk-mono vk-benk-faktura-belop">
                              {belop}
                            </span>
                          ) : null}
                        </div>
                        {f.beskrivelse ? (
                          <p className="vk-benk-faktura-besk">{f.beskrivelse}</p>
                        ) : null}
                        <div className="vk-benk-faktura-meta">
                          <span
                            className="vk-mono vk-benk-faktura-status"
                            data-status={f.status}
                          >
                            {t.benken.fakturaStatus[f.status]}
                          </span>
                          {f.status === "betalt" && f.betalt ? (
                            <span className="vk-mono">
                              {t.benken.fakturaBetaltTemplate.replace(
                                "{dato}",
                                formatDatoKort(f.betalt, lang)
                              )}
                            </span>
                          ) : f.forfall ? (
                            <span className="vk-mono">
                              {t.benken.fakturaForfallTemplate.replace(
                                "{dato}",
                                formatDatoKort(f.forfall, lang)
                              )}
                            </span>
                          ) : null}
                          {f.status === "forfalt" ? (
                            <span className="vk-mono vk-benk-faktura-purr">
                              {t.benken.fakturaForfaltTekst}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          {topp.length === 0 && !venterHoved ? (
            <p className="vk-benk-tomt">{t.benken.tomt}</p>
          ) : (
            <ol className="vk-benk-feed" aria-label={t.benken.feedLabel}>
              {rader}
              {venterHoved ? (
                <li className="vk-benk-note vk-benk-note--kunde vk-benk-venter">
                  <VenterVisning venter={venterHoved} t={t} />
                </li>
              ) : null}
            </ol>
          )}

          {/* The bottom sentinel — scroll target + the read marker's eye. */}
          <div ref={bunnRef} className="vk-benk-bunn" aria-hidden="true" />

          {levert ? (
            <div className="vk-benk-levertboks">
              <p className="vk-benk-levertlinje">{t.benken.levertMelding}</p>
            </div>
          ) : (
            <div className="vk-benk-komposer">
              <Komposer
                t={t}
                idPrefix="vk-benk-hoved"
                variant="hoved"
                onSend={(tekst, filer) => send(tekst, filer)}
              />
              <p className="vk-mono vk-benk-sikkerhet">{t.benken.sikkerhet}</p>
            </div>
          )}
        </>
      ) : null}

      {lysbilde ? (
        <Lysbord bilde={lysbilde} onClose={() => setLysbilde(null)} />
      ) : null}

      <p className="vk-sr" role="status">
        {live === "sendt"
          ? t.benken.sendtBekreftelse
          : live === "nytt"
            ? t.benken.nyttInnlegg
            : ""}
      </p>
    </section>
  );
}
