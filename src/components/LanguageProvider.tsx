"use client";

import { createContext, useContext, useState } from "react";
import { Lang } from "@/lib/translations";

interface LangContext {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangContext>({ lang: "no", setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("no");
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
