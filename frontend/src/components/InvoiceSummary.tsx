import { useTranslation } from 'react-i18next';
import type { Invoice, Role } from '../api/types';
import { formatDate, formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';
import { Card } from './ui';

/** Header card with the invoice's key facts, shared by the Finance and Courier detail pages. */
export function InvoiceSummary({ invoice, viewer }: { invoice: Invoice; viewer: Role }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('invoice.number')}</p>
          <p className="text-xl font-bold text-slate-900">{invoice.number}</p>
        </div>
        <StatusBadge status={invoice.status} viewer={viewer} />
      </div>

      <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
        {formatMoney(invoice.amount, invoice.currency, lang)}
      </p>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">{t('invoice.client')}</dt>
          <dd className="font-medium text-slate-900">{invoice.client.name}</dd>
          <dd className="text-slate-600">{invoice.client.address}</dd>
          {invoice.client.phone && <dd className="text-slate-600">{invoice.client.phone}</dd>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-slate-500">{t('invoice.issueDate')}</dt>
            <dd className="font-medium text-slate-900">{formatDate(invoice.issueDate, lang)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t('invoice.dueDate')}</dt>
            <dd className="font-medium text-slate-900">{formatDate(invoice.dueDate, lang)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-500">{t('invoice.courier')}</dt>
            <dd className="font-medium text-slate-900">{invoice.courier?.fullName ?? t('common.unassigned')}</dd>
          </div>
        </div>
        {invoice.details && (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">{t('invoice.details')}</dt>
            <dd className="whitespace-pre-line text-slate-800">{invoice.details}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
