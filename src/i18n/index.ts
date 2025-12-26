import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  si: { translation: si },
  ta: { translation: ta },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('preferredLanguage') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
