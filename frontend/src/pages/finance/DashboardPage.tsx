import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClients, useCouriers, useInvoices } from '../../api/queries';
import { INVOICE_STATUSES, type InvoiceStatus } from '../../api/types';
import { InvoiceTable } from '../../components/InvoiceTable';
import { statusDot } from '../../components/StatusBadge';
import { Card, EmptyState, ErrorAlert, Input, Loading, PageHeader, Select } from '../../components/ui';
import { formatMoney } from '../../lib/format';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const invoices = useInvoices();
  const clients = useClients();
  const couriers = useCouriers();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const status = params.get('status') as InvoiceStatus | null;
  const clientId = params.get('client');
  const courierId = params.get('courier');

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const all = useMemo(() => invoices.data ?? [], [invoices.data]);

  const stats = useMemo(
    () =>
      INVOICE_STATUSES.map((s) => {
        const items = all.filter((i) => i.status === s);
        return { status: s, count: items.length, sum: items.reduce((acc, i) => acc + i.amount, 0) };
      }),
    [all],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (i) =>
        (!status || i.status === status) &&
        (!clientId || String(i.client.id) === clientId) &&
        (!courierId || String(i.courier?.id) === courierId) &&
        (!q || i.number.toLowerCase().includes(q) || i.client.name.toLowerCase().includes(q)),
    );
  }, [all, status, clientId, courierId, search]);

  return (
    <>
      <PageHeader
        title={t('finance.dashboard.title')}
        subtitle={t('finance.dashboard.subtitle')}
        actions={
          <Link
            to="/finance/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <span aria-hidden="true">+</span> {t('nav.newInvoice')}
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const active = status === s.status;
          return (
            <button
              key={s.status}
              type="button"
              aria-pressed={active}
              onClick={() => setParam('status', active ? null : s.status)}
              className={`rounded-xl bg-white p-4 text-left shadow-sm ring-1 transition hover:ring-blue-300 ${
                active ? 'ring-2 ring-blue-600' : 'ring-slate-200'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className={`size-2 rounded-full ${statusDot[s.status]}`} />
                {t(`status.${s.status}`)}
              </span>
              <span className="mt-2 block text-2xl font-bold tabular-nums text-slate-900">{s.count}</span>
              <span className="block text-xs tabular-nums text-slate-500">{formatMoney(s.sum, 'EUR', i18n.language)}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.dashboard.searchPlaceholder')}
            className="sm:max-w-xs"
          />
          <Select value={status ?? ''} onChange={(e) => setParam('status', e.target.value || null)} className="sm:w-auto">
            <option value="">{t('common.all')}</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </Select>
          <Select value={clientId ?? ''} onChange={(e) => setParam('client', e.target.value || null)} className="sm:w-auto">
            <option value="">{t('finance.dashboard.allClients')}</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={courierId ?? ''} onChange={(e) => setParam('courier', e.target.value || null)} className="sm:w-auto">
            <option value="">{t('finance.dashboard.allCouriers')}</option>
            {couriers.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-sm text-slate-500">{t('finance.dashboard.count', { count: filtered.length })}</span>
        </div>

        {invoices.isPending ? (
          <Loading />
        ) : invoices.isError ? (
          <div className="p-4">
            <ErrorAlert error={invoices.error} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState>{t('finance.dashboard.empty')}</EmptyState>
          </div>
        ) : (
          <InvoiceTable invoices={filtered} linkTo={(i) => `/finance/invoices/${i.id}`} />
        )}
      </Card>
    </>
  );
}
