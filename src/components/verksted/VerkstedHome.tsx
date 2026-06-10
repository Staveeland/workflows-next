"use client";

import "@/styles/verksted/base.css";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";
import { ThreadProvider } from "@/components/verksted/ThreadContext";
import { EasterEggs } from "@/components/verksted/EasterEggs";
import { NavVerksted } from "@/components/verksted/sections/NavVerksted";
import { Hero } from "@/components/verksted/sections/Hero";
import { Manifest } from "@/components/verksted/sections/Manifest";
import { Tjenester } from "@/components/verksted/sections/Tjenester";
import { Prosess } from "@/components/verksted/sections/Prosess";
import { Kundecaser } from "@/components/verksted/sections/Kundecaser";
import { Eierskap } from "@/components/verksted/sections/Eierskap";
import { Folkene } from "@/components/verksted/sections/Folkene";
import { Kontakt } from "@/components/verksted/sections/Kontakt";
import { Kolofon } from "@/components/verksted/sections/Kolofon";

export default function VerkstedHome() {
  // Nav and colophon sit OUTSIDE <main> so the skip link actually bypasses
  // the nav and <header>/<footer> keep their banner/contentinfo landmarks.
  return (
    <div className={`vk ${fraunces.variable} ${schibsted.variable} ${spline.variable}`}>
      <ThreadProvider>
        <NavVerksted />
        <main id="main">
          <Hero />
          <Manifest />
          <Tjenester />
          <Prosess />
          <Kundecaser />
          <Eierskap />
          {/* Legacy anchor: external links to /#om land just above Folkene. */}
          <span id="om" aria-hidden="true" />
          <Folkene />
          <Kontakt />
        </main>
        <Kolofon />
        <EasterEggs />
        <div className="vk-grain" aria-hidden="true" />
      </ThreadProvider>
    </div>
  );
}
