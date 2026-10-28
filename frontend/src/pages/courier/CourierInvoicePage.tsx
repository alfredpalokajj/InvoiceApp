import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoice, useInvoiceTransition } from '../../api/queries';
import { ConfirmAction } from '../../components/ConfirmAction';
import { DownloadPdfButton } from '../../components/DownloadPdfButton';
import { InvoiceSummary } from '../../components/InvoiceSummary';
import { StatusTimeline } from '../../components/StatusTimeline';
import { Button, Card, ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';
import { distanceKm } from '../../lib/format';
import { DeliveryMap } from '../../maps';
import { useGeolocation } from '../../maps/useGeolocation';

export function CourierInvoicePage() {
  const { t } = useTranslation();
  const id = Number(useParams().id);
  const invoice = useInvoice(id);
  const transition = useInvoiceTransition();
  const geo = useGeolocation();

  if (invoice.isPending) return <Loading />;
  if (invoice.isError) return <ErrorAlert error={invoice.error} />;
  const inv = invoice.data;
  const destination = { lat: inv.client.latitude, lng: inv.client.longitude };
  // Works without an API key; on phones it opens the Google Maps app.
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;

  return (
    <>
      <PageHeader
        title={inv.number}
        actions={
          <Link to="/courier" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            ← {t('common.back')}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="size-2.5 rounded-full bg-blue-600" /> {t('courier.yourLocation')}
                <span className="ml-3 size-2.5 rounded-full bg-rose-600" /> {t('courier.destination')}
              </span>
              {geo.position ? (
                <span className="font-semibold tabular-nums text-slate-900">
                  {t('courier.distance', { km: distanceKm(geo.position, destination).toFixed(1) })}
                </span>
              ) : geo.error ? (
                <span className="text-amber-700">{t(`courier.geo.${geo.error}`)}</span>
              ) : (
                <span className="flex items-center gap-2 text-slate-500">
                  <Spinner className="size-4" /> {t('courier.locating')}
                </span>
              )}
            </div>
            <DeliveryMap destination={destination} destinationLabel={inv.client.address} current={geo.position} />
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={navigationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                {t('courier.openNavigation')} ↗
              </a>
              {inv.client.phone && (
                <a
                  href={`tel:${inv.client.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  {t('courier.call')} {inv.client.phone}
                </a>
              )}
            </div>
          </Card>

          <InvoiceSummary invoice={inv} viewer="Courier" />
        </div>

        <div className="space-y-6">
          {(inv.status === 'ReadyForDelivery' || inv.status === 'InTransit') && (
            <Card className="p-5">
              {inv.status === 'ReadyForDelivery' && (
                <Button
                  className="w-full py-3 text-base"
                  loading={transition.isPending}
                  onClick={() => transition.mutate({ id: inv.id, action: 'start' })}
                >
                  {t('courier.start')}
                </Button>
              )}
              {inv.status === 'InTransit' && (
                <ConfirmAction
                  variant="success"
                  className="w-full py-3 text-base"
                  label={t('courier.deliver')}
                  question={t('courier.confirmDeliver')}
                  confirmLabel={t('courier.confirmDeliverYes')}
                  loading={transition.isPending}
                  onConfirm={() => transition.mutate({ id: inv.id, action: 'deliver' })}
                />
              )}
              {transition.error != null && (
                <div className="mt-3">
                  <ErrorAlert error={transition.error} />
                </div>
              )}
            </Card>
          )}
          <Card className="p-5">
            <StatusTimeline invoice={inv} />
            <DownloadPdfButton invoice={inv} className="mt-5 w-full" />
          </Card>
        </div>
      </div>
    </>
  );
}
