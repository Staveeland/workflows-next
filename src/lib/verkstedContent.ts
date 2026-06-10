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
    body: string;
    footnote: string;
    linkLabel: string;
    linkHref: string;
  };
  folkene: {
    kicker: string;
    heading: string;
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
    ctaStamp: string;
    cta: string;
    emailLabel: string;
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
      sub: "Chatboter, automatiseringer og AI-agenter for norske bedrifter. Bygget i Haugesund på 2–6 uker. Du eier alt.",
      cta: "Book en gratis prat",
      proof: "6+ norske bedrifter bruker systemene våre hver dag.",
      chalk: "dette er innboksen din ↑",
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
          benefit: "En chatbot som svarer kundene på norsk — også klokka tre om natta.",
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
          benefit: "Rutinejobbene gjør seg selv: fra innboks til ferdig rapport uten at noen rører et tastatur.",
          proof: "ElementLab: 80 % raskere rapporter, hundrevis av timer frigjort i året.",
          href: "/automatiserte-flyter",
          vignette: { pipeline: ["innboks", "hentet", "behandlet", "levert"] },
        },
        {
          id: "agenter",
          stamp: "PÅ NATTEVAKT",
          title: "AI-agenter",
          benefit: "En agent som følger med døgnet rundt — og sier fra før små avvik blir dyre.",
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
          benefit: "Passer ikke hyllevaren, bygger vi verktøyet rundt måten dere faktisk jobber på.",
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
        { n: 6, log: "nøklene er dine — repo, kode, data" },
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
        lead: "Prosjektdata lå spredt i Excel-ark. Nå ligger alt i ett dashbord.",
        body: "RAG-assistenten på toppen svarer på spørsmål, finner statistikk og lager rapporter — rett fra deres egne dokumenter. Ingen leting, bare svar.",
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
        lead: "Et historisk teater med en nattevakt som aldri blunker. AI-en følger billettsalg og annonser på Meta, Google og radio — i sanntid.",
        body: "Svikter salget for en forestilling, kommer varselet med en gang. Scenen får oppmerksomheten — systemet tar tallene.",
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
        lead: "Hundrevis av timer frigjort — hvert år.",
        body: "Flyten henter tallene, bygger rapporten og legger den klar. Timene går tilbake til arbeid som trenger et menneske.",
        stamp: "TIMER FRIGJORT",
        chalk: "ekte tall — vi har målt",
        statValue: "80%",
        statLabel: "raskere rapporter",
        monoLine: "rapport bygget → levert · neste i kø",
        href: "/kunder/elementlab",
      },
    ],
    eierskap: {
      kicker: "Skjøtet",
      heading: "Du eier alt — svart på hvitt.",
      stamps: ["KODEN: DIN", "DATAENE: DINE", "REPOET: DITT"],
      body: "Når vi leverer, er alt ditt: kode, design, data. Vil du bytte oss ut i morgen, kan du det — alt ligger allerede hos deg.",
      footnote: "Ingen lisenser. Ingen bindingstid. Ingen data-norsk i kontrakten heller.",
      linkLabel: "Se overleveringen — uke for uke",
      linkHref: "#prosess",
    },
    folkene: {
      kicker: "Folkene",
      heading: "Haugesund, etter stengetid",
      body: "Workflows ble startet i Haugesund i 2024. Ingen selgere her — du snakker med han som bygger.",
      osloLine: "Vi er ikke et byrå i Oslo med pitch-deck. Vi er et verksted i Haugesund med lys i vinduet.",
      nameStory: "Leia utenfor kontoret vårt ga Norge navn. Vi bygger nye veier for arbeid — fra Haugesund.",
      coordinates: "59.4138° N, 5.2679° Ø",
      person: { name: "Petter Staveland", role: "Grunnlegger og daglig leder", initials: "PS" },
      values: [
        ["Vis, ikke fortell", "Synlig fremdrift fra uke én. Du ser hva vi bygger mens vi bygger det."],
        ["Ditt, helt ditt", "Kode, design og data er dine. Ingen bindingstid, ingen innlåsing."],
        ["Norsk og nær", "Bygget for norske bedrifter, på norsk, med GDPR i bakhodet fra første linje."],
      ],
    },
    kontakt: {
      kicker: "Tråden ender her",
      heading: "Den første praten er gratis.",
      disarm: "Som regel vet du etter 30 minutter om dette er noe for dere.",
      proof: "ElementLab sparte hundrevis av timer i året. Praten som startet det kostet ingenting.",
      mono: "svar innen én arbeidsdag",
      ctaStamp: "FØRSTE PRAT: GRATIS",
      cta: "Book en gratis prat",
      emailLabel: "Skriv når det passer",
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
    eggs: {
      consoleArt:
        "┌──────────────────────────────┐\n│  WORKFLOWS — VERKSTEDET      │\n│  lyset er på · Haugesund     │\n├──────────────────────────────┤\n│  kaos inn ─────────→ flyt ut │\n└──┬────────────────────────┬──┘\n   │                        │\n\nHei! Du titter i konsollen — det gjør vi også.\nVi har til og med skrevet /llms.txt for agentene dine.\nMennesker booker gratis prat på workflows.no/#kontakt.",
      kaffeToast: "Den første praten tar vi gjerne over en kaffe. Den er gratis.",
      logoStampFinal: "FERDIG. DU EIER ALT.",
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
      sub: "Chatbots, automations and AI agents for Norwegian businesses. Built in Haugesund in 2–6 weeks. You own everything.",
      cta: "Book a free chat",
      proof: "6+ Norwegian companies use our systems every day.",
      chalk: "this is your inbox ↑",
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
          benefit: "A chatbot that answers your customers in Norwegian — even at three in the morning.",
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
          benefit: "Routine jobs run themselves: from inbox to finished report without anyone touching a keyboard.",
          proof: "ElementLab: 80% faster reports, hundreds of hours freed up every year.",
          href: "/automatiserte-flyter",
          vignette: { pipeline: ["inbox", "fetched", "processed", "delivered"] },
        },
        {
          id: "agenter",
          stamp: "ON NIGHT WATCH",
          title: "AI agents",
          benefit: "An agent that keeps watch around the clock — and speaks up before small problems become expensive ones.",
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
          benefit: "When off-the-shelf doesn't fit, we build the tool around the way you actually work.",
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
        { n: 6, log: "the keys are yours — repo, code, data" },
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
        lead: "Project data was scattered across Excel sheets. Now it all lives in one dashboard.",
        body: "The RAG assistant on top answers questions, digs out statistics and builds reports — straight from their own documents. No hunting, just answers.",
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
        lead: "A historic theatre with a night watchman who never blinks. The AI tracks ticket sales and ads across Meta, Google and radio — in real time.",
        body: "If a show is selling slowly, the alert lands straight away. The stage gets the attention — the system minds the numbers.",
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
        lead: "Hundreds of hours freed up — every year.",
        body: "The workflow pulls the numbers, builds the report and leaves it ready. The hours go back to work that needs a human.",
        stamp: "HOURS RECLAIMED",
        chalk: "real numbers — we measured",
        statValue: "80%",
        statLabel: "faster reports",
        monoLine: "report built → delivered · next in queue",
        href: "/kunder/elementlab",
      },
    ],
    eierskap: {
      kicker: "The deed",
      heading: "You own everything — in black and white.",
      stamps: ["THE CODE: YOURS", "THE DATA: YOURS", "THE REPO: YOURS"],
      body: "When we hand over, it's all yours: code, design, data. Want to swap us out tomorrow? Go ahead — everything already lives with you.",
      footnote: "No licences. No lock-in. No corporate-speak in the contract either.",
      linkLabel: "See the handover — week by week",
      linkHref: "#prosess",
    },
    folkene: {
      kicker: "The people",
      heading: "Haugesund, after closing time",
      body: "Workflows was founded in Haugesund in 2024. No salespeople here — you talk to the person who builds it.",
      osloLine: "We're not an Oslo agency with a pitch deck. We're a workshop in Haugesund with the light still on.",
      nameStory: "The sea lane outside our office gave Norway its name. We're building new ways to work — from Haugesund.",
      coordinates: "59.4138° N, 5.2679° E",
      person: { name: "Petter Staveland", role: "Founder and managing director", initials: "PS" },
      values: [
        ["Show, don't tell", "Visible progress from week one. You see what we're building while we build it."],
        ["Yours, all yours", "Code, design and data belong to you. No lock-in, no minimum term."],
        ["Norwegian to the core", "Built for Norwegian businesses, in Norwegian, with GDPR in mind from the first line."],
      ],
    },
    kontakt: {
      kicker: "The thread ends here",
      heading: "The first chat is free.",
      disarm: "As a rule, you'll know within 30 minutes whether this is for you.",
      proof: "ElementLab saved hundreds of hours a year. The chat that started it cost nothing.",
      mono: "reply within one working day",
      ctaStamp: "FIRST CHAT: FREE",
      cta: "Book a free chat",
      emailLabel: "Write when it suits you",
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
    eggs: {
      consoleArt:
        "┌──────────────────────────────┐\n│  WORKFLOWS — THE WORKSHOP    │\n│  the light is on · Haugesund │\n├──────────────────────────────┤\n│  chaos in ────────→ flow out │\n└──┬────────────────────────┬──┘\n   │                        │\n\nHi! You're peeking into the console — we do too.\nWe even wrote /llms.txt for your agents.\nHumans book a free chat at workflows.no/#kontakt.",
      kaffeToast: "We'd gladly take that first chat over a coffee. It's free.",
      logoStampFinal: "DONE. YOU OWN EVERYTHING.",
      coordsTooltipTemplate: "The thread on this page follows the wind in Haugesund. Right now: {wind}.",
      wonkCaption: "we have a bit of fun at work",
      konamiStamp: "NIGHT SHIFT APPROVED ✓",
    },
  },
} as const;
