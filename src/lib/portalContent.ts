import type { Lang } from "@/lib/translations";
import type {
  ForesporselStatus,
  PortalAnbefaling,
  PortalStatus,
  ProsjektFakturaStatus,
  ProsjektFeedType,
  ProsjektFra,
  ResearchFunn,
} from "@/lib/portalTypes";

/**
 * Kundeportalen («Verkstedet» /start) — ALL user-facing strings, NO + EN.
 *
 * Voice: verkstedsstemme — tørrvittig, varm, null hype. The honesty IS the
 * brand: the assessment may well conclude «dere trenger ikke AI til dette».
 * EN is hand-authored in the same voice, never machine-translated word for
 * word. Chip/step ids are language-independent — they go straight into the
 * answers JSON, so they must be identical across NO and EN.
 */

export type PortalStepId =
  | "bedrift"
  | "bransje"
  | "storrelse"
  | "tidstyver"
  | "tidsbruk"
  | "systemer"
  | "kundehenvendelser"
  | "dromen"
  /** Dynamic step — NOT in the steps arrays; the Wizard injects it after
   *  «dromen» when /api/portal/oppfolging produced a question. The answer
   *  lives at answers.oppfolging = { sporsmal, svar }. */
  | "oppfolging"
  | "rolle"
  | "budsjett"
  | "tempo"
  /** The review screen — last step, carries no answer of its own. */
  | "oppsummering";

export interface PortalChip {
  /** Stable id stored in answers — same across languages. */
  id: string;
  label: string;
  /**
   * Legacy chip: resolvable by id → label lookups (old rows keep their
   * readable etiketter) but never rendered as a pressable chip. Set when a
   * chip is split/retired — NEVER reuse a retired id for something new.
   */
  skjult?: boolean;
}

export interface PortalStep {
  id: PortalStepId;
  sporsmal: string;
  hint?: string;
  /** Multi-select chips (default: single-select). */
  multi?: boolean;
  chips?: PortalChip[];
  /** Step has a free-text field (alone, or alongside chips / «annet»). */
  fritekst?: boolean;
  plassholder?: string;
}

export interface PortalLevel {
  /** 1-indexed level number on the rail. */
  n: number;
  navn: string;
}

