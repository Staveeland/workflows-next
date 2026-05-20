"use client";

import { useEffect, useRef, useState } from "react";
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

export function Stats() {
  const { lang } = useLang();
  const t = translations[lang];

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "0px 0px -10% 0px" });

  const s1 = useCounter(40, 2000, statsInView);
  const s2 = useCounter(12, 2000, statsInView);

  return (
    <section className="stats" ref={statsRef}>
      <div className="wrap">
        <div className="stats__grid">
          <div className="stats__item">
            <span className="stats__num">
              {s1}
              <span className="stats__pct">%</span>
            </span>
            <span className="stats__label">{t.stats.s1Label}</span>
          </div>
          <div className="stats__item">
            <span className="stats__num">
              {s2}
              <span className="stats__pct">+</span>
            </span>
            <span className="stats__label">{t.stats.s2Label}</span>
          </div>
          <div className="stats__item">
            <span className="stats__num">
              24<span className="stats__pct">/7</span>
            </span>
            <span className="stats__label">{t.stats.s3Label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
