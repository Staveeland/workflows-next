import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import VerkstedShell from "@/components/verksted/VerkstedShell";
import { PageHero } from "@/components/verksted/page/PageHero";
import { PageCta } from "@/components/verksted/page/PageCta";
import { Reveal } from "@/components/verksted/page/Reveal";
import { KunderClient, type KunderCase } from "@/components/verksted/pages/KunderClient";
import { urlFor } from "@/lib/site";
import { buildBreadcrumb } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "Kundecaser — AI-agenter og skreddersydd software",
  description:
    "Workflows i Haugesund bygger AI-agenter, kunstig intelligens og skreddersydd software. Les kundecasene fra CSUB, Festiviteten og ElementLab.",
  alternates: {
    canonical: "/kunder",
    languages: {
      "nb-NO": "/kunder",
      "en": "/kunder",
      "x-default": "/kunder",
    },
  },
  openGraph: {
    title: "Kundecaser | Workflows",
    description:
      "Ekte AI- og softwareprosjekter levert av Workflows i Haugesund — CSUB, Festiviteten og ElementLab.",
    url: urlFor("/kunder"),
  },
  keywords: [
    "AI kundecaser",
    "kunstig intelligens case Norge",
    "AI-agenter kundecase",
    "skreddersydd software Norge",
    "automatisering eksempler",
    "Workflows referanser",
    "AI Haugesund referanser",
  ],
};

// Tre dokumenterte jobber — platene på arkivveggen.
const cases: KunderCase[] = [
  {
    slug: "csub",
    name: "CSUB",
    jobNo: "jobb 01",
    industry: "Subsea & Offshore",
    logo: "/kunder-csub.svg",
    logoWidth: 279,
    logoHeight: 48,
    logoDisplayHeight: 24,
    summary:
      "Prosjektdata lå spredt i Excel-filer. Nå ligger alt i ett dashbord — med en AI-assistent som svarer på spørsmål og bygger rapporter på sekunder.",
    results: ["Alt samlet på ett sted", "AI-assistent med full datainnsikt", "Rapporter på sekunder"],
    weeks: "levert på 6 uker",
    whisper: "assistent: svar funnet i prosjektarkivet",
  },
  {
    slug: "festiviteten",
    name: "Festiviteten",
    jobNo: "jobb 02",
    industry: "Kultur & arrangement",
    logo: "/kunder-festiviteten.png",
    logoWidth: 911,
    logoHeight: 387,
    logoDisplayHeight: 34,
    summary:
      "AI-en følger billettsalg og annonser på Meta, Google og radio — i sanntid, døgnet rundt. Svikter salget for en forestilling, kommer varselet med en gang.",
    results: ["Sanntidsoversikt på alle kanaler", "AI-assistent 24/7", "Varsler ved svakt salg"],
    weeks: "levert på 6 uker",
    whisper: "03:12: svakt salg oppdaget → varsel sendt",
  },
  {
    slug: "elementlab",
    name: "ElementLab",
    jobNo: "jobb 03",
    industry: "Helse & Velvære",
    logo: "/kunder-elementlab.png",
    logoWidth: 256,
    logoHeight: 74,
    logoDisplayHeight: 26,
    summary:
      "Skreddersydd booking rett på nettsiden og en AI-chatbot trent på behandlingsdataene. Én sømløs kundereise fra spørsmål til time.",
    results: ["Booking rett på nettsiden", "AI-chatbot 24/7", "Eget design hele veien"],
    weeks: "levert på 4 uker",
    whisper: "booking fullført — uten å forlate nettsiden",
  },
];

// Skiltveggen — alle seks. Tre lenker videre til dokumenterte case.
const skilt: Array<{
  name: string;
  logo: string;
  width: number;
  height: number;
  displayHeight: number;
  href?: string;
}> = [
  { name: "CSUB", logo: "/kunder-csub.svg", width: 279, height: 48, displayHeight: 26, href: "/kunder/csub" },
  { name: "Saga Subsea", logo: "/kunder-saga.png", width: 320, height: 91, displayHeight: 26 },
  { name: "ElementLab", logo: "/kunder-elementlab.png", width: 256, height: 74, displayHeight: 26, href: "/kunder/elementlab" },
  { name: "Port 5561", logo: "/kunder-port.webp", width: 474, height: 101, displayHeight: 24 },
  { name: "Nyholmen", logo: "/kunder-nyholmen.png", width: 448, height: 200, displayHeight: 44 },
  { name: "Festiviteten", logo: "/kunder-festiviteten.png", width: 911, height: 387, displayHeight: 36, href: "/kunder/festiviteten" },
];

