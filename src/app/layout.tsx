import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Workflows – Smartere systemer for din bedrift",
    template: "%s | Workflows",
  },
  description: "Workflows bygger skreddersydd software, digitale assistenter og automatiserte systemer som sparer tid og oker inntektene for norske bedrifter.",
  keywords: ["automatisering", "skreddersydd software", "digitale assistenter", "systemintegrasjon", "norsk teknologi", "workflows", "AI", "kunstig intelligens", "bedriftsautomatisering"],
  icons: {
    icon: "/favicon.jpg",
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Workflows",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO">
      <body className={inter.className}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
