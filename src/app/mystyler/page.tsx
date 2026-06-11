import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { MystylerClient } from "@/components/verksted/pages/MystylerClient";
import { ORG_ID, SITE_URL, urlFor } from "@/lib/site";
import { buildBreadcrumb } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "MyStyler — AI-stylist i lommen | Workflows",
  description:
    "MyStyler er Workflows sin egenutviklede iOS-app. Last opp to bilder, beskriv anledningen, og få fire fotorealistiske antrekksforslag av deg selv på sekunder.",
  alternates: {
    canonical: "/mystyler",
    languages: {
      "nb-NO": "/mystyler",
      "x-default": "/mystyler",
    },
  },
  openGraph: {
    title: "MyStyler — AI-stylist i lommen",
    description:
      "Personlig AI-stylist for iPhone. Beskriv en anledning og få fire fotorealistiske antrekk som faktisk ser ut som deg.",
    url: urlFor("/mystyler"),
    type: "website",
    images: [{ url: urlFor("/mystyler-logo.png"), width: 520, height: 520, alt: "MyStyler-logo" }],
  },
  keywords: [
    "MyStyler",
    "AI stylist",
    "AI-stylist app",
    "iOS-app",
    "outfit generator",
    "AI antrekk",
    "Workflows app",
  ],
};

const APP_STORE_URL = "https://apps.apple.com/no/app/mystyler-ai/id6763133918";

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "MyStyler", path: "/mystyler" },
]);

// JSON-LD for a mobile app. JSON.stringify of a static object — safe for dangerouslySetInnerHTML.
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "@id": `${SITE_URL}/mystyler#app`,
  name: "MyStyler",
  description:
    "MyStyler er en AI-stylist for iPhone. Last opp to bilder, beskriv en anledning, og få fire fotorealistiske antrekksforslag av deg selv.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "iOS",
  url: urlFor("/mystyler"),
  installUrl: APP_STORE_URL,
  image: urlFor("/mystyler-logo.png"),
  inLanguage: ["nb-NO", "en"],
  author: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

const FEATURES = [
  "Beskriv hvilken som helst anledning på vanlig norsk eller engelsk",
  "Garderobe-modus: ta bilde av klærne du allerede eier",
  "Lagre favorittene i ditt eget stilbibliotek",
  "Generer hele antrekk eller hår + sminke-looks",
];

const STEPS = [
  {
    n: "01",
    title: "Last opp to bilder",
    desc: "Ett ansiktsbilde og ett helkroppsbilde. Det er nok for at MyStyler skal forstå hvem du er.",
  },
  {
    n: "02",
    title: "Beskriv anledningen",
    desc: "«Middag på en italiensk restaurant» eller «første dag tilbake på kontoret». Skriv på norsk eller engelsk.",
  },
  {
    n: "03",
    title: "Få fire antrekk",
    desc: "Fire fotorealistiske bilder av deg i ulike antrekk. Lagre favorittene i ditt eget stilbibliotek.",
  },
];

