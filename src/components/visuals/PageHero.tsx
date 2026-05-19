/**
 * PageHero — landing-page hero with visual on the right side.
 * Drop-in replacement for the old centered <section className="page-hero">.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import PageHeroVisual from "./PageHeroVisual";

export default function PageHero({
  tag,
  title,
  sub,
  ctaHref = "/#kontakt",
  ctaText = "Book en gratis prat",
  visual,
  highlights,
}: {
  tag: string;
  title: string;
  sub: string;
  ctaHref?: string;
  ctaText?: string;
  visual: "chatbot" | "flow" | "agent" | "ai" | "software" | "haugesund" | "faq";
  highlights?: { icon: ReactNode; text: string }[];
}) {
  return (
    <section className="page-hero page-hero--split">
      <div className="wrap">
        <div className="page-hero__grid">
          <div className="page-hero__text">
            <span className="tag">{tag}</span>
            <h1>{title}</h1>
            <p className="page-hero__sub">{sub}</p>
            {highlights && highlights.length > 0 && (
              <ul className="page-hero__highlights">
                {highlights.map((h, i) => (
                  <li key={i}>
                    <span className="page-hero__hi-icon">{h.icon}</span>
                    {h.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="page-hero__cta">
              <Link href={ctaHref} className="btn btn--primary">
                {ctaText} <span className="btn__arrow">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="page-hero__visual-wrap">
            <PageHeroVisual variant={visual} />
          </div>
        </div>
      </div>
    </section>
  );
}
