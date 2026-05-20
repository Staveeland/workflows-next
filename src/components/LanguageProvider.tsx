"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Lang } from "@/lib/translations";

interface LangContext {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangContext>({ lang: "no", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("no");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "en" ? "en" : "nb-NO";
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {/* reducedMotion="user" — framer-motion respects the user's OS-level
          "Reduce motion" preference automatically across all motion components. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
