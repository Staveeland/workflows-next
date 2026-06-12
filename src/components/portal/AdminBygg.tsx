"use client";

import "@/styles/verksted/bygg.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type {
  AdminBygg as AdminByggData,
  AdminByggHandling,
  AdminByggResponse,
  ByggStatus,
} from "@/lib/byggTypes";

/**
 * Byggefabrikken i verkstedkontoret — monteres i AdminDetaljs Bygging-fane
 * (via `bygging`-proppen). Selvforsynt som AdminFaktura: henter selv med
 * Bearer-token mot /api/portal/admin/bygg, og poller lett (10 s) mens
 * fabrikken jobber så loggen ruller inn uten reload.
 *
 * Admin-flate — norsk copy lokalt, samme avveining som AdminFaktura.
 */

interface AdminByggProps {
  kartleggingId: string;
  /** Løpets status — Start-knappen krever videre/levert (ruta håndhever). */
  kartStatus: string;
}

const STATUS_LABEL: Record<ByggStatus, string> = {
  ikke_startet: "Ikke startet",
  venter: "Starter …",
  bygger: "Bygger …",
  klar: "Klar til finpuss",
  delt: "Delt med kunden",
  feilet: "Feilet",
  stoppet: "Stoppet",
};

const AKTIV: ReadonlySet<ByggStatus> = new Set(["venter", "bygger"]);

/**
 * De kanoniske fasene fabrikken går gjennom, hver med et nøkkelord vi
 * kjenner igjen i loggteksten. Tidslinjen markerer hver fase som ferdig,
 * pågående eller ikke startet ut fra hvor langt loggen har kommet.
 */
const FASER: ReadonlyArray<{ navn: string; nokkel: RegExp }> = [
  { navn: "Henter byggegrunnlaget", nokkel: /byggegrunnlaget|i gang/i },
  { navn: "Oppretter kunde-repo", nokkel: /repo/i },
  { navn: "Designbrief fra kundens uttrykk", nokkel: /designbrief|uttrykk/i },
  { navn: "Fable 5 koder førsteversjonen", nokkel: /koder|gjennomgang/i },
  { navn: "Verifiserer bygget", nokkel: /verifiser|bygget/i },
  { navn: "Passordbeskyttelse", nokkel: /passordbeskyttelse/i },
  { navn: "Deployer til Vercel", nokkel: /vercel|deployer|laster opp/i },
  { navn: "Live og klar", nokkel: /live|klar til/i },
];

type FaseTilstand = "ferdig" | "aktiv" | "venter";

/** Hvor langt loggen har kommet → tilstand per fase. */
function faseTilstander(
  logg: ReadonlyArray<{ melding: string }>,
  status: ByggStatus
): FaseTilstand[] {
  let nadd = -1;
  FASER.forEach((f, i) => {
    if (logg.some((l) => f.nokkel.test(l.melding))) nadd = i;
  });
  const ferdigBygg = status === "klar" || status === "delt";
  if (ferdigBygg) nadd = FASER.length - 1;
  const stoppet = status === "feilet" || status === "stoppet";
  return FASER.map((_, i) => {
    if (i <= nadd) return "ferdig";
    if (i === nadd + 1 && !stoppet && AKTIV.has(status)) return "aktiv";
    return "venter";
  });
}

async function hentToken(): Promise<string> {
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? "dev-mock";
  } catch {
    return "dev-mock";
  }
}

