import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useInvoiceTransition } from '../../api/queries';
import type { Invoice } from '../../api/types';
import { ConfirmAction } from '../../components/ConfirmAction';
import { DownloadPdfButton } from '../../components/DownloadPdfButton';
import { StatusBadge } from '../../components/StatusBadge';
import { Alert, Card, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format';

export function ClientHomePage() {
  const { t, i18n } = useTranslation();
  const invoices = useInvoices();
  const transition = useInvoiceTransition();

  if (invoices.isPending) return <Loading />;
  if (invoices.isError) return <ErrorAlert error={invoices.error} />;

  const unpaid = invoices.data.filter((i) => i.status === 'Delivered');
  const paid = invoices.data.filter((i) => i.status === 'Paid');
  const justPaid = transition.isSuccess && transition.data.status === 'Paid';

  return (
    <>
      <PageHeader title={t('client.title')} subtitle={t('client.subtitle')} />

      {justPaid && (
        <div className="mb-4">
          <Alert tone="success">{t('client.payDone')}</Alert>
        </div>
      )}
      {transition.error != null && (
        <div className="mb-4">
          <ErrorAlert error={transition.error} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('client.unpaid')} ({unpaid.length})
        </h2>
        {unpaid.length === 0 ? (
          <EmptyState>{t('client.emptyUnpaid')}</EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {unpaid.map((inv) => (
              <li key={inv.id}>
                <ClientInvoiceCard invoice={inv}>
                  <ConfirmAction
                    variant="success"
                    label={t('client.pay')}
                    question={t('client.confirmPay', {
                      amount: formatMoney(inv.amount, inv.currency, i18n.language),
                      number: inv.number,
                    })}
                    confirmLabel={t('client.confirmPayYes')}
                    loading={transition.isPending && transition.variables?.id === inv.id}
                    onConfirm={() => transition.mutate({ id: inv.id, action: 'pay' })}
                  />
                </ClientInvoiceCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('client.paid')} ({paid.length})
        </h2>
        {paid.length === 0 ? (
          <EmptyState>{t('client.emptyPaid')}</EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {paid.map((inv) => (
              <li key={inv.id}>
                <ClientInvoiceCard invoice={inv} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ClientInvoiceCard({ invoice, children }: { invoice: Invoice; children?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{invoice.number}</p>
          <p className="text-xs text-slate-500">
            {invoice.paidAt
              ? t('client.paidAt', { date: formatDateTime(invoice.paidAt, lang) })
              : invoice.deliveredAt && t('client.deliveredAt', { date: formatDateTime(invoice.deliveredAt, lang) })}
          </p>
        </div>
        <StatusBadge status={invoice.status} viewer="Client" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(invoice.amount, invoice.currency, lang)}</p>
      <p className="text-sm text-slate-500">
        {t('invoice.dueDate')}: {formatDate(invoice.dueDate, lang)}
      </p>
      {invoice.details && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{invoice.details}</p>}
      <div className="mt-auto flex flex-wrap items-start gap-2 pt-4">
        {children}
        <DownloadPdfButton invoice={invoice} />
      </div>
    </Card>
  );
}
