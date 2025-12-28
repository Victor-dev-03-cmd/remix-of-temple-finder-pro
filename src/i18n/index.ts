import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  si: { translation: si },
  ta: { translation: ta },
  hi: { translation: hi },
  fr: { translation: fr },
};

// Get stored language or default to 'en'
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredLanguage') || 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
