import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoices, useInvoiceTransition } from '../../api/queries';
import type { Invoice, InvoiceStatus } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Button, Card, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { formatMoney } from '../../lib/format';

type Tab = 'pending' | 'inTransit' | 'delivered';

const tabStatuses: Record<Tab, InvoiceStatus[]> = {
  pending: ['ReadyForDelivery'],
  inTransit: ['InTransit'],
  delivered: ['Delivered', 'Paid'],
};

export function CourierHomePage() {
  const { t } = useTranslation();
  const invoices = useInvoices();
  const [tab, setTab] = useState<Tab>('pending');

  const all = invoices.data ?? [];
  const visible = all.filter((i) => tabStatuses[tab].includes(i.status));

  return (
    <>
      <PageHeader title={t('courier.title')} subtitle={t('courier.subtitle')} />

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        {(Object.keys(tabStatuses) as Tab[]).map((key) => {
          const count = all.filter((i) => tabStatuses[key].includes(i.status)).length;
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold transition sm:flex-row sm:gap-2 sm:px-3 ${
                active ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(`courier.tabs.${key}`)}
              <span className={`rounded-full px-2 text-xs ${active ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {invoices.isPending ? (
        <Loading />
      ) : invoices.isError ? (
        <ErrorAlert error={invoices.error} />
      ) : visible.length === 0 ? (
        <EmptyState>{t('courier.empty')}</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((inv) => (
            <li key={inv.id}>
              <DeliveryCard invoice={inv} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DeliveryCard({ invoice }: { invoice: Invoice }) {
  const { t, i18n } = useTranslation();
  const transition = useInvoiceTransition();

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/courier/invoices/${invoice.id}`} className="font-semibold text-blue-800 hover:underline">
            {invoice.number}
          </Link>
          <p className="truncate font-medium text-slate-900">{invoice.client.name}</p>
          <p className="text-sm text-slate-600">{invoice.client.address}</p>
        </div>
        <StatusBadge status={invoice.status} viewer="Courier" />
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums text-slate-900">
        {formatMoney(invoice.amount, invoice.currency, i18n.language)}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {invoice.status === 'ReadyForDelivery' && (
          <Button loading={transition.isPending} onClick={() => transition.mutate({ id: invoice.id, action: 'start' })}>
            {t('courier.start')}
          </Button>
        )}
        <Link
          to={`/courier/invoices/${invoice.id}`}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          {t('common.details')}
        </Link>
      </div>
      {transition.error != null && (
        <div className="mt-3">
          <ErrorAlert error={transition.error} />
        </div>
      )}
    </Card>
  );
}
