import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import { LANGUAGES, translations, type Translations } from "@/constants/translations";

type LanguageContextType = {
  langCode: string;
  t: Translations;
  setLanguage: (code: string) => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  langCode: "en",
  t: translations["en"],
  setLanguage: () => {},
  isRTL: false,
});

function getDeviceLanguage(): string {
  const locale = Localization.getLocales()?.[0]?.languageCode ?? "en";
  const supported = Object.keys(translations);
  if (supported.includes(locale)) return locale;
  const base = locale.split("-")[0];
  if (supported.includes(base)) return base;
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langCode, setLangCode] = useState<string>("en");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("language");
      const code = saved || getDeviceLanguage();
      applyLanguage(code);
    })();
  }, []);

  function applyLanguage(code: string) {
    const lang = LANGUAGES.find((l) => l.code === code);
    const rtl = lang?.rtl ?? false;
    I18nManager.forceRTL(rtl);
    setLangCode(code);
  }

  async function setLanguage(code: string) {
    await AsyncStorage.setItem("language", code);
    applyLanguage(code);
  }

  const isRTL = LANGUAGES.find((l) => l.code === langCode)?.rtl ?? false;
  const t = { ...translations["en"], ...(translations[langCode] ?? {}) } as Translations;

  return (
    <LanguageContext.Provider value={{ langCode, t, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
