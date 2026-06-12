import type { Lang } from "@/lib/translations";
import type {
  ForesporselStatus,
  PortalAnbefaling,
  PortalStatus,
  ProsjektFra,
  ProsjektInnleggType,
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
  | "systemer"
  | "kundehenvendelser"
  | "dromen"
  | "tempo";

export interface PortalChip {
  /** Stable id stored in answers — same across languages. */
  id: string;
  label: string;
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
  /** Exactly 8 steps, in order. The "bransje" step is auto-skipped when
   *  the company research already found their line of business. */
  steps: PortalStep[];
  wizard: {
    neste: string;
    tilbake: string;
    sendInn: string;
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
    /** Quiet mailto link beside the CTA. */
    sporsmalLenke: string;
    /** Level 4 — after approval (status «videre»). */
    godkjentTittel: string;
    godkjentTekst: string;
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
      /** Quiet manual refresh button (mono, ≥44px target). */
      oppdater: string;
      /** «sist hentet {tid}» — quiet mono line beside the refresh button. */
      sistHentetTemplate: string;
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
    };
    tilbudForm: {
      tittel: string;
      tekstLabel: string;
      tekstPlassholder: string;
      prisLabel: string;
      prisPlassholder: string;
      leveranseLabel: string;
      leveransePlassholder: string;
      sendKnapp: string;
      /** Button label when a tilbud already exists on the row. */
      oppdaterKnapp: string;
      /** «sendt {dato}» — quiet mono line when tilbudSendtAt is set. */
      sendtTemplate: string;
      bekreftelse: string;
      /** Validation: all three fields required (WCAG 3.3.1). */
      mangler: string;
      feil: string;
    };
    /** Delete — two-stage confirm at the bottom of the detail view. */
    slett: {
      knapp: string;
      /** Armed state — second press within 5s deletes for good. */
      bekreft: string;
      feil: string;
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
      /** Doubles as composer chip labels and feed meta — capitalized. */
      typer: Record<ProsjektInnleggType, string>;
      foresporselStatus: Record<ForesporselStatus, string>;
      /** «↳ svar på forespørselen» — marker on a customer answer. */
      svarMarkor: string;
      /** aria-label for the forced-download file link. */
      lastNedTemplate: string;
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
        "Svar på åtte spørsmål. Få en ærlig vurdering — også hvis svaret er at dere ikke trenger AI.",
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
        id: "systemer",
        sporsmal: "Hvilke verktøy bruker dere i dag?",
        hint: "Velg alle som er i daglig bruk.",
        multi: true,
        chips: [
          { id: "excel_sheets", label: "Excel / Sheets" },
          { id: "okonomisystem", label: "Tripletex / Fiken / Visma" },
          { id: "m365", label: "Microsoft 365" },
          { id: "google", label: "Google Workspace" },
          { id: "crm", label: "CRM" },
          { id: "fagsystem", label: "Eget fagsystem" },
          { id: "annet", label: "Annet" },
        ],
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
        id: "tempo",
        sporsmal: "Hvor fort vil dere i gang?",
        hint: "«Bare nysgjerrig» er et helt fint svar.",
        chips: [
          { id: "fort", label: "Så fort som mulig" },
          { id: "noen_maneder", label: "I løpet av noen måneder" },
          { id: "nysgjerrig", label: "Bare nysgjerrig" },
        ],
      },
    ],
    wizard: {
      neste: "Neste",
      tilbake: "Tilbake",
      sendInn: "Send inn og se forslaget",
    },
    research: {
      navnLabel: "Bedriftsnavnet",
      navnPlassholder: "f.eks. Håland Rør AS",
      nettsideLabel: "Nettsiden deres",
      nettsideHint: "valgfritt — vi titter gjerne",
      nettsidePlassholder: "bedriften.no",
      slaarOpp: "slår opp i Brønnøysundregistrene …",
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
        "Lenken er sendt — sjekk innboksen. Den virker i én time, og svarene dine ligger trygt her imens.",
      sendPaNytt: "Send lenken på nytt",
      sendPaNyttOm: "kan sendes på nytt om {s} sekunder",
      feil: "Det gikk ikke. Sjekk adressen og prøv igjen — eller ta en prat med oss i stedet.",
      epostMangler: "Skriv inn e-postadressen din først.",
      lenkeUtlopt:
        "Lenken er utløpt eller allerede brukt — send en ny, så ligger svarene dine fortsatt trygt her.",
      forMangeLenker:
        "Vi har sendt mange lenker på kort tid og må vente litt — det er vår grense, ikke skrivefeil hos deg. Prøv igjen om en times tid, eller ta en prat med oss i mellomtiden.",
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
      sporsmalLenke: "har du spørsmål? ta en prat",
      godkjentTittel: "Da setter vi i gang.",
      godkjentTekst:
        "Tilbudet er godkjent — Petter tar kontakt om oppstart. Verkstedet rigger benken.",
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
        oppdater: "Oppdater",
        sistHentetTemplate: "sist hentet {tid}",
      },
      status: {
        innsendt: "innsendt",
        genererer: "genererer",
        forslag_klart: "forslag klart",
        likt: "likt",
        tilbud_sendt: "tilbud sendt",
        videre: "godkjent",
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
        },
        tilbudSendtTemplate: "tilbud sendt {dato}",
        godkjentTemplate: "godkjent {dato}",
      },
      tilbudForm: {
        tittel: "Tilbudet",
        tekstLabel: "Tilbudstekst",
        tekstPlassholder:
          "Hva vi bygger og hva det løser — med dine ord. Avsnitt skilles med blank linje.",
        prisLabel: "Pris",
        prisPlassholder: "f.eks. fra 45 000 kr eks. mva",
        leveranseLabel: "Leveranse",
        leveransePlassholder: "f.eks. 3–4 uker fra signering",
        sendKnapp: "Send tilbud",
        oppdaterKnapp: "Oppdater tilbud",
        sendtTemplate: "sendt {dato}",
        bekreftelse: "Tilbudet ligger på benken — kunden ser det på /start.",
        mangler: "Alle tre feltene må fylles ut: tekst, pris og leveranse.",
        feil: "Det gikk ikke å lagre tilbudet. Prøv igjen.",
      },
      slett: {
        knapp: "Slett kartleggingen",
        bekreft: "Sikker? Slett for godt",
        feil: "Det gikk ikke å slette. Prøv igjen.",
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
        },
        foresporselStatus: {
          apen: "åpen",
          levert: "levert",
        },
        svarMarkor: "svar på forespørselen",
        lastNedTemplate: "last ned {navn}",
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
        "Answer eight questions. Get an honest assessment — even if the answer is that you don't need AI.",
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
        id: "systemer",
        sporsmal: "What tools do you use today?",
        hint: "Pick everything in daily use.",
        multi: true,
        chips: [
          { id: "excel_sheets", label: "Excel / Sheets" },
          { id: "okonomisystem", label: "Tripletex / Fiken / Visma" },
          { id: "m365", label: "Microsoft 365" },
          { id: "google", label: "Google Workspace" },
          { id: "crm", label: "CRM" },
          { id: "fagsystem", label: "In-house system" },
          { id: "annet", label: "Other" },
        ],
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
        id: "tempo",
        sporsmal: "How soon do you want to start?",
        hint: "“Just curious” is a perfectly fine answer.",
        chips: [
          { id: "fort", label: "As soon as possible" },
          { id: "noen_maneder", label: "Within a few months" },
          { id: "nysgjerrig", label: "Just curious" },
        ],
      },
    ],
    wizard: {
      neste: "Next",
      tilbake: "Back",
      sendInn: "Submit and see the proposal",
    },
    research: {
      navnLabel: "Company name",
      navnPlassholder: "e.g. Håland Plumbing AS",
      nettsideLabel: "Your website",
      nettsideHint: "optional — we'll gladly have a look",
      nettsidePlassholder: "yourcompany.com",
      slaarOpp: "checking the Brønnøysund public registers …",
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
        "Link sent — check your inbox. It works for one hour, and your answers are kept safe here meanwhile.",
      sendPaNytt: "Send the link again",
      sendPaNyttOm: "you can resend in {s} seconds",
      feil: "That didn't work. Check the address and try again — or just talk to us instead.",
      epostMangler: "Enter your email address first.",
      lenkeUtlopt:
        "That link has expired or was already used — send a new one, your answers are still safe here.",
      forMangeLenker:
        "We've sent a lot of links in a short time and need a breather — our ceiling, not your typo. Try again in an hour or so, or just talk to us in the meantime.",
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
      sporsmalLenke: "questions? let's talk",
      godkjentTittel: "Then we get to work.",
      godkjentTekst:
        "The quote is approved — Petter will be in touch about kick-off. The workshop is rigging the bench.",
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
        oppdater: "Refresh",
        sistHentetTemplate: "last fetched {tid}",
      },
      status: {
        innsendt: "submitted",
        genererer: "generating",
        forslag_klart: "proposal ready",
        likt: "liked",
        tilbud_sendt: "quote sent",
        videre: "approved",
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
        },
        tilbudSendtTemplate: "quote sent {dato}",
        godkjentTemplate: "approved {dato}",
      },
      tilbudForm: {
        tittel: "The quote",
        tekstLabel: "Quote text",
        tekstPlassholder:
          "What we'll build and what it solves — in your own words. Blank line between paragraphs.",
        prisLabel: "Price",
        prisPlassholder: "e.g. from 45 000 kr ex. VAT",
        leveranseLabel: "Delivery",
        leveransePlassholder: "e.g. 3–4 weeks from signing",
        sendKnapp: "Send quote",
        oppdaterKnapp: "Update quote",
        sendtTemplate: "sent {dato}",
        bekreftelse: "The quote is on the bench — the customer sees it on /start.",
        mangler: "All three fields are needed: text, price and delivery.",
        feil: "Saving the quote failed. Try again.",
      },
      slett: {
        knapp: "Delete the mapping",
        bekreft: "Sure? Delete for good",
        feil: "Deleting failed. Try again.",
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
        },
        foresporselStatus: {
          apen: "open",
          levert: "delivered",
        },
        svarMarkor: "answers the request",
        lastNedTemplate: "download {navn}",
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
