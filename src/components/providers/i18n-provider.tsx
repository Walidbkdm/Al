"use client";

import * as React from "react";
import { TRANSLATIONS, translate, isRTL } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { readStorage, writeStorage } from "@/lib/storage";

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("fr");

  React.useEffect(() => {
    const saved = readStorage<Lang>("lang", "fr");
    if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
      setLangState(saved);
    }
  }, []);

  React.useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", isRTL(lang) ? "rtl" : "ltr");
  }, [lang]);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    writeStorage("lang", l);
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (k: string) => translate(k, lang),
      dir: isRTL(lang) ? "rtl" : "ltr"
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "fr" as Lang,
      setLang: () => {},
      t: (k: string) => (TRANSLATIONS.fr as Record<string, string>)[k] ?? k,
      dir: "ltr" as const
    };
  }
  return ctx;
}
