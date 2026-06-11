import type { Metadata } from "next";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb } from "@/lib/jsonLd";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { FaqClient, type FaqCategory } from "@/components/verksted/pages/FaqClient";

export const metadata: Metadata = {
  title: "Vanlige spørsmål om AI og softwareutvikling",
  description:
    "Svar på vanlige spørsmål om AI-agenter, kunstig intelligens, skreddersydd software, automatisering, priser og prosess hos Workflows i Haugesund.",
  alternates: {
    canonical: "/faq",
    languages: {
      "nb-NO": "/faq",
      "x-default": "/faq",
    },
  },
  openGraph: {
    title: "Vanlige spørsmål om AI og softwareutvikling | Workflows",
    description:
      "Svar på vanlige spørsmål om AI-agenter, kunstig intelligens, skreddersydd software og automatisering for norske bedrifter.",
    url: urlFor("/faq"),
  },
  keywords: [
    "AI Haugesund spørsmål",
    "kunstig intelligens pris",
    "AI-agenter FAQ",
    "automatisering spørsmål",
    "skreddersydd software pris",
    "hva koster AI",
    "digital assistent bedrift",
    "systemintegrasjon Norge",
    "AI for bedrifter",
    "Workflows FAQ",
    "kunstig intelligens norsk bedrift",
    "AI-byrå Haugesund",
  ],
};

/**
 * Spørsmålsveggen — ÉN kilde til sannhet: både den synlige Q&A-en og
 * FAQPage-JSON-LD-en under bygges fra denne lista, så de speiler
 * hverandre ord for ord. Endrer du et svar her, endres begge.
 */
