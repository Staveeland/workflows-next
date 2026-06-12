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

      {status === "delt" && bygg?.deltMedKundeAt ? (
        <p className="vk-mono vk-bygg-meta">
          Delt med kunden {formatTid(bygg.deltMedKundeAt)} — push til repoet
          oppdaterer forhåndsvisningen deres automatisk.
        </p>
      ) : null}

      {logg.length > 0 ? (
        <ol className="vk-bygg-logg" aria-label="Byggelogg">
          {logg
            .slice(-15)
            .reverse()
            .map((l, i) => (
              <li key={`${l.tid}-${i}`}>
                <span className="vk-mono vk-bygg-logg-tid">{formatTid(l.tid)}</span>
                <span>{l.melding}</span>
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
    </div>
  );
}
