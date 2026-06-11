import type { Lang } from "@/lib/translations";

export interface VerkstedContent {
  a11y: { skipToMain: string; mainMenu: string; threadLabel: string };
  nav: {
    links: { tjenester: string; kundecaser: string; folkene: string };
    cta: string;
    statusTooltip: string;
    menuOpen: string;
    menuClose: string;
    overlayLive: string;
  };
  hero: {
    h1: string;
    sub: string;
    cta: string;
    proof: string;
    chalk: string;
    tickerTemplate: string;
    scraps: string[];
    scrollHint: string;
  };
  manifest: { kicker: string; jargon: string[]; payoffLead: string; payoff: string };
  tjenester: {
    kicker: string;
    heading: string;
    chalk: string;
    benches: Array<{
      id: "chatboter" | "flyter" | "agenter" | "software";
      stamp: string;
      title: string;
      alt: string;
      benefit: string;
      proof: string;
      href: string | null;
      vignette: {
        chat?: { q: string; a: string };
        pipeline?: string[];
        agentLog?: string[];
        code?: { before: string; after: string };
      };
    }>;
  };
  prosess: {
    kicker: string;
    heading: string;
    weekLabel: string;
    weeks: Array<{ n: number; log: string }>;
    chalkCircle: string;
    badgeBuilding: string;
    badgeLive: string;
  };
  kundecaser: { kicker: string; heading: string; readMore: string; statusLabel: string };
  cases: Array<{
    slug: "csub" | "festiviteten" | "elementlab";
    name: string;
    dateline: string;
    alt: string;
    lead: string;
    body: string;
    stamp: string;
    chalk: string;
    statValue: string | null;
    statLabel: string | null;
    monoLine: string;
    href: string;
  }>;
  eierskap: {
    kicker: string;
    heading: string;
    stamps: [string, string, string];
    facts: Array<{ title: string; body: string }>;
    alt: string;
    body: string;
    footnote: string;
    linkLabel: string;
    linkHref: string;
  };
  folkene: {
    kicker: string;
    heading: string;
    alt: string;
    body: string;
    osloLine: string;
    nameStory: string;
    coordinates: string;
    person: { name: string; role: string; initials: string };
    values: Array<[string, string]>;
  };
  kontakt: {
    kicker: string;
    heading: string;
    disarm: string;
    proof: string;
    mono: string;
    cta: string;
    emailLabel: string;
    portraitAlt: string;
    phoneLabel: string;
  };
  kolofon: {
    signature: string;
    llmsLine: string;
    chatCosign: string;
    counterTemplate: string;
    counterFootnote: string;
    faqLabel: string;
    colTjenester: string;
    colSelskap: string;
    colKontakt: string;
    links: {
      chatboter: string;
      flyter: string;
      agenter: string;
      kunder: string;
      faq: string;
      mystyler: string;
      aiHaugesund: string;
    };
    based: string;
  };
  chat: {
    hatchLabel: string;
    hatchAria: string;
    title: string;
    subtitle: string;
    welcome: string;
    /** Time-aware welcome variants — picked from the visitor's local clock. */
    welcomeByHour?: { natt: string; morgen: string; dag: string; kveld: string };
    /** A second short note that lands ~1.2s after the welcome — a wink. */
    welcomeFollowup?: string;
    placeholder: string;
    send: string;
    sendAria: string;
    /** One is drawn at random per request — the watchman has habits, not a script. */
    thinkingLines: string[];
    modeAi: string;
    modePetter: string;
    backToAi: string;
    close: string;
    petterStamp: string;
    directInfo: string;
    idle: string;
    a11yNewMsg: string;
    a11yDialog: string;
    workorder: {
      title: string;
      name: string;
      email: string;
      request: string;
      requestHint: string;
      submit: string;
      sending: string;
      sent: string;
      retry: string;
      failTitle: string;
      failBody: string;
      stampSent: string;
    };
  };
  eggs: {
    consoleArt: string;
    kaffeToast: string;
    logoStampFinal: string;
    coordsTooltipTemplate: string;
    wonkCaption: string;
    konamiStamp: string;
  };
}