const faqs: FaqCategory[] = [
  {
    id: "om-tjenestene",
    title: "Om tjenestene",
    questions: [
      {
        q: "Hva slags bedrifter jobber dere med?",
        a: "Bedrifter i alle størrelser — fra småbedrifter med fem ansatte til selskaper med flere hundre. Fellesnevneren er manuelle prosesser som tar for mye tid. Vi har erfaring fra bransjer som subsea, forskning, eiendom, handel og tjenesteyting.",
      },
      {
        q: "Hva er skreddersydd software?",
        a: "Programvare bygget spesifikt for din bedrift og dine prosesser. I motsetning til hyllevare som Salesforce eller HubSpot får du et system som passer måten dere faktisk jobber på — uten unødvendige funksjoner og uten begrensninger dere ikke har bedt om.",
      },
      {
        q: "Hva er en digital assistent?",
        a: "Et AI-drevet system som håndterer oppgaver som kundeservice, oppfølging, rapportering eller databehandling — automatisk, døgnet rundt. Tenk på det som en kollega som aldri sover, aldri glemmer og aldri gjør slurvefeil.",
      },
      {
        q: "Kan dere integrere med systemene vi allerede bruker?",
        a: "Ja. Vi spesialiserer oss på å koble sammen eksisterende verktøy. Enten dere bruker Tripletex, Visma, Microsoft 365, Google Workspace, Slack eller bransjespesifikke systemer, bygger vi broer mellom dem slik at data flyter automatisk.",
      },
      {
        q: "Trenger vi teknisk kompetanse internt?",
        a: "Nei. Vi bygger systemer som er enkle å bruke for alle. Du trenger ikke forstå teknologien — bare resultatene. Vi tar oss av alt det tekniske og gir grundig opplæring når systemet er klart.",
      },
    ],
    more: {
      label: "utforsk tjenestene:",
      links: [
        { href: "/chatboter", text: "Chatboter" },
        { href: "/automatiserte-flyter", text: "Automatiserte flyter" },
        { href: "/ai-agenter", text: "AI-agenter" },
      ],
    },
  },
  {
    id: "pris-og-prosess",
    title: "Pris og prosess",
    chalk: "fast pristilbud før du sier ja",
    questions: [
      {
        q: "Hva koster det?",
        a: "Det kommer an på hva du trenger. Et enkelt automatiseringsprosjekt kan starte fra 30 000 kr, mens større skreddersydde systemer typisk ligger mellom 80 000 og 300 000 kr. Du får alltid et fast pristilbud før du bestemmer deg — ingen overraskelser.",
      },
      {
        q: "Hvor lang tid tar det?",
        a: "De fleste prosjekter leveres innen 4–12 uker. Enkle automatiseringer kan være klare på under to uker. Du ser fremgang fra uke én — vi viser demoer underveis, slik at du kan gi tilbakemeldinger tidlig.",
      },
      {
        q: "Hva skjer etter lansering?",
        a: "Vi tilbyr support og vedlikehold så lenge du trenger det. Alle systemer leveres med dokumentasjon og opplæring. Trenger noe justering, eller vil du legge til nye funksjoner senere, er vi tilgjengelige.",
      },
      {
        q: "Blir vi låst til dere?",
        a: "Nei. Det er ingen bindingstid — avtalen løper måned for måned. Dataene dine blir med deg ut, i formater det neste systemet kan lese. Alt vi bygger er dokumentert, og teamet ditt får opplæring før overlevering. Vil du bytte leverandør, gjør du det når du vil.",
      },
      {
        q: "Er den første samtalen virkelig gratis?",
        a: "Ja, helt gratis og uforpliktende. Vi setter oss ned — fysisk eller digitalt — og lytter til utfordringene dine. Etter samtalen får du et konkret forslag til hva vi kan gjøre, uten noen forpliktelser.",
      },
    ],
    more: {
      label: "se resultater:",
      links: [{ href: "/kunder", text: "Kundecaser" }],
    },
  },
  {
    id: "teknologi-og-sikkerhet",
    title: "Teknologi og sikkerhet",
    chalk: "GDPR i bakhodet fra første linje",
    questions: [
      {
        q: "Er dataene våre trygge?",
        a: "Ja. Vi følger beste praksis for datasikkerhet og personvern: kryptering, tilgangskontroll og sikker hosting i alle systemer. Vi kjenner GDPR-kravene og sørger for at løsningene følger norske og europeiske regelverk.",
      },
      {
        q: "Bruker dere kunstig intelligens (AI)?",
        a: "Ja, der det gir verdi. Vi bruker AI til tekstforståelse, automatisk kategorisering, chatboter og dataanalyse. Men AI er et verktøy, ikke et mål — vi bruker det bare når det løser problemet bedre enn alternativene.",
      },
      {
        q: "Hva skjer hvis noe går galt med systemet?",
        a: "Alle systemer vi bygger har overvåking og varsling. Skjer noe uventet, får vi beskjed umiddelbart og fikser det raskt. For bedrifter som trenger garantert oppetid og responstid tilbyr vi SLA-avtaler.",
      },
      {
        q: "Kan systemet skalere når vi vokser?",
        a: "Ja. Vi bygger med skalering i tankene fra dag én. Enten dere dobler antall ansatte, får ti ganger så mange kunder eller ekspanderer til nye markeder — systemet vokser med dere uten å måtte bygges på nytt.",
      },
    ],
    more: {
      label: "mer å lese:",
      links: [{ href: "/ai-haugesund", text: "AI for bedrifter i Haugesund" }],
    },
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.flatMap((cat) =>
    cat.questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    }))
  ),
};

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "FAQ", path: "/faq" },
]);

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VerkstedShell>
        <div className="vk-faq-top">
          <PageHero
            kicker="FAQ — verkstedet svarer"
            title="Vanlige spørsmål om AI og softwareutvikling"
            lead="Korte svar på det folk faktisk lurer på: chatboter, AI-agenter, automatisering, skreddersydd software — og hva det koster. På norsk, ikke data-norsk."
            chalk="ingen dumme spørsmål — bare ubesvarte"
          >
            <nav className="vk-faq-nav" aria-label="Hopp til kategori">
              {faqs.map((cat, i) => (
                <a key={cat.id} href={`#${cat.id}`} className="vk-faq-navlink">
                  <span className="vk-faq-navnum" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {cat.title}
                </a>
              ))}
            </nav>
          </PageHero>
        </div>
        <FaqClient categories={faqs} />
        <PageCta
          heading="Fant du ikke svaret du lette etter?"
          note="Still spørsmålet direkte. Vi svarer gjerne — helt uforpliktende."
        />
      </VerkstedShell>
    </>
  );
}
