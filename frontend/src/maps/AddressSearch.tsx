import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';
import type { GeocodeResult } from './types';

/**
 * Address search box used by both map providers. Searches on submit (not on every keystroke),
 * which also keeps us inside Nominatim's one-request-per-second policy.
 */
export function AddressSearch({
  search,
  onSelect,
}: {
  search: (query: string) => Promise<GeocodeResult[]>;
  onSelect: (result: GeocodeResult) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!query.trim()) return;
    setBusy(true);
    try {
      setResults(await search(query.trim()));
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    // Not a <form>: this sits inside the client form, and nested forms are invalid HTML.
    <div className="relative">
      <div className="flex gap-2">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(e)}
          placeholder={t('maps.searchPlaceholder')}
          aria-label={t('maps.searchPlaceholder')}
        />
        <Button type="button" variant="secondary" onClick={submit} loading={busy}>
          {t('common.search')}
        </Button>
      </div>
      {results && (
        <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200">
          {results.length === 0 && <li className="px-3 py-2 text-slate-500">{t('maps.noResults')}</li>}
          {results.map((r) => (
            <li key={`${r.position.lat},${r.position.lng},${r.label}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-blue-50"
                onClick={() => {
                  onSelect(r);
                  setResults(null);
                  setQuery('');
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
