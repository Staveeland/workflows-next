"use client";

import { ThreadSegment } from "@/components/verksted/ThreadContext";
import { Reveal } from "@/components/verksted/page/Reveal";

// Tråden enters every sub-page from the top edge near the 38% spine and
// hands off to the page content — same line, new room in the workshop.
const HERO_THREAD_D =
  "M 50 0 C 47 30 38 52 40 84 C 42 112 56 134 54 168 C 52.5 196 46 218 47 240";

/**
 * Sub-page opener: mono kicker, Fraunces display title, lead paragraph,
 * optional chalk aside — on the shared dark ground with the thread
 * drawing itself down the spine as you arrive.
 */
export function PageHero({
  kicker,
  title,
  lead,
  chalk,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  lead?: string;
  chalk?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="vk-pg-hero">
      <ThreadSegment
        d={HERO_THREAD_D}
        viewBox="0 0 100 240"
        className="vk-pg-hero-thread"
        offset={["start 0.6", "end 0.2"]}
      />
      <div className="vk-wrap">
        <Reveal as="p" className="vk-kicker vk-pg-kicker" y={14}>
          {kicker}
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="vk-display vk-pg-title">{title}</h1>
        </Reveal>
        {lead ? (
          <Reveal as="p" className="vk-pg-lead" delay={0.14}>
            {lead}
          </Reveal>
        ) : null}
        {chalk ? (
          <Reveal as="p" className="vk-chalk vk-pg-chalk" delay={0.22} y={10}>
            {chalk}
          </Reveal>
        ) : null}
        {children}
      </div>
    </header>
  );
}
