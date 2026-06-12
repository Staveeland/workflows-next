/**
 * Byggefabrikken — typer delt mellom portal-API-ene og admin-/kunde-UI.
 *
 * Livssyklus (speiler check-constrainten i public.byggeprosjekter):
 *   ikke_startet → venter (angrefrist) → bygger → klar → delt
 *                                       ↘ feilet      (stoppet kan inntreffe
 *                                                      fra venter/bygger)
 */

export type ByggStatus =
  | "ikke_startet"
  | "venter"
  | "bygger"
  | "klar"
  | "delt"
  | "feilet"
  | "stoppet";

export type ByggLoggLinje = {
  /** ISO-tidsstempel satt av fabrikken. */
  tid: string;
  /** Én kort norsk statuslinje («Repo opprettet», «Fable 5 koder …»). */
  melding: string;
};

/** Admin-flatens visning av byggeløpet. */
export type AdminBygg = {
  id: string;
  kartleggingId: string;
  status: ByggStatus;
  autobygg: boolean;
  githubRepo: string | null;
  /** https://github.com/<repo> — avledet, klikkbar. */
  githubUrl: string | null;
  previewUrl: string | null;
  /** Basic Auth-legitimasjon til forhåndsvisningen (lav sensitivitet). */
  nettstedBruker: string | null;
  nettstedPassord: string | null;
  sisteCommitSha: string | null;
  sisteDeployAt: string | null;
  deltMedKundeAt: string | null;
  startetAt: string | null;
  ferdigAt: string | null;
  /** Petters stående føringer til fabrikken (brukes ved førstebygg). */
  byggenotat: string | null;
  logg: ByggLoggLinje[];
};

export type AdminByggResponse = {
  bygg: AdminBygg | null;
};

export type AdminByggHandling =
  | "start"
  | "stopp"
  | "del"
  | "autobygg"
  | "notat"
  | "endre";

export type AdminByggBody = {
  kartleggingId: string;
  handling: AdminByggHandling;
  /** Kun for handling: 'autobygg'. */
  autobygg?: boolean;
  /** Kun for handling: 'notat' — stående føringer (lagres). */
  byggenotat?: string;
  /** Kun for handling: 'endre' — endringsønske som starter et revisjonsbygg. */
  endringsonske?: string;
};

/** Maks lengde på byggenotat/endringsønske. */
export const BYGG_NOTAT_MAX = 4000;

/** Byggemodus fabrikken kjører i. */
export type ByggModus = "full" | "revisjon";

/** Kundens forhåndsvisnings-fane — bevisst minimal. */
export type KundeByggResponse = {
  forhandsvisning: {
    url: string;
    sistOppdatert: string | null;
    bruker: string | null;
    passord: string | null;
  } | null;
};

/** Fabrikk-callbackens kropp (POST /api/fabrikk/status). */
export type FabrikkStatusBody = {
  byggId: string;
  status?: Exclude<ByggStatus, "ikke_startet" | "venter">;
  melding?: string;
  githubRepo?: string;
  vercelProjectId?: string;
  previewUrl?: string;
  commitSha?: string;
  nettstedBruker?: string;
  nettstedPassord?: string;
};

export const BYGG_LOGG_MAX = 200;
