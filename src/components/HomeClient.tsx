"use client";

// Orchestrator for the home page. Each section lives in src/components/home/*.
// Sprint 2.2: split from a 550-line monolith and reduced whileInView count
// from 25+ to ~10 anchor elements (section heads + major CTAs).

import { Hero } from "@/components/home/Hero";
import { LogoStrip } from "@/components/home/LogoStrip";
import { Levels } from "@/components/home/Levels";
import { Statement } from "@/components/home/Statement";
import { Stats } from "@/components/home/Stats";
import { Features } from "@/components/home/Features";
import { MidCta } from "@/components/home/MidCta";
import { Process } from "@/components/home/Process";
import { Results } from "@/components/home/Results";
import { About } from "@/components/home/About";
import { Partners } from "@/components/home/Partners";
import { Customers } from "@/components/home/Customers";
import { Faq } from "@/components/home/Faq";
import { Contact } from "@/components/home/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <LogoStrip />
      <Levels />
      <Statement />
      <Stats />
      <Features />
      <MidCta />
      <Process />
      <Results />
      <MidCta withText />
      <About />
      <Partners />
      <Customers />
      <Faq />
      <Contact />
    </>
  );
}