const breadcrumbJsonLd = buildBreadcrumb([
  { name: "Hjem", path: "/" },
  { name: "Kundecaser", path: "/kunder" },
]);

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Kundecaser — Workflows Haugesund",
  description:
    "Samling av kundecaser som viser AI-agenter, kunstig intelligens og skreddersydd software levert av Workflows.",
  url: urlFor("/kunder"),
  inLanguage: "nb-NO",
  hasPart: cases.map((c) => ({
    "@type": "CreativeWork",
    name: c.name,
    url: urlFor(`/kunder/${c.slug}`),
    about: c.industry,
  })),
};

export default function KunderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <VerkstedShell>
        <PageHero
          kicker="Kundecaser · arkivet"
          title="Kundecaser fra verkstedet"
          lead="Fra subsea-operasjoner til helsesentre: se hvordan AI-agenter, kunstig intelligens og skreddersydd software gjør en forskjell i hverdagen — i daglig bruk hos norske bedrifter."
          chalk="alt på denne veggen er i drift"
        />

        <KunderClient
          kicker="Arkivet"
          heading="Tre jobber, dokumentert"
          sub="Chatboter, AI-agenter og skreddersydd programvare — bygget på 4–6 uker, fortsatt i daglig bruk. Hver plate lenker til hele historien."
          statusLabel="I DAGLIG BRUK"
          readMore="Les hele caset"
          cases={cases}
        />

        <section aria-labelledby="vk-kunder-vegg-h" className="vk-pg-s vk-pg-s--tight vk-kunder-vegg">
          <div className="vk-wrap">
            <Reveal as="p" className="vk-kicker" y={14}>
              Skiltene på veggen
            </Reveal>
            <Reveal delay={0.06}>
              <h2 id="vk-kunder-vegg-h" className="vk-display vk-pg-h2">
                I drift hos seks norske bedrifter
              </h2>
            </Reveal>
            <Reveal as="p" className="vk-pg-sub" delay={0.12}>
              Tre av jobbene er dokumentert som case over. Resten av skiltene henger her —
              systemene deres går stille i bakgrunnen.
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="vk-kunder-skiltrad">
                {skilt.map((s) =>
                  s.href ? (
                    <li key={s.name}>
                      <Link href={s.href} className="vk-kunder-skilt">
                        <Image
                          src={s.logo}
                          alt=""
                          width={s.width}
                          height={s.height}
                          style={{ height: s.displayHeight, width: "auto" }}
                        />
                        <span className="vk-mono vk-kunder-skiltnavn">{s.name}</span>
                      </Link>
                    </li>
                  ) : (
                    <li key={s.name}>
                      <figure className="vk-kunder-skilt">
                        <Image
                          src={s.logo}
                          alt=""
                          width={s.width}
                          height={s.height}
                          style={{ height: s.displayHeight, width: "auto" }}
                        />
                        <figcaption className="vk-mono vk-kunder-skiltnavn">{s.name}</figcaption>
                      </figure>
                    </li>
                  ),
                )}
                <li>
                  <Link href="#kontakt" className="vk-kunder-skilt vk-kunder-slot">
                    plass til ditt skilt<span aria-hidden="true"> →</span>
                  </Link>
                </li>
              </ul>
            </Reveal>
            <p className="vk-chalk vk-kunder-veggchalk">seks skilt — plass til flere</p>
            <p className="vk-pg-prose vk-kunder-verktoy">
              Verktøyene bak jobbene står på benkene våre:{" "}
              <Link href="/chatboter">chatboter</Link>,{" "}
              <Link href="/automatiserte-flyter">automatiserte flyter</Link> og{" "}
              <Link href="/ai-agenter">AI-agenter</Link> — alle fire arbeidsbenkene finner du på{" "}
              <Link href="/#tjenester">forsiden</Link>.
            </p>
          </div>
        </section>

        <PageCta heading="Neste skilt på veggen kan bli ditt." />
      </VerkstedShell>
    </>
  );
}
