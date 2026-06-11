"use client";

import "@/styles/verksted/pages/faq.css";
import Link from "next/link";
import { useRef, useState, type SyntheticEvent } from "react";
import { Reveal } from "@/components/verksted/page/Reveal";
import { ThreadSegment } from "@/components/verksted/ThreadContext";

export interface FaqQuestion {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  /** Optional chalk aside under the category header. */
  chalk?: string;
  questions: FaqQuestion[];
  /** Related internal links — rendered OUTSIDE the answers so the
      FAQPage JSON-LD stays a word-for-word mirror of the visible Q&A. */
  more?: { label: string; links: Array<{ href: string; text: string }> };
}

// Tråden tar imot fra PageHero (x≈47 på 38 %-ryggraden) og syr seg
// ned langs gutteren mellom kategorikolonnene.
const WALL_THREAD_D =
  "M 47 0 C 45 36 57 64 54 104 C 51.5 140 41 174 43 212 C 44.6 244 53 270 50 300";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/**
 * Spørsmålsveggen: tre kategorier som rader i verkstedet, native
 * <details>-trekkspill (fungerer uten JS), og en kritt-hvisken som
 * dukker opp etter det tredje åpnede spørsmålet.
 */
export function FaqClient({ categories }: { categories: FaqCategory[] }) {
  const opened = useRef<Set<string>>(new Set());
  const [delight, setDelight] = useState(false);

  const handleToggle = (q: string) => (e: SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open) return;
    opened.current.add(q);
    if (opened.current.size >= 3) setDelight(true);
  };

  // Continuous archive numbering 01..N across all categories.
  let counter = 0;
  const numbered = categories.map((cat) => ({
    ...cat,
    items: cat.questions.map((item) => ({ ...item, n: counter++ })),
  }));

  return (
    <div className="vk-faq">
      <ThreadSegment
        d={WALL_THREAD_D}
        viewBox="0 0 100 300"
        className="vk-faq-thread"
        offset={["start 0.85", "end 0.35"]}
      />
      {numbered.map((cat, ci) => (
        <section
          key={cat.id}
          id={cat.id}
          className="vk-faq-cat"
          aria-labelledby={`vk-faq-h-${cat.id}`}
        >
          <div className="vk-wrap">
            <div className="vk-faq-grid">
              <header className="vk-faq-cathead">
                <Reveal y={18}>
                  <p className="vk-faq-num" aria-hidden="true">
                    {pad2(ci)}
                  </p>
                  <h2 id={`vk-faq-h-${cat.id}`} className="vk-display vk-faq-cattitle">
                    {cat.title}
                  </h2>
                  <p className="vk-mono vk-faq-count">{cat.items.length} spørsmål</p>
                  {cat.chalk ? <p className="vk-chalk vk-faq-catchalk">{cat.chalk}</p> : null}
                </Reveal>
              </header>
              <div className="vk-faq-listcol">
                <Reveal delay={0.08} y={20}>
                  <div className="vk-faq-list">
                    {cat.items.map((item) => (
                      <details
                        key={item.q}
                        className="vk-faq-item"
                        onToggle={handleToggle(item.q)}
                      >
                        <summary className="vk-faq-q">
                          <span className="vk-mono vk-faq-qnum" aria-hidden="true">
                            {pad2(item.n)}
                          </span>
                          <span className="vk-faq-qtext">{item.q}</span>
                          <span className="vk-faq-icon" aria-hidden="true">
                            <svg
                              viewBox="0 0 12 12"
                              width="12"
                              height="12"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path
                                d="M6 1v10M1 6h10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        </summary>
                        <div className="vk-faq-a">
                          <p className="vk-pg-prose vk-faq-prose">{item.a}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                  {cat.more ? (
                    <p className="vk-faq-more">
                      <span className="vk-mono vk-faq-morelabel">{cat.more.label}</span>
                      {cat.more.links.map((link) => (
                        <Link key={link.href} href={link.href} className="vk-pg-link vk-faq-morelink">
                          {link.text}
                        </Link>
                      ))}
                    </p>
                  ) : null}
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      ))}
      <div className="vk-wrap vk-faq-tail">
        <p
          className="vk-chalk vk-faq-delight"
          data-show={delight ? "true" : "false"}
          aria-hidden="true"
        >
          tredje spørsmålet nå — resten tar vi gjerne over en kaffe ↓
        </p>
      </div>
    </div>
  );
}
