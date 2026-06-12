"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLang } from "@/components/LanguageProvider";
import { formatDato } from "@/components/portal/AdminDetalj";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import {
  PROSJEKT_FIL_MAX_BYTES,
  PROSJEKT_FIL_TYPER,
  PROSJEKT_LENKE_MAX,
  PROSJEKT_TEKST_MAX,
  PROSJEKT_UKE_MAX,
  PROSJEKT_UKE_MIN,
  type AdminProsjektPostBody,
  type ProsjektFilBody,
  type ProsjektFilRef,
  type ProsjektFilResponse,
  type ProsjektInnlegg,
  type ProsjektInnleggType,
  type ProsjektResponse,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * «Benken» seen from verkstedkontoret — the project-room feed + composer
 * rendered inside AdminDetalj for rows that went «videre». Same thread the
 * customer reads on /start, but office-dense: mono meta lines, every
 * innlegg-type visible, files as forced downloads.
 *
 * The composer POSTs /api/portal/admin/prosjekt (fra=workflows, any type);
 * files go through /api/portal/prosjekt/fil for the safe path, then the
 * browser uploads DIRECTLY to the private «prosjektfiler» bucket with
 * Petters own token — the storage policies let the admin in, no service
 * key anywhere. The uke-setter (1–6) rides along with a post or goes out
 * alone as a status innlegg. After every post: quiet refetch.
 *
 * Security posture (mirrors the routes):
 *   - customer/admin text renders as escaped React text — never HTML.
 *   - lenke renders as <a target=_blank rel="noopener noreferrer"> ONLY
 *     when it starts with https:// (the server validated; belt + braces).
 *   - filUrl is a signed download URL (attachment disposition) — inline
 *     rendering of an uploaded SVG/HTML can never happen here.
 */

interface AdminBenkenProps {
  /** The kartlegging id — the room key. */
  kartleggingId: string;
}

type Lasting = "laster" | "klar" | "feil";

const FEIL_ID = "vk-adm-benk-feil";

const TYPER: readonly ProsjektInnleggType[] = [
  "melding",
  "leveranse",
  "foresporsel",
  "status",
];

const UKER: readonly number[] = Array.from(
  { length: PROSJEKT_UKE_MAX - PROSJEKT_UKE_MIN + 1 },
  (_, i) => PROSJEKT_UKE_MIN + i
);

/** The native picker pre-filters to the server's allowlist. */
const FIL_ACCEPT = Object.keys(PROSJEKT_FIL_TYPER)
  .map((ext) => `.${ext}`)
  .join(",");

/** Real rows have uuid ids; the dev-mock rows («adm-mock-1») never do. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The admin session token. No session only happens under the dev mock
 * (those routes short-circuit before auth, so the placeholder passes);
 * in production a missing session just earns an honest 401 → feil.
 */
async function hentToken(): Promise<string> {
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? "dev-mock";
  } catch {
    return "dev-mock";
  }
}

function filEtternavn(navn: string): string {
  const dot = navn.lastIndexOf(".");
  return dot > 0 && dot < navn.length - 1 ? navn.slice(dot + 1).toLowerCase() : "";
}

/**
 * The declared MIME is the browser's word — and on some platforms it is an
 * empty word for md/csv/json. Fall back to the canonical type for the
 * extension (same trick as the customer composer); download-only delivery
 * is the real wall (see the /fil route).
 */
function filMime(f: File): string {
  const oppgitt = f.type.trim().toLowerCase();
  if (oppgitt) return oppgitt;
  return PROSJEKT_FIL_TYPER[filEtternavn(f.name)]?.[0] ?? "";
}

/** Client-side gate — the same extension+declared-MIME+size rules as /fil. */
function validerFil(f: File, t: PortalContent): string | null {
  const ext = filEtternavn(f.name);
  const tillattMime = ext ? PROSJEKT_FIL_TYPER[ext] : undefined;
  const mime = filMime(f);
  if (!tillattMime || !mime || !tillattMime.includes(mime)) {
    return t.admin.benken.komp.filUgyldig;
  }
  if (f.size > PROSJEKT_FIL_MAX_BYTES) {
    return t.admin.benken.komp.filForStor;
  }
  return null;
}

