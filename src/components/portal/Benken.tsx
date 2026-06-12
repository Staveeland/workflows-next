"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLang } from "@/components/LanguageProvider";
import { portalContent, type PortalContent } from "@/lib/portalContent";
import type { Lang } from "@/lib/translations";
import {
  PROSJEKT_FIL_MAX_BYTES,
  PROSJEKT_FIL_TYPER,
  PROSJEKT_TEKST_MAX,
  type PortalKartlegging,
  type ProsjektFilRef,
  type ProsjektFilResponse,
  type ProsjektInnlegg,
  type ProsjektPostResponse,
  type ProsjektResponse,
} from "@/lib/portalTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * «Benken» — the customer's project room (status «videre», level 4 BYGGES).
 *
 * One chronological feed with date dividers, one card shape per innlegg
 * type, and a composer at the bottom. Refreshes on window focus and after
 * an own post — never polls. Files travel in two hops: POST /prosjekt/fil
 * validates name/size/MIME and answers with the ONE safe path, then the
 * browser uploads DIRECTLY to the private «prosjektfiler» bucket with the
 * user's own token (storage RLS scopes the write to this project's folder).
 * Files come back as forced-download links only — never inline.
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

/* ── Dates: local-day grouping for the dividers ── */

function dagKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDag(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const medAar = d.getFullYear() !== new Date().getFullYear();
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nb-NO", {
    day: "numeric",
    month: "long",
    ...(medAar ? { year: "numeric" as const } : {}),
  }).format(d);
}

/* ── The composer — main (bottom) and inline (foresporsel answer) ── */

type SendResultat = "ok" | "sendFeil" | "forMange";
type FeilKey = "tomMelding" | "filForStor" | "filType" | "sendFeil" | "forMange";

interface KomposerProps {
  t: PortalContent;
  /** Unique id prefix — several composers can live on one screen. */
  idPrefix: string;
  variant: "hoved" | "svar";
  onSend: (tekst: string, fil: File | null) => Promise<SendResultat>;
}

