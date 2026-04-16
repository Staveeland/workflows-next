import type { Metadata, Viewport } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const SITE_URL = "https://workflows.no";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Workflows – AI og softwareutvikling i Haugesund",
    template: "%s | Workflows",
  },
  description:
    "AI-agenter, kunstig intelligens og skreddersydd software for bedrifter i Haugesund og Norge. Gratis første samtale, ingen forpliktelser.",
  applicationName: "Workflows",
  authors: [{ name: "Workflows AS", url: SITE_URL }],
  generator: "Next.js",
  keywords: [
    "AI Haugesund",
    "kunstig intelligens Haugesund",
    "smarte agenter Haugesund",
    "AI-agenter",
    "AI agenter Norge",
    "software utvikling Haugesund",
    "programutvikling Haugesund",
    "programvareutvikling Haugesund",
    "skreddersydd software",
    "automatisering Haugesund",
    "digitale assistenter",
    "chatbot Norge",
    "AI-byrå Haugesund",
    "AI-konsulent Haugesund",
    "systemintegrasjon Haugesund",
    "Workflows AS",
    "Workflows Haugesund",
    "kunstig intelligens for bedrifter",
    "AI for bedrifter Norge",
    "maskinlæring Haugesund",
    "automatisering Rogaland",
  ],
  category: "technology",
  creator: "Workflows AS",
  publisher: "Workflows AS",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "nb-NO": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: SITE_URL,
    siteName: "Workflows",
    title: "Workflows – AI og softwareutvikling i Haugesund",
    description:
      "AI-agenter, kunstig intelligens og skreddersydd software for bedrifter i Haugesund og Norge.",
    images: [
      {
        url: "/logo-square.jpg",
        width: 1200,
        height: 630,
        alt: "Workflows – AI og softwareutvikling i Haugesund",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workflows – AI og softwareutvikling i Haugesund",
    description:
      "AI-agenter, kunstig intelligens og skreddersydd software for bedrifter i Haugesund og Norge.",
    images: ["/logo-square.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/logo-square.jpg" }],
  },
  verification: {
    // Add Google Search Console + Bing Webmaster verification tokens here when available
    // google: "xxxx",
    // other: { "msvalidate.01": "xxxx" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a3d2e",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "Workflows AS",
  alternateName: "Workflows",
  legalName: "Workflows AS",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-dark.png`,
  image: `${SITE_URL}/logo-square.jpg`,
  description:
    "Workflows er et AI- og softwareutviklingsselskap i Haugesund som bygger smarte agenter, kunstig intelligens og skreddersydde systemer for norske bedrifter.",
  foundingDate: "2024",
  email: "petter@workflows.no",
  telephone: "+47 930 77 915",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Haugesund",
    addressRegion: "Rogaland",
    addressCountry: "NO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 59.4138,
    longitude: 5.2679,
  },
  areaServed: [
    { "@type": "City", name: "Haugesund" },
    { "@type": "City", name: "Stavanger" },
    { "@type": "City", name: "Bergen" },
    { "@type": "City", name: "Oslo" },
    { "@type": "AdministrativeArea", name: "Rogaland" },
    { "@type": "AdministrativeArea", name: "Haugalandet" },
    { "@type": "Country", name: "Norge" },
  ],
  knowsAbout: [
    "Kunstig intelligens",
    "AI-agenter",
    "Maskinlæring",
    "Skreddersydd softwareutvikling",
    "Automatisering",
    "Digitale assistenter",
    "Chatboter",
    "Systemintegrasjon",
    "RAG",
    "OpenAI",
    "Anthropic Claude",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Tjenester",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI-agenter og smarte agenter",
          description:
            "Autonome AI-agenter som planlegger og utfører oppgaver for bedriften din.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Kunstig intelligens for bedrifter",
          description:
            "Chatboter, RAG-assistenter og AI-integrasjoner tilpasset din bedrift.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Skreddersydd softwareutvikling",
          description:
            "Programvare bygget spesifikt for dine prosesser og behov.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Automatisering og systemintegrasjon",
          description:
            "Automatiserte flyter som kobler sammen verktøyene dine og fjerner manuelt arbeid.",
        },
      },
    ],
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+47 930 77 915",
      contactType: "sales",
      email: "petter@workflows.no",
      areaServed: "NO",
      availableLanguage: ["Norwegian", "English"],
    },
  ],
  sameAs: [
    // Add social profiles when available
    // "https://www.linkedin.com/company/workflows-as",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Workflows",
  description:
    "AI, smarte agenter og softwareutvikling for bedrifter i Haugesund og Norge.",
  inLanguage: "nb-NO",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${lora.variable} ${inter.variable} ${lora.className}`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
