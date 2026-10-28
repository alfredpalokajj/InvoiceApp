import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Invoice } from '../api/types';
import { formatDate, formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';

export function InvoiceTable({ invoices, linkTo }: { invoices: Invoice[]; linkTo: (invoice: Invoice) => string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  return (
    <div className="overflow-x-auto">
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
  );
}