export interface PortalContent {
  header: {
    /** Accessible name for the wordmark link back to "/". */
    hjemLabel: string;
    /** The escape hatch — link to /#kontakt. */
    avbryt: string;
    /** Quiet session escape — clears the Supabase session. */
    loggUt: string;
  };
  /** The five levels on the rail: 1 KARTLEGGING → 5 SKJØTET. */
  levels: [PortalLevel, PortalLevel, PortalLevel, PortalLevel, PortalLevel];
  intro: {
    tittel: string;
    undertekst: string;
    startKnapp: string;
    taPratHeller: string;
    /** Quiet returning-user link below the start button → loginOnly gate. */
    loggInnLenke: string;
  };
  /** The wizard steps, in order (oppsummering last). "bransje"/"storrelse"
   *  are auto-skipped when the company research already answered them; the
   *  dynamic "oppfolging" step is injected by the Wizard, never listed here. */
  steps: PortalStep[];
  wizard: {
    neste: string;
    tilbake: string;
    sendInn: string;
    /** The edit-link on each oppsummering row. */
    endre: string;
    /** aria-label for the edit-link: «Endre svaret på: {sporsmal}». */
    endreTemplate: string;
    /** Shown on an oppsummering row with no answer (only oppfolging can). */
    ikkeBesvart: string;
    /** «{n} tegn igjen» — the dromen character counter near the cap. */
    tegnIgjenTemplate: string;
  };
  /** The adaptive follow-up moment (dynamic step after «dromen»). */
  oppfolging: {
    /** Mono status while the question is generated (lookup-moment pattern). */
    tenker: string;
    /** Quiet note under the generated question — says it's skippable. */
    hint: string;
    plassholder: string;
  };
  /** The bedrift step + lookup moment (BRREG + company website). */
  research: {
    /** Visible label for the required company-name input. */
    navnLabel: string;
    navnPlassholder: string;
    /** Visible label for the optional website input. */
    nettsideLabel: string;
    /** Quiet add-on after the website label: «valgfritt — vi titter gjerne». */
    nettsideHint: string;
    nettsidePlassholder: string;
    /** Mono status while the lookup runs (also the role=status message). */
    slaarOpp: string;
    /** Second status line — the lookup now also reads their website. */
    leserNettsiden: string;
    /** Heading on the confirmation card: «Fant dere:». */
    fantDere: string;
    /** «{n} ansatte» — meta line on the card, only when present. */
    ansatteTemplate: string;
    /** Chip: confirm — stores the research and continues. */
    stemmer: string;
    /** Chip: reject — continues without storing the research. */
    ikkeOss: string;
    /** Quiet mono note on the step after bedrift when bransje was skipped. */
    fantBransjen: string;
  };
  authgate: {
    tittel: string;
    forklaring: string;
    epostLabel: string;
    epostPlassholder: string;
    sendLenke: string;
    lenkeSendt: string;
    /** Resend button label (30s cooldown). */
    sendPaNytt: string;
    /** Cooldown line — {s} replaced with seconds left. */
    sendPaNyttOm: string;
    feil: string;
    /** Empty/invalid email on submit (WCAG 3.3.1 — never fail silently). */
    epostMangler: string;
    /** Magic link came back expired/used (#error_code=otp_expired). */
    lenkeUtlopt: string;
    /** Supabase email rate limit hit — our ceiling, not their typo. */
    forMangeLenker: string;
    /** Label above the 6-digit one-time-code field (shown after send). */
    kodeLabel: string;
    kodePlassholder: string;
    /** Verify button beside the code field. */
    loggInnMedKode: string;
    /** Quiet alternative line — the magic link in the same email works too. */
    ellerLenke: string;
    /** Code submitted with fewer than 6 digits (never fail silently). */
    kodeMangler: string;
    /** verifyOtp said no — wrong or expired code (precise, not generic). */
    kodeUgyldig: string;
    /** loginOnly mode (returning user) — heading. */
    loginTittel: string;
    /** loginOnly mode — explanation (no draft, no generation pending). */
    loginForklaring: string;
    /** After loginOnly auth when /me has no rows — wizard step 1 notice. */
    ingenKartlegging: string;
  };
  generating: {
    tittel: string;
    /** Rotating mono status lines while the model draws. */
    statuslinjer: string[];
  };
  forslag: {
    kicker: string;
    /** Section headings for the assessment fields. */
    skisseLabel: string;
    tidslinjeLabel: string;
    nesteLabel: string;
    mockupAlt: string;
    likerKnapp: string;
    ikkeKnapp: string;
    taPrat: string;
    /** Own heading when anbefaling === "ikke_ai" — the honest no. */
    ikkeAiTittel: string;
    /** After «lik»: level 3 waiting state. */
    videreTekst: string;
    /** «vi sier ifra på e-post»-line in the waiting state after «lik». */
    videreEpost: string;
    /** The LIKE click failed — never reuse the «genereringen feilet»-copy. */
    likFeil: string;
    /** Quiet restart link («ikke»-state and rail-back). */
    startPaNytt: string;
    /** Labels for the kontaktkort-light in the videre state. */
    epostLabel: string;
    telefonLabel: string;
  };
  /** Generation failed (submit error or status «feilet»). */
  feil: {
    tittel: string;
    tekst: string;
    provIgjen: string;
    forMangeTittel: string;
    forMangeTekst: string;
  };
  a11y: {
    /** aria-label for the level rail <nav>. */
    railLabel: string;
    /** «Steg {n} av {total}» — wizard progress for assistive tech. */
    stegTemplate: string;
    /** «Nivå {n}: {navn}» — accessible name per rail stop. */
    levelTemplate: string;
    /** Announced on the current rail stop (aria-current). */
    duErHer: string;
    /** Accessible name for the fritekst input on chips+fritekst steps. */
    egneOrd: string;
  };
  /** Level 3 — Petters hand-written quote (status «tilbud_sendt»). */
  tilbud: {
    kicker: string;
    tittel: string;
    /** <summary> label for the collapsed assessment from level 2. */
    seVurdering: string;
    /** Stamp-style heading on the cream quote sheet. */
    arkOverskrift: string;
    /** «sendt {dato}» — quiet mono date line on the sheet. */
    sendtTemplate: string;
    prisLabel: string;
    leveranseLabel: string;
    /**
     * Binding terms — LOCKED text (Petter approved, verbatim). The server
     * stores THIS string as godkjent_vilkar on approval; never reword
     * without a new approval.
     */
    vilkar: string;
    /** Short a11y group label for the vilkår checkbox row. */
    vilkarLabel: string;
    godkjennKnapp: string;
    /** The APPROVE click failed — never the «genereringen feilet»-copy. */
    godkjennFeil: string;
    /** Quiet mailto link beside the CTA. */
    sporsmalLenke: string;
    /** «eks. mva» — suffix under the structured price amount. */
    belopEksMva: string;
    /** Level 4 — after approval (status «videre»). */
    godkjentTittel: string;
    godkjentTekst: string;
    /** «Skriv ut / lagre som PDF» — on the kvittering + skjøtet ark. */
    skrivUt: string;
    /** The receipt — the approved quote as a printable cream sheet. */
    kvittering: {
      /** <summary>/section label above the sheet (phase «videre»). */
      tittel: string;
      /** Stamp-style heading on the sheet. */
      stempel: string;
      /** «godkjent {dato}» — the binding date line. */
      godkjentTemplate: string;
      /** Mono label over the terms text the customer accepted. */
      vilkarTittel: string;
      /** Signature line at the foot of the sheet. */
      signatur: string;
    };
  };
  /** Level 5 — SKJØTET (status «levert»): the handover experience. */
  skjotet: {
    tittel: string;
    /** Thank-you lead in the verkstedsstemme. */
    tekst: string;
    /** Stamp-style heading on the cream skjøte sheet. */
    stempel: string;
    /** «levert {dato}» — quiet mono date line on the sheet. */
    levertTemplate: string;
    /** Mono label over Petters closing report. */
    sluttrapportTittel: string;
    /** Mono label over the approved-quote block on the same sheet. */
    kvitteringTittel: string;
    /** The quiet maintenance / next-project CTA under the sheet. */
    ctaTekst: string;
    ctaKnapp: string;
    /** Quiet line introducing the read-only project room below. */
    arkivTekst: string;
  };
  /** «Benken» — the customer's project room behind status «videre». */
  benken: {
    tittel: string;
    undertekst: string;
    /** «uke {n} av 6» — quiet mono line under the rail (kartlegginger.uke). */
    ukeTemplate: string;
    /** Mono line while the first fetch runs. */
    henter: string;
    feil: string;
    provIgjen: string;
    /** The room is open but nothing is posted yet. */
    tomt: string;
    /** Accessible name for the feed list. */
    feedLabel: string;
    /** sr-prefixes on notes — who wrote it (sighted users read the layout). */
    fraOss: string;
    fraDere: string;
    /** Byline on workflows-innlegg (lantern dot + name) — both feeds. */
    fraWorkflows: string;
    /** Byline on the customer's OWN posts (customer side only). */
    degSelv: string;
    /** Mono card label on type «leveranse» (CSS uppercases it). */
    leveranseLabel: string;
    /** Button on a leveranse carrying an https-link (arrow added in JSX). */
    apneKnapp: string;
    /** Mono card label on type «foresporsel». */
    foresporselLabel: string;
    /** The --drift-green chip once a foresporsel is answered. */
    levertChip: string;
    /** «Last ned {navn}» — aria-label on file download links. */
    lastNedTemplate: string;
    /** «Vis {navn}» — aria-label on image thumbnails (opens lysbordet). */
    visBildeTemplate: string;
    /** Lysbordet (the shared lightbox dialog) — close + download. */
    lysLukk: string;
    lysLastNed: string;
    /** Inline answer composer on an open foresporsel. */
    svarLabel: string;
    svarSend: string;
    /** The main composer at the bottom of the room. */
    skrivLabel: string;
    skrivPlassholder: string;
    sendKnapp: string;
    velgFil: string;
    /** «Fjern {navn}» — aria-label on the remove-file button. */
    fjernFilTemplate: string;
    /** Quiet allowlist hint beside the file button. */
    filHint: string;
    /** The secrets warning — quiet mono line under the composer. */
    sikkerhet: string;
    /** Validation + errors (WCAG 3.3.1 — always say what's wrong). */
    tomMelding: string;
    filForStor: string;
    filType: string;
    /** More than PROSJEKT_FILER_MAX files picked for one message. */
    forMangeFiler: string;
    sendFeil: string;
    forMange: string;
    /** Polite live region: own post landed / something new arrived. */
    sendtBekreftelse: string;
    nyttInnlegg: string;
    /** Day dividers — relative labels; older days fall back to the date. */
    iDag: string;
    iGar: string;
    /** The «── nytt ──» divider over the first innlegg since last visit. */
    nyttSkille: string;
    nyttSkilleSr: string;
    /** Chip on the optimistic note while a post is in flight. */
    senderChip: string;
    /** «laster opp {navn} — {i} av {n}» — file progress on the same note. */
    lasterOppTemplate: string;
    /** Mono card label on feed type «faktura». */
    fakturaLabel: string;
    /** Mono label on feed type «milepael» (the quiet celebration line). */
    milepaelLabel: string;
    /** The invoice panel under the room header. */
    fakturaTittel: string;
    fakturaTom: string;
    fakturaNrTemplate: string;
    /** Fallback title while Fiken hasn't assigned a number yet. */
    fakturaUtenNr: string;
    fakturaForfallTemplate: string;
    fakturaBetaltTemplate: string;
    /** Quiet amber note beside an overdue invoice (red stays decorative). */
    fakturaForfaltTekst: string;
    fakturaStatus: Record<ProsjektFakturaStatus, string>;
    /** Replaces the composer once the project is «levert» (read-only room). */
    levertMelding: string;
  };
  /** Verkstedkontoret (/start/admin) — Petters bakrom. Quiet, dense. */
  admin: {
    /** Mono badge in the topbar + kicker over the list. */
    kicker: string;
    login: {
      tittel: string;
      forklaring: string;
    };
    /** Logged in, but not Petter. */
    ikkeDinDor: {
      tittel: string;
      tekst: string;
      hjem: string;
      byttKonto: string;
    };
    felles: {
      /** Mono line while a fetch runs. */
      henter: string;
      feil: string;
      provIgjen: string;
    };
    liste: {
      tittel: string;
      /** «{n} kartlegginger» — quiet mono count under the heading. */
      antallTemplate: string;
      tom: string;
      /** Row fallback when answers carry no company name. */
      ukjentBedrift: string;
      /** Unread tag — customer activity since the admin last opened it. */
      nyttFraKunde: string;
      /** «NYTT FRA KUNDE ({n})» — with the unread post count when > 0. */
      nyttFraKundeAntallTemplate: string;
      /** Quiet manual refresh button (mono, ≥44px target). */
      oppdater: string;
      /** «sist hentet {tid}» — quiet mono line beside the refresh button. */
      sistHentetTemplate: string;
      /** Search field over navn/e-post/bedrift. */
      sokLabel: string;
      sokPlassholder: string;
      /** Nothing matched the active filter/search. */
      ingenTreff: string;
      /** Pipeline filter chips — «Alle» + one per column. */
      filterAlle: string;
      pipeline: {
        nye: string;
        forslagKlart: string;
        likt: string;
        tilbudSendt: string;
        bygges: string;
        levert: string;
        feilet: string;
      };
      /** SLA-pulse: the «venter på deg»-filter + per-row reasons. */
      venterPaDeg: string;
      /** «{n} venter på deg» — summary line over the list. */
      venterAntallTemplate: string;
      slaLiktTemplate: string;
      slaForesporslerTemplate: string;
      slaFeilet: string;
      /** Relative time — «nettopp», «{n} min siden», «{n} t siden», «{n} d siden». */
      relNaa: string;
      relMinTemplate: string;
      relTimeTemplate: string;
      relDagTemplate: string;
      /** Soft-deleted rows: toggle + chip. */
      visSlettedeTemplate: string;
      skjulSlettede: string;
      slettetChip: string;
    };
    /** Chip text per status — short, lowercase, mono. */
    status: Record<PortalStatus, string>;
    /** Readable label per anbefaling. */
    anbefaling: Record<PortalAnbefaling, string>;
    detalj: {
      /** Back-link to the list. */
      tilbake: string;
      svarTittel: string;
      /** Suffix on the label of a `${id}_tekst` free-text answer. */
      egneOrdSuffix: string;
      researchTittel: string;
      vurderingTittel: string;
      /** Quiet mono note when assessment is still null. */
      ingenVurdering: string;
      mockupAlt: string;
      /** Mono labels for the research-funn fields. */
      researchFelter: Record<keyof ResearchFunn, string>;
      /** «tilbud sendt {dato}» — meta line in the detail header. */
      tilbudSendtTemplate: string;
      /** «godkjent {dato}» — meta line when the customer has approved. */
      godkjentTemplate: string;
      /** «levert {dato}» — meta line once the project is delivered. */
      levertTemplate: string;
      /** «slettet {dato}» — meta line on a soft-deleted row. */
      slettetTemplate: string;
      /** Suffix on the label of the AI follow-up answer. */
      oppfolgingSuffix: string;
      /** The price-signal box at the top: budsjett + regnskapstall. */
      prislappTittel: string;
      prislappBudsjett: string;
    };
    tilbudForm: {
      tittel: string;
      tekstLabel: string;
      tekstPlassholder: string;
      prisLabel: string;
      prisPlassholder: string;
      leveranseLabel: string;
      leveransePlassholder: string;
      /** Structured price (the Fiken bridge) — amount ex. VAT + VAT rate. */
      belopLabel: string;
      belopPlassholder: string;
      belopHint: string;
      belopUgyldig: string;
      mvaLabel: string;
      sendKnapp: string;
      /** Button label when a tilbud already exists on the row. */
      oppdaterKnapp: string;
      /** «sendt {dato}» — quiet mono line when tilbudSendtAt is set. */
      sendtTemplate: string;
      bekreftelse: string;
      /** Validation: all three fields required (WCAG 3.3.1). */
      mangler: string;
      feil: string;
      /** «Tilbudet er låst — kunden godkjente det {dato}.» (frozen in DB). */
      laastTemplate: string;
      /** Shown for innsendt/genererer/feilet — the route 409s those, so
          the form waits until the assessment is actually ready. */
      ikkeKlar: string;
    };
    /** The lever-flow — mark the project «levert» (level 5 SKJØTET). */
    lever: {
      tittel: string;
      forklaring: string;
      sluttrapportLabel: string;
      sluttrapportPlassholder: string;
      knapp: string;
      /** Armed state — second press within 5s delivers. */
      bekreft: string;
      bekreftelse: string;
      mangler: string;
      feil: string;
      /** Shown once levert: «levert {dato}» + the report + the undo. */
      levertTemplate: string;
      sluttrapportTittel: string;
      angreKnapp: string;
      angreBekreft: string;
      angreFeil: string;
    };
    /** Delete — two-stage confirm at the bottom of the detail view.
        SOFT delete: the row is stamped slettet_at and hidden, never purged. */
    slett: {
      knapp: string;
      /** Armed state — second press within 5s deletes for good. */
      bekreft: string;
      feil: string;
      /** Quiet explanation under the button — what soft delete means. */
      forklaring: string;
    };
    /** «Benken» seen from the office — feed + composer on a videre row. */
    benken: {
      tittel: string;
      /** «uke {n} av 6» — the project clock over the feed. */
      ukeTemplate: string;
      ukeIkkeSatt: string;
      tom: string;
      /** Voice tags in the feed meta line (CSS uppercases them). */
      fra: Record<ProsjektFra, string>;
      /** Doubles as composer chip labels and feed meta — capitalized.
          Covers the full feed union (incl. faktura/milepael, render-only). */
      typer: Record<ProsjektFeedType, string>;
      foresporselStatus: Record<ForesporselStatus, string>;
      /** «↳ svar på forespørselen» — marker on a customer answer. */
      svarMarkor: string;
      /** aria-label for the forced-download file link. */
      lastNedTemplate: string;
      /**
       * «sett av kunden · {tid}» — under the LAST innlegg older than
       * kunde_sett_at: Petters read receipt for the room.
       */
      settAvKundenTemplate: string;
      /** The composer — Petter posts into the room. */
      komp: {
        tittel: string;
        typeLabel: string;
        tekstLabel: string;
        tekstPlassholder: string;
        /** Link field — shown for type «leveranse» only. */
        lenkeLabel: string;
        lenkePlassholder: string;
        /** Quiet guidance: staging links, never production data. */
        lenkeVeiledning: string;
        lenkeUgyldig: string;
        filLabel: string;
        velgFil: string;
        fjernFil: string;
        /** «Fjern {navn}» — aria-label on the per-file remove buttons. */
        fjernFilTemplate: string;
        filUgyldig: string;
        filForStor: string;
        /** More than PROSJEKT_FILER_MAX files picked for one innlegg. */
        forMangeFiler: string;
        filFeil: string;
        /** Week setter — 1–6 chips, current highlighted. */
        ukeLabel: string;
        /** aria-label per chip: «uke {n}». */
        ukeChipTemplate: string;
        ukeHint: string;
        /** Posts the week alone as a status innlegg. */
        settUkeAlene: string;
        /** Auto-text for that status post: «Da er vi i uke {n}.» */
        ukeAleneTekstTemplate: string;
        ukeAutoTekst: string;
        ukeAutoChip: string;
        ukeKildeAuto: string;
        ukeKildeManuell: string;
        sendKnapp: string;
        tekstMangler: string;
        bekreftelse: string;
        feil: string;
      };
    };
  };
}

