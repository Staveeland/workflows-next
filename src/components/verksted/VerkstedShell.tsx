"use client";

import "@/styles/verksted/base.css";
import "@/styles/verksted/page.css";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";
import { ThreadProvider } from "@/components/verksted/ThreadContext";
import { EasterEggs } from "@/components/verksted/EasterEggs";
import { NavVerksted } from "@/components/verksted/sections/NavVerksted";
import { Kolofon } from "@/components/verksted/sections/Kolofon";

/**
 * Verksted chrome for every route except "/" (which mounts VerkstedHome).
 * Nav and colophon sit OUTSIDE <main> so the skip link actually bypasses
 * the nav and <header>/<footer> keep their banner/contentinfo landmarks.
 * Sub-pages render a #kontakt CTA (PageCta) so the nav CTA anchor resolves.
 */
export default function VerkstedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`vk vk-page ${fraunces.variable} ${schibsted.variable} ${spline.variable}`}>
      <ThreadProvider>
        <NavVerksted variant="page" />
        <main id="main">{children}</main>
        <Kolofon />
        <EasterEggs />
        <div className="vk-grain" aria-hidden="true" />
      </ThreadProvider>
    </div>
  );
}
