import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Workflows – Intelligent arbeidsflyt",
  description: "Workflows — Din lokale AI-partner på Haugalandet. Intelligente agenter, automatisering og språkmodell-integrasjon.",
  icons: {
    icon: "/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
