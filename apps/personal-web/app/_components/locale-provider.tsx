"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Locale, LocaleDict } from "@/app/_locales/types";
import en from "@/app/_locales/en";
import zh from "@/app/_locales/zh";

const dicts: Record<Locale, LocaleDict> = { en, zh };

type LocaleCtx = {
  locale: Locale;
  t: LocaleDict;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LocaleContext.Provider value={{ locale, t: dicts[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
