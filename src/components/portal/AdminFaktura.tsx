"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import "@/styles/verksted/faktura.css";
import {
  FAKTURA_BESKRIVELSE_MAX,
  FAKTURA_DAGER_FORFALL_DEFAULT,
  FAKTURA_DAGER_FORFALL_MAX,
  FAKTURA_DAGER_FORFALL_MIN,
  FAKTURA_LINJE_BESKRIVELSE_MAX,
  FAKTURA_LINJER_MAX,
  FAKTURA_REFERANSE_MAX,
  MVA_SATSER,
  type AdminFakturaListeResponse,
  type AdminFakturaOpprettBody,
  type AdminFikenSyncResponse,
  type FakturaLinjeInput,
  type FakturaRad,
  type FakturaStatus,
  type FikenStatusResponse,
  type MvaSats,
} from "@/lib/fikenTypes";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Fakturering («regningsblokka») — selvstendig seksjon i verkstedkontoret
 * for ETT kartlegging-løp. Importeres av admin-UI-et i neste bølge.
 *
 * Gjør alt selv med Petters eget Bearer-token (samme mønster som
 * AdminBenken): tilkoblingsstatus, fakturaliste m/ status-chips, skjema
 * for nye fakturaUTKAST (pris i KRONER i UI → øre mot API-et, mva default
 * 25 %, forfall default 14 dager) og de tre knappene «Lag faktura i
 * Fiken», «Send faktura» og «Synk status».
 *
 * Sikkerhetsmodellen speiles i UI-et: utkast er det eneste som lages
 * uten videre; createInvoice og send står bak to-stegs bekreftelse
 * (arm → 5 s vindu → utfør), samme grep som slettknappen i AdminDetalj.
 * Ingen Fiken-kall skjer fra nettleseren — alt går via admin-API-et.
 *
 * Tekstene er norske og bor her (komponenten er selvstendig; admin-flaten
 * er uansett norsk — jf. portalContent der admin-tekstene er språknøytrale
 * fra Petters side).
 */

interface AdminFakturaProps {
  /** Løpet fakturaene hører til. */
  kartleggingId: string;
  /** Visning i hodet («faktureres til») — API-et utleder selv fra raden. */
  kundeEpost: string;
  kundeNavn: string;
  orgnr?: string;
}

type Lasting = "laster" | "klar" | "feil";

const FEIL_ID = "vk-fak-feil";

const STATUS_TEKST: Record<FakturaStatus, string> = {
  utkast: "Utkast",
  sendt: "Sendt",
  delbetalt: "Delbetalt",
  betalt: "Betalt",
  forfalt: "Forfalt",
  kansellert: "Kansellert",
};

function chipClass(status: FakturaStatus): string {
  if (status === "betalt") return "vk-fak-chip vk-fak-chip--betalt";
  if (status === "forfalt") return "vk-fak-chip vk-fak-chip--forfalt";
  return "vk-fak-chip";
}

/** «12 500,00 kr» — øre inn, nb-NO ut. */
function oreTilKr(ore: number | null): string {
  if (ore === null) return "—";
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(ore / 100);
}

/** «12.06.2026» fra en ISO-dato — eller streken når feltet er tomt. */
function visDato(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "short" }).format(d);
}

