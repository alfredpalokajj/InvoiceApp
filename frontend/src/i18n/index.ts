import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import sq from './sq';

export type Lang = 'sq' | 'en';
const STORAGE_KEY = 'invoiceapp.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'sq' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  return 'sq';
}

i18n.use(initReactI18next).init({
  resources: { sq: { translation: sq }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'sq',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lang) => {
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
});

export default i18n;
