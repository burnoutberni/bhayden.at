import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations } from '@/data/content';

export type Lang = 'en' | 'de';

const LANGUAGE_STORAGE_KEY = 'language';

function getInitialLanguage(): Lang {
  if (typeof window === 'undefined') return 'en';

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'de') return stored;
  } catch {
    // Ignore storage failures and fall back to document state.
  }

  const documentLang = document.documentElement.lang;
  if (documentLang === 'de') return 'de';

  return 'en';
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLanguage);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures and keep the UI functional.
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
