import { Fraunces, Schibsted_Grotesk, Spline_Sans_Mono } from "next/font/google";

// latin only: æøå/ÆØÅ + «» live in the latin subset (U+0000-00FF) — the
// latin-ext files were ~277KB of preloaded dead weight for nb/en copy.

// Display face. opsz 144 + WONK is the letterpress identity; italic is the annotation voice.
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline",
  display: "swap",
});
