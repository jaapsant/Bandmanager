import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en/translation.json';
import nlTranslations from './locales/nl/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      nl: { translation: nlTranslations }
    },
    lng: 'nl',
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 