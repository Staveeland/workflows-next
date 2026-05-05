export type Lang = 'no' | 'en';

export const translations = {
  no: {
    nav: {
      services: 'Tjenester',
      process: 'Prosess',
      customers: 'Kunder',
      faq: 'FAQ',
      about: 'Om oss',
      contact: 'Ta kontakt',
    },
    hero: {
      title: 'Vi gjør hverdagen din',
      rotateWords: ['enklere', 'smartere', 'raskere', 'billigere'],
      sub: 'Haugesund-basert AI- og softwareutviklingsselskap som bygger smarte agenter, kunstig intelligens og skreddersydde systemer — slik at du kan fokusere på det som faktisk betyr noe.',
      cta: 'Book en gratis prat',
      ctaSecondary: 'Se hva vi gjør',
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
      s1Label: 'mindre tid på repeterende oppgaver',
      s2Label: 'norske bedrifter bruker systemene våre daglig',
      s3Label: 'systemene jobber — også når du ikke gjør det',
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
    app: {
      tag: 'Vår egen app',
      heading: 'Prøv vår AI-stylist',
      lead: 'MyStyler er vår egenutviklede iOS-app — en personlig AI-stylist du kan ha i lommen. Last opp to bilder, beskriv anledningen, og få fire fotorealistiske antrekk som faktisk ser ut som deg.',
      sub: 'Middag i Paris. Jobbintervju. Strandbryllup. Første dag tilbake på kontoret. Uansett hva du skriver inn, kler MyStyler deg opp for det — uten å miste ansiktet, hårfargen eller proporsjonene dine.',
      features: [
        'Beskriv hvilken som helst anledning på vanlig norsk eller engelsk',
        'Garderobe-modus: ta bilde av klærne du allerede eier',
        'Lagre favorittene i ditt eget stilbibliotek',
        'Generer hele antrekk eller hår + sminke-looks',
      ],
      cta: 'Last ned i App Store',
      platform: 'Tilgjengelig for iPhone',
    },
    faq: {
      tag: 'FAQ',
      heading: 'Ofte stilte spørsmål',
      categories: [
        {
          category: 'Om tjenestene',
          questions: [
            { q: 'Hva slags bedrifter jobber dere med?', a: 'Vi jobber med bedrifter i alle størrelser — fra småbedrifter med 5 ansatte til større selskaper med hundrevis. Fellesnevneren er at de har manuelle prosesser som tar for mye tid. Vi har erfaring fra bransjer som subsea, forskning, eiendom, handel og tjenesteyting.' },
            { q: 'Hva er skreddersydd software?', a: 'Skreddersydd software er programvare bygget spesifikt for din bedrift og dine prosesser. I motsetning til hyllevare som Salesforce eller HubSpot, får du et system som passer perfekt til måten du jobber på — uten unødvendige funksjoner eller begrensninger.' },
            { q: 'Hva er en digital assistent?', a: 'En digital assistent er et AI-drevet system som kan håndtere oppgaver som kundeservice, oppfølging, rapportering eller databehandling — automatisk og døgnets alle timer. Tenk på det som en kollega som aldri sover, aldri glemmer, og aldri gjør slurve-feil.' },
            { q: 'Kan dere integrere med systemene vi allerede bruker?', a: 'Ja. Vi spesialiserer oss på å koble sammen eksisterende verktøy. Enten du bruker Tripletex, Visma, Microsoft 365, Google Workspace, Slack eller bransjespesifikke systemer — vi bygger broer mellom dem slik at data flyter automatisk.' },
            { q: 'Trenger vi teknisk kompetanse internt?', a: 'Nei. Vi bygger systemer som er enkle å bruke for alle. Du trenger ikke forstå teknologien — bare resultatene. Vi tar oss av alt det tekniske, og gir grundig opplæring når systemet er klart.' },
          ],
        },
        {
          category: 'Pris og prosess',
          questions: [
            { q: 'Hva koster det?', a: 'Prisen avhenger av prosjektets omfang og størrelse. Vi gir alltid et fast pristilbud etter en uforpliktende første samtale — slik at du vet nøyaktig hva du betaler før du bestemmer deg.' },
            { q: 'Hvor lang tid tar det?', a: 'De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser deg demoer underveis slik at du kan gi tilbakemeldinger tidlig.' },
            { q: 'Hva skjer etter lansering?', a: 'Vi tilbyr support og vedlikehold så lenge du trenger det. Alle systemer leveres med dokumentasjon og opplæring. Hvis noe trenger justering eller du vil legge til nye funksjoner senere, er vi tilgjengelige.' },
            { q: 'Er den første samtalen virkelig gratis?', a: 'Ja, helt gratis og uforpliktende. Vi setter oss ned (fysisk eller digitalt) og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre — uten noen forpliktelser.' },
          ],
        },
        {
          category: 'Teknologi og sikkerhet',
          questions: [
            { q: 'Er dataene våre trygge?', a: 'Absolutt. Vi følger beste praksis for datasikkerhet og personvern. Alle systemer bygges med kryptering, tilgangskontroll og sikker hosting. Vi er kjent med GDPR-kravene og sørger for at løsningene er i samsvar med norske og europeiske regelverk.' },
            { q: 'Bruker dere kunstig intelligens (AI)?', a: 'Ja, der det gir verdi. Vi bruker AI for oppgaver som tekstforståelse, automatisk kategorisering, chatboter og dataanalyse. Men vi bruker det ikke bare for å være hippe — AI er et verktøy, og vi bruker det kun når det faktisk løser et problem bedre enn alternativene.' },
            { q: 'Kan systemet skalere når vi vokser?', a: 'Ja. Vi bygger med skalering i tankene fra dag én. Enten du dobler antall ansatte, får ti ganger så mange kunder, eller ekspanderer til nye markeder — systemene våre vokser med deg uten at du trenger å bygge på nytt.' },
          ],
        },
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
        ai: 'Kunstig intelligens',
        software: 'Softwareutvikling',
        cases: 'Kundecaser',
        faq: 'Ofte stilte spørsmål',
      },
      based: 'Basert på Haugalandet, Norge',
    },
  },
  en: {
    nav: {
      services: 'Services',
      process: 'Process',
      customers: 'Clients',
      faq: 'FAQ',
      about: 'About us',
      contact: 'Get in touch',
    },
    hero: {
      title: 'We make your workday',
      rotateWords: ['simpler', 'smarter', 'faster', 'more affordable'],
      sub: 'Haugesund-based AI and software development company building intelligent agents, artificial intelligence, and custom systems — so you can focus on what actually matters.',
      cta: 'Book a free call',
      ctaSecondary: 'See what we do',
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
      s1Label: 'less time on repetitive tasks',
      s2Label: 'Norwegian companies use our systems daily',
      s3Label: 'systems work — even when you don\'t',
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
    app: {
      tag: 'Our app',
      heading: 'Try our AI stylist',
      lead: 'MyStyler is our own iOS app — a personal AI stylist you can have in your pocket. Upload two photos, describe the occasion, and get four photorealistic outfits that actually look like you.',
      sub: 'Dinner in Paris. Job interview. Beach wedding. First day back at the office. Whatever you type in, MyStyler dresses you for it — without losing your face, hair color, or proportions.',
      features: [
        'Describe any occasion in plain English or Norwegian',
        'Wardrobe mode: take photos of the clothes you already own',
        'Save favorites to your own style library',
        'Generate full outfits or hair + makeup looks',
      ],
      cta: 'Download on App Store',
      platform: 'Available for iPhone',
    },
    faq: {
      tag: 'FAQ',
      heading: 'Frequently asked questions',
      categories: [
        {
          category: 'About our services',
          questions: [
            { q: 'What kinds of businesses do you work with?', a: 'We work with businesses of all sizes — from small companies with 5 employees to larger ones with hundreds. The common thread is that they have manual processes that take too much time. We have experience in industries such as subsea, research, real estate, retail, and services.' },
            { q: 'What is custom software?', a: 'Custom software is software built specifically for your business and processes. Unlike off-the-shelf products like Salesforce or HubSpot, you get a system that fits perfectly with how you work — without unnecessary features or limitations.' },
            { q: 'What is a digital assistant?', a: "A digital assistant is an AI-powered system that can handle tasks like customer service, follow-up, reporting, or data processing — automatically and around the clock. Think of it as a colleague who never sleeps, never forgets, and never makes careless mistakes." },
            { q: 'Can you integrate with the systems we already use?', a: 'Yes. We specialize in connecting existing tools. Whether you use Tripletex, Visma, Microsoft 365, Google Workspace, Slack, or industry-specific systems — we build bridges between them so data flows automatically.' },
            { q: 'Do we need technical expertise internally?', a: "No. We build systems that are easy for everyone to use. You don't need to understand the technology — just the results. We handle all the technical aspects and provide thorough training when the system is ready." },
          ],
        },
        {
          category: 'Price and process',
          questions: [
            { q: 'What does it cost?', a: "The price depends on the scope and size of the project. We always provide a fixed quote after a non-binding initial conversation — so you know exactly what you'll pay before you decide." },
            { q: 'How long does it take?', a: 'Most projects are delivered within 4–12 weeks. Simple automations can be ready in under two weeks. You see progress from week one — we show you demos along the way so you can give early feedback.' },
            { q: 'What happens after launch?', a: "We offer support and maintenance for as long as you need it. All systems come with documentation and training. If something needs adjustment or you want to add new features later, we're available." },
            { q: 'Is the first conversation really free?', a: 'Yes, completely free and non-binding. We sit down (physically or digitally) and listen to your challenges. After the conversation, you get a concrete proposal for what we can do — with no obligations.' },
          ],
        },
        {
          category: 'Technology and security',
          questions: [
            { q: 'Is our data safe?', a: 'Absolutely. We follow best practices for data security and privacy. All systems are built with encryption, access control, and secure hosting. We are familiar with GDPR requirements and ensure that solutions comply with Norwegian and European regulations.' },
            { q: 'Do you use artificial intelligence (AI)?', a: "Yes, where it adds value. We use AI for tasks like text understanding, automatic categorization, chatbots, and data analysis. But we don't use it just to be trendy — AI is a tool, and we only use it when it actually solves a problem better than the alternatives." },
            { q: 'Can the system scale as we grow?', a: 'Yes. We build with scaling in mind from day one. Whether you double your staff, get ten times as many customers, or expand to new markets — our systems grow with you without needing to be rebuilt.' },
          ],
        },
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
        ai: 'Artificial intelligence',
        software: 'Software development',
        cases: 'Client cases',
        faq: 'Frequently asked questions',
      },
      based: 'Based in Haugalandet, Norway',
    },
  },
} as const;

export type Translations = typeof translations.no;
