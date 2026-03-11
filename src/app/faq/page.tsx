import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ofte stilte spørsmål (FAQ)",
  description: "Svar på vanlige spørsmål om skreddersydd software, automatisering, digitale assistenter, priser og prosess. Workflows hjelper norske bedrifter med smartere systemer.",
  keywords: [
    "automatisering spørsmål", "skreddersydd software pris", "hva koster automatisering",
    "digital assistent bedrift", "systemintegrasjon Norge", "AI for bedrifter",
    "automatisering småbedrift", "Workflows FAQ", "kunstig intelligens norsk bedrift",
    "spare tid med automatisering", "erstatte manuelt arbeid",
  ],
};

const faqs = [
  {
    category: "Om tjenestene",
    questions: [
      {
        q: "Hva slags bedrifter jobber dere med?",
        a: "Vi jobber med bedrifter i alle størrelser — fra småbedrifter med 5 ansatte til større selskaper med hundrevis. Fellesnevneren er at de har manuelle prosesser som tar for mye tid. Vi har erfaring fra bransjer som subsea, forskning, eiendom, handel og tjenesteyting.",
      },
      {
        q: "Hva er skreddersydd software?",
        a: "Skreddersydd software er programvare bygget spesifikt for din bedrift og dine prosesser. I motsetning til hyllevare som Salesforce eller HubSpot, får du et system som passer perfekt til måten du jobber på — uten unødvendige funksjoner eller begrensninger.",
      },
      {
        q: "Hva er en digital assistent?",
        a: "En digital assistent er et AI-drevet system som kan håndtere oppgaver som kundeservice, oppfølging, rapportering eller databehandling — automatisk og døgnets alle timer. Tenk på det som en kollega som aldri sover, aldri glemmer, og aldri gjør slurve-feil.",
      },
      {
        q: "Kan dere integrere med systemene vi allerede bruker?",
        a: "Ja. Vi spesialiserer oss på å koble sammen eksisterende verktøy. Enten du bruker Tripletex, Visma, Microsoft 365, Google Workspace, Slack eller bransjespesifikke systemer — vi bygger broer mellom dem slik at data flyter automatisk.",
      },
      {
        q: "Trenger vi teknisk kompetanse internt?",
        a: "Nei. Vi bygger systemer som er enkle å bruke for alle. Du trenger ikke forstå teknologien — bare resultatene. Vi tar oss av alt det tekniske, og gir grundig opplæring når systemet er klart.",
      },
    ],
  },
  {
    category: "Pris og prosess",
    questions: [
      {
        q: "Hva koster det?",
        a: "Prisen avhenger av hva du trenger. Et enkelt automatiseringsprosjekt kan starte fra 30 000 kr, mens større skreddersydde systemer typisk ligger mellom 80 000 og 300 000 kr. Vi gir alltid et fast pristilbud før du bestemmer deg — ingen overraskelser.",
      },
      {
        q: "Hvor lang tid tar det?",
        a: "De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser deg demoer underveis slik at du kan gi tilbakemeldinger tidlig.",
      },
      {
        q: "Hva skjer etter lansering?",
        a: "Vi tilbyr support og vedlikehold så lenge du trenger det. Alle systemer leveres med dokumentasjon og opplæring. Hvis noe trenger justering eller du vil legge til nye funksjoner senere, er vi tilgjengelige.",
      },
      {
        q: "Eier vi koden og systemet?",
        a: "Ja, alltid. Du eier alt vi bygger for deg — kildekode, design, data. Det er ingen innlåsing og ingen skjulte kostnader. Hvis du en dag vil bytte leverandør eller ta over driften selv, har du full frihet til det.",
      },
      {
        q: "Er den første samtalen virkelig gratis?",
        a: "Ja, helt gratis og uforpliktende. Vi setter oss ned (fysisk eller digitalt) og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre — uten noen forpliktelser.",
      },
    ],
  },
  {
    category: "Teknologi og sikkerhet",
    questions: [
      {
        q: "Er dataene våre trygge?",
        a: "Absolutt. Vi følger beste praksis for datasikkerhet og personvern. Alle systemer bygges med kryptering, tilgangskontroll og sikker hosting. Vi er kjent med GDPR-kravene og sørger for at løsningene er i samsvar med norske og europeiske regelverk.",
      },
      {
        q: "Bruker dere kunstig intelligens (AI)?",
        a: "Ja, der det gir verdi. Vi bruker AI for oppgaver som tekstforståelse, automatisk kategorisering, chatboter og dataanalyse. Men vi bruker det ikke bare for å være hippe — AI er et verktøy, og vi bruker det kun når det faktisk løser et problem bedre enn alternativene.",
      },
      {
        q: "Hva skjer hvis noe går galt med systemet?",
        a: "Alle systemer vi bygger har overvåking og varslingssystemer. Hvis noe uventet skjer, får vi beskjed umiddelbart og fikser det raskt. Vi tilbyr SLA-avtaler for bedrifter som trenger garantert oppetid og responstid.",
      },
      {
        q: "Kan systemet skalere når vi vokser?",
        a: "Ja. Vi bygger med skalering i tankene fra dag én. Enten du dobler antall ansatte, får ti ganger så mange kunder, eller ekspanderer til nye markeder — systemene våre vokser med deg uten at du trenger å bygge på nytt.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <span className="tag">FAQ</span>
          <h1>Ofte stilte spørsmål</h1>
          <p className="page-hero__sub">
            Alt du lurer på om automatisering, skreddersydd software og hvordan Workflows kan hjelpe din bedrift.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="faq-layout">
            {faqs.map((cat) => (
              <div key={cat.category} className="faq-category">
                <h2>{cat.category}</h2>
                <div className="faq-list">
                  {cat.questions.map((faq) => (
                    <details key={faq.q} className="faq-item">
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Fant du ikke svaret du lette etter?</h2>
            <p>Ta kontakt — vi svarer gjerne på alle spørsmål, helt uforpliktende.</p>
            <Link href="/#kontakt" className="btn btn--dark">
              Start samtalen <span className="btn__arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
