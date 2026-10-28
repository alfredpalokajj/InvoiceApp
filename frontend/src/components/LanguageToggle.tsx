import { useTranslation } from 'react-i18next';
import type { Lang } from '../i18n';

const langs: { code: Lang; label: string }[] = [
  { code: 'sq', label: 'SQ' },
  { code: 'en', label: 'EN' },
];

export function LanguageToggle() {
  const { i18n } = useTranslation();
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {langs.map(({ code, label }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => i18n.changeLanguage(code)}
            className={`rounded-md px-2.5 py-1 transition ${active ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