/** https only, no smuggled credentials, ≤500 chars — URL parser, no regex. */
function validerLenke(raw: string): string | null {
  if (raw.length > PROSJEKT_LENKE_MAX) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.href.length > PROSJEKT_LENKE_MAX) return null;
  return url.href;
}

export default function AdminBenken({ kartleggingId }: AdminBenkenProps) {
  const { lang } = useLang();
  const t = portalContent[lang];
  const b = t.admin.benken;

  const [prosjekt, setProsjekt] = useState<ProsjektResponse | null>(null);
  const [tilstand, setTilstand] = useState<Lasting>("laster");

  // The composer.
  const [type, setType] = useState<ProsjektInnleggType>("melding");
  const [tekst, setTekst] = useState("");
  const [lenke, setLenke] = useState("");
  const [fil, setFil] = useState<File | null>(null);
  /** Pending week pick — null means «leave kartlegginger.uke alone». */
  const [nyUke, setNyUke] = useState<number | "auto" | null>(null);
  const [sender, setSender] = useState(false);
  const [ukeSender, setUkeSender] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [bekreftet, setBekreftet] = useState(false);
  const filInput = useRef<HTMLInputElement>(null);
  const tekstFelt = useRef<HTMLTextAreaElement>(null);

  // Which control does the active error belong to? The error strings are
  // already localized, so compare against the same content keys.
  const tekstFeil = feil === b.komp.tekstMangler;
  const lenkeFeil = feil === b.komp.lenkeUgyldig;
  const filFeil =
    feil === b.komp.filUgyldig ||
    feil === b.komp.filForStor ||
    feil === b.komp.filFeil;

  const hentFeed = useCallback(
    async (stille = false) => {
      if (!stille) setTilstand("laster");
      try {
        const token = await hentToken();
        const res = await fetch(
          `/api/portal/admin/prosjekt?id=${encodeURIComponent(kartleggingId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`admin/prosjekt → ${res.status}`);
        setProsjekt((await res.json()) as ProsjektResponse);
        setTilstand("klar");
      } catch (err) {
        console.error("[portal/admin/benken] fetch failed", err);
        // Quiet refetch keeps the stale thread visible; the first load
        // has nothing to keep and says feil out loud.
        if (!stille) setTilstand("feil");
      }
    },
    [kartleggingId]
  );

  useEffect(() => {
    void hentFeed();
  }, [hentFeed]);

  /**
   * The file flow: /fil validates and answers with the ONE safe path, then
   * the browser uploads straight to the private bucket with the admin's own
   * token — the storage policies do authorization. The dev-mock rows have
   * no real bucket folder; their fabricated path is reference enough.
   */
  const lastOppFil = useCallback(
    async (token: string, f: File): Promise<ProsjektFilRef> => {
      // filMime, not f.type raw — Windows browsers declare an empty MIME
      // for md/csv/json and the /fil gate requires a non-empty one.
      const mime = filMime(f);
      const body: ProsjektFilBody = {
        id: kartleggingId,
        navn: f.name,
        size: f.size,
        mime,
      };
      const res = await fetch("/api/portal/prosjekt/fil", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`prosjekt/fil → ${res.status}`);
      const ref = (await res.json()) as ProsjektFilResponse;
      if (UUID_RE.test(kartleggingId)) {
        const { error } = await supabaseBrowser()
          .storage.from("prosjektfiler")
          .upload(ref.path, f, { contentType: mime, upsert: false });
        if (error) throw error;
      }
      return { path: ref.path, navn: ref.navn };
    },
    [kartleggingId]
  );

  const postInnlegg = useCallback(
    async (token: string, body: AdminProsjektPostBody): Promise<void> => {
      const res = await fetch("/api/portal/admin/prosjekt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`admin/prosjekt → ${res.status}`);
    },
    []
  );

  function velgFil(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const filFeil = validerFil(f, t);
    if (filFeil) {
      setFeil(filFeil);
      setBekreftet(false);
      e.target.value = "";
      return;
    }
    setFeil(null);
    setFil(f);
  }

  function fjernFil() {
    setFil(null);
    if (filInput.current) filInput.current.value = "";
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sender || ukeSender) return;
    const innhold = tekst.trim();
    // noValidate — say what's missing instead of a silent native bubble.
    if (!innhold || innhold.length > PROSJEKT_TEKST_MAX) {
      setFeil(b.komp.tekstMangler);
      setBekreftet(false);
      return;
    }
    let lenkeUt: string | null = null;
    if (type === "leveranse" && lenke.trim()) {
      lenkeUt = validerLenke(lenke.trim());
      if (!lenkeUt) {
        setFeil(b.komp.lenkeUgyldig);
        setBekreftet(false);
        return;
      }
    }
    setFeil(null);
    setBekreftet(false);
    setSender(true);
    try {
      const token = await hentToken();
      let filRef: ProsjektFilRef | null = null;
      if (fil) {
        try {
          filRef = await lastOppFil(token, fil);
        } catch (err) {
          console.error("[portal/admin/benken] upload failed", err);
          setFeil(b.komp.filFeil);
          return;
        }
      }
      await postInnlegg(token, {
        id: kartleggingId,
        type,
        tekst: innhold,
        ...(lenkeUt ? { lenke: lenkeUt } : {}),
        ...(filRef ? { fil: filRef } : {}),
        ...(nyUke !== null ? { uke: nyUke } : {}),
      });
      // On the bench — clear everything but the type (runs come in batches).
      setTekst("");
      setLenke("");
      fjernFil();
      setNyUke(null);
      setBekreftet(true);
      await hentFeed(true);
    } catch (err) {
      console.error("[portal/admin/benken] post failed", err);
      setFeil(b.komp.feil);
    } finally {
      setSender(false);
    }
  }

  /** The week alone — a status innlegg with the canned line + uke stamp. */
  async function settUkeAlene() {
    if (nyUke === null || sender || ukeSender) return;
    setFeil(null);
    setBekreftet(false);
    setUkeSender(true);
    try {
      const token = await hentToken();
      await postInnlegg(token, {
        id: kartleggingId,
        type: "status",
        tekst:
          nyUke === "auto"
            ? b.komp.ukeAutoTekst
            : b.komp.ukeAleneTekstTemplate.replace("{n}", String(nyUke)),
        uke: nyUke,
      });
      setNyUke(null);
      setBekreftet(true);
      // nyUke → null disables the focused button — park keyboard focus on
      // the textarea (the natural next action) instead of <body>.
      tekstFelt.current?.focus();
      await hentFeed(true);
    } catch (err) {
      console.error("[portal/admin/benken] uke post failed", err);
      setFeil(b.komp.feil);
    } finally {
      setUkeSender(false);
    }
  }

  function innleggRad(i: ProsjektInnlegg) {
    return (
      <li key={i.id} className="vk-adm-innlegg" data-fra={i.fra}>
        <p className="vk-mono vk-adm-innlegg-meta">
          <span className="vk-adm-innlegg-fra">{b.fra[i.fra]}</span>
          <span aria-hidden="true">·</span>
          <span>{b.typer[i.type]}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDato(i.createdAt, lang, true)}</span>
          {i.foresporselStatus ? (
            <span
              className={
                i.foresporselStatus === "levert"
                  ? "vk-adm-chip vk-adm-chip--godkjent"
                  : "vk-adm-chip"
              }
            >
              {b.foresporselStatus[i.foresporselStatus]}
            </span>
          ) : null}
          {i.svarPa ? (
            <span className="vk-adm-innlegg-svarpa">
              <span aria-hidden="true">↳ </span>
              {b.svarMarkor}
            </span>
          ) : null}
        </p>
        {i.tekst
          ? i.tekst.split("\n\n").map((avsnitt, idx) => (
              <p key={idx} className="vk-adm-innlegg-tekst">
                {avsnitt}
              </p>
            ))
          : null}
        {/* Only https leaves the row (server-validated; belt + braces). */}
        {i.lenke && i.lenke.startsWith("https://") ? (
          <a
            className="vk-adm-innlegg-lenke"
            href={i.lenke}
            target="_blank"
            rel="noopener noreferrer"
          >
            {i.lenke}
          </a>
        ) : null}
        {i.filUrl && i.filNavn ? (
          <a
            className="vk-mono vk-adm-innlegg-fil"
            href={i.filUrl}
            aria-label={b.lastNedTemplate.replace("{navn}", i.filNavn)}
          >
            <span aria-hidden="true">↓ </span>
            {i.filNavn}
          </a>
        ) : i.filNavn ? (
          // Signing hiccuped — the name still tells what was attached.
          <p className="vk-mono vk-adm-innlegg-filnavn">{i.filNavn}</p>
        ) : null}
      </li>
    );
  }

  return (
    <section className="vk-adm-seksjon vk-adm-benk" aria-label={b.tittel}>
      <h2 className="vk-mono vk-adm-stittel">{b.tittel}</h2>

      {tilstand === "laster" ? (
        <p className="vk-mono vk-adm-tomt" role="status">
          {t.admin.felles.henter}
        </p>
      ) : null}

      {tilstand === "feil" ? (
        <>
          <p className="vk-portal-feilmelding" role="alert">
            {t.admin.felles.feil}
          </p>
          <div>
            <button type="button" className="vk-btn" onClick={() => void hentFeed()}>
              {t.admin.felles.provIgjen}
            </button>
          </div>
        </>
      ) : null}

      {tilstand === "klar" && prosjekt ? (
        <>
          <p className="vk-mono vk-adm-ukelinje">
            {prosjekt.uke !== null
              ? `${b.ukeTemplate.replace("{n}", String(prosjekt.uke))} ${
                  prosjekt.ukeKilde === "manuell"
                    ? b.komp.ukeKildeManuell
                    : b.komp.ukeKildeAuto
                }`
              : b.ukeIkkeSatt}
          </p>

          {prosjekt.innlegg.length === 0 ? (
            <p className="vk-mono vk-adm-tomt">{b.tom}</p>
          ) : (
            <ol className="vk-adm-benk-feed">{prosjekt.innlegg.map(innleggRad)}</ol>
          )}

          {/* ── The composer ── */}
          <form className="vk-adm-komp" onSubmit={send} noValidate>
            <h3 className="vk-mono vk-adm-stittel">{b.komp.tittel}</h3>

            <div className="vk-portal-felt">
              <span className="vk-portal-label" id="vk-adm-benk-typelabel">
                {b.komp.typeLabel}
              </span>
              <div
                className="vk-portal-chips"
                role="group"
                aria-labelledby="vk-adm-benk-typelabel"
              >
                {TYPER.map((ty) => (
                  <button
                    key={ty}
                    type="button"
                    className="vk-portal-chip"
                    aria-pressed={type === ty}
                    onClick={() => setType(ty)}
                  >
                    {b.typer[ty]}
                  </button>
                ))}
              </div>
            </div>

            <div className="vk-portal-felt">
              <label className="vk-portal-label" htmlFor="vk-adm-benk-tekst">
                {b.komp.tekstLabel}
              </label>
              <textarea
                ref={tekstFelt}
                id="vk-adm-benk-tekst"
                className="vk-portal-textarea vk-adm-komp-tekst"
                rows={4}
                maxLength={PROSJEKT_TEKST_MAX}
                value={tekst}
                placeholder={b.komp.tekstPlassholder}
                aria-invalid={tekstFeil ? true : undefined}
                aria-describedby={tekstFeil ? FEIL_ID : undefined}
                onChange={(e) => setTekst(e.target.value)}
              />
            </div>

            {type === "leveranse" ? (
              <div className="vk-portal-felt">
                <label className="vk-portal-label" htmlFor="vk-adm-benk-lenke">
                  {b.komp.lenkeLabel}
                </label>
                <input
                  id="vk-adm-benk-lenke"
                  type="url"
                  inputMode="url"
                  className="vk-portal-input"
                  maxLength={PROSJEKT_LENKE_MAX}
                  value={lenke}
                  placeholder={b.komp.lenkePlassholder}
                  aria-invalid={lenkeFeil ? true : undefined}
                  aria-describedby={
                    lenkeFeil
                      ? `${FEIL_ID} vk-adm-benk-lenkehint`
                      : "vk-adm-benk-lenkehint"
                  }
                  onChange={(e) => setLenke(e.target.value)}
                />
                <p className="vk-mono vk-adm-komp-hint" id="vk-adm-benk-lenkehint">
                  {b.komp.lenkeVeiledning}
                </p>
              </div>
            ) : null}

            <div className="vk-portal-felt">
              <span className="vk-portal-label" id="vk-adm-benk-fillabel">
                {b.komp.filLabel}
              </span>
              <div
                className="vk-adm-komp-filrad"
                role="group"
                aria-labelledby="vk-adm-benk-fillabel"
              >
                {/* The real input stays hidden; the mono button is the control. */}
                <input
                  ref={filInput}
                  type="file"
                  accept={FIL_ACCEPT}
                  className="vk-adm-komp-filinput"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={velgFil}
                />
                <button
                  type="button"
                  className="vk-mono vk-adm-oppdater"
                  aria-describedby={filFeil ? FEIL_ID : undefined}
                  onClick={() => filInput.current?.click()}
                >
                  {b.komp.velgFil}
                </button>
                {fil ? (
                  <>
                    <span className="vk-mono vk-adm-komp-filnavn">{fil.name}</span>
                    <button
                      type="button"
                      className="vk-portal-quietlink vk-mono"
                      onClick={fjernFil}
                    >
                      {b.komp.fjernFil}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="vk-portal-felt">
              <span className="vk-portal-label" id="vk-adm-benk-ukelabel">
                {b.komp.ukeLabel}
              </span>
              <div
                className="vk-portal-chips"
                role="group"
                aria-labelledby="vk-adm-benk-ukelabel"
              >
                {/* Any chip can become the pending pick — INCLUDING the
                    current week (re-announcing «Da er vi i uke {n}» must be
                    possible). A second click on the pending chip backs out
                    to «leave the week alone». */}
                {UKER.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="vk-portal-chip vk-adm-komp-uke"
                    aria-pressed={(nyUke ?? prosjekt.uke) === n}
                    aria-label={b.komp.ukeChipTemplate.replace("{n}", String(n))}
                    onClick={() => setNyUke(nyUke === n ? null : n)}
                  >
                    {n}
                  </button>
                ))}
                {/* Back to automatic — visible only while an override is in
                    play (set, or pending). Auto needs no chip otherwise. */}
                {prosjekt.ukeKilde === "manuell" || nyUke === "auto" ? (
                  <button
                    type="button"
                    className="vk-portal-chip vk-adm-komp-uke"
                    aria-pressed={nyUke === "auto"}
                    onClick={() => setNyUke(nyUke === "auto" ? null : "auto")}
                  >
                    {b.komp.ukeAutoChip}
                  </button>
                ) : null}
                {/* disabled only for the no-pick state; mid-flight the
                    guard in settUkeAlene() holds — disabling the focused
                    button would drop keyboard focus to <body>. */}
                <button
                  type="button"
                  className="vk-mono vk-adm-oppdater"
                  disabled={nyUke === null}
                  aria-disabled={sender || ukeSender || undefined}
                  aria-busy={ukeSender || undefined}
                  onClick={() => void settUkeAlene()}
                >
                  {b.komp.settUkeAlene}
                </button>
              </div>
              <p className="vk-mono vk-adm-komp-hint">{b.komp.ukeHint}</p>
            </div>

            <div className="vk-adm-formrad vk-adm-formrad--send">
              {/* Never disabled mid-flight: disabling the focused button
                  drops keyboard focus to <body>. The guard in send() stops
                  double sends; aria-disabled + aria-busy tell AT. */}
              <button
                type="submit"
                className="vk-btn vk-btn--cta"
                aria-disabled={sender || ukeSender || undefined}
                aria-busy={sender || undefined}
              >
                {b.komp.sendKnapp}
              </button>
              {/* Always in the DOM — a live region must exist BEFORE its
                  content changes for AT to announce it (the customer Benken
                  does the same with its vk-sr status line). */}
              <p className="vk-adm-bekreftelse" role="status">
                {bekreftet ? b.komp.bekreftelse : ""}
              </p>
            </div>
            {feil ? (
              <p className="vk-portal-feilmelding" role="alert" id={FEIL_ID}>
                {feil}
              </p>
            ) : null}
          </form>
        </>
      ) : null}
    </section>
  );
}
