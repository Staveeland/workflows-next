"use client";

import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

export default function SkipLink() {
  const { lang } = useLang();
  const t = translations[lang].a11y;
  return (
    <a href="#main" className="skip-link">
      {t.skipToMain}
    </a>
  );
}