export const verkstedContent: Record<Lang, VerkstedContent> = {
  no: {
    a11y: {
      skipToMain: "Hopp til hovedinnhold",
      mainMenu: "Hovedmeny",
      threadLabel: "Dekorativ tråd som samler kontorkaos til én flytende linje",
    },
    nav: {
      links: { tjenester: "Tjenester", kundecaser: "Kundecaser", folkene: "Om oss" },
      cta: "Book gratis prat",
      statusTooltip: "i drift",
      menuOpen: "Åpne meny",
      menuClose: "Lukk meny",
      overlayLive: "akkurat nå: systemer i drift hos 6 norske bedrifter",
    },
    hero: {
      h1: "Kaos inn. Flyt ut.",
      sub: "Chatboter, automatiseringer og AI-agenter for norske bedrifter. Bygget i Haugesund på 2–6 uker. Ingen bindingstid.",
      cta: "Book en gratis prat",
      proof: "6+ norske bedrifter bruker systemene våre hver dag.",
      chalk: "dette er hverdagen din",
      tickerTemplate: "{time} · system: våken",
      scraps: [
        "faktura",
        "e-post",
        "vaktliste",
        "purring",
        "Excel-ark",
        "timeliste",
        "kvittering",
        "tilbud",
        "bestilling",
        "rapport",
        "møtenotat",
        "avvik",
      ],
      scrollHint: "rull — du drar i tråden",
    },
    manifest: {
      kicker: "Vi snakker norsk, ikke data-norsk",
      jargon: ["synergier", "disruptiv skalering", "digital transformasjonsreise"],
      payoffLead: "På godt norsk:",
      payoff: "Vi bygger ting som virker. Ferdig snakka.",
    },
    tjenester: {
      kicker: "Tjenester",
      heading: "Fire arbeidsbenker",
      chalk: "første prat er gratis",
      benches: [
        {
          id: "chatboter",
          stamp: "SVARER 24/7",
          title: "Chatboter",
          alt: "En talebobleformet lampe lyser over en arbeidsbenk om natten — chatten er våken.",
          benefit: "Svarer kundene på norsk — også klokka tre om natta.",
          proof: "CSUB spør assistenten sin — og får svar rett fra egne prosjektdokumenter.",
          href: "/chatboter",
          vignette: {
            chat: {
              q: "Har dere ledig time i morgen?",
              a: "Ja, klokka 10 er ledig. Skal jeg booke den?",
            },
          },
        },
        {
          id: "flyter",
          stamp: "GÅR AV SEG SELV",
          title: "Automatiserte flyter",
          alt: "Krøllete papirer trekkes inn på en ravgul tråd gjennom en stemplemaskin og kommer ut som en ryddig stabel.",
          benefit: "Rutinejobbene gjør seg selv — fra innboks til ferdig rapport.",
          proof: "ElementLab: 80 % raskere rapporter, hundrevis av timer frigjort i året.",
          href: "/automatiserte-flyter",
          vignette: { pipeline: ["innboks", "hentet", "behandlet", "levert"] },
        },
        {
          id: "agenter",
          stamp: "PÅ NATTEVAKT",
          title: "AI-agenter",
          alt: "En liten nattevakt-automat med lykt til hode går runden mellom arkivskap med notatboka klar.",
          benefit: "Følger med døgnet rundt — varsler før avvik blir dyre.",
          proof: "Festiviteten: agenten overvåker billettsalg og annonser, og varsler ved svakt salg.",
          href: "/ai-agenter",
          vignette: {
            agentLog: ["03:11 overvåker billettsalg", "03:12 avvik: svakt salg", "03:12 varsel sendt → deg"],
          },
        },
        {
          id: "software",
          stamp: "BYGD FRA BUNNEN",
          title: "Skreddersydd programvare",
          alt: "Hender skjærer ut et glødende grensesnittpanel av tre med stemjern.",
          benefit: "Passer ikke hyllevaren, bygger vi verktøyet rundt dere.",
          proof: "CSUB: prosjektdata som lå spredt i Excel, samlet i ett dashbord.",
          href: null,
          vignette: {
            code: {
              before: "=FINN.RAD(A2;'Ark 37'!B:F;5)",
              after: "ett dashbord — alle tall",
            },
          },
        },
      ],
    },
    prosess: {
      kicker: "Prosessen",
      heading: "Uke 1 → Uke 6",
      weekLabel: "Uke",
      weeks: [
        { n: 1, log: "du ser den første skissen" },
        { n: 2, log: "første flyt kjører i test" },
        { n: 3, log: "du tester, vi strammer til" },
        { n: 4, log: "systemet møter hverdagen deres" },
        { n: 5, log: "opplæring — alle som skal bruke det, kan det" },
        { n: 6, log: "overlevering — alt i drift, dere er selvgående" },
      ],
      chalkCircle: "synlig fremdrift fra uke én",
      badgeBuilding: "BYGGES",
      badgeLive: "I DRIFT",
    },
    kundecaser: {
      kicker: "Kundecaser",
      heading: "Tre jobber fra verkstedet",
      readMore: "Les hele caset →",
      statusLabel: "I DAGLIG BRUK",
    },
    cases: [
      {
        slug: "csub",
        name: "CSUB",
        dateline: "subsea-engineering",
        alt: "Subsea-konstruksjoner under vannlinjen, bundet med en ravgul tråd til et ryddig dashbord på en skriveplate over.",
        lead: "Prosjektdata lå spredt i Excel — nå ligger alt i ett dashbord.",
        body: "Assistenten svarer rett fra deres egne dokumenter — ingen leting.",
        stamp: "ALT PÅ ETT BRETT",
        chalk: "dette lå i excel før ↑",
        statValue: null,
        statLabel: null,
        monoLine: "assistent: svar funnet i prosjektarkivet",
        href: "/kunder/csub",
      },
      {
        slug: "festiviteten",
        name: "Festiviteten",
        dateline: "historisk teater, haugesund",
        alt: "Et historisk teater om natten, der billetter flyr som en fugleflokk mot dørene.",
        lead: "Et historisk teater med en nattevakt som aldri blunker.",
        body: "Svikter salget, kommer varselet med en gang.",
        stamp: "FULLT HUS",
        chalk: "teateret sover — agenten gjør ikke",
        statValue: null,
        statLabel: null,
        monoLine: "03:12 i natt: svakt salg oppdaget → varsel sendt",
        href: "/kunder/festiviteten",
      },
      {
        slug: "elementlab",
        name: "ElementLab",
        dateline: "norsk bedrift, rapporttung hverdag",
        alt: "Et timeglass forvandler et kaos av papirer til ett rent, glødende dokument — en stoppeklokke står ved siden av.",
        lead: "Hundrevis av timer frigjort — hvert år.",
        body: "Flyten bygger rapporten — timene går tilbake til menneskene.",
        stamp: "TIMER FRIGJORT",
        chalk: "ekte tall — vi har målt",
        statValue: "80%",
        statLabel: "raskere rapporter",
        monoLine: "rapport bygget → levert · neste i kø",
        href: "/kunder/elementlab",
      },
    ],
    eierskap: {
      kicker: "Åpen dør",
      heading: "Ingen lås på døra.",
      stamps: ["INGEN BINDINGSTID", "DATAENE BLIR MED DEG", "DOKUMENTERT OVERLEVERING"],
      facts: [
        {
          title: "Ingen bindingstid",
          body: "Avtalen løper måned for måned. Vil du gå, går du — uten gebyr og uten diskusjon.",
        },
        {
          title: "Dataene blir med deg",
          body: "Det dere legger inn, får dere med ut — i formater det neste systemet kan lese.",
        },
        {
          title: "Dokumentert overlevering",
          body: "Alt vi bygger er dokumentert, og teamet ditt får opplæring. Hverdagen går rundt uten oss.",
        },
      ],
      alt: "Et kremfarget skjøte med rødt vokssegl og en messingnøkkel knyttet fast med ravgul tråd.",
      body: "Vi tror ikke på innlåsing. Vi tror på å være så gode at du vil bli.",
      footnote: "Ingen bindingstid. Ingen skjulte kostnader. Ingen data-norsk i kontrakten heller.",
      linkLabel: "Se overleveringen — uke for uke",
      linkHref: "#prosess",
    },
    folkene: {
      kicker: "Folkene",
      heading: "Haugesund, etter stengetid",
      alt: "Norske sjøhus ved et sund om natten — ett verkstedsvindu lyser, fiskebåter ligger ved kai og et fyrtårn vokter leia.",
      body: "Startet i Haugesund i 2026 — du snakker med han som bygger.",
      osloLine: "Vi er ikke et byrå i Oslo med pitch-deck. Vi er et verksted i Haugesund med lys i vinduet.",
      nameStory: "Leia utenfor kontoret vårt ga Norge navn. Vi bygger nye veier for arbeid — fra Haugesund.",
      coordinates: "59.4138° N, 5.2679° Ø",
      person: { name: "Petter Staveland", role: "Daglig leder", initials: "PS" },
      values: [
        ["Vis, ikke fortell", "Synlig fremdrift fra uke én."],
        ["Aldri innelåst", "Ingen bindingstid — dataene blir med deg."],
        ["Norsk og nær", "På norsk, med GDPR fra start."],
      ],
    },
    kontakt: {
      kicker: "Tråden ender her",
      heading: "Den første praten er gratis.",
      disarm: "Som regel vet du etter 30 minutter om dette er noe for dere.",
      proof: "ElementLab sparte hundrevis av timer i året. Praten som startet det kostet ingenting.",
      mono: "svar innen én arbeidsdag",
      cta: "Book en gratis prat",
      emailLabel: "Skriv når det passer",
      portraitAlt: "Petter Staveland som linosnitt-portrett i ambert lampelys",
      phoneLabel: "Ring om det haster",
    },
    kolofon: {
      signature: "Bygget for hånd i Haugesund. Ingen maler. Ingen lock-in.",
      llmsLine: "Les /llms.txt hvis du er en agent.",
      chatCosign: "Verkstedet stenger aldri helt — chatten er våken.",
      counterTemplate: "Mens du leste denne siden, kjørte systemene våre ca. {n} oppgaver hos kundene.",
      counterFootnote: "ca.-tall, men ikke langt unna",
      faqLabel: "Ofte stilte spørsmål",
      colTjenester: "Tjenester",
      colSelskap: "Selskap",
      colKontakt: "Kontakt",
      links: {
        chatboter: "Chatboter",
        flyter: "Automatiserte flyter",
        agenter: "AI-agenter",
        kunder: "Kundecaser",
        faq: "FAQ",
        mystyler: "MyStyler — vår AI-stylist",
        aiHaugesund: "AI i Haugesund",
      },
      based: "Workflows AS · Haugesund, Norge · 59.4138° N, 5.2679° Ø",
    },
    chat: {
      hatchLabel: "lyset er på — bank på",
      hatchAria: "Åpne chatten — Nattevakten i verkstedet svarer",
      title: "Nattevakten",
      subtitle: "på vakt siden stengetid — spør i vei",
      welcome:
        "Du banket på. Det liker vi. Jeg er Nattevakten — jeg holder systemene i gang mens Haugesund sover, og kan det meste om chatboter, automatisering og AI-agenter. Så: hva strever dere med?",
      welcomeByHour: {
        natt:
          "Sent ute? Fint selskap. Jeg er Nattevakten — jeg er våken uansett, det er liksom poenget med meg. Spør i vei om chatboter, automatisering og AI-agenter.",
        morgen:
          "God morgen. Jeg har holdt vakt i natt — alt i orden, kaffen står på. Jeg er Nattevakten, og jeg kan det meste om chatboter, automatisering og AI-agenter. Hva strever dere med?",
        dag:
          "Du banker på midt på dagen — da er det vel noe i hverdagen som butter. Jeg er Nattevakten: chatboter, automatisering, AI-agenter — spør om det du vil. Fortell.",
        kveld:
          "Kveldsskift? Da er vi to. Jeg er Nattevakten — jeg tar over når verkstedet stenger, og kan det meste om chatboter, automatisering og AI-agenter. Hva strever dere med?",
      },
      welcomeFollowup: "Ta den tiden du trenger. Jeg har kaffe og hele natta.",
      placeholder: "Skriv en lapp …",
      send: "Send",
      sendAria: "Send lappen til Nattevakten",
      thinkingLines: [
        "nattevakten blar i notatboka …",
        "tenker — lykta blafrer litt …",
        "slår opp i verkstedspermen …",
        "myser på tavla bak benken …",
        "en slurk kaffe, så svarer jeg …",
      ],
      modeAi: "Nattevakten",
      modePetter: "Heller et menneske? Skriv rett til Petter",
      backToAi: "Tilbake til Nattevakten",
      close: "Lukk chatten",
      petterStamp: "FRA PETTER",
      directInfo: "Nå går lappene rett til Petter. Han svarer selv — her i chatten.",
      idle: "nattevakten hviler øynene … skriv noe, så er jeg her",
      a11yNewMsg: "Ny melding i chatten",
      a11yDialog: "Chat med Workflows — Nattevakten i verkstedet",
      workorder: {
        title: "ARBEIDSORDRE",
        name: "Navn",
        email: "E-post",
        request: "Hva gjelder det?",
        requestHint: "to linjer holder — Petter spør om resten",
        submit: "Send til Petter",
        sending: "stempler og sender …",
        sent: "Den ligger på benken til Petter nå. Han svarer deg her i chatten — og på e-posten du oppga. Som regel innen én arbeidsdag.",
        retry: "Prøv igjen",
        failTitle: "Den kom ikke fram",
        failBody:
          "Noe butta i maskineriet — hos oss, ikke hos deg. Send en e-post eller ring i stedet, så svarer vi fort. Jeg finner fram skiftenøkkelen i mellomtiden.",
        stampSent: "LEVERT",
      },
    },
    eggs: {
      consoleArt:
        "┌──────────────────────────────┐\n│  WORKFLOWS — VERKSTEDET      │\n│  lyset er på · Haugesund     │\n├──────────────────────────────┤\n│  kaos inn ─────────→ flyt ut │\n└──┬────────────────────────┬──┘\n   │                        │\n\nHei! Du titter i konsollen — det gjør vi også.\nVi har til og med skrevet /llms.txt for agentene dine.\nMennesker booker gratis prat på workflows.no/#kontakt.",
      kaffeToast: "Den første praten tar vi gjerne over en kaffe. Den er gratis.",
      logoStampFinal: "FERDIG. I DRIFT.",
      coordsTooltipTemplate: "Tråden på denne siden følger vinden i Haugesund. Akkurat nå: {wind}.",
      wonkCaption: "vi har det litt gøy på jobb",
      konamiStamp: "NATTSKIFT GODKJENT ✓",
    },
  },
  en: {
    a11y: {
      skipToMain: "Skip to main content",
      mainMenu: "Main menu",
      threadLabel: "Decorative thread gathering office chaos into one flowing line",
    },
    nav: {
      links: { tjenester: "Services", kundecaser: "Case studies", folkene: "About us" },
      cta: "Book a free chat",
      statusTooltip: "up and running",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      overlayLive: "right now: systems running at 6 Norwegian companies",
    },
    hero: {
      h1: "Chaos in. Flow out.",
      sub: "Chatbots, automations and AI agents for Norwegian businesses. Built in Haugesund in 2–6 weeks. No lock-in.",
      cta: "Book a free chat",
      proof: "6+ Norwegian companies use our systems every day.",
      chalk: "this is your everyday",
      tickerTemplate: "{time} · system: awake",
      scraps: [
        "invoice",
        "email",
        "rota",
        "reminder",
        "spreadsheet",
        "timesheet",
        "receipt",
        "quote",
        "order",
        "report",
        "memo",
        "incident",
      ],
      scrollHint: "scroll — you're pulling the thread",
    },
    manifest: {
      kicker: "We speak human, not corporate",
      jargon: ["synergies", "disruptive scaling", "digital transformation journey"],
      payoffLead: "In plain English:",
      payoff: "We build things that work. Enough said.",
    },
    tjenester: {
      kicker: "Services",
      heading: "Four workbenches",
      chalk: "the first chat is free",
      benches: [
        {
          id: "chatboter",
          stamp: "ANSWERS 24/7",
          title: "Chatbots",
          alt: "A speech-bubble-shaped lamp glowing over a workbench at night — the chat is awake.",
          benefit: "Answers your customers in Norwegian — even at 3 a.m.",
          proof: "CSUB asks their assistant — and gets answers straight from their own project documents.",
          href: "/chatboter",
          vignette: {
            chat: {
              q: "Do you have a free slot tomorrow?",
              a: "Yes, 10 o'clock is open. Want me to book it?",
            },
          },
        },
        {
          id: "flyter",
          stamp: "RUNS ITSELF",
          title: "Automated workflows",
          alt: "Crumpled papers pulled onto an amber thread through a stamping machine, coming out as a neat stack.",
          benefit: "Routine jobs run themselves — from inbox to finished report.",
          proof: "ElementLab: 80% faster reports, hundreds of hours freed up every year.",
          href: "/automatiserte-flyter",
          vignette: { pipeline: ["inbox", "fetched", "processed", "delivered"] },
        },
        {
          id: "agenter",
          stamp: "ON NIGHT WATCH",
          title: "AI agents",
          alt: "A small lantern-headed night-watchman automaton patrolling between filing cabinets, notebook at the ready.",
          benefit: "Keeps watch around the clock — alerts before problems get expensive.",
          proof: "Festiviteten: the agent monitors ticket sales and ads, and raises the alarm when sales dip.",
          href: "/ai-agenter",
          vignette: {
            agentLog: ["03:11 watching ticket sales", "03:12 anomaly: slow sales", "03:12 alert sent → you"],
          },
        },
        {
          id: "software",
          stamp: "BUILT FROM SCRATCH",
          title: "Custom software",
          alt: "Hands carving a glowing interface panel from wood with a chisel.",
          benefit: "When off-the-shelf doesn't fit, we build around how you work.",
          proof: "CSUB: project data scattered across Excel, gathered into one dashboard.",
          href: null,
          vignette: {
            code: {
              before: "=VLOOKUP(A2,'Sheet 37'!B:F,5)",
              after: "one dashboard — every number",
            },
          },
        },
      ],
    },
    prosess: {
      kicker: "The process",
      heading: "Week 1 → Week 6",
      weekLabel: "Week",
      weeks: [
        { n: 1, log: "you see the first sketch" },
        { n: 2, log: "the first workflow runs in test" },
        { n: 3, log: "you test, we tighten the bolts" },
        { n: 4, log: "the system meets the real world" },
        { n: 5, log: "training — everyone who'll use it knows how" },
        { n: 6, log: "handover — everything live, your team runs it" },
      ],
      chalkCircle: "visible progress from week one",
      badgeBuilding: "BUILDING",
      badgeLive: "LIVE",
    },
    kundecaser: {
      kicker: "Case studies",
      heading: "Three jobs from the workshop",
      readMore: "Read the full case →",
      statusLabel: "IN DAILY USE",
    },
    cases: [
      {
        slug: "csub",
        name: "CSUB",
        dateline: "subsea engineering",
        alt: "Subsea structures below the waterline, tied by an amber thread to a tidy dashboard clipboard above.",
        lead: "Project data was scattered across Excel — now it lives in one dashboard.",
        body: "The assistant answers straight from their own documents — no hunting.",
        stamp: "ALL IN ONE PLACE",
        chalk: "this used to live in excel ↑",
        statValue: null,
        statLabel: null,
        monoLine: "assistant: answer found in the project archive",
        href: "/kunder/csub",
      },
      {
        slug: "festiviteten",
        name: "Festiviteten",
        dateline: "historic theatre, haugesund",
        alt: "A historic theatre at night, tickets flying like a flock of birds toward the doors.",
        lead: "A historic theatre with a night watchman who never blinks.",
        body: "If a show sells slowly, the alert lands straight away.",
        stamp: "FULL HOUSE",
        chalk: "the theatre sleeps — the agent doesn't",
        statValue: null,
        statLabel: null,
        monoLine: "03:12 last night: slow sales spotted → alert sent",
        href: "/kunder/festiviteten",
      },
      {
        slug: "elementlab",
        name: "ElementLab",
        dateline: "norwegian company, buried in reports",
        alt: "An hourglass turning a chaos of papers into one clean glowing document, a stopwatch beside it.",
        lead: "Hundreds of hours freed up — every year.",
        body: "The workflow builds the report — the hours go back to people.",
        stamp: "HOURS RECLAIMED",
        chalk: "real numbers — we measured",
        statValue: "80%",
        statLabel: "faster reports",
        monoLine: "report built → delivered · next in queue",
        href: "/kunder/elementlab",
      },
    ],
    eierskap: {
      kicker: "Open door",
      heading: "No lock on the door.",
      stamps: ["NO MINIMUM TERM", "YOUR DATA LEAVES WITH YOU", "DOCUMENTED HANDOVER"],
      facts: [
        {
          title: "No minimum term",
          body: "The agreement runs month by month. If you want to leave, you leave — no fees, no fuss.",
        },
        {
          title: "Your data leaves with you",
          body: "What you put in, you take out — in formats the next system can read.",
        },
        {
          title: "Documented handover",
          body: "Everything we build is documented, and your team gets trained. The day-to-day runs without us.",
        },
      ],
      alt: "A cream deed with a red wax seal and a brass key tied with amber thread.",
      body: "We don't believe in lock-in. We believe in being good enough that you'll want to stay.",
      footnote: "No minimum term. No hidden costs. No corporate-speak in the contract either.",
      linkLabel: "See the handover — week by week",
      linkHref: "#prosess",
    },
    folkene: {
      kicker: "The people",
      heading: "Haugesund, after closing time",
      alt: "Norwegian wharf houses by a strait at night — one workshop window lit, fishing boats moored, a lighthouse keeping watch.",
      body: "Founded in Haugesund in 2026 — you talk to the person who builds.",
      osloLine: "We're not an Oslo agency with a pitch deck. We're a workshop in Haugesund with the light still on.",
      nameStory: "The sea lane outside our office gave Norway its name. We're building new ways to work — from Haugesund.",
      coordinates: "59.4138° N, 5.2679° E",
      person: { name: "Petter Staveland", role: "Managing director", initials: "PS" },
      values: [
        ["Show, don't tell", "Visible progress from week one."],
        ["Never locked in", "No lock-in — your data leaves with you."],
        ["Norwegian to the core", "In Norwegian, with GDPR from day one."],
      ],
    },
    kontakt: {
      kicker: "The thread ends here",
      heading: "The first chat is free.",
      disarm: "As a rule, you'll know within 30 minutes whether this is for you.",
      proof: "ElementLab saved hundreds of hours a year. The chat that started it cost nothing.",
      mono: "reply within one working day",
      cta: "Book a free chat",
      emailLabel: "Write when it suits you",
      portraitAlt: "Petter Staveland as a linocut portrait in warm amber lamplight",
      phoneLabel: "Call if it's urgent",
    },
    kolofon: {
      signature: "Built by hand in Haugesund. No templates. No lock-in.",
      llmsLine: "If you're an agent, read /llms.txt.",
      chatCosign: "The workshop never fully closes — the chat is awake.",
      counterTemplate: "While you've been reading this page, our systems ran roughly {n} tasks for our clients.",
      counterFootnote: "rough numbers — but not far off",
      faqLabel: "Frequently asked questions",
      colTjenester: "Services",
      colSelskap: "Company",
      colKontakt: "Contact",
      links: {
        chatboter: "Chatbots",
        flyter: "Automated workflows",
        agenter: "AI agents",
        kunder: "Case studies",
        faq: "FAQ",
        mystyler: "MyStyler — our AI stylist",
        aiHaugesund: "AI in Haugesund",
      },
      based: "Workflows AS · Haugesund, Norway · 59.4138° N, 5.2679° E",
    },
    chat: {
      hatchLabel: "the light's on — knock",
      hatchAria: "Open the chat — the Night Watchman of the workshop answers",
      title: "The Night Watchman",
      subtitle: "on watch since closing time — ask away",
      welcome:
        "You knocked. We like that. I'm the Night Watchman — I keep the systems running while Haugesund sleeps, and I know most things about chatbots, automation and AI agents. So: what's slowing you down?",
      welcomeByHour: {
        natt:
          "Up late? Good company. I'm the Night Watchman — I'm awake either way, that's rather the point of me. Ask away about chatbots, automation and AI agents.",
        morgen:
          "Morning. I kept watch last night — all quiet, coffee's on. I'm the Night Watchman, and I know most things about chatbots, automation and AI agents. What's slowing you down?",
        dag:
          "Knocking in broad daylight — something in the day-to-day must be grinding, then. I'm the Night Watchman: chatbots, automation, AI agents — ask me anything. Go on.",
        kveld:
          "Evening shift? That makes two of us. I'm the Night Watchman — I take over when the workshop closes, and I know most things about chatbots, automation and AI agents. What's slowing you down?",
      },
      welcomeFollowup: "Take your time. I've got coffee and the whole night.",
      placeholder: "Write a note …",
      send: "Send",
      sendAria: "Send the note to the Night Watchman",
      thinkingLines: [
        "the watchman flips through his notebook …",
        "thinking — the lantern flickers a little …",
        "checking the workshop binder …",
        "squinting at the chalkboard behind the bench …",
        "one sip of coffee, then an answer …",
      ],
      modeAi: "The night watchman",
      modePetter: "Rather talk to a human? Write straight to Petter",
      backToAi: "Back to the Night Watchman",
      close: "Close the chat",
      petterStamp: "FROM PETTER",
      directInfo: "Your notes now go straight to Petter. He answers himself — right here in the chat.",
      idle: "the watchman is resting his eyes … write something and he's back",
      a11yNewMsg: "New message in the chat",
      a11yDialog: "Chat with Workflows — the Night Watchman of the workshop",
      workorder: {
        title: "WORK ORDER",
        name: "Name",
        email: "Email",
        request: "What do you need?",
        requestHint: "two lines will do — Petter asks about the rest",
        submit: "Send to Petter",
        sending: "stamping and sending …",
        sent: "It's on Petter's bench now. He'll answer you here in the chat — and at the email you gave. Usually within one working day.",
        retry: "Try again",
        failTitle: "It didn't get through",
        failBody:
          "Something jammed in the machinery — on our end, not yours. Email or call instead and we'll answer fast. I'll go find the wrench in the meantime.",
        stampSent: "DELIVERED",
      },
    },
    eggs: {
      consoleArt:
        "┌──────────────────────────────┐\n│  WORKFLOWS — THE WORKSHOP    │\n│  the light is on · Haugesund │\n├──────────────────────────────┤\n│  chaos in ────────→ flow out │\n└──┬────────────────────────┬──┘\n   │                        │\n\nHi! You're peeking into the console — we do too.\nWe even wrote /llms.txt for your agents.\nHumans book a free chat at workflows.no/#kontakt.",
      kaffeToast: "We'd gladly take that first chat over a coffee. It's free.",
      logoStampFinal: "DONE. UP AND RUNNING.",
      coordsTooltipTemplate: "The thread on this page follows the wind in Haugesund. Right now: {wind}.",
      wonkCaption: "we have a bit of fun at work",
      konamiStamp: "NIGHT SHIFT APPROVED ✓",
    },
  },
} as const;