export const portalContent: Record<Lang, PortalContent> = {
  no: {
    header: {
      hjemLabel: "Workflows — til forsiden",
      avbryt: "avbryt — ta en prat heller",
      loggUt: "logg ut",
    },
    levels: [
      { n: 1, navn: "Kartlegging" },
      { n: 2, navn: "Forslaget" },
      { n: 3, navn: "Pristilbud" },
      { n: 4, navn: "Bygges" },
      { n: 5, navn: "Skjøtet" },
    ],
    intro: {
      tittel: "Hva trenger dere egentlig?",
      undertekst:
        "Svar på rundt ti spørsmål. Få en ærlig vurdering — også hvis svaret er at dere ikke trenger AI.",
      startKnapp: "Start kartleggingen",
      taPratHeller: "heller ta en prat med et menneske?",
      loggInnLenke: "Har du vært her før? Logg inn",
    },
    steps: [
      {
        id: "bedrift",
        sporsmal: "Hvilken bedrift gjelder det?",
        hint: "Si navnet, så slår vi opp det offentlige selv — du slipper å taste det.",
      },
      {
        id: "bransje",
        sporsmal: "Hva driver dere med?",
        hint: "Velg det nærmeste — eller si det med egne ord.",
        chips: [
          { id: "bygg_industri", label: "Bygg og industri" },
          { id: "handel", label: "Handel" },
          { id: "tjenester", label: "Tjenester" },
          { id: "helse", label: "Helse" },
          { id: "kultur_event", label: "Kultur og event" },
          { id: "annet", label: "Annet" },
        ],
        fritekst: true,
        plassholder: "f.eks. rørleggerfirma på Haugalandet",
      },
      {
        id: "storrelse",
        sporsmal: "Hvor mange er dere?",
        hint: "Omtrent. Vi teller ikke etter.",
        chips: [
          { id: "1_5", label: "1–5" },
          { id: "6_20", label: "6–20" },
          { id: "21_50", label: "21–50" },
          { id: "50_pluss", label: "50+" },
        ],
      },
      {
        id: "tidstyver",
        sporsmal: "Hva stjeler mest tid?",
        hint: "Velg alt som svir. Ærlighet lønner seg her.",
        multi: true,
        chips: [
          { id: "epost", label: "E-post og henvendelser" },
          { id: "rapporter", label: "Rapporter og dokumenter" },
          { id: "dobbeltregistrering", label: "Dobbeltregistrering" },
          { id: "oppfolging", label: "Oppfølging og purring" },
          { id: "lete_info", label: "Lete etter info" },
          { id: "vaktplaner", label: "Vaktplaner og koordinering" },
          { id: "annet", label: "Annet" },
        ],
        fritekst: true,
        plassholder: "tidstyven vi glemte å nevne",
      },
      {
        id: "tidsbruk",
        sporsmal: "Hvor mye tid forsvinner i dette i dag?",
        hint: "Grovt anslag holder. Summen pleier å overraske.",
        chips: [
          { id: "under_2t", label: "Under 2 timer i uka" },
          { id: "2_5t", label: "2–5 timer i uka" },
          { id: "5_15t", label: "5–15 timer i uka" },
          { id: "mer_enn_dag", label: "Mer enn en dag i uka" },
          { id: "vet_ikke", label: "Vet ikke" },
        ],
      },
      {
        id: "systemer",
        sporsmal: "Hvilke verktøy bruker dere i dag?",
        hint: "Velg alle som er i daglig bruk — og nevn gjerne navnet på CRM-et eller fagsystemet.",
        multi: true,
        chips: [
          { id: "excel_sheets", label: "Excel / Sheets" },
          { id: "tripletex", label: "Tripletex" },
          { id: "fiken", label: "Fiken" },
          { id: "visma", label: "Visma" },
          // Legacy: tidligere én samlechip — beholdes skjult så gamle rader
          // fortsatt slår opp riktig etikett. Aldri gjenbruk id-en.
          { id: "okonomisystem", label: "Tripletex / Fiken / Visma", skjult: true },
          { id: "m365", label: "Microsoft 365" },
          { id: "google", label: "Google Workspace" },
          { id: "crm", label: "CRM" },
          { id: "fagsystem", label: "Eget fagsystem" },
          { id: "annet", label: "Annet" },
        ],
        fritekst: true,
        plassholder: "hvilket CRM eller fagsystem? si navnet her",
      },
      {
        id: "kundehenvendelser",
        sporsmal: "Får dere mange kundehenvendelser?",
        hint: "E-post, telefon, skjema — alt teller.",
        chips: [
          { id: "ja_mye", label: "Ja, mye" },
          { id: "litt", label: "Litt" },
          { id: "nei", label: "Nei, nesten ingen" },
        ],
      },
      {
        id: "dromen",
        sporsmal: "Hva skulle du ønske bare gikk av seg selv?",
        hint: "Hovedspørsmålet. Skriv fritt — jo mer konkret, jo bedre tegning.",
        fritekst: true,
        plassholder:
          "f.eks. at tilbudet skrev seg selv når befaringen var gjort",
      },
      {
        id: "rolle",
        sporsmal: "Hvem er du i bedriften?",
        hint: "Så vi vet hvem vi skriver til.",
        chips: [
          { id: "eier", label: "Eier eller daglig leder" },
          { id: "leder", label: "Leder for avdeling eller team" },
          { id: "ansatt", label: "Ansatt som kjenner problemet" },
          { id: "annet", label: "Annet" },
        ],
        fritekst: true,
        plassholder: "f.eks. innleid regnskapsfører",
      },
      {
        id: "budsjett",
        sporsmal: "Har dere et budsjett i tankene?",
        hint: "Helt frivillig — det hjelper oss å foreslå riktig størrelse på løsningen. Prisen setter uansett et menneske.",
        chips: [
          { id: "under_25k", label: "Under 25 000 kr" },
          { id: "25_75k", label: "25 000–75 000 kr" },
          { id: "75_200k", label: "75 000–200 000 kr" },
          { id: "over_200k", label: "Over 200 000 kr" },
          { id: "vet_ikke", label: "Vet ikke / vil ikke si" },
        ],
      },
      {
        id: "tempo",
        sporsmal: "Hvor fort vil dere i gang?",
        hint: "«Bare nysgjerrig» er et helt fint svar.",
        chips: [
          { id: "fort", label: "Så fort som mulig" },
          { id: "noen_maneder", label: "I løpet av noen måneder" },
          { id: "nysgjerrig", label: "Bare nysgjerrig" },
        ],
      },
      {
        id: "oppsummering",
        sporsmal: "Ser dette riktig ut?",
        hint: "Siste blikk før verkstedet tegner. Du kan endre hva som helst herfra.",
      },
    ],
    wizard: {
      neste: "Neste",
      tilbake: "Tilbake",
      sendInn: "Send inn og se forslaget",
      endre: "Endre",
      endreTemplate: "Endre svaret på: {sporsmal}",
      ikkeBesvart: "(ikke besvart)",
      tegnIgjenTemplate: "{n} tegn igjen",
    },
    oppfolging: {
      tenker: "verkstedet leser svarene dine …",
      hint: "Ett oppfølgingsspørsmål, basert på det du har svart. Hopp over hvis det ikke treffer.",
      plassholder: "svar kort — eller bare gå videre",
    },
    research: {
      navnLabel: "Bedriftsnavnet",
      navnPlassholder: "f.eks. Håland Rør AS",
      nettsideLabel: "Nettsiden deres",
      nettsideHint: "valgfritt — vi titter gjerne",
      nettsidePlassholder: "bedriften.no",
      slaarOpp: "slår opp i Brønnøysundregistrene …",
      leserNettsiden: "titter på nettsiden deres …",
      fantDere: "Fant dere:",
      ansatteTemplate: "{n} ansatte",
      stemmer: "Stemmer",
      ikkeOss: "Ikke oss — fortsett uten",
      fantBransjen: "(Brønnøysund har allerede svart på noe av dette for dere)",
    },
    authgate: {
      tittel: "Nesten der.",
      forklaring:
        "Før verkstedet tegner, må du logge inn. Ærlig grunn: genereringen koster oss faktisk litt — og vi vil vite hvem vi tegner for. Du får en lenke på e-post. Ingen passord, ingen nyhetsbrev.",
      epostLabel: "E-postadressen din",
      epostPlassholder: "du@bedriften.no",
      sendLenke: "Send meg lenken",
      lenkeSendt:
        "E-posten er sendt — i den ligger en engangskode og en lenke. Tast koden under, så fortsetter du her i denne nettleseren. Begge virker i én time.",
      sendPaNytt: "Send på nytt",
      sendPaNyttOm: "kan sendes på nytt om {s} sekunder",
      feil: "Det gikk ikke. Sjekk adressen og prøv igjen — eller ta en prat med oss i stedet.",
      epostMangler: "Skriv inn e-postadressen din først.",
      lenkeUtlopt:
        "Lenken er utløpt eller allerede brukt — send en ny, så ligger svarene dine fortsatt trygt her.",
      forMangeLenker:
        "Vi har sendt mange lenker på kort tid og må vente litt — det er vår grense, ikke skrivefeil hos deg. Prøv igjen om en times tid, eller ta en prat med oss i mellomtiden.",
      kodeLabel: "Engangskoden fra e-posten",
      kodePlassholder: "123456",
      loggInnMedKode: "Logg inn med kode",
      ellerLenke: "… eller klikk lenken i e-posten — den virker like godt.",
      kodeMangler: "Skriv inn hele engangskoden fra e-posten.",
      kodeUgyldig:
        "Koden stemmer ikke eller er utløpt — sjekk sifrene, eller send en ny e-post og bruk den ferskeste koden.",
      loginTittel: "Velkommen tilbake.",
      loginForklaring:
        "Skriv e-posten du brukte sist, så sender vi en fersk lenke.",
      ingenKartlegging:
        "Fant ingen kartlegging på denne adressen — men benken er ledig.",
    },
    generating: {
      tittel: "Verkstedet tegner.",
      statuslinjer: [
        "leser svarene dine …",
        "ringer inn tidstyvene …",
        "verkstedet tegner …",
        "nattevakten dobbeltsjekker …",
        "pusser på strekene …",
      ],
    },
    forslag: {
      kicker: "Forslaget — ferskt fra tegnebordet",
      skisseLabel: "Løsningsskissen",
      tidslinjeLabel: "Tidslinje",
      nesteLabel: "Neste steg",
      mockupAlt:
        "Håndtegnet konseptskisse av løsningen — blåkopi på mørk grunn, ikke ferdig design",
      likerKnapp: "Dette vil jeg se mer av",
      ikkeKnapp: "Ikke helt riktig",
      taPrat: "Ta en prat i stedet",
      ikkeAiTittel: "Ærlig talt: dere trenger ikke AI til dette.",
      videreTekst:
        "Petter ser på vurderingen og kommer med et konkret pristilbud — innen én arbeidsdag.",
      videreEpost:
        "Vi sier ifra på e-post når tilbudet ligger klart — du trenger ikke vente her.",
      likFeil:
        "Det gikk ikke å sende beskjeden. Forslaget ligger trygt her — prøv igjen.",
      startPaNytt: "Start kartleggingen på nytt",
      epostLabel: "E-post",
      telefonLabel: "Telefon",
    },
    feil: {
      tittel: "Det stoppet opp.",
      tekst:
        "Genereringen feilet — det skjer innimellom. Svarene dine ligger trygt her. Prøv igjen, eller ta en prat med et menneske i stedet.",
      provIgjen: "Prøv igjen",
      forMangeTittel: "Verkstedet trenger en pust.",
      forMangeTekst:
        "Du har fått maks antall genereringer denne timen — tegnebordet koster oss faktisk litt per runde. Prøv igjen om en times tid, eller ta praten direkte med Petter. Den er gratis, og han tegner gjerne på ordentlig.",
    },
    a11y: {
      railLabel: "Hvor du er i prosessen",
      stegTemplate: "Steg {n} av {total}",
      levelTemplate: "Nivå {n}: {navn}",
      duErHer: "du er her",
      egneOrd: "Eller si det med egne ord",
    },
    tilbud: {
      kicker: "Pristilbudet",
      tittel: "Tilbudet ligger på benken.",
      seVurdering: "Se vurderingen fra forslaget",
      arkOverskrift: "Pristilbud",
      sendtTemplate: "sendt {dato}",
      prisLabel: "Pris",
      leveranseLabel: "Leveranse",
      vilkar:
        "Jeg godkjenner tilbudet som en bindende bestilling av arbeidet, prisen og leveransen slik de er beskrevet over. Oppstart og detaljer avtales direkte med Workflows AS.",
      vilkarLabel: "Vilkår for bestillingen",
      godkjennKnapp: "Godkjenn tilbudet",
      godkjennFeil:
        "Det gikk ikke å godkjenne. Tilbudet ligger fortsatt her — prøv igjen, eller ta en prat med oss.",
      sporsmalLenke: "har du spørsmål? ta en prat",
      belopEksMva: "eks. mva",
      godkjentTittel: "Da setter vi i gang.",
      godkjentTekst:
        "Tilbudet er godkjent — Petter tar kontakt om oppstart. Verkstedet rigger benken.",
      skrivUt: "Skriv ut / lagre som PDF",
      kvittering: {
        tittel: "Kvitteringen — tilbudet dere godkjente",
        stempel: "Kvittering",
        godkjentTemplate: "godkjent {dato}",
        vilkarTittel: "Vilkårene dere godkjente",
        signatur: "Workflows AS",
      },
    },
    skjotet: {
      tittel: "Skjøtet er deres.",
      tekst:
        "Prosjektet er levert og overlevert — dere eier det som er bygget, med alt som hører til. Takk for tilliten. Benken under blir stående som arkiv.",
      stempel: "Skjøtet",
      levertTemplate: "levert {dato}",
      sluttrapportTittel: "Sluttrapporten",
      kvitteringTittel: "Det godkjente tilbudet",
      ctaTekst:
        "Det som er bygget skal også leve. Trenger dere en justering, et vedlikeholdsblikk — eller har et nytt prosjekt i tankene — er det bare å si ifra.",
      ctaKnapp: "Ta kontakt om neste prosjekt",
      arkivTekst:
        "Prosjektloggen under er nå et lesbart arkiv — alt som ble sagt og levert ligger trygt her.",
    },
    benken: {
      tittel: "Benken er rigget.",
      undertekst:
        "Her ligger prosjektet mens det bygges — fremdrift, leveranser og det vi trenger fra dere. Skriv når som helst.",
      ukeTemplate: "uke {n} av 6",
      henter: "henter prosjektet …",
      feil: "Det stoppet opp. Prøv igjen.",
      provIgjen: "Prøv igjen",
      tomt: "Stille på benken ennå — vi skriver her så snart noe skjer.",
      feedLabel: "Prosjektloggen",
      fraOss: "Fra verkstedet",
      fraDere: "Fra dere",
      fraWorkflows: "Workflows",
      degSelv: "Deg",
      leveranseLabel: "Noe å se på",
      apneKnapp: "Åpne",
      foresporselLabel: "Vi trenger noe fra deg",
      levertChip: "levert",
      lastNedTemplate: "Last ned {navn}",
      visBildeTemplate: "Vis {navn}",
      lysLukk: "Lukk",
      lysLastNed: "Last ned",
      svarLabel: "Svaret ditt",
      svarSend: "Send svaret",
      skrivLabel: "Skriv til verkstedet",
      skrivPlassholder: "spørsmål, beskjed — eller bare et hei",
      sendKnapp: "Send",
      velgFil: "Legg ved filer",
      fjernFilTemplate: "Fjern {navn}",
      filHint: "pdf, bilder eller dokumenter — maks 25 MB, inntil 6 filer",
      sikkerhet:
        "aldri passord eller API-nøkler her — slikt avtaler vi i egen sikker kanal",
      tomMelding: "Skriv en melding eller legg ved en fil først.",
      filForStor: "Fila er for stor — maks 25 MB.",
      filType: "Filtypen støttes ikke — pdf, bilder eller vanlige dokumenter funker.",
      forMangeFiler: "Maks 6 filer per melding — fjern noen først.",
      sendFeil: "Det gikk ikke å sende. Teksten ligger her ennå — prøv igjen.",
      forMange: "Mange meldinger på kort tid — vent et lite minutt og prøv igjen.",
      sendtBekreftelse: "Sendt — ligger på benken.",
      nyttInnlegg: "Noe nytt har landet i prosjektrommet.",
      iDag: "I dag",
      iGar: "I går",
      nyttSkille: "nytt",
      nyttSkilleSr: "Nytt siden sist begynner her.",
      senderChip: "sender …",
      lasterOppTemplate: "laster opp {navn} — {i} av {n}",
      fakturaLabel: "Faktura",
      milepaelLabel: "Milepæl",
      fakturaTittel: "Fakturaer",
      fakturaTom:
        "Ingen fakturaer ennå — når noe går til betaling, ligger det her.",
      fakturaNrTemplate: "Faktura {nr}",
      fakturaUtenNr: "Faktura",
      fakturaForfallTemplate: "forfall {dato}",
      fakturaBetaltTemplate: "betalt {dato}",
      fakturaForfaltTekst: "forfalt — fint om den får et blikk",
      fakturaStatus: {
        sendt: "sendt",
        delbetalt: "delbetalt",
        betalt: "betalt",
        forfalt: "forfalt",
        kansellert: "kansellert",
      },
      levertMelding:
        "Prosjektet er levert — loggen blir stående her. Trenger dere noe, er verkstedet aldri lenger unna enn en e-post.",
    },
    admin: {
      kicker: "Verkstedkontoret",
      login: {
        tittel: "Verkstedkontoret.",
        forklaring:
          "Bakrommet. Logg inn med verkstedets e-post — lenke, ikke passord.",
      },
      ikkeDinDor: {
        tittel: "Ikke din dør.",
        tekst:
          "Dette er bakrommet — bare Petter har nøkkel hit. Leter du etter din egen kartlegging, ligger den trygt bak /start.",
        hjem: "Til forsiden",
        byttKonto: "Logg ut og bytt adresse",
      },
      felles: {
        henter: "henter …",
        feil: "Det stoppet opp. Prøv igjen.",
        provIgjen: "Prøv igjen",
      },
      liste: {
        tittel: "Kartleggingene",
        antallTemplate: "{n} på benken",
        tom: "Ingen kartlegginger ennå. Benken er ryddet.",
        ukjentBedrift: "(uten bedriftsnavn)",
        nyttFraKunde: "NYTT FRA KUNDE",
        nyttFraKundeAntallTemplate: "NYTT FRA KUNDE ({n})",
        oppdater: "Oppdater",
        sistHentetTemplate: "sist hentet {tid}",
        sokLabel: "Søk",
        sokPlassholder: "navn, e-post eller bedrift",
        ingenTreff: "Ingen treff på filteret. Benken er bredere enn dette.",
        filterAlle: "Alle",
        pipeline: {
          nye: "Nye",
          forslagKlart: "Forslag klart",
          likt: "Likt",
          tilbudSendt: "Tilbud sendt",
          bygges: "Bygges",
          levert: "Levert",
          feilet: "Feilet",
        },
        venterPaDeg: "Venter på deg",
        venterAntallTemplate: "{n} venter på deg",
        slaLiktTemplate: "likt for {t} siden — tilbud lovet innen én arbeidsdag",
        slaForesporslerTemplate: "{n} åpne forespørsler",
        slaFeilet: "genereringen feilet — kunden står fast",
        relNaa: "nettopp",
        relMinTemplate: "{n} min siden",
        relTimeTemplate: "{n} t siden",
        relDagTemplate: "{n} d siden",
        visSlettedeTemplate: "vis slettede ({n})",
        skjulSlettede: "skjul slettede",
        slettetChip: "slettet",
      },
      status: {
        innsendt: "innsendt",
        genererer: "genererer",
        forslag_klart: "forslag klart",
        likt: "likt",
        tilbud_sendt: "tilbud sendt",
        videre: "godkjent",
        levert: "levert",
        feilet: "feilet",
      },
      anbefaling: {
        chatbot: "chatbot",
        flyt: "flyt",
        agent: "agent",
        software: "software",
        kombinasjon: "kombinasjon",
        ikke_ai: "ikke AI",
      },
      detalj: {
        tilbake: "tilbake til lista",
        svarTittel: "Svarene",
        egneOrdSuffix: "— egne ord",
        researchTittel: "Research-funn",
        vurderingTittel: "Vurderingen kunden fikk",
        ingenVurdering: "ingen vurdering ennå",
        mockupAlt: "Konseptskissen kunden fikk se",
        researchFelter: {
          navn: "Navn",
          orgnr: "Orgnr",
          orgform: "Orgform",
          bransje: "Bransje",
          ansatte: "Ansatte",
          sted: "Sted",
          nettside: "Nettside",
          sideTittel: "Sidetittel",
          sideBeskrivelse: "Beskrivelse",
          undersider: "Undersider",
          omsetning: "Driftsinntekter",
          resultat: "Årsresultat",
          regnskapsAar: "Regnskapsår",
          valuta: "Valuta",
        },
        tilbudSendtTemplate: "tilbud sendt {dato}",
        godkjentTemplate: "godkjent {dato}",
        levertTemplate: "levert {dato}",
        slettetTemplate: "slettet {dato}",
        oppfolgingSuffix: "— oppfølgingsspørsmålet (AI)",
        prislappTittel: "Prissignaler",
        prislappBudsjett: "Budsjett",
      },
      tilbudForm: {
        tittel: "Tilbudet",
        tekstLabel: "Tilbudstekst",
        tekstPlassholder:
          "Hva vi bygger og hva det løser — med dine ord. Avsnitt skilles med blank linje.",
        prisLabel: "Pris (fritekst)",
        prisPlassholder: "f.eks. fra 45 000 kr eks. mva",
        leveranseLabel: "Leveranse",
        leveransePlassholder: "f.eks. 3–4 uker fra signering",
        belopLabel: "Beløp eks. mva (kr)",
        belopPlassholder: "f.eks. 45000",
        belopHint:
          "valgfritt — men satt beløp gjør fakturaen i Fiken til ett klikk",
        belopUgyldig: "Beløpet må være et tall i kroner — f.eks. 45000 eller 45 000,50.",
        mvaLabel: "Mva-sats",
        sendKnapp: "Send tilbud",
        oppdaterKnapp: "Oppdater tilbud",
        sendtTemplate: "sendt {dato}",
        bekreftelse: "Tilbudet ligger på benken — kunden ser det på /start.",
        mangler: "Alle tre feltene må fylles ut: tekst, pris og leveranse.",
        feil: "Det gikk ikke å lagre tilbudet. Prøv igjen.",
        laastTemplate:
          "Tilbudet er låst — kunden godkjente det {dato}. Det godkjente tilbudet kan ikke endres; nye avtaler tas på Benken eller i egen kanal.",
        ikkeKlar:
          "Tilbudsskjemaet åpner når forslaget er klart — dette løpet har ikke en ferdig vurdering ennå.",
      },
      lever: {
        tittel: "Lever prosjektet",
        forklaring:
          "Skriv sluttrapporten kunden skal få på skjøtet — hva som er bygget, hvor det bor, og hva som er verdt å vite videre. Kunden løftes til nivå 5.",
        sluttrapportLabel: "Sluttrapport",
        sluttrapportPlassholder:
          "Hva som er levert og hvordan det står — med dine ord. Avsnitt skilles med blank linje.",
        knapp: "Marker som levert",
        bekreft: "Sikker? Lever til kunden",
        bekreftelse: "Levert — kunden ser Skjøtet på /start.",
        mangler: "Skriv sluttrapporten først.",
        feil: "Det gikk ikke å levere. Prøv igjen.",
        levertTemplate: "levert {dato}",
        sluttrapportTittel: "Sluttrapporten",
        angreKnapp: "Angre levering",
        angreBekreft: "Sikker? Tilbake til Bygges",
        angreFeil: "Det gikk ikke å angre. Prøv igjen.",
      },
      slett: {
        knapp: "Slett kartleggingen",
        bekreft: "Sikker? Skjul fra lista",
        feil: "Det gikk ikke å slette. Prøv igjen.",
        forklaring:
          "Myk sletting: raden skjules fra lista og for kunden, men ligger trygt i databasen (godkjente løp kan aldri hard-slettes).",
      },
      benken: {
        tittel: "Benken — prosjektrommet",
        ukeTemplate: "uke {n} av 6",
        ukeIkkeSatt: "uke ikke satt ennå",
        tom: "Ingen innlegg ennå. Benken er rigget — skriv det første.",
        fra: {
          kunde: "kunde",
          workflows: "workflows",
        },
        typer: {
          melding: "Melding",
          leveranse: "Leveranse",
          foresporsel: "Forespørsel",
          status: "Status",
          faktura: "Faktura",
          milepael: "Milepæl",
        },
        foresporselStatus: {
          apen: "åpen",
          levert: "levert",
        },
        svarMarkor: "svar på forespørselen",
        lastNedTemplate: "last ned {navn}",
        settAvKundenTemplate: "sett av kunden · {tid}",
        komp: {
          tittel: "Nytt innlegg",
          typeLabel: "Type",
          tekstLabel: "Tekst",
          tekstPlassholder: "Det kunden skal se — kort og konkret.",
          lenkeLabel: "Lenke",
          lenkePlassholder: "https://demo.workflows.no/…",
          lenkeVeiledning:
            "leveranse-lenker bør peke på test-/staging-miljøer uten produksjonsdata",
          lenkeUgyldig: "Lenka må være en gyldig https-adresse.",
          filLabel: "Vedlegg",
          velgFil: "Velg filer",
          fjernFil: "Fjern fila",
          fjernFilTemplate: "Fjern {navn}",
          filUgyldig: "Filtypen støttes ikke.",
          filForStor: "Fila er for stor — maks 25 MB.",
          forMangeFiler: "Maks 6 filer per innlegg — fjern noen først.",
          filFeil: "Opplastingen feilet. Prøv igjen.",
          ukeLabel: "Uke (1–6)",
          ukeChipTemplate: "uke {n}",
          ukeHint: "uka følger innlegget — eller send den alene som status",
          settUkeAlene: "Sett uka alene",
          ukeAleneTekstTemplate: "Da er vi i uke {n}.",
          ukeAutoTekst: "Uka følger kalenderen igjen.",
          ukeAutoChip: "Auto",
          ukeKildeAuto: "(automatisk fra godkjenningsdato)",
          ukeKildeManuell: "(manuelt satt)",
          sendKnapp: "Legg på benken",
          tekstMangler: "Skriv teksten først.",
          bekreftelse: "Lagt på benken — kunden ser det på /start.",
          feil: "Det gikk ikke å legge ut. Prøv igjen.",
        },
      },
    },
  },

  en: {
    header: {
      hjemLabel: "Workflows — back to the front page",
      avbryt: "cancel — let's talk instead",
      loggUt: "sign out",
    },
    levels: [
      { n: 1, navn: "Mapping" },
      { n: 2, navn: "The proposal" },
      { n: 3, navn: "The quote" },
      { n: 4, navn: "Being built" },
      { n: 5, navn: "Tended" },
    ],
    intro: {
      tittel: "What do you actually need?",
      undertekst:
        "Answer about ten questions. Get an honest assessment — even if the answer is that you don't need AI.",
      startKnapp: "Start the mapping",
      taPratHeller: "rather talk to a human?",
      loggInnLenke: "Been here before? Sign in",
    },
    steps: [
      {
        id: "bedrift",
        sporsmal: "Which company is this about?",
        hint: "Give us the name — we'll look up the public bits ourselves, so you don't have to type them.",
      },
      {
        id: "bransje",
        sporsmal: "What do you do?",
        hint: "Pick the closest — or say it in your own words.",
        chips: [
          { id: "bygg_industri", label: "Construction and industry" },
          { id: "handel", label: "Retail and trade" },
          { id: "tjenester", label: "Services" },
          { id: "helse", label: "Health" },
          { id: "kultur_event", label: "Culture and events" },
          { id: "annet", label: "Other" },
        ],
        fritekst: true,
        plassholder: "e.g. a plumbing firm with eight people",
      },
      {
        id: "storrelse",
        sporsmal: "How many of you are there?",
        hint: "Roughly. We won't count.",
        chips: [
          { id: "1_5", label: "1–5" },
          { id: "6_20", label: "6–20" },
          { id: "21_50", label: "21–50" },
          { id: "50_pluss", label: "50+" },
        ],
      },
      {
        id: "tidstyver",
        sporsmal: "What steals the most time?",
        hint: "Pick everything that stings. Honesty pays off here.",
        multi: true,
        chips: [
          { id: "epost", label: "Email and inquiries" },
          { id: "rapporter", label: "Reports and documents" },
          { id: "dobbeltregistrering", label: "Entering data twice" },
          { id: "oppfolging", label: "Follow-ups and reminders" },
          { id: "lete_info", label: "Hunting for information" },
          { id: "vaktplaner", label: "Rotas and coordination" },
          { id: "annet", label: "Other" },
        ],
        fritekst: true,
        plassholder: "the time thief we forgot to mention",
      },
      {
        id: "tidsbruk",
        sporsmal: "How much time disappears into this today?",
        hint: "A rough guess is fine. The total tends to surprise people.",
        chips: [
          { id: "under_2t", label: "Under 2 hours a week" },
          { id: "2_5t", label: "2–5 hours a week" },
          { id: "5_15t", label: "5–15 hours a week" },
          { id: "mer_enn_dag", label: "More than a day a week" },
          { id: "vet_ikke", label: "Don't know" },
        ],
      },
      {
        id: "systemer",
        sporsmal: "What tools do you use today?",
        hint: "Pick everything in daily use — and do name the CRM or in-house system.",
        multi: true,
        chips: [
          { id: "excel_sheets", label: "Excel / Sheets" },
          { id: "tripletex", label: "Tripletex" },
          { id: "fiken", label: "Fiken" },
          { id: "visma", label: "Visma" },
          // Legacy: previously one combined chip — kept hidden so old rows
          // still resolve to a readable label. Never reuse the id.
          { id: "okonomisystem", label: "Tripletex / Fiken / Visma", skjult: true },
          { id: "m365", label: "Microsoft 365" },
          { id: "google", label: "Google Workspace" },
          { id: "crm", label: "CRM" },
          { id: "fagsystem", label: "In-house system" },
          { id: "annet", label: "Other" },
        ],
        fritekst: true,
        plassholder: "which CRM or in-house system? name it here",
      },
      {
        id: "kundehenvendelser",
        sporsmal: "Do you get a lot of customer inquiries?",
        hint: "Email, phone, forms — it all counts.",
        chips: [
          { id: "ja_mye", label: "Yes, plenty" },
          { id: "litt", label: "Some" },
          { id: "nei", label: "Hardly any" },
        ],
      },
      {
        id: "dromen",
        sporsmal: "What do you wish just took care of itself?",
        hint: "The main question. Write freely — the more concrete, the better the drawing.",
        fritekst: true,
        plassholder:
          "e.g. that the quote wrote itself once the site visit was done",
      },
      {
        id: "rolle",
        sporsmal: "Who are you at the company?",
        hint: "So we know who we're writing to.",
        chips: [
          { id: "eier", label: "Owner or managing director" },
          { id: "leder", label: "Head of a department or team" },
          { id: "ansatt", label: "An employee who knows the problem" },
          { id: "annet", label: "Other" },
        ],
        fritekst: true,
        plassholder: "e.g. the external accountant",
      },
      {
        id: "budsjett",
        sporsmal: "Do you have a budget in mind?",
        hint: "Entirely optional — it helps us size the solution right. The price is set by a human either way.",
        chips: [
          { id: "under_25k", label: "Under 25 000 kr" },
          { id: "25_75k", label: "25 000–75 000 kr" },
          { id: "75_200k", label: "75 000–200 000 kr" },
          { id: "over_200k", label: "Over 200 000 kr" },
          { id: "vet_ikke", label: "Don't know / rather not say" },
        ],
      },
      {
        id: "tempo",
        sporsmal: "How soon do you want to start?",
        hint: "“Just curious” is a perfectly fine answer.",
        chips: [
          { id: "fort", label: "As soon as possible" },
          { id: "noen_maneder", label: "Within a few months" },
          { id: "nysgjerrig", label: "Just curious" },
        ],
      },
      {
        id: "oppsummering",
        sporsmal: "Does this look right?",
        hint: "One last look before the workshop draws. You can change anything from here.",
      },
    ],
    wizard: {
      neste: "Next",
      tilbake: "Back",
      sendInn: "Submit and see the proposal",
      endre: "Change",
      endreTemplate: "Change the answer to: {sporsmal}",
      ikkeBesvart: "(not answered)",
      tegnIgjenTemplate: "{n} characters left",
    },
    oppfolging: {
      tenker: "the workshop is reading your answers …",
      hint: "One follow-up question, based on what you've told us. Skip it if it misses.",
      plassholder: "answer briefly — or just continue",
    },
    research: {
      navnLabel: "Company name",
      navnPlassholder: "e.g. Håland Plumbing AS",
      nettsideLabel: "Your website",
      nettsideHint: "optional — we'll gladly have a look",
      nettsidePlassholder: "yourcompany.com",
      slaarOpp: "checking the Brønnøysund public registers …",
      leserNettsiden: "having a look at your website …",
      fantDere: "Found you:",
      ansatteTemplate: "{n} employees",
      stemmer: "That's us",
      ikkeOss: "Not us — continue without",
      fantBransjen: "(the public register already answered some of this for you)",
    },
    authgate: {
      tittel: "Almost there.",
      forklaring:
        "Before the workshop draws, you need to sign in. Honest reason: the generation actually costs us a little — and we want to know who we're drawing for. You'll get a link by email. No passwords, no newsletters.",
      epostLabel: "Your email address",
      epostPlassholder: "you@yourcompany.com",
      sendLenke: "Send me the link",
      lenkeSendt:
        "Email sent — inside you'll find a one-time code and a link. Type the code below to continue right here in this browser. Both work for one hour.",
      sendPaNytt: "Send again",
      sendPaNyttOm: "you can resend in {s} seconds",
      feil: "That didn't work. Check the address and try again — or just talk to us instead.",
      epostMangler: "Enter your email address first.",
      lenkeUtlopt:
        "That link has expired or was already used — send a new one, your answers are still safe here.",
      forMangeLenker:
        "We've sent a lot of links in a short time and need a breather — our ceiling, not your typo. Try again in an hour or so, or just talk to us in the meantime.",
      kodeLabel: "The one-time code from the email",
      kodePlassholder: "123456",
      loggInnMedKode: "Sign in with code",
      ellerLenke: "… or click the link in the email — it works just as well.",
      kodeMangler: "Enter the whole one-time code from the email.",
      kodeUgyldig:
        "That code is wrong or has expired — check the digits, or send a new email and use the freshest code.",
      loginTittel: "Welcome back.",
      loginForklaring:
        "Enter the email you used last time, and we'll send you a fresh link.",
      ingenKartlegging:
        "Found no mapping for this address — but the bench is open.",
    },
    generating: {
      tittel: "The workshop is drawing.",
      statuslinjer: [
        "reading your answers …",
        "circling the time thieves …",
        "the workshop is drawing …",
        "the night watch is double-checking …",
        "polishing the linework …",
      ],
    },
    forslag: {
      kicker: "The proposal — fresh off the drawing board",
      skisseLabel: "The solution sketch",
      tidslinjeLabel: "Timeline",
      nesteLabel: "Next step",
      mockupAlt:
        "Hand-drawn concept sketch of the solution — blueprint on dark ground, not a finished design",
      likerKnapp: "I want to see more of this",
      ikkeKnapp: "Not quite right",
      taPrat: "Talk to us instead",
      ikkeAiTittel: "Honestly: you don't need AI for this.",
      videreTekst:
        "Petter reviews the assessment and comes back with a concrete quote — within one working day.",
      videreEpost:
        "We'll let you know by email the moment the quote is ready — no need to wait here.",
      likFeil:
        "Sending that didn't work. The proposal is safe right here — try again.",
      startPaNytt: "Start the mapping over",
      epostLabel: "Email",
      telefonLabel: "Phone",
    },
    feil: {
      tittel: "It stalled.",
      tekst:
        "The generation failed — it happens now and then. Your answers are safe here. Try again, or just talk to a human instead.",
      provIgjen: "Try again",
      forMangeTittel: "The workshop needs a breather.",
      forMangeTekst:
        "You've hit the hourly limit for generations — the drawing board does cost us a little per round. Try again in an hour or so, or talk to Petter directly. That's free, and he draws properly.",
    },
    a11y: {
      railLabel: "Where you are in the process",
      stegTemplate: "Step {n} of {total}",
      levelTemplate: "Level {n}: {navn}",
      duErHer: "you are here",
      egneOrd: "Or say it in your own words",
    },
    tilbud: {
      kicker: "The quote",
      tittel: "The quote is on the bench.",
      seVurdering: "Revisit the assessment from the proposal",
      arkOverskrift: "Quote",
      sendtTemplate: "sent {dato}",
      prisLabel: "Price",
      leveranseLabel: "Delivery",
      vilkar:
        "I approve the quote as a binding order for the work, price and delivery as described above. Start-up and details are agreed directly with Workflows AS.",
      vilkarLabel: "Terms of the order",
      godkjennKnapp: "Approve the quote",
      godkjennFeil:
        "Approving didn't go through. The quote is still right here — try again, or just talk to us.",
      sporsmalLenke: "questions? let's talk",
      belopEksMva: "ex. VAT",
      godkjentTittel: "Then we get to work.",
      godkjentTekst:
        "The quote is approved — Petter will be in touch about kick-off. The workshop is rigging the bench.",
      skrivUt: "Print / save as PDF",
      kvittering: {
        tittel: "The receipt — the quote you approved",
        stempel: "Receipt",
        godkjentTemplate: "approved {dato}",
        vilkarTittel: "The terms you approved",
        signatur: "Workflows AS",
      },
    },
    skjotet: {
      tittel: "The deed is yours.",
      tekst:
        "The project is delivered and handed over — you own what was built, with everything that belongs to it. Thank you for the trust. The bench below stays on as an archive.",
      stempel: "The deed",
      levertTemplate: "delivered {dato}",
      sluttrapportTittel: "The closing report",
      kvitteringTittel: "The approved quote",
      ctaTekst:
        "What's built should keep living. If you need an adjustment, a maintenance once-over — or have the next project in mind — just say the word.",
      ctaKnapp: "Get in touch about the next project",
      arkivTekst:
        "The project log below is now a readable archive — everything said and delivered stays safely here.",
    },
    benken: {
      tittel: "The bench is rigged.",
      undertekst:
        "This is where the project lives while it's being built — progress, deliveries and whatever we need from you. Write any time.",
      ukeTemplate: "week {n} of 6",
      henter: "fetching the project …",
      feil: "It stalled. Try again.",
      provIgjen: "Try again",
      tomt: "Quiet on the bench so far — we'll post here the moment something happens.",
      feedLabel: "The project log",
      fraOss: "From the workshop",
      fraDere: "From you",
      fraWorkflows: "Workflows",
      degSelv: "You",
      leveranseLabel: "Something to look at",
      apneKnapp: "Open",
      foresporselLabel: "We need something from you",
      levertChip: "delivered",
      lastNedTemplate: "Download {navn}",
      visBildeTemplate: "View {navn}",
      lysLukk: "Close",
      lysLastNed: "Download",
      svarLabel: "Your answer",
      svarSend: "Send the answer",
      skrivLabel: "Write to the workshop",
      skrivPlassholder: "a question, a note — or just a hello",
      sendKnapp: "Send",
      velgFil: "Attach files",
      fjernFilTemplate: "Remove {navn}",
      filHint: "pdf, images or documents — max 25 MB, up to 6 files",
      sikkerhet:
        "never passwords or API keys here — that sort of thing we agree on in a separate, secure channel",
      tomMelding: "Write a message or attach a file first.",
      filForStor: "That file is too big — max 25 MB.",
      filType: "That file type isn't supported — pdf, images or ordinary documents work.",
      forMangeFiler: "Max 6 files per message — remove some first.",
      sendFeil: "Sending failed. Your text is still here — try again.",
      forMange: "A lot of messages in a short time — give it a minute and try again.",
      sendtBekreftelse: "Sent — it's on the bench.",
      nyttInnlegg: "Something new has landed in the project room.",
      iDag: "Today",
      iGar: "Yesterday",
      nyttSkille: "new",
      nyttSkilleSr: "New since your last visit starts here.",
      senderChip: "sending …",
      lasterOppTemplate: "uploading {navn} — {i} of {n}",
      fakturaLabel: "Invoice",
      milepaelLabel: "Milestone",
      fakturaTittel: "Invoices",
      fakturaTom:
        "No invoices yet — when something goes to payment, it lives here.",
      fakturaNrTemplate: "Invoice {nr}",
      fakturaUtenNr: "Invoice",
      fakturaForfallTemplate: "due {dato}",
      fakturaBetaltTemplate: "paid {dato}",
      fakturaForfaltTekst: "overdue — we'd appreciate a look",
      fakturaStatus: {
        sendt: "sent",
        delbetalt: "partly paid",
        betalt: "paid",
        forfalt: "overdue",
        kansellert: "cancelled",
      },
      levertMelding:
        "The project is delivered — the log stays right here. Need anything, the workshop is never further away than an email.",
    },
    admin: {
      kicker: "The back office",
      login: {
        tittel: "The back office.",
        forklaring:
          "Workshop staff only. Sign in with the workshop email — a link, no password.",
      },
      ikkeDinDor: {
        tittel: "Not your door.",
        tekst:
          "This is the back room — only Petter has a key. If you're after your own mapping, it lives safely behind /start.",
        hjem: "To the front page",
        byttKonto: "Sign out and switch address",
      },
      felles: {
        henter: "fetching …",
        feil: "It stalled. Try again.",
        provIgjen: "Try again",
      },
      liste: {
        tittel: "The mappings",
        antallTemplate: "{n} on the bench",
        tom: "No mappings yet. The bench is clear.",
        ukjentBedrift: "(no company name)",
        nyttFraKunde: "NEW FROM CUSTOMER",
        nyttFraKundeAntallTemplate: "NEW FROM CUSTOMER ({n})",
        oppdater: "Refresh",
        sistHentetTemplate: "last fetched {tid}",
        sokLabel: "Search",
        sokPlassholder: "name, email or company",
        ingenTreff: "Nothing matches the filter. The bench is wider than this.",
        filterAlle: "All",
        pipeline: {
          nye: "New",
          forslagKlart: "Proposal ready",
          likt: "Liked",
          tilbudSendt: "Quote sent",
          bygges: "Being built",
          levert: "Delivered",
          feilet: "Failed",
        },
        venterPaDeg: "Waiting on you",
        venterAntallTemplate: "{n} waiting on you",
        slaLiktTemplate: "liked {t} ago — quote promised within one working day",
        slaForesporslerTemplate: "{n} open requests",
        slaFeilet: "generation failed — the customer is stuck",
        relNaa: "just now",
        relMinTemplate: "{n} min ago",
        relTimeTemplate: "{n} h ago",
        relDagTemplate: "{n} d ago",
        visSlettedeTemplate: "show deleted ({n})",
        skjulSlettede: "hide deleted",
        slettetChip: "deleted",
      },
      status: {
        innsendt: "submitted",
        genererer: "generating",
        forslag_klart: "proposal ready",
        likt: "liked",
        tilbud_sendt: "quote sent",
        videre: "approved",
        levert: "delivered",
        feilet: "failed",
      },
      anbefaling: {
        chatbot: "chatbot",
        flyt: "flow",
        agent: "agent",
        software: "software",
        kombinasjon: "combination",
        ikke_ai: "no AI",
      },
      detalj: {
        tilbake: "back to the list",
        svarTittel: "The answers",
        egneOrdSuffix: "— in their own words",
        researchTittel: "Research findings",
        vurderingTittel: "The assessment the customer saw",
        ingenVurdering: "no assessment yet",
        mockupAlt: "The concept sketch the customer saw",
        researchFelter: {
          navn: "Name",
          orgnr: "Org. no.",
          orgform: "Form",
          bransje: "Line of business",
          ansatte: "Employees",
          sted: "Location",
          nettside: "Website",
          sideTittel: "Page title",
          sideBeskrivelse: "Description",
          undersider: "Subpages",
          omsetning: "Revenue",
          resultat: "Net result",
          regnskapsAar: "Financial year",
          valuta: "Currency",
        },
        tilbudSendtTemplate: "quote sent {dato}",
        godkjentTemplate: "approved {dato}",
        levertTemplate: "delivered {dato}",
        slettetTemplate: "deleted {dato}",
        oppfolgingSuffix: "— the follow-up question (AI)",
        prislappTittel: "Price signals",
        prislappBudsjett: "Budget",
      },
      tilbudForm: {
        tittel: "The quote",
        tekstLabel: "Quote text",
        tekstPlassholder:
          "What we'll build and what it solves — in your own words. Blank line between paragraphs.",
        prisLabel: "Price (free text)",
        prisPlassholder: "e.g. from 45 000 kr ex. VAT",
        leveranseLabel: "Delivery",
        leveransePlassholder: "e.g. 3–4 weeks from signing",
        belopLabel: "Amount ex. VAT (kr)",
        belopPlassholder: "e.g. 45000",
        belopHint:
          "optional — but a set amount makes the Fiken invoice one click",
        belopUgyldig: "The amount must be a number in kroner — e.g. 45000 or 45 000.50.",
        mvaLabel: "VAT rate",
        sendKnapp: "Send quote",
        oppdaterKnapp: "Update quote",
        sendtTemplate: "sent {dato}",
        bekreftelse: "The quote is on the bench — the customer sees it on /start.",
        mangler: "All three fields are needed: text, price and delivery.",
        feil: "Saving the quote failed. Try again.",
        laastTemplate:
          "The quote is locked — the customer approved it {dato}. An approved quote can't be edited; new agreements live on the bench or in a separate channel.",
        ikkeKlar:
          "The quote form opens once the proposal is ready — this run doesn't have a finished assessment yet.",
      },
      lever: {
        tittel: "Deliver the project",
        forklaring:
          "Write the closing report the customer gets on the deed — what was built, where it lives, and what's worth knowing onwards. The customer is lifted to level 5.",
        sluttrapportLabel: "Closing report",
        sluttrapportPlassholder:
          "What was delivered and how it stands — in your own words. Blank line between paragraphs.",
        knapp: "Mark as delivered",
        bekreft: "Sure? Deliver to the customer",
        bekreftelse: "Delivered — the customer sees the deed on /start.",
        mangler: "Write the closing report first.",
        feil: "Delivering failed. Try again.",
        levertTemplate: "delivered {dato}",
        sluttrapportTittel: "The closing report",
        angreKnapp: "Undo delivery",
        angreBekreft: "Sure? Back to Being built",
        angreFeil: "Undoing failed. Try again.",
      },
      slett: {
        knapp: "Delete the mapping",
        bekreft: "Sure? Hide from the list",
        feil: "Deleting failed. Try again.",
        forklaring:
          "Soft delete: the row is hidden from the list and from the customer, but stays safely in the database (approved runs can never be hard-deleted).",
      },
      benken: {
        tittel: "The bench — the project room",
        ukeTemplate: "week {n} of 6",
        ukeIkkeSatt: "week not set yet",
        tom: "No posts yet. The bench is rigged — write the first one.",
        fra: {
          kunde: "customer",
          workflows: "workflows",
        },
        typer: {
          melding: "Message",
          leveranse: "Delivery",
          foresporsel: "Request",
          status: "Status",
          faktura: "Invoice",
          milepael: "Milestone",
        },
        foresporselStatus: {
          apen: "open",
          levert: "delivered",
        },
        svarMarkor: "answers the request",
        lastNedTemplate: "download {navn}",
        settAvKundenTemplate: "seen by the customer · {tid}",
        komp: {
          tittel: "New post",
          typeLabel: "Type",
          tekstLabel: "Text",
          tekstPlassholder: "What the customer will see — short and concrete.",
          lenkeLabel: "Link",
          lenkePlassholder: "https://demo.workflows.no/…",
          lenkeVeiledning:
            "delivery links should point at test or staging environments without production data",
          lenkeUgyldig: "The link must be a valid https address.",
          filLabel: "Attachments",
          velgFil: "Choose files",
          fjernFil: "Remove the file",
          fjernFilTemplate: "Remove {navn}",
          filUgyldig: "That file type isn't supported.",
          filForStor: "The file is too big — 25 MB max.",
          forMangeFiler: "Max 6 files per post — remove some first.",
          filFeil: "The upload failed. Try again.",
          ukeLabel: "Week (1–6)",
          ukeChipTemplate: "week {n}",
          ukeHint: "the week rides along with the post — or goes out alone as a status",
          settUkeAlene: "Set the week alone",
          ukeAleneTekstTemplate: "We're in week {n}.",
          ukeAutoTekst: "The week follows the calendar again.",
          ukeAutoChip: "Auto",
          ukeKildeAuto: "(automatic from approval date)",
          ukeKildeManuell: "(set manually)",
          sendKnapp: "Put it on the bench",
          tekstMangler: "Write the text first.",
          bekreftelse: "On the bench — the customer sees it on /start.",
          feil: "Posting failed. Try again.",
        },
      },
    },
  },
};
