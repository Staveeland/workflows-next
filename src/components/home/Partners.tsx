"use client";

import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

// Static section — animations removed (Sprint 2.2 budget reduction).
export function Partners() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="partners">
      <div className="wrap">
        <div className="partners__inner">
          <p className="partners__label">{t.partners.label}</p>
          <div className="partners__row">
            {["OpenAI", "Anthropic", "Microsoft", "Google Cloud", "n8n", "Vercel"].map((name) => (
              <span key={name} className="partners__badge">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
