export type Lang = 'no' | 'en';

export const translations = {
  no: {
    a11y: {
      skipToMain: 'Hopp til hovedinnhold',
      mainMenu: 'Hovedmeny',
    },
    nav: {
      services: 'Tjenester',
      process: 'Prosess',
      customers: 'Kunder',
      faq: 'FAQ',
      about: 'Om oss',
      contact: 'Ta kontakt',
      servicesMenu: {
        toggleLabel: 'Åpne tjenester-meny',
        items: [
          {
            label: 'Chatboter',
            description: 'AI-drevne chatboter som svarer kunder døgnet rundt — koblet til dine data.',
            href: '/chatboter',
            icon: 'chatbot',
          },
          {
            label: 'Automatiserte flyter',
            description: 'Systemer som kjører automatisk og fjerner repetitivt arbeid mellom verktøyene dine.',
            href: '/automatiserte-flyter',
            icon: 'flow',
          },
          {
            label: 'AI-agenter',
            description: 'Autonome agenter som planlegger, beslutter og utfører oppgaver på dine vegne.',
            href: '/ai-agenter',
            icon: 'agent',
          },
        ],
        seeAll: 'Se alle tjenester',
        seeAllHref: '/#tjenester',
      },
    },
    hero: {
      title: 'Vi bygger AI-løsninger for norske bedrifter',
      rotateWords: ['chatboter', 'automatiserte flyter', 'AI-agenter', 'skreddersydd software'],
      sub: 'Fra første samtale til ferdig løsning på 2–6 uker. Du eier koden, og første samtale er alltid gratis.',
      cta: 'Book en gratis prat',
      ctaSecondary: 'Se kundecaser',
    },
    logoStrip: {
      label: 'Brukt av bedrifter som',
    },
    levels: {
      tag: 'Hva vi bygger',
      heading: 'Tre nivåer av AI',
      sub: 'Fra enkel chatbot til autonom agent — vi bygger løsninger på alle nivåer.',
      items: [
        {
          title: 'Chatboter',
          href: '/chatboter',
          points: [
            'Den er koblet på språkmodeller og data',
            'Du snakker med den via et tilpasset chatvindu',
            'Den svarer på spørsmål basert på tilgjengelig data',
          ],
          example: 'En kundeservice-chatbot som svarer på spørsmål basert på bedriftens dokumentasjon.',
          levelLabel: 'Nivå',
        },
        {
          title: 'Automatiserte flyter',
          href: '/automatiserte-flyter',
          points: [
            'Trigges av en hendelse og følger et fast flyt',
            'Kjører automatisk uten menneskelig input',
            'AI er bakt inn i ett eller flere steg i flyten',
          ],
          example: 'Et system som automatisk leser innkommende fakturaer, trekker ut nøkkeldata, og legger det inn i regnskapssystemet.',
          levelLabel: 'Nivå',
        },
        {
          title: 'Agenter',
          href: '/ai-agenter',
          points: [
            'Får et mål og tilgang til verktøy og data',
            'Lager selv en plan og justerer underveis',
            'Tar beslutninger og utfører handlinger',
          ],
          example: 'Du sier \'lag kvartalsrapport for Q1\' og den henter tallene, analyserer trender, lager grafer, skriver sammendrag og lager en powerpoint.',
          levelLabel: 'Nivå',
        },
      ],
      footerText: 'Vi bygger på alle tre nivåene.',
      footerCta: 'Book en gratis prat',
      readMore: 'Les mer',
      think: 'Tenk:',
    },
    statement: {
      heading: 'Vi bygger det som gjør jobben for deg.',
      body: 'Uansett om du trenger en chatbot som svarer kunder, automatiserte flyter som fjerner dobbeltarbeid, eller en AI-agent som jobber for deg — vi finner ut hva som passer, og bygger det.',
    },
    stats: {
      items: [
        {
          value: '80',
          unit: '%',
          label: 'raskere rapporter — ElementLab frigjorde hundrevis av timer årlig',
          href: '/kunder/elementlab',
          cta: 'Se ElementLab-saken',
        },
        {
          value: '6',
          unit: '+',
          label: 'norske bedrifter bruker systemene våre daglig',
          href: '/kunder',
          cta: 'Se kundene våre',
        },
        {
          value: '24',
          unit: '/7',
          label: 'systemene jobber — også når du ikke gjør det',
          href: null,
          cta: null,
        },
      ],
    },
    features: {
      tag: 'Hva vi gjør',
      heading: 'Verktøy som gjør jobben for deg',
      rows: [
        {
          label: 'Automatisering',
          title: 'Slutt på kjedelig manuelt arbeid',
          body: 'Vi setter opp systemer som gjør de repeterende oppgavene automatisk. Rapporter lager seg selv. Kunder får svar med en gang. Data flyter mellom systemene dine uten at noen trenger å løfte en finger.',
          items: [
            'Automatiske rapporter og oppdateringer',
            'Svar kunder døgnets rundt',
            'Koble sammen alle verktøyene dine',
            'Kutt ut dobbeltarbeid for godt',
          ],
        },
        {
          label: 'AI-assistent',
          title: 'Din digitale medarbeider',
          body1: 'En smart assistent som svarer kunder, sorterer henvendelser og følger opp — akkurat som en ekte kollega, bare raskere og tilgjengelig døgnets rundt.',
          body2: 'Den lærer bedriften din å kjenne, og blir bedre over tid. Du bestemmer hva den skal gjøre, og vi sørger for at den gjør det riktig.',
          items: [
            'Svarer kunder på sekunder',
            'Sorterer og videresender henvendelser',
            'Følger opp automatisk',
            'Tilgjengelig 24/7, hele året',
          ],
        },
        {
          label: 'Skreddersydd software',
          title: 'Bygget for akkurat din bedrift',
          body1: 'Trenger du et system som ikke finnes? Vi bygger det. Tilpasset din bedrift, dine behov, dine prosesser — ingen kompromisser, ingen unødvendige funksjoner.',
          body2: 'Alt fra interne verktøy og kundeportaler til komplette forretningssystemer.',
          items: [
            'Skreddersydd til dine prosesser',
            'Søkbare kunnskapsbaser',
            'Rapporter som lager seg selv',
            'Vokser med bedriften din',
          ],
        },
      ],
    },
    midCta: {
      cta: 'Book en gratis prat',
      text2: 'Vil du se hva vi kan gjøre for din bedrift?',
    },
    process: {
      tag: 'Slik jobber vi',
      heading: 'Fra idé til ferdig system på noen uker',
      steps: [
        {
          title: 'Vi snakker sammen',
          desc: 'Du forteller oss hva som tar for mye tid i hverdagen. Vi lytter, stiller spørsmål, og finner ut hva vi kan lage for deg. Ingen teknisk sjargong — bare en vanlig samtale.',
          label: 'Gratis og uforpliktende',
        },
        {
          title: 'Vi bygger det',
          desc: 'Du ser fremgang fra første uke. Vi viser deg hva vi lager underveis, og du gir tilbakemeldinger. Ingen overraskelser når vi er ferdige.',
          label: 'Du er med hele veien',
        },
        {
          title: 'Det bare fungerer',
          desc: 'Systemet er klart. Vi lærer deg å bruke det, og vi er her hvis noe trengs. Dine ansatte sparer tid fra dag én.',
          label: 'Opplæring inkludert',
        },
      ],
    },
    results: {
      tag: 'Resultater',
      heading: 'Hva kundene våre faktisk opplever',
      items: [
        { title: 'Mer tid til det viktige', desc: 'Ansatte slipper å bruke timer på kopiering, rapporter og oppfølging. De får tiden tilbake til det de faktisk er gode på.' },
        { title: 'Færre feil', desc: 'Maskiner gjør ikke slurve-feil. Når data flyter automatisk, blir alt mer nøyaktig og pålitelig.' },
        { title: 'Fornøyde kunder', desc: 'Kunder får raskere svar, bedre oppfølging, og slipper å vente. Det merkes.' },
        { title: 'Vekst uten stress', desc: 'Digitale systemer vokser med bedriften din. Du kan ta på deg mer uten å måtte ansette flere.' },
      ],
    },
    about: {
      tag: 'Om oss',
      heading: 'Teknologi skal være enkelt',
      body1: 'Workflows er et AI- og softwareutviklingsselskap i Haugesund. Vi bygger kunstig intelligens, smarte agenter og skreddersatt programvare for bedrifter på Haugalandet og i resten av Norge. Du trenger ikke forstå programutvikling eller maskinlæring — det er vår jobb.',
      body2: 'Din jobb er å fortelle oss hva som tar for mye tid. Vår jobb er å fikse det.',
      values: [
        ['Null sjargong', 'Vi snakker norsk, ikke data-norsk. Du skal forstå alt vi sier og gjør.'],
        ['Du ser resultater fort', 'Ingen månedslange prosjekter i mørket. Du ser fremgang fra uke én.'],
        ['Du eier alt', 'Koden er din. Systemet er ditt. Ingen innlåsing, ingen skjulte avgifter.'],
      ],
    },
    partners: {
      label: 'Vi bygger med teknologi fra',
    },
    clientsSection: {
      tag: 'Kunder',
      heading: 'Se hva vi har bygget for andre',
      sub: 'Ekte bedrifter med ekte resultater. Klikk for å lese hele historien.',
      readMore: 'Les hele casen',
      clients: [
        { name: 'CSUB', logo: '/kunder-csub.svg', slug: 'csub', desc: 'Samlet dashboard for prosjektdata som tidligere lå spredt i Excel-filer. RAG-system med AI-assistent for søk, statistikk og rapporter — pluss delegering av prosjekter til ansatte.' },
        { name: 'Festiviteten', logo: '/kunder-festiviteten.png', slug: 'festiviteten', desc: 'AI som overvåker billettsalg og annonser på Meta, Google og radio i sanntid. Personlige AI-assistenter rådgir 24/7 og varsler ved svakt salg.' },
        { name: 'ElementLab', logo: '/kunder-elementlab.png', slug: 'elementlab', desc: 'Søkbar kunnskapsbase som erstatter manuell leting. 80% raskere rapporter — frigjør hundrevis av timer årlig.' },
      ],
    },
    faq: {
      tag: 'FAQ',
      heading: 'Ofte stilte spørsmål',
      seeAllLabel: 'Se alle vanlige spørsmål',
      seeAllHref: '/faq',
      featured: [
        { q: 'Hva koster det?', a: 'Prisen avhenger av prosjektets omfang og størrelse. Vi gir alltid et fast pristilbud etter en uforpliktende første samtale — slik at du vet nøyaktig hva du betaler før du bestemmer deg.' },
        { q: 'Hvor lang tid tar det?', a: 'De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser deg demoer underveis slik at du kan gi tilbakemeldinger tidlig.' },
        { q: 'Eier vi koden og systemet?', a: 'Ja, alltid. Du eier alt vi bygger for deg — kildekode, design, data. Det er ingen innlåsing og ingen skjulte kostnader. Hvis du en dag vil bytte leverandør eller ta over driften selv, har du full frihet til det.' },
        { q: 'Er dataene våre trygge?', a: 'Absolutt. Vi følger beste praksis for datasikkerhet og personvern. Alle systemer bygges med kryptering, tilgangskontroll og sikker hosting. Vi er kjent med GDPR-kravene og sørger for at løsningene er i samsvar med norske og europeiske regelverk.' },
        { q: 'Er den første samtalen virkelig gratis?', a: 'Ja, helt gratis og uforpliktende. Vi setter oss ned (fysisk eller digitalt) og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre — uten noen forpliktelser.' },
      ],
    },
    contact: {
      tag: 'Kontakt',
      heading: 'La oss snakke sammen',
      body: 'Send oss en e-post eller ring. Vi svarer raskt, og første samtale er alltid gratis. Workflows holder til i Haugesund og jobber med bedrifter over hele Norge.',
      role: 'Daglig leder',
    },
    footer: {
      brand: 'Skreddersydd software, digitale assistenter og automatiserte systemer for norske bedrifter.',
      company: 'Selskap',
      services: 'Tjenester',
      resources: 'Ressurser',
      clients: 'Kunder',
      links: {
        services: 'Tjenester',
        process: 'Prosess',
        about: 'Om oss',
        contact: 'Kontakt',
        aiHaugesund: 'AI i Haugesund',
        aiAgents: 'AI-agenter',
        chatbots: 'Chatboter',
        automatedFlows: 'Automatiserte flyter',
        cases: 'Kundecaser',
        faq: 'Ofte stilte spørsmål',
        mystyler: 'MyStyler — vår AI-stylist',
      },
      based: 'Basert på Haugalandet, Norge',
    },
  },
  en: {
    a11y: {
      skipToMain: 'Skip to main content',
      mainMenu: 'Main menu',
    },
    nav: {
      services: 'Services',
      process: 'Process',
      customers: 'Clients',
      faq: 'FAQ',
      about: 'About us',
      contact: 'Get in touch',
      servicesMenu: {
        toggleLabel: 'Open services menu',
        items: [
          {
            label: 'Chatbots',
            description: 'AI chatbots that answer customers around the clock — connected to your data.',
            href: '/chatboter',
            icon: 'chatbot',
          },
          {
            label: 'Automated flows',
            description: 'Systems that run automatically and remove repetitive work between your tools.',
            href: '/automatiserte-flyter',
            icon: 'flow',
          },
          {
            label: 'AI agents',
            description: 'Autonomous agents that plan, decide, and act on your behalf.',
            href: '/ai-agenter',
            icon: 'agent',
          },
        ],
        seeAll: 'See all services',
        seeAllHref: '/#tjenester',
      },
    },
    hero: {
      title: 'We build AI solutions for Norwegian businesses',
      rotateWords: ['chatbots', 'automated flows', 'AI agents', 'custom software'],
      sub: 'From first conversation to finished solution in 2–6 weeks. You own the code, and the first call is always free.',
      cta: 'Book a free call',
      ctaSecondary: 'See client cases',
    },
    logoStrip: {
      label: 'Trusted by companies like',
    },
    levels: {
      tag: 'What we build',
      heading: 'Three levels of AI',
      sub: 'From simple chatbot to autonomous agent — we build solutions at every level.',
      items: [
        {
          title: 'Chatbots',
          href: '/chatboter',
          points: [
            'Connected to language models and your data',
            'You interact through a custom chat window',
            'It answers questions based on available data',
          ],
          example: 'A customer service chatbot that answers questions based on your company documentation.',
          levelLabel: 'Level',
        },
        {
          title: 'Automated flows',
          href: '/automatiserte-flyter',
          points: [
            'Triggered by an event and follows a fixed flow',
            'Runs automatically without human input',
            'AI is embedded in one or more steps of the flow',
          ],
          example: 'A system that automatically reads incoming invoices, extracts key data, and enters it into the accounting system.',
          levelLabel: 'Level',
        },
        {
          title: 'Agents',
          href: '/ai-agenter',
          points: [
            'Given a goal and access to tools and data',
            'Creates its own plan and adjusts along the way',
            'Makes decisions and takes actions',
          ],
          example: "You say 'create Q1 quarterly report' and it fetches the numbers, analyzes trends, creates charts, writes a summary, and produces a PowerPoint.",
          levelLabel: 'Level',
        },
      ],
      footerText: 'We build at all three levels.',
      footerCta: 'Book a free call',
      readMore: 'Read more',
      think: 'Think:',
    },
    statement: {
      heading: 'We build what does the work for you.',
      body: "Whether you need a chatbot that answers customers, automated flows that eliminate duplicate work, or an AI agent that works for you — we figure out what fits, and build it.",
    },
    stats: {
      items: [
        {
          value: '80',
          unit: '%',
          label: 'faster reports — ElementLab freed hundreds of hours annually',
          href: '/kunder/elementlab',
          cta: 'See the ElementLab case',
        },
        {
          value: '6',
          unit: '+',
          label: 'Norwegian companies use our systems daily',
          href: '/kunder',
          cta: 'See our clients',
        },
        {
          value: '24',
          unit: '/7',
          label: "systems run — even when you don't",
          href: null,
          cta: null,
        },
      ],
    },
    features: {
      tag: 'What we do',
      heading: 'Tools that do the work for you',
      rows: [
        {
          label: 'Automation',
          title: 'No more tedious manual work',
          body: 'We set up systems that handle repetitive tasks automatically. Reports write themselves. Customers get immediate responses. Data flows between your systems without anyone needing to lift a finger.',
          items: [
            'Automatic reports and updates',
            'Answer customers around the clock',
            'Connect all your tools',
            'Cut out double work for good',
          ],
        },
        {
          label: 'AI assistant',
          title: 'Your digital coworker',
          body1: 'A smart assistant that answers customers, sorts requests, and follows up — just like a real colleague, but faster and available around the clock.',
          body2: 'It gets to know your business and improves over time. You decide what it should do, and we make sure it does it right.',
          items: [
            'Responds to customers in seconds',
            'Sorts and forwards requests',
            'Follows up automatically',
            'Available 24/7, year-round',
          ],
        },
        {
          label: 'Custom software',
          title: 'Built for exactly your business',
          body1: "Need a system that doesn't exist yet? We build it. Tailored to your company, your needs, your processes — no compromises, no unnecessary features.",
          body2: 'From internal tools and customer portals to complete business systems.',
          items: [
            'Tailored to your processes',
            'Searchable knowledge bases',
            'Reports that write themselves',
            'Grows with your business',
          ],
        },
      ],
    },
    midCta: {
      cta: 'Book a free call',
      text2: 'Want to see what we can do for your business?',
    },
    process: {
      tag: 'How we work',
      heading: 'From idea to finished system in weeks',
      steps: [
        {
          title: 'We talk',
          desc: 'You tell us what takes too much time in your day. We listen, ask questions, and figure out what we can build for you. No technical jargon — just a normal conversation.',
          label: 'Free and non-binding',
        },
        {
          title: 'We build it',
          desc: 'You see progress from the first week. We show you what we\'re building along the way, and you give feedback. No surprises when we\'re done.',
          label: 'You\'re involved throughout',
        },
        {
          title: 'It just works',
          desc: 'The system is ready. We teach you how to use it, and we\'re here if anything is needed. Your employees save time from day one.',
          label: 'Training included',
        },
      ],
    },
    results: {
      tag: 'Results',
      heading: 'What our clients actually experience',
      items: [
        { title: 'More time for what matters', desc: 'Employees stop spending hours copying, reporting, and following up. They get their time back for what they\'re actually good at.' },
        { title: 'Fewer errors', desc: "Machines don't make careless mistakes. When data flows automatically, everything becomes more accurate and reliable." },
        { title: 'Happy customers', desc: 'Customers get faster responses, better follow-up, and don\'t have to wait. It shows.' },
        { title: 'Growth without stress', desc: 'Digital systems grow with your business. You can take on more without needing to hire more people.' },
      ],
    },
    about: {
      tag: 'About us',
      heading: 'Technology should be simple',
      body1: "Workflows is an AI and software development company in Haugesund. We build artificial intelligence, intelligent agents, and custom software for businesses on Haugalandet and the rest of Norway. You don't need to understand software development or machine learning — that's our job.",
      body2: 'Your job is to tell us what takes too much time. Our job is to fix it.',
      values: [
        ['Zero jargon', "We speak plain English, not tech-speak. You should understand everything we say and do."],
        ['You see results fast', 'No month-long projects in the dark. You see progress from week one.'],
        ['You own everything', 'The code is yours. The system is yours. No lock-in, no hidden fees.'],
      ],
    },
    partners: {
      label: 'We build with technology from',
    },
    clientsSection: {
      tag: 'Clients',
      heading: "See what we've built for others",
      sub: 'Real businesses with real results. Click to read the full story.',
      readMore: 'Read the full case',
      clients: [
        { name: 'CSUB', logo: '/kunder-csub.svg', slug: 'csub', desc: 'Unified dashboard for project data previously spread across Excel files. RAG system with AI assistant for search, statistics and reports — plus delegation of projects to employees.' },
        { name: 'Festiviteten', logo: '/kunder-festiviteten.png', slug: 'festiviteten', desc: 'AI monitoring ticket sales and ads on Meta, Google, and radio in real-time. Personal AI assistants advise 24/7 and alert when sales are weak.' },
        { name: 'ElementLab', logo: '/kunder-elementlab.png', slug: 'elementlab', desc: 'Searchable knowledge base replacing manual searching. Reports 80% faster — freeing up hundreds of hours annually.' },
      ],
    },
    faq: {
      tag: 'FAQ',
      heading: 'Frequently asked questions',
      seeAllLabel: 'See all FAQs',
      seeAllHref: '/faq',
      featured: [
        { q: 'What does it cost?', a: "The price depends on the scope and size of the project. We always provide a fixed quote after a non-binding initial conversation — so you know exactly what you'll pay before you decide." },
        { q: 'How long does it take?', a: 'Most projects are delivered within 4–12 weeks. Simple automations can be ready in under two weeks. You see progress from week one — we show you demos along the way so you can give early feedback.' },
        { q: 'Do we own the code and the system?', a: 'Yes, always. You own everything we build for you — source code, design, data. There is no lock-in and no hidden costs. If you ever want to switch vendors or take over operations yourself, you have full freedom to do so.' },
        { q: 'Is our data safe?', a: 'Absolutely. We follow best practices for data security and privacy. All systems are built with encryption, access control, and secure hosting. We are familiar with GDPR requirements and ensure that solutions comply with Norwegian and European regulations.' },
        { q: 'Is the first conversation really free?', a: 'Yes, completely free and non-binding. We sit down (physically or digitally) and listen to your challenges. After the conversation, you get a concrete proposal for what we can do — with no obligations.' },
      ],
    },
    contact: {
      tag: 'Contact',
      heading: "Let's talk",
      body: 'Send us an email or call. We respond quickly, and the first conversation is always free. Workflows is based in Haugesund and works with businesses across Norway.',
      role: 'CEO',
    },
    footer: {
      brand: 'Custom software, digital assistants, and automated systems for Norwegian businesses.',
      company: 'Company',
      services: 'Services',
      resources: 'Resources',
      clients: 'Clients',
      links: {
        services: 'Services',
        process: 'Process',
        about: 'About us',
        contact: 'Contact',
        aiHaugesund: 'AI in Haugesund',
        aiAgents: 'AI agents',
        chatbots: 'Chatbots',
        automatedFlows: 'Automated flows',
        cases: 'Client cases',
        faq: 'Frequently asked questions',
        mystyler: 'MyStyler — our AI stylist',
      },
      based: 'Based in Haugalandet, Norway',
    },
  },
} as const;

export type Translations = typeof translations.no;
