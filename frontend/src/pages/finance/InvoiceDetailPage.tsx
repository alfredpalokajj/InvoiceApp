import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCouriers, useInvoice, useInvoiceTransition } from '../../api/queries';
import { DownloadPdfButton } from '../../components/DownloadPdfButton';
import { InvoiceSummary } from '../../components/InvoiceSummary';
import { StatusTimeline } from '../../components/StatusTimeline';
import { Alert, Button, Card, ErrorAlert, Field, Loading, PageHeader, Select } from '../../components/ui';
import { DeliveryMap } from '../../maps';

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const id = Number(useParams().id);
  const invoice = useInvoice(id);

  if (invoice.isPending) return <Loading />;
  if (invoice.isError) return <ErrorAlert error={invoice.error} />;
  const inv = invoice.data;

  return (
    <>
      <PageHeader
        title={inv.number}
        actions={
          <>
            <Link to="/finance" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              ← {t('common.back')}
            </Link>
            {inv.status === 'Created' && (
              <Link
                to={`/finance/invoices/${inv.id}/edit`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                {t('common.edit')}
              </Link>
            )}
            <DownloadPdfButton invoice={inv} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InvoiceSummary invoice={inv} viewer="Finance" />
          {inv.status === 'Created' && <MarkReadyCard invoiceId={inv.id} />}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('finance.invoiceDetail.deliveryLocation')}</h2>
            <DeliveryMap
              destination={{ lat: inv.client.latitude, lng: inv.client.longitude }}
              destinationLabel={inv.client.address}
              current={null}
            />
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('finance.invoiceDetail.timeline')}</h2>
          <StatusTimeline invoice={inv} />
        </Card>
      </div>
    </>
  );
}

function MarkReadyCard({ invoiceId }: { invoiceId: number }) {
  const { t } = useTranslation();
  const couriers = useCouriers();
  const transition = useInvoiceTransition();
  const [courierId, setCourierId] = useState('');

  return (
    <Card className="border-l-4 border-amber-400 p-5">
      <h2 className="text-sm font-semibold text-slate-900">{t('finance.invoiceDetail.assignCourier')}</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">{t('finance.invoiceDetail.markReadyHint')}</p>
      {couriers.data?.length === 0 ? (
        <Alert tone="info">
          {t('finance.invoiceDetail.noCouriers')}{' '}
          <Link to="/finance/couriers" className="font-semibold underline">
            {t('nav.couriers')}
          </Link>
        </Alert>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Field label={t('invoice.courier')}>
              <Select value={courierId} onChange={(e) => setCourierId(e.target.value)}>
                <option value="" disabled>
                  {t('finance.invoiceDetail.selectCourier')}
                </option>
                {couriers.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button
            disabled={!courierId}
            loading={transition.isPending}
            onClick={() => transition.mutate({ id: invoiceId, action: 'ready', courierId: Number(courierId) })}
          >
            {t('finance.invoiceDetail.markReady')}
          </Button>
        </div>
      )}
      {transition.error != null && (
        <div className="mt-3">
          <ErrorAlert error={transition.error} />
        </div>
      )}
    </Card>
  );
}
