import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Invoice } from '../api/types';
import { formatDate, formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';

/** A stacked list on phones and portrait tablets, where six columns don't fit; a table from `lg` up. */
export function InvoiceTable({ invoices, linkTo }: { invoices: Invoice[]; linkTo: (invoice: Invoice) => string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  return (
    <>
      <ul className="divide-y divide-slate-100 lg:hidden">
        {invoices.map((inv) => (
          <li key={inv.id}>
            <Link to={linkTo(inv)} className="block px-4 py-3 transition hover:bg-blue-50/50 active:bg-blue-50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-blue-800">{inv.number}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-slate-800">{inv.client.name}</span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
                  {formatMoney(inv.amount, inv.currency, lang)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-slate-500">
                <span>
                  {t('invoice.courier')}: {inv.courier?.fullName ?? '—'}
                </span>
                <span>
                  {t('invoice.dueDate')}: {formatDate(inv.dueDate, lang)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{t('invoice.number')}</th>
              <th className="px-4 py-3">{t('invoice.client')}</th>
              <th className="px-4 py-3 text-right">{t('invoice.amount')}</th>
              <th className="px-4 py-3">{t('invoice.status')}</th>
              <th className="px-4 py-3">{t('invoice.courier')}</th>
              <th className="px-4 py-3">{t('invoice.dueDate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => navigate(linkTo(inv))}
                className="cursor-pointer transition hover:bg-blue-50/50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-800">
                  {/* A real link for keyboard and screen-reader users; the row click is a shortcut. */}
                  <a href={linkTo(inv)} onClick={(e) => { e.preventDefault(); navigate(linkTo(inv)); }}>
                    {inv.number}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-800">{inv.client.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatMoney(inv.amount, inv.currency, lang)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{inv.courier?.fullName ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(inv.dueDate, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
