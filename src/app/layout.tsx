import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Workflows – Smartere systemer for din bedrift",
  description: "Workflows bygger skreddersydd software, digitale assistenter og automatiserte systemer som sparer tid og øker inntektene for norske bedrifter.",
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
