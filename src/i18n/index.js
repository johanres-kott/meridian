import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import sv from "./locales/sv.json";
import en from "./locales/en.json";

// Supported languages. Swedish is the source/base language; everything falls
// back to it when a key is missing in another locale. Adding a language later
// is just a new JSON file imported here plus an entry in LANGUAGES.
export const LANGUAGES = [
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const STORAGE_KEY = "thesion_language";

// Read the persisted choice synchronously so first paint is in the right
// language (before user preferences load from Supabase).
function initialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some(l => l.code === stored)) return stored;
  } catch { /* localStorage unavailable */ }
  return "sv";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      sv: { translation: sv },
      en: { translation: en },
    },
    lng: initialLanguage(),
    fallbackLng: "sv",
    interpolation: { escapeValue: false }, // React already escapes
    returnEmptyString: false,
  });

// Persist + switch. Call this from the language switcher; preference syncing
// to Supabase is handled separately in AppContent.
export function setLanguage(code) {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  i18n.changeLanguage(code);
}

export default i18n;
