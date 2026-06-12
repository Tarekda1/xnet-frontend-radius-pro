import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import esCommon from "./locales/es/common.json";
import enScreens from "./locales/en/screens.json";
import esScreens from "./locales/es/screens.json";

const storedLang = (() => {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem("app.lang") || undefined;
  } catch {
    return undefined;
  }
})();

void i18n.use(initReactI18next).init({
  lng: storedLang ?? "en",
  fallbackLng: "en",
  resources: {
    en: {
      common: enCommon,
      screens: enScreens,
    },
    es: {
      common: esCommon,
      screens: esScreens,
    },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