function Komposer({ t, idPrefix, variant, onSend }: KomposerProps) {
  const { lang } = useLang();
  const [tekst, setTekst] = useState("");
  const [fil, setFil] = useState<File | null>(null);
  const [feil, setFeil] = useState<FeilKey | null>(null);
  const [sender, setSender] = useState(false);
  const filInputRef = useRef<HTMLInputElement>(null);

  const tekstId = `${idPrefix}-tekst`;
  const filId = `${idPrefix}-fil`;
  const feilId = `${idPrefix}-feil`;

  // File errors belong to the file control, the rest to the textarea — a
  // SR user re-querying the control they must re-operate needs the context.
  const filFeil = feil === "filForStor" || feil === "filType";

  const velgFil = (e: ChangeEvent<HTMLInputElement>) => {
    const valgt = e.target.files?.[0] ?? null;
    if (!valgt) return;
    const brudd = validerFil(valgt);
    if (brudd) {
      setFeil(brudd);
      setFil(null);
      e.target.value = "";
      return;
    }
    setFeil((f) => (f === "filForStor" || f === "filType" ? null : f));
    setFil(valgt);
  };

  const fjernFil = () => {
    setFil(null);
    if (filInputRef.current) filInputRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sender) return;
    const trimmet = tekst.trim();
    // noValidate — say what's missing instead of a silent native bubble.
    if (!trimmet && !fil) {
      setFeil("tomMelding");
      return;
    }
    setFeil(null);
    setSender(true);
    const res = await onSend(trimmet, fil);
    setSender(false);
    if (res === "ok") {
      setTekst("");
      fjernFil();
    } else {
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
      <div className="vk-benk-skjemarad">
        {/* The visible «Legg ved fil» is the label of this visually-hidden
            input — keyboard focus lands on the input and the focus ring is
            drawn on the label (sibling selector in portal.css). */}
        <input
          ref={filInputRef}
          id={filId}
          type="file"
          className="vk-sr vk-benk-filinput"
          accept={FIL_ACCEPT}
          aria-describedby={filFeil ? feilId : undefined}
          onChange={velgFil}
        />
        <label htmlFor={filId} className="vk-mono vk-benk-filknapp">
          {t.benken.velgFil}
        </label>
        {fil ? (
          <span className="vk-mono vk-benk-filvalgt">
            <span>{fil.name}</span>
            <span className="vk-benk-filstr">{formatStorrelse(fil.size, lang)}</span>
            <button
              type="button"
              className="vk-benk-fjernfil"
              aria-label={t.benken.fjernFilTemplate.replace("{navn}", fil.name)}
              onClick={fjernFil}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ) : (
          <span className="vk-mono vk-benk-filhint">{t.benken.filHint}</span>
        )}
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

/** Filename as the link text, forced-download signed URL behind it. */
function FilLenke({ innlegg, t }: { innlegg: ProsjektInnlegg; t: PortalContent }) {
  if (!innlegg.filNavn) return null;
  if (!innlegg.filUrl) {
    // Signing hiccuped server-side — name the file without a dead link.
    return <span className="vk-mono vk-benk-fil vk-benk-fil--dau">{innlegg.filNavn}</span>;
  }
  return (
    <a
      className="vk-mono vk-benk-fil"
      href={innlegg.filUrl}
      aria-label={t.benken.lastNedTemplate.replace("{navn}", innlegg.filNavn)}
    >
      <span aria-hidden="true">↓</span>
      {innlegg.filNavn}
    </a>
  );
}

/** Belt and suspenders — the server already filters to https-only. */
function httpsLenke(innlegg: ProsjektInnlegg): string | null {
  return innlegg.lenke && innlegg.lenke.startsWith("https://") ? innlegg.lenke : null;
}

interface ForesporselKortProps {
  innlegg: ProsjektInnlegg;
  /** The customer's answers (svar_pa → this innlegg), rendered beneath. */
  svar: ProsjektInnlegg[];
  t: PortalContent;
  onSvar: (tekst: string, fil: File | null) => Promise<SendResultat>;
}

function ForesporselKort({ innlegg, svar, t, onSvar }: ForesporselKortProps) {
  const apen = innlegg.foresporselStatus === "apen";
  const levertRef = useRef<HTMLSpanElement>(null);
  const svarte = useRef(false);

  // The inline composer unmounts when the flip to «levert» lands — keep
  // focus in the card (the chip) instead of dropping SR users on <body>.
  useEffect(() => {
    if (!apen && svarte.current) levertRef.current?.focus();
  }, [apen]);

  const send = async (tekst: string, fil: File | null): Promise<SendResultat> => {
    const res = await onSvar(tekst, fil);
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
      {innlegg.tekst ? <p className="vk-benk-tekst">{innlegg.tekst}</p> : null}
      <FilLenke innlegg={innlegg} t={t} />
      {apen ? (
        <Komposer
          t={t}
          idPrefix={`vk-benk-svar-${innlegg.id}`}
          variant="svar"
          onSend={send}
        />
      ) : null}
      {svar.length > 0 ? (
        <ul className="vk-benk-svarliste">
          {svar.map((s) => (
            <li key={s.id} className="vk-benk-svar">
              <span className="vk-sr">{t.benken.fraDere}: </span>
              {s.tekst ? <p className="vk-benk-tekst">{s.tekst}</p> : null}
              <FilLenke innlegg={s} t={t} />
            </li>
          ))}
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

  const dataRef = useRef<ProsjektResponse | null>(null);
  const seqRef = useRef(0);
  const antallRef = useRef<number | null>(null);
  const sendteRef = useRef(false);
  const liveTimerRef = useRef<number | null>(null);
  /** Set by «Prøv igjen» — a successful retry must not drop focus on <body>. */
  const provIgjenRef = useRef(false);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (liveTimerRef.current !== null) window.clearTimeout(liveTimerRef.current);
    };
  }, []);

  // Live regions announce *changes* — clear first, fill on the next beat,
  // so the same message can be announced twice in a row (two sends).
  const annonser = useCallback((hva: "sendt" | "nytt") => {
    setLive("");
    if (liveTimerRef.current !== null) window.clearTimeout(liveTimerRef.current);
    liveTimerRef.current = window.setTimeout(() => setLive(hva), 80);
  }, []);

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
      dataRef.current = res;
      setData(res);
      setLastefeil(false);
      // Recovering via «Prøv igjen» unmounts the feilboks (and the focused
      // button) — land on the heading so the state change is perceivable.
      if (provIgjenRef.current) {
        provIgjenRef.current = false;
        headingRef.current?.focus();
      }
      const antall = res.innlegg.length;
      if (
        antallRef.current !== null &&
        antall > antallRef.current &&
        !sendteRef.current
      ) {
        annonser("nytt");
      }
      sendteRef.current = false;
      antallRef.current = antall;
    } catch (err) {
      console.error("[benken] fetch failed", err);
      // A refetch hiccup must not blank a feed that already reads fine.
      if (!dataRef.current) setLastefeil(true);
    }
  }, [annonser, getToken, kartlegging.id]);

  useEffect(() => {
    void hent();
  }, [hent]);

  // Refresh when the visitor comes back to the tab — no polling.
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

  /**
   * One customer post: optional file (validated path from /fil, then the
   * DIRECT upload with the user's own token), then the innlegg POST —
   * optionally answering a foresporsel (svarPa flips it to «levert»).
   */
  const send = useCallback(
    async (
      tekst: string,
      fil: File | null,
      svarPa?: string
    ): Promise<SendResultat> => {
      try {
        const token = await getToken();
        if (!token) return "sendFeil";

        let filRef: ProsjektFilRef | undefined;
        if (fil) {
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
              return "sendFeil";
            }
          }
          filRef = { path: ref.path, navn: ref.navn };
        }

        await api<ProsjektPostResponse>("/api/portal/prosjekt", token, {
          method: "POST",
          body: JSON.stringify({
            id: kartlegging.id,
            ...(tekst ? { tekst } : {}),
            ...(filRef ? { fil: filRef } : {}),
            ...(svarPa ? { svarPa } : {}),
          }),
        });
        sendteRef.current = true;
        annonser("sendt");
        void hent();
        return "ok";
      } catch (err) {
        if (err instanceof BenkenApiError && err.status === 429) return "forMange";
        console.error("[benken] send failed", err);
        return "sendFeil";
      }
    },
    [annonser, devMock, getToken, hent, kartlegging.id]
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

  const rader: ReactElement[] = [];
  let forrigeDag = "";
  for (const i of topp) {
    const dag = dagKey(i.createdAt);
    if (dag !== forrigeDag) {
      forrigeDag = dag;
      rader.push(
        <li key={`dag-${dag}`} className="vk-benk-dag">
          <span className="vk-mono">{formatDag(i.createdAt, lang)}</span>
        </li>
      );
    }
    if (i.type === "status") {
      rader.push(
        <li key={i.id} className="vk-benk-statuslinje">
          <p className="vk-mono">
            <span className="vk-benk-hake" aria-hidden="true">
              ✓{" "}
            </span>
            {i.tekst}
          </p>
        </li>
      );
    } else if (i.type === "leveranse") {
      const lenke = httpsLenke(i);
      rader.push(
        <li key={i.id} className="vk-benk-kort vk-benk-kort--leveranse">
          <p className="vk-mono vk-benk-kortlabel">{t.benken.leveranseLabel}</p>
          {i.tekst ? <p className="vk-benk-tekst">{i.tekst}</p> : null}
          {lenke || i.filNavn ? (
            <div className="vk-benk-kortacts">
              {lenke ? (
                <a
                  className="vk-btn vk-benk-apne"
                  href={lenke}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.benken.apneKnapp} <span aria-hidden="true">→</span>
                </a>
              ) : null}
              <FilLenke innlegg={i} t={t} />
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
          }`}
        >
          <ForesporselKort
            innlegg={i}
            svar={svarMap.get(i.id) ?? []}
            t={t}
            onSvar={(tekst, fil) => send(tekst, fil, i.id)}
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
          }`}
        >
          <span className="vk-sr">
            {kunde ? t.benken.fraDere : t.benken.fraOss}:{" "}
          </span>
          {i.tekst ? <p className="vk-benk-tekst">{i.tekst}</p> : null}
          <FilLenke innlegg={i} t={t} />
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

  return (
    <section className="vk-benk">
      <header className="vk-benk-hode">
        <p className="vk-kicker vk-portal-fkicker">{t.levels[3].navn}</p>
        <h1 ref={headingRef} tabIndex={-1} className="vk-display vk-portal-h1">
          {t.benken.tittel}
        </h1>
        <p className="vk-portal-lead">{t.benken.undertekst}</p>
        {typeof uke === "number" ? (
          <p className="vk-mono vk-benk-uke">
            {t.benken.ukeTemplate.replace("{n}", String(uke))}
          </p>
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
          {topp.length === 0 ? (
            <p className="vk-benk-tomt">{t.benken.tomt}</p>
          ) : (
            <ol className="vk-benk-feed" aria-label={t.benken.feedLabel}>
              {rader}
            </ol>
          )}
          <div className="vk-benk-komposer">
            <Komposer
              t={t}
              idPrefix="vk-benk-hoved"
              variant="hoved"
              onSend={(tekst, fil) => send(tekst, fil)}
            />
            <p className="vk-mono vk-benk-sikkerhet">{t.benken.sikkerhet}</p>
          </div>
        </>
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
