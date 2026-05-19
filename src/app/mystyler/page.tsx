import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ORG_ID, SITE_URL, urlFor } from "@/lib/site";
import { buildBreadcrumb } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "MyStyler — AI-stylist i lommen | Workflows",
  description:
    "MyStyler er Workflows sin egenutviklede iOS-app. Last opp to bilder, beskriv anledningen, og få fire fotorealistiske antrekksforslag av deg selv på sekunder.",
  alternates: { canonical: "/mystyler" },
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

const SHOTS = [
  { src: "/mystyler-1.png", alt: "Bygg et stilbibliotek — favorittlooks du elsker" },
  { src: "/mystyler-2.png", alt: "Bruk klærne du eier — garderobe-modus" },
  { src: "/mystyler-3.png", alt: "Fotorealistisk og umiskjennelig deg — fire variasjoner per prompt" },
  { src: "/mystyler-4.png", alt: "Middag, intervju, strand — beskriv øyeblikket, MyStyler kler deg for det" },
];

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

      {/* ──── HERO (uses existing .our-app CSS) ──── */}
      <section className="our-app our-app--page" id="mystyler">
        <div className="wrap">
          <div className="our-app__grid">
            <div className="our-app__content">
              <span className="tag">Vår egen app</span>
              <h1>MyStyler — AI-stylist i lommen</h1>
              <p className="our-app__lead">
                MyStyler er Workflows sin egenutviklede iOS-app. Last opp to bilder, beskriv anledningen,
                og få fire fotorealistiske antrekk som faktisk ser ut som deg.
              </p>
              <p className="our-app__sub">
                Middag i Paris. Jobbintervju. Strandbryllup. Første dag tilbake på kontoret. Uansett
                hva du skriver inn, kler MyStyler deg opp for det — uten å miste ansiktet, hårfargen
                eller proporsjonene dine.
              </p>

              <ul className="our-app__features">
                {FEATURES.map((item) => (
                  <li key={item} className="our-app__feature">
                    <span className="our-app__check">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="our-app__cta">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  Last ned i App Store <span className="btn__arrow">&rarr;</span>
                </a>
                <span className="our-app__platform">Tilgjengelig for iPhone</span>
              </div>
            </div>

            <div className="our-app__visual">
              <div className="our-app__logo-wrap">
                <Image
                  src="/mystyler-logo.png"
                  alt="MyStyler — AI stylist app"
                  width={520}
                  height={520}
                  className="our-app__logo"
                  priority
                />
              </div>
              <div className="our-app__badge">
                <span className="our-app__badge-spark">&#10022;</span>
                <div>
                  <strong>Real outfits.</strong>
                  <span>Made for you. By AI.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── WHAT IS MYSTYLER ──── */}
      <section className="section">
        <div className="wrap">
          <article className="longform">
            <h2>Hva er MyStyler?</h2>
            <p>
              MyStyler er Workflows sitt eget forbrukerprodukt — et sideprosjekt vi bygget for å vise
              hva moderne bildemodeller kan brukes til. Appen kombinerer to bilder av deg med en
              tekstbeskrivelse av en anledning, og genererer fire fotorealistiske antrekksforslag i
              løpet av sekunder.
            </p>
            <p>
              Du beholder ansiktstrekkene, hårfargen og proporsjonene dine — den endrer kun klærne.
              Tenk på det som å prøve seg fram foran et speil, uten å måtte ta på et eneste plagg.
            </p>

            <h2>Slik fungerer det</h2>
            <ol>
              {STEPS.map((s) => (
                <li key={s.n}>
                  <strong>{s.title}.</strong> {s.desc}
                </li>
              ))}
            </ol>

            <h2>Hvorfor lager et B2B-AI-byrå en stylist-app?</h2>
            <p>
              MyStyler er en demonstrasjon, ikke en kjernevirksomhet. Vi bygger AI-løsninger for
              norske bedrifter til daglig — chatboter, automatiserte flyter, AI-agenter og
              skreddersydd software. MyStyler er måten vi holder oss skarpe på: et reelt produkt
              med ekte brukere, hvor vi presser ny bildeteknologi til grensene. Det vi lærer her,
              tar vi med oss inn i kundeprosjektene.
            </p>
            <p>
              Hvis du er nysgjerrig på hva slags AI-løsninger vi kan bygge for din bedrift —{" "}
              <Link href="/#kontakt">ta kontakt</Link>, eller{" "}
              <Link href="/kunder">se hva vi har bygget for andre</Link>.
            </p>
          </article>
        </div>
      </section>

      {/* ──── SCREENSHOTS ──── */}
      <section className="section" aria-labelledby="mystyler-shots">
        <div className="wrap">
          <h2 id="mystyler-shots" style={{ textAlign: "center", marginBottom: "clamp(32px, 4vw, 56px)" }}>
            Se MyStyler i bruk
          </h2>
          <div className="our-app__shots">
            {SHOTS.map((shot) => (
              <div key={shot.src} className="our-app__shot">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={420}
                  height={910}
                  sizes="(max-width: 768px) 60vw, (max-width: 1024px) 30vw, 240px"
                  className="our-app__shot-img"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="cta-section">
        <div className="wrap">
          <div className="cta">
            <h2>Last ned MyStyler i App Store</h2>
            <p>Gratis å prøve. Tilgjengelig for iPhone.</p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--dark"
            >
              Åpne i App Store <span className="btn__arrow">&rarr;</span>
            </a>
            <p style={{ marginTop: "24px" }}>
              <Link href="/">&larr; Tilbake til Workflows</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