export default function MyStylerPage() {
  const breadcrumbJson = JSON.stringify(breadcrumbJsonLd);
  const softwareJson = JSON.stringify(softwareJsonLd);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: softwareJson }} />

      <VerkstedShell>
        {/* ──── HERO ──── */}
        <PageHero
          kicker="Fra verkstedet · vår egen app"
          title={
            <>
              MyStyler{" "}
              <span className="vk-mystyler-titletail">— AI-stylist i lommen</span>
            </>
          }
          lead="Workflows sin egenutviklede iOS-app. Last opp to bilder, beskriv anledningen, og få fire fotorealistiske antrekk som faktisk ser ut som deg."
          chalk="sideprosjektet som holder oss skarpe"
        >
          <Reveal className="vk-mystyler-hero-row" delay={0.3} y={12}>
            <span className="vk-mystyler-hero-icon">
              <Image
                src="/mystyler-logo.png"
                alt="MyStyler — AI-stylist app"
                width={112}
                height={112}
                priority
              />
            </span>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="vk-btn vk-btn--cta"
            >
              Last ned i App Store <span aria-hidden="true">↗</span>
              <span className="vk-sr">(åpnes i App Store)</span>
            </a>
            <span className="vk-mono vk-mystyler-hero-note">
              gratis å prøve · tilgjengelig for iPhone
            </span>
          </Reveal>
          <div className="vk-mystyler-poster vk-rot-c" aria-hidden="true">
            <span className="vk-mystyler-poster-img">
              <Image src="/mystyler-logo.png" alt="" width={210} height={210} />
            </span>
            <span className="vk-mono vk-mystyler-poster-whisper">
              speilbildet — uten speilet
            </span>
          </div>
        </PageHero>

        {/* ──── HVA ER MYSTYLER? ──── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="mystyler-om-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker vk-mystyler-kicker" y={14}>
              Et produkt fra verkstedet
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="mystyler-om-h" className="vk-display vk-pg-h2">
                Hva er MyStyler?
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="vk-pg-prose vk-mystyler-prose">
                <p>
                  MyStyler er Workflows sitt eget forbrukerprodukt — et sideprosjekt vi bygget for å
                  vise hva moderne bildemodeller kan brukes til. Appen kombinerer to bilder av deg
                  med en tekstbeskrivelse av en anledning, og genererer fire fotorealistiske
                  antrekksforslag i løpet av sekunder.
                </p>
                <p>
                  Du beholder ansiktstrekkene, hårfargen og proporsjonene dine — appen endrer bare
                  klærne. Tenk på det som å prøve deg fram foran et speil, uten å måtte ta på et
                  eneste plagg.
                </p>
              </div>
            </Reveal>
            <ul className="vk-mystyler-feats">
              {FEATURES.map((item, i) => (
                <Reveal as="li" key={item} className="vk-mystyler-feat" delay={0.05 * i} y={14}>
                  <span className="vk-mystyler-check" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ──── SLIK FUNGERER DET ──── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="mystyler-steg-h">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker vk-mystyler-kicker" y={14}>
              Tre steg
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="mystyler-steg-h" className="vk-display vk-pg-h2">
                Slik fungerer det
              </h2>
            </Reveal>
            <ol className="vk-pg-grid vk-pg-grid--3 vk-mystyler-steps">
              {STEPS.map((step, i) => (
                <Reveal as="li" key={step.n} className="vk-pg-card" delay={0.06 * i}>
                  <span className="vk-mystyler-step-num" aria-hidden="true">
                    {step.n}
                  </span>
                  <h3 className="vk-pg-card-title">{step.title}</h3>
                  <p className="vk-pg-card-body">{step.desc}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ──── GALLERIET (klient: promptlinje + fire trykk) ──── */}
        <MystylerClient />

        {/* ──── HVORFOR ──── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="mystyler-hvorfor-h">
          <div className="vk-wrap">
            <Reveal y={14}>
              <p className="vk-mystyler-stamp-row">
                <span className="vk-stamp">Ekte produkt · ekte brukere</span>
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 id="mystyler-hvorfor-h" className="vk-display vk-pg-h2">
                Hvorfor lager et B2B-AI-byrå en stylist-app?
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="vk-pg-prose vk-mystyler-prose">
                <p>
                  MyStyler er en demonstrasjon, ikke en kjernevirksomhet. Til daglig bygger vi{" "}
                  <Link href="/chatboter">chatboter</Link>,{" "}
                  <Link href="/automatiserte-flyter">automatiserte flyter</Link>,{" "}
                  <Link href="/ai-agenter">AI-agenter</Link> og skreddersydd programvare for norske
                  bedrifter. MyStyler er måten vi holder oss skarpe på: et reelt produkt med ekte
                  brukere, hvor vi presser ny bildeteknologi til grensene.
                </p>
                <p>
                  Det vi lærer her, tar vi med oss inn i kundeprosjektene. Nysgjerrig på hva slags
                  AI-løsninger vi kan bygge for din bedrift? <a href="#kontakt">Ta kontakt</a>,
                  eller <Link href="/kunder">se hva vi har bygget for andre</Link>.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ──── APP STORE ──── */}
        <section className="vk-pg-s vk-pg-s--tight" aria-labelledby="mystyler-store-h">
          <div className="vk-wrap">
            <Reveal>
              <div className="vk-mystyler-store">
                <span className="vk-mystyler-store-icon" aria-hidden="true">
                  <Image src="/mystyler-logo.png" alt="" width={96} height={96} />
                </span>
                <div>
                  <h2 id="mystyler-store-h" className="vk-display vk-mystyler-store-h">
                    Last ned MyStyler i App Store
                  </h2>
                  <p className="vk-mystyler-store-sub">Gratis å prøve. Tilgjengelig for iPhone.</p>
                </div>
                <div className="vk-mystyler-store-cta">
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vk-btn vk-btn--cta"
                  >
                    Åpne i App Store <span aria-hidden="true">↗</span>
                    <span className="vk-sr">(åpnes i App Store)</span>
                  </a>
                  <span className="vk-mono vk-mystyler-store-mono">iOS · norsk og engelsk</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ──── KONTAKT (alltid sist) ──── */}
        <PageCta />
      </VerkstedShell>
    </>
  );
}
