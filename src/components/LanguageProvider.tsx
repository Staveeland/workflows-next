"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