function formatTid(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function AdminBygg({ kartleggingId, kartStatus }: AdminByggProps) {
  const [bygg, setBygg] = useState<AdminByggData | null>(null);
  const [lastet, setLastet] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [travel, setTravel] = useState(false);
  /** To-stegs bekreftelse: {handling} armert i 5 s før den fyrer. */
  const [armet, setArmet] = useState<AdminByggHandling | null>(null);
  const armTimer = useRef<number | null>(null);
  const seq = useRef(0);

  const hent = useCallback(async () => {
    const minSeq = ++seq.current;
    try {
      const token = await hentToken();
      const res = await fetch(
        `/api/portal/admin/bygg?kartleggingId=${encodeURIComponent(kartleggingId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminByggResponse;
      if (minSeq !== seq.current) return;
      setBygg(json.bygg);
      setFeil(null);
    } catch (err) {
      console.error("[AdminBygg] henting feilet", err);
      if (minSeq === seq.current) setFeil("Fikk ikke hentet byggestatus.");
    } finally {
      if (minSeq === seq.current) setLastet(true);
    }
  }, [kartleggingId]);

  useEffect(() => {
    void hent();
    const onFokus = () => void hent();
    window.addEventListener("focus", onFokus);
    return () => window.removeEventListener("focus", onFokus);
  }, [hent]);

  // Lett polling mens fabrikken jobber — loggen ruller inn.
  useEffect(() => {
    if (!bygg || !AKTIV.has(bygg.status)) return;
    const id = window.setInterval(() => void hent(), 10_000);
    return () => window.clearInterval(id);
  }, [bygg, hent]);

  useEffect(() => () => {
    if (armTimer.current) window.clearTimeout(armTimer.current);
  }, []);

  function arm(handling: AdminByggHandling) {
    setArmet(handling);
    if (armTimer.current) window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => setArmet(null), 5000);
  }

  const utfor = useCallback(
    async (handling: AdminByggHandling, ekstra?: { autobygg?: boolean }) => {
      if (travel) return;
      setTravel(true);
      setFeil(null);
      try {
        const token = await hentToken();
        const res = await fetch("/api/portal/admin/bygg", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ kartleggingId, handling, ...ekstra }),
        });
        const json = (await res.json().catch(() => ({}))) as AdminByggResponse & {
          error?: string;
        };
        if (!res.ok) {
          setFeil(json.error ?? "Noe gikk galt.");
        } else if (json.bygg !== undefined) {
          setBygg(json.bygg);
        }
      } catch (err) {
        console.error("[AdminBygg] handling feilet", err);
        setFeil("Noe gikk galt — prøv igjen.");
      } finally {
        setTravel(false);
        setArmet(null);
      }
    },
    [kartleggingId, travel]
  );

  /** Armert → bekreft; ellers armer. */
  function toStegs(handling: AdminByggHandling) {
    if (travel) return;
    if (armet === handling) void utfor(handling);
    else arm(handling);
  }

  if (!lastet) {
    return <p className="vk-mono vk-bygg-status">Henter byggestatus …</p>;
  }

  const status: ByggStatus = bygg?.status ?? "ikke_startet";
  const kanStarte =
    (kartStatus === "videre" || kartStatus === "levert") &&
    (status === "ikke_startet" || status === "stoppet" || status === "feilet");
  const kanStoppe = AKTIV.has(status);
  const kanDele = status === "klar" || (status === "delt" && bygg?.previewUrl);
  const logg = bygg?.logg ?? [];

  return (
    <div className="vk-bygg">
      <div className="vk-bygg-topp">
        <span className={`vk-bygg-badge vk-bygg-badge--${status}`}>
          {STATUS_LABEL[status]}
        </span>
        {bygg?.sisteDeployAt ? (
          <span className="vk-mono vk-bygg-meta">
            siste deploy {formatTid(bygg.sisteDeployAt)}
          </span>
        ) : null}
      </div>

      {feil ? (
        <p className="vk-mono vk-bygg-feil" role="alert">
          {feil}
        </p>
      ) : null}

      {/* Autobygg-bryteren — settes typisk FØR kunden godkjenner. */}
      <label className="vk-bygg-auto">
        <input
          type="checkbox"
          checked={bygg?.autobygg ?? false}
          disabled={travel || AKTIV.has(status)}
          onChange={(e) => void utfor("autobygg", { autobygg: e.target.checked })}
        />
        <span>
          Autobygg: start fabrikken automatisk når kunden godkjenner
          <span className="vk-bygg-auto-hint">
            {" "}
            (10 min angrefrist — du varsles på Telegram)
          </span>
        </span>
      </label>

      <div className="vk-bygg-knapper">
        {kanStarte ? (
          <button
            type="button"
            className="vk-btn"
            disabled={travel}
            onClick={() => toStegs("start")}
          >
            {armet === "start" ? "Sikker? Starter fabrikken →" : "Start bygget nå"}
          </button>
        ) : null}
        {kanStoppe ? (
          <button
            type="button"
            className="vk-btn vk-bygg-stopp"
            disabled={travel}
            onClick={() => toStegs("stopp")}
          >
            {armet === "stopp" ? "Sikker? Stopper →" : "Stopp bygget"}
          </button>
        ) : null}
        {kanDele && status === "klar" ? (
          <button
            type="button"
            className="vk-btn"
            disabled={travel}
            onClick={() => toStegs("del")}
          >
            {armet === "del"
              ? "Sikker? Kunden får lenken →"
              : "Del med kunden"}
          </button>
        ) : null}
      </div>

      {bygg?.githubUrl || bygg?.previewUrl ? (
        <dl className="vk-bygg-lenker">
          {bygg.previewUrl ? (
            <div>
              <dt className="vk-mono">Forhåndsvisning</dt>
              <dd>
                <a href={bygg.previewUrl} target="_blank" rel="noopener noreferrer">
                  {bygg.previewUrl.replace(/^https:\/\//, "")}
                </a>
              </dd>
            </div>
          ) : null}
          {bygg.githubUrl ? (
            <div>
              <dt className="vk-mono">Repo</dt>
              <dd>
                <a href={bygg.githubUrl} target="_blank" rel="noopener noreferrer">
                  {bygg.githubRepo}
                </a>
                {bygg.sisteCommitSha ? (
                  <span className="vk-mono vk-bygg-sha">
                    {" "}
                    @ {bygg.sisteCommitSha.slice(0, 7)}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* Passord-porten — vis legitimasjonen når den finnes. */}
      {bygg?.nettstedBruker && bygg?.nettstedPassord ? (
        <div className="vk-bygg-laas">
          <p className="vk-bygg-laas-tittel">🔒 Forhåndsvisningen er passordbeskyttet</p>
          <dl className="vk-bygg-laas-felt">
            <div>
              <dt className="vk-mono">Bruker</dt>
              <dd className="vk-mono">{bygg.nettstedBruker}</dd>
            </div>
            <div>
              <dt className="vk-mono">Passord</dt>
              <dd className="vk-mono">{bygg.nettstedPassord}</dd>
            </div>
          </dl>
          <p className="vk-bygg-laas-hint">
            Kunden får dette automatisk i Forhåndsvisning-fanen når du deler.
          </p>
        </div>
      ) : null}

      {status === "delt" && bygg?.deltMedKundeAt ? (
        <p className="vk-mono vk-bygg-meta">
          Delt med kunden {formatTid(bygg.deltMedKundeAt)} — push til repoet
          oppdaterer forhåndsvisningen deres automatisk.
        </p>
      ) : null}

      {/* Strukturert fase-tidslinje i stedet for rå logg. */}
      {logg.length > 0 ? (
        <ol className="vk-bygg-faser" aria-label="Byggesteg">
          {faseTilstander(logg, status).map((tilstand, i) => (
            <li key={FASER[i].navn} className={`vk-bygg-fase vk-bygg-fase--${tilstand}`}>
              <span className="vk-bygg-fase-merke" aria-hidden="true">
                {tilstand === "ferdig" ? "✓" : tilstand === "aktiv" ? "●" : "○"}
              </span>
              <span className="vk-bygg-fase-navn">{FASER[i].navn}</span>
              {tilstand === "aktiv" ? (
                <span className="vk-bygg-fase-na vk-mono">pågår …</span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : status === "ikke_startet" ? (
        <p className="vk-bygg-intro">
          Fabrikken leser hele kartleggingen, lager designbrief fra kundens
          eget uttrykk, koder en komplett førsteversjon med Fable 5 og
          deployer den — du får Telegram når den er klar til finpuss.
        </p>
      ) : null}

      {/* Rå logg tilgjengelig for den som vil grave. */}
      {logg.length > 0 ? (
        <details className="vk-bygg-rålogg">
          <summary className="vk-mono">Detaljert logg ({logg.length} linjer)</summary>
          <ol className="vk-bygg-logg" aria-label="Detaljert byggelogg">
            {logg
              .slice(-30)
              .reverse()
              .map((l, i) => (
                <li key={`${l.tid}-${i}`}>
                  <span className="vk-mono vk-bygg-logg-tid">{formatTid(l.tid)}</span>
                  <span>{l.melding}</span>
                </li>
              ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
