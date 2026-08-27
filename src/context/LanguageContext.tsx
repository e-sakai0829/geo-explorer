"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, DICTIONARY } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof DICTIONARY["ja"];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ja",
  setLang: () => {},
  t: DICTIONARY["ja"],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ja");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang") as Language;
    if (saved && (saved === "ja" || saved === "zh-TW" || saved === "en")) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("preferred_lang", newLang);
  };

  const t = DICTIONARY[lang] || DICTIONARY["ja"];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
