"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInView } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

// Counter hook (uses rAF instead of setInterval).
function useCounter(end: number, dur: number, active: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / dur, 1);
      setN(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, dur, active]);
  return n;
}

type StatItem = {
  value: string;
  unit: string;
  label: string;
  href: string | null;
  cta: string | null;
};

function StatBlock({ item, active }: { item: StatItem; active: boolean }) {
  // Animate numeric portion if it parses cleanly; otherwise show as-is.
  const target = Number(item.value);
  const animatable = Number.isFinite(target);
  const n = useCounter(animatable ? target : 0, 2000, active);
  const display = animatable ? String(n) : item.value;

  const body = (
    <>
      <span className="stats__num">
        {display}
        <span className="stats__pct">{item.unit}</span>
      </span>
      <span className="stats__label">{item.label}</span>
      {item.cta && (
        <span className="stats__cta">
          {item.cta}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="stats__item stats__item--link">
        {body}
      </Link>
    );
  }
  return <div className="stats__item">{body}</div>;
}

export function Stats() {
  const { lang } = useLang();
  const t = translations[lang];

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "0px 0px -10% 0px" });

  return (
    <section className="stats" ref={statsRef}>
      <div className="wrap">
        <div className="stats__grid">
          {t.stats.items.map((item, i) => (
            <StatBlock key={i} item={item as StatItem} active={statsInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