/** «1 234,50» / «1234.50» → 123450 øre — eller null når det ikke er pris. */
function krTilOre(raw: string): number | null {
  const s = raw.replace(/[\s ]/g, "").replace(",", ".");
  if (!s || !/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const kr = Number(s);
  if (!Number.isFinite(kr)) return null;
  return Math.round(kr * 100);
}

/** «2,5» → 2.5 — maks to desimaler, større enn null. */
function parseAntall(raw: string): number | null {
  const s = raw.replace(/[\s ]/g, "").replace(",", ".");
  if (!s || !/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Samme admin-token-grep som AdminBenken — dev-mock passerer mock-ruter. */
async function hentToken(): Promise<string> {
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? "dev-mock";
  } catch {
    return "dev-mock";
  }
}

interface LinjeUtkast {
  beskrivelse: string;
  antall: string;
  prisKr: string;
  mvaSats: MvaSats;
}

const TOM_LINJE: LinjeUtkast = {
  beskrivelse: "",
  antall: "1",
  prisKr: "",
  mvaSats: 25,
};

export default function AdminFaktura({
  kartleggingId,
  kundeEpost,
  kundeNavn,
  orgnr,
}: AdminFakturaProps) {
  const [status, setStatus] = useState<FikenStatusResponse | null>(null);
  const [fakturaer, setFakturaer] = useState<FakturaRad[]>([]);
  const [tilstand, setTilstand] = useState<Lasting>("laster");

  // Skjemaet for nye utkast.
  const [linjer, setLinjer] = useState<LinjeUtkast[]>([{ ...TOM_LINJE }]);
  const [dagerTilForfall, setDagerTilForfall] = useState(
    String(FAKTURA_DAGER_FORFALL_DEFAULT)
  );
  const [fakturatekst, setFakturatekst] = useState("");
  const [varReferanse, setVarReferanse] = useState("Workflows AS");
  const [deresReferanse, setDeresReferanse] = useState("");
  const [lagrer, setLagrer] = useState(false);
  const [forslagHentet, setForslagHentet] = useState(false);

  // Radhandlinger: to-stegs bekreftelse (arm → 5 s → utfør) per knapp.
  const [armet, setArmet] = useState<{
    id: string;
    handling: "opprett" | "send";
  } | null>(null);
  const [travelRad, setTravelRad] = useState<string | null>(null);
  const [synker, setSynker] = useState(false);
  const armTimer = useRef<number | null>(null);

  const [feil, setFeil] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current);
    };
  }, []);

  const hentAlt = useCallback(
    async (stille = false) => {
      if (!stille) setTilstand("laster");
      try {
        const token = await hentToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [statusRes, listeRes] = await Promise.all([
          fetch("/api/portal/admin/fiken/status", { headers }),
          fetch(
            `/api/portal/admin/fiken/faktura?kartleggingId=${encodeURIComponent(kartleggingId)}`,
            { headers }
          ),
        ]);
        if (!statusRes.ok) throw new Error(`fiken/status → ${statusRes.status}`);
        if (!listeRes.ok) throw new Error(`fiken/faktura → ${listeRes.status}`);
        setStatus((await statusRes.json()) as FikenStatusResponse);
        setFakturaer(
          ((await listeRes.json()) as AdminFakturaListeResponse).fakturaer
        );
        setTilstand("klar");
      } catch (err) {
        console.error("[portal/admin/faktura] fetch failed", err);
        // Stille refetch beholder den gamle lista; førstelasten sier feil.
        if (!stille) setTilstand("feil");
      }
    },
    [kartleggingId]
  );

  useEffect(() => {
    void hentAlt();
  }, [hentAlt]);

  // Autoutfyll skjemaet fra det godkjente tilbudet — én gang per løp, så
  // Petter bare trykker «Lag fakturautkast». Stille ved feil.
  useEffect(() => {
    if (forslagHentet) return;
    let avbrutt = false;
    void (async () => {
      try {
        const token = await hentToken();
        const res = await fetch(
          `/api/portal/admin/fiken/faktura?kartleggingId=${encodeURIComponent(
            kartleggingId
          )}&forslag=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok || avbrutt) return;
        const { forslag } = (await res.json()) as {
          forslag: {
            linjer: Array<{ beskrivelse: string; antall: number; enhetsprisOre: number; mvaSats: MvaSats }>;
            dagerTilForfall: number;
            fakturatekst: string;
            varReferanse: string;
            deresReferanse: string;
          };
        };
        if (avbrutt || !forslag) return;
        if (forslag.linjer.length > 0) {
          setLinjer(
            forslag.linjer.map((l) => ({
              beskrivelse: l.beskrivelse,
              antall: String(l.antall),
              prisKr: l.enhetsprisOre > 0 ? String(l.enhetsprisOre / 100).replace(".", ",") : "",
              mvaSats: l.mvaSats,
            }))
          );
        }
        setDagerTilForfall(String(forslag.dagerTilForfall));
        if (forslag.fakturatekst) setFakturatekst(forslag.fakturatekst);
        if (forslag.deresReferanse) setDeresReferanse(forslag.deresReferanse);
      } catch {
        // stille — skjemaet står med tom standardlinje
      } finally {
        if (!avbrutt) setForslagHentet(true);
      }
    })();
    return () => {
      avbrutt = true;
    };
  }, [kartleggingId, forslagHentet]);

  /** POST mot admin-API-et — kaster med serverens feilmelding når den finnes. */
  const postJson = useCallback(
    async (sti: string, body: unknown): Promise<unknown> => {
      const token = await hentToken();
      const res = await fetch(sti, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(json?.error || `${sti} → ${res.status}`);
      }
      return json;
    },
    []
  );

  /* ── Skjema: linjer ── */

  function settLinje(idx: number, endring: Partial<LinjeUtkast>) {
    setLinjer((ls) => ls.map((l, i) => (i === idx ? { ...l, ...endring } : l)));
  }

  function leggTilLinje() {
    setLinjer((ls) =>
      ls.length < FAKTURA_LINJER_MAX ? [...ls, { ...TOM_LINJE }] : ls
    );
  }

  function fjernLinje(idx: number) {
    setLinjer((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== idx) : ls));
  }

  /** Klient-speiling av server-valideringen — sier hva som mangler. */
  function byggLinjer(): FakturaLinjeInput[] | string {
    const ut: FakturaLinjeInput[] = [];
    for (const [i, l] of linjer.entries()) {
      const beskrivelse = l.beskrivelse.trim();
      if (!beskrivelse) return `Linje ${i + 1} mangler beskrivelse.`;
      const antall = parseAntall(l.antall);
      if (antall === null) return `Linje ${i + 1} har ugyldig antall.`;
      const enhetsprisOre = krTilOre(l.prisKr);
      if (enhetsprisOre === null) {
        return `Linje ${i + 1} har ugyldig pris (kroner, f.eks. 12 500 eller 1250,50).`;
      }
      ut.push({ beskrivelse, antall, enhetsprisOre, mvaSats: l.mvaSats });
    }
    return ut;
  }

  /** Løpende sum nederst i skjemaet — netto + mva per gyldig linje. */
  function skjemaSumOre(): { netto: number; mva: number } | null {
    let netto = 0;
    let mva = 0;
    let noeGyldig = false;
    for (const l of linjer) {
      const antall = parseAntall(l.antall);
      const pris = krTilOre(l.prisKr);
      if (antall === null || pris === null) continue;
      const linjeNetto = Math.round(antall * pris);
      netto += linjeNetto;
      mva += Math.round((linjeNetto * l.mvaSats) / 100);
      noeGyldig = true;
    }
    return noeGyldig ? { netto, mva } : null;
  }

  async function lagUtkast(e: FormEvent) {
    e.preventDefault();
    if (lagrer) return;
    const bygde = byggLinjer();
    if (typeof bygde === "string") {
      setFeil(bygde);
      setMelding(null);
      return;
    }
    const dager = Number(dagerTilForfall);
    if (
      !Number.isInteger(dager) ||
      dager < FAKTURA_DAGER_FORFALL_MIN ||
      dager > FAKTURA_DAGER_FORFALL_MAX
    ) {
      setFeil(
        `Dager til forfall må være ${FAKTURA_DAGER_FORFALL_MIN}–${FAKTURA_DAGER_FORFALL_MAX}.`
      );
      setMelding(null);
      return;
    }
    setFeil(null);
    setMelding(null);
    setLagrer(true);
    try {
      const body: AdminFakturaOpprettBody = {
        kartleggingId,
        linjer: bygde,
        dagerTilForfall: dager,
        ...(fakturatekst.trim() ? { fakturatekst: fakturatekst.trim() } : {}),
        ...(varReferanse.trim() ? { varReferanse: varReferanse.trim() } : {}),
        ...(deresReferanse.trim() ? { deresReferanse: deresReferanse.trim() } : {}),
      };
      await postJson("/api/portal/admin/fiken/faktura", body);
      setLinjer([{ ...TOM_LINJE }]);
      setFakturatekst("");
      setDeresReferanse("");
      setDagerTilForfall(String(FAKTURA_DAGER_FORFALL_DEFAULT));
      setMelding("Utkastet ligger i Fiken — neste steg er «Lag faktura».");
      await hentAlt(true);
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setLagrer(false);
    }
  }

  /* ── Radhandlinger ── */

  function arm(id: string, handling: "opprett" | "send") {
    if (armTimer.current !== null) window.clearTimeout(armTimer.current);
    setArmet({ id, handling });
    armTimer.current = window.setTimeout(() => {
      setArmet(null);
      armTimer.current = null;
    }, 5000);
  }

  async function utfor(f: FakturaRad, handling: "opprett" | "send") {
    // Aldri to handlinger i flukta — en faktura skal ikke kunne sendes to
    // ganger fordi knappen rakk et ekstra klikk.
    if (travelRad) return;
    // Første trykk armerer; bare et andre trykk innen 5 s når hit.
    if (armet?.id !== f.id || armet.handling !== handling) {
      arm(f.id, handling);
      return;
    }
    if (armTimer.current !== null) {
      window.clearTimeout(armTimer.current);
      armTimer.current = null;
    }
    setArmet(null);
    setFeil(null);
    setMelding(null);
    setTravelRad(f.id);
    try {
      if (handling === "opprett") {
        await postJson("/api/portal/admin/fiken/faktura/opprett", {
          fakturaId: f.id,
        });
        setMelding("Fakturaen er opprettet i Fiken — send når du er klar.");
      } else {
        await postJson("/api/portal/admin/fiken/faktura/send", {
          fakturaId: f.id,
          metode: "auto",
        });
        setMelding("Fakturaen er sendt. Kunden ser den nå i Benken.");
      }
      await hentAlt(true);
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setTravelRad(null);
    }
  }

  async function synk() {
    if (synker) return;
    setFeil(null);
    setMelding(null);
    setSynker(true);
    try {
      const resultat = (await postJson(
        "/api/portal/admin/fiken/sync",
        {}
      )) as AdminFikenSyncResponse;
      setMelding(
        resultat.totalt === 0
          ? "Ingenting å synke ennå."
          : `Synket ${resultat.totalt} — ${resultat.oppdatert} endret` +
              (resultat.feil.length ? `, ${resultat.feil.length} feil.` : ".")
      );
      await hentAlt(true);
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Synken feilet.");
    } finally {
      setSynker(false);
    }
  }

  /* ── Rendering ── */

  function fakturaRad(f: FakturaRad) {
    const travel = travelRad === f.id;
    const kanOpprette = f.fikenDraftId !== null && f.fikenInvoiceId === null;
    const kanSende = f.fikenInvoiceId !== null && f.status !== "kansellert";
    const opprettArmet =
      armet?.id === f.id && armet.handling === "opprett";
    const sendArmet = armet?.id === f.id && armet.handling === "send";
    return (
      <li key={f.id} className="vk-fak-rad">
        <p className="vk-mono vk-fak-radmeta">
          <span className={chipClass(f.status)}>{STATUS_TEKST[f.status]}</span>
          <span className="vk-fak-belop">{oreTilKr(f.belopOre)}</span>
          {f.invoiceNumber !== null ? (
            <span>Faktura nr. {f.invoiceNumber}</span>
          ) : (
            <span>Utkast i Fiken</span>
          )}
          <span>Forfall {visDato(f.dueDate)}</span>
          {f.kid ? <span>KID {f.kid}</span> : null}
        </p>
        {f.beskrivelse ? (
          <p className="vk-fak-beskrivelse">{f.beskrivelse}</p>
        ) : null}
        <p className="vk-mono vk-fak-radmeta vk-fak-radmeta--dimmet">
          <span>Opprettet {visDato(f.createdAt)}</span>
          {f.sistSynketAt ? (
            <span>Sist synket {visDato(f.sistSynketAt)}</span>
          ) : null}
          {f.sendtVia ? <span>Sendt via {f.sendtVia}</span> : null}
        </p>
        {kanOpprette || kanSende ? (
          <div className="vk-fak-knapperad">
            {kanOpprette ? (
              <button
                type="button"
                className="vk-mono vk-fak-knapp"
                data-armed={opprettArmet ? "true" : undefined}
                disabled={travel}
                aria-busy={travel || undefined}
                aria-disabled={travel || undefined}
                onClick={() => void utfor(f, "opprett")}
              >
                {opprettArmet ? "Sikker? Trykk igjen" : "Lag faktura i Fiken"}
              </button>
            ) : null}
            {kanSende ? (
              <button
                type="button"
                className="vk-mono vk-fak-knapp"
                data-armed={sendArmet ? "true" : undefined}
                disabled={travel}
                aria-busy={travel || undefined}
                aria-disabled={travel || undefined}
                onClick={() => void utfor(f, "send")}
              >
                {sendArmet
                  ? "Sikker? Trykk igjen"
                  : f.status === "utkast"
                    ? "Send faktura"
                    : "Send på nytt"}
              </button>
            ) : null}
          </div>
        ) : null}
        {/* Armeringen flipper teksten på den fokuserte knappen — speil den
            i en live region så skiftet annonseres pålitelig. */}
        <p className="vk-sr" role="status">
          {opprettArmet || sendArmet ? "Sikker? Trykk igjen" : ""}
        </p>
      </li>
    );
  }

  return (
    <section className="vk-adm-seksjon vk-fak" aria-label="Fakturering">
      <h2 className="vk-mono vk-adm-stittel">Fakturering</h2>

      {tilstand === "laster" ? (
        <p className="vk-mono vk-fak-tomt" role="status">
          Henter …
        </p>
      ) : null}

      {tilstand === "feil" ? (
        <>
          <p className="vk-portal-feilmelding" role="alert">
            Fikk ikke hentet faktureringen. Prøv igjen.
          </p>
          <div>
            <button
              type="button"
              className="vk-btn"
              onClick={() => void hentAlt()}
            >
              Prøv igjen
            </button>
          </div>
        </>
      ) : null}

      {tilstand === "klar" && status ? (
        <>
          {/* ── Tilkoblingslinja ── */}
          {status.koblet ? (
            <p className="vk-mono vk-fak-kobling">
              <span className="vk-fak-koblingsdot" aria-hidden="true" />
              Koblet til Fiken
              {status.selskap ? ` — ${status.selskap}` : ""}
              {status.testCompany ? " (testselskap)" : ""}
              <span className="vk-fak-koblingsvia">
                {status.via === "token" ? "API-nøkkel" : "OAuth"}
              </span>
            </p>
          ) : (
            <div className="vk-fak-koblingsboks">
              <p className="vk-mono vk-fak-tomt">
                {status.feil
                  ? `Fiken: ${status.feil}`
                  : "Fiken er ikke koblet til ennå."}
              </p>
              {status.authUrl ? (
                // Hel navigasjon (ikke fetch) — state-cookien er alt satt
                // av status-svaret, og Fiken sender oss til callbacken.
                <a className="vk-btn vk-btn--cta" href={status.authUrl}>
                  Koble til Fiken
                </a>
              ) : status.via === null ? (
                <p className="vk-mono vk-fak-tomt">
                  Sett FIKEN_PERSONAL_TOKEN (anbefalt) eller FIKEN_CLIENT_ID
                  + FIKEN_CLIENT_SECRET i env — se docs/fiken.md.
                </p>
              ) : null}
            </div>
          )}

          {/* ── Fakturalista ── */}
          <div className="vk-fak-listehode">
            <p className="vk-mono vk-fak-tilhvem">
              Faktureres til {kundeNavn} ({kundeEpost}
              {orgnr ? `, org.nr. ${orgnr}` : ""})
            </p>
            <button
              type="button"
              className="vk-mono vk-fak-knapp"
              disabled={synker}
              aria-busy={synker || undefined}
              aria-disabled={synker || undefined}
              onClick={() => void synk()}
            >
              {synker ? "Synker …" : "Synk status"}
            </button>
          </div>

          {fakturaer.length === 0 ? (
            <p className="vk-mono vk-fak-tomt">
              Ingen fakturaer i dette løpet ennå.
            </p>
          ) : (
            <ol className="vk-fak-liste">{fakturaer.map(fakturaRad)}</ol>
          )}

          {/* ── Nytt fakturautkast ── */}
          {status.koblet ? (
            <form className="vk-fak-skjema" onSubmit={lagUtkast} noValidate>
              <h3 className="vk-mono vk-adm-stittel">Nytt fakturautkast</h3>

              {linjer.map((l, idx) => (
                <fieldset key={idx} className="vk-fak-linje">
                  <legend className="vk-sr">Fakturalinje {idx + 1}</legend>
                  <div className="vk-portal-felt vk-fak-felt--beskrivelse">
                    <label
                      className="vk-portal-label"
                      htmlFor={`vk-fak-besk-${idx}`}
                    >
                      Beskrivelse
                    </label>
                    <input
                      id={`vk-fak-besk-${idx}`}
                      type="text"
                      className="vk-portal-input"
                      maxLength={FAKTURA_LINJE_BESKRIVELSE_MAX}
                      value={l.beskrivelse}
                      placeholder="F.eks. «AI-chatbot, fase 1 av 2»"
                      onChange={(e) =>
                        settLinje(idx, { beskrivelse: e.target.value })
                      }
                    />
                  </div>
                  <div className="vk-portal-felt vk-fak-felt--antall">
                    <label
                      className="vk-portal-label"
                      htmlFor={`vk-fak-antall-${idx}`}
                    >
                      Antall
                    </label>
                    <input
                      id={`vk-fak-antall-${idx}`}
                      type="text"
                      inputMode="decimal"
                      className="vk-portal-input"
                      value={l.antall}
                      onChange={(e) => settLinje(idx, { antall: e.target.value })}
                    />
                  </div>
                  <div className="vk-portal-felt vk-fak-felt--pris">
                    <label
                      className="vk-portal-label"
                      htmlFor={`vk-fak-pris-${idx}`}
                    >
                      Pris (kr eks. mva)
                    </label>
                    <input
                      id={`vk-fak-pris-${idx}`}
                      type="text"
                      inputMode="decimal"
                      className="vk-portal-input"
                      value={l.prisKr}
                      placeholder="45 000"
                      onChange={(e) => settLinje(idx, { prisKr: e.target.value })}
                    />
                  </div>
                  <div className="vk-portal-felt vk-fak-felt--mva">
                    <label
                      className="vk-portal-label"
                      htmlFor={`vk-fak-mva-${idx}`}
                    >
                      Mva
                    </label>
                    <select
                      id={`vk-fak-mva-${idx}`}
                      className="vk-portal-input vk-fak-select"
                      value={l.mvaSats}
                      onChange={(e) =>
                        settLinje(idx, {
                          mvaSats: Number(e.target.value) as MvaSats,
                        })
                      }
                    >
                      {MVA_SATSER.map((s) => (
                        <option key={s} value={s}>
                          {s} %
                        </option>
                      ))}
                    </select>
                  </div>
                  {linjer.length > 1 ? (
                    <button
                      type="button"
                      className="vk-fak-fjernlinje"
                      aria-label={`Fjern linje ${idx + 1}`}
                      onClick={() => fjernLinje(idx)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}
                </fieldset>
              ))}

              <div className="vk-fak-skjemarad">
                <button
                  type="button"
                  className="vk-mono vk-fak-knapp"
                  disabled={linjer.length >= FAKTURA_LINJER_MAX}
                  onClick={leggTilLinje}
                >
                  + Linje
                </button>
                {(() => {
                  const sum = skjemaSumOre();
                  return sum ? (
                    <p className="vk-mono vk-fak-sum" aria-live="polite">
                      {oreTilKr(sum.netto)} eks. mva · {oreTilKr(sum.netto + sum.mva)}{" "}
                      inkl. mva
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="vk-fak-skjemarad vk-fak-skjemarad--detaljer">
                <div className="vk-portal-felt vk-fak-felt--forfall">
                  <label className="vk-portal-label" htmlFor="vk-fak-forfall">
                    Dager til forfall
                  </label>
                  <input
                    id="vk-fak-forfall"
                    type="number"
                    min={FAKTURA_DAGER_FORFALL_MIN}
                    max={FAKTURA_DAGER_FORFALL_MAX}
                    className="vk-portal-input"
                    value={dagerTilForfall}
                    onChange={(e) => setDagerTilForfall(e.target.value)}
                  />
                </div>
                <div className="vk-portal-felt vk-fak-felt--tekst">
                  <label className="vk-portal-label" htmlFor="vk-fak-tekst">
                    Fakturatekst (valgfri)
                  </label>
                  <input
                    id="vk-fak-tekst"
                    type="text"
                    className="vk-portal-input"
                    maxLength={FAKTURA_BESKRIVELSE_MAX}
                    value={fakturatekst}
                    placeholder="Vises på fakturaen i Fiken"
                    onChange={(e) => setFakturatekst(e.target.value)}
                  />
                </div>
              </div>

              <div className="vk-fak-skjemarad vk-fak-skjemarad--detaljer">
                <div className="vk-portal-felt vk-fak-felt--tekst">
                  <label className="vk-portal-label" htmlFor="vk-fak-varref">
                    Vår referanse
                  </label>
                  <input
                    id="vk-fak-varref"
                    type="text"
                    className="vk-portal-input"
                    maxLength={FAKTURA_REFERANSE_MAX}
                    value={varReferanse}
                    placeholder="f.eks. Petter Staveland"
                    onChange={(e) => setVarReferanse(e.target.value)}
                  />
                </div>
                <div className="vk-portal-felt vk-fak-felt--tekst">
                  <label className="vk-portal-label" htmlFor="vk-fak-deresref">
                    Deres referanse
                  </label>
                  <input
                    id="vk-fak-deresref"
                    type="text"
                    className="vk-portal-input"
                    maxLength={FAKTURA_REFERANSE_MAX}
                    value={deresReferanse}
                    placeholder="kundens kontaktperson"
                    onChange={(e) => setDeresReferanse(e.target.value)}
                  />
                </div>
              </div>

              <div className="vk-adm-formrad vk-adm-formrad--send">
                {/* Ekte disabled i flukta — i tillegg til guarden i
                    lagUtkast(); aria-busy forteller AT. */}
                <button
                  type="submit"
                  className="vk-btn vk-btn--cta"
                  disabled={lagrer}
                  aria-busy={lagrer || undefined}
                  aria-disabled={lagrer || undefined}
                >
                  Lag fakturautkast
                </button>
              </div>
            </form>
          ) : null}

          {/* Alltid i DOM — live regions må finnes FØR innholdet skifter. */}
          <p className="vk-fak-bekreftelse" role="status">
            {melding ?? ""}
          </p>
          {feil ? (
            <p className="vk-portal-feilmelding" role="alert" id={FEIL_ID}>
              {feil}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
