import { useTranslation } from 'react-i18next';
import type { InvoiceStatus, Role } from '../api/types';

const styles: Record<InvoiceStatus, string> = {
  Created: 'bg-slate-100 text-slate-700 ring-slate-300',
  ReadyForDelivery: 'bg-amber-50 text-amber-800 ring-amber-300',
  InTransit: 'bg-blue-50 text-blue-800 ring-blue-300',
  Delivered: 'bg-rose-50 text-rose-800 ring-rose-300',
  Paid: 'bg-emerald-50 text-emerald-800 ring-emerald-300',
};

export const statusDot: Record<InvoiceStatus, string> = {
  Created: 'bg-slate-400',
  ReadyForDelivery: 'bg-amber-500',
  InTransit: 'bg-blue-600',
  Delivered: 'bg-rose-500',
  Paid: 'bg-emerald-600',
};

/** Couriers see "Ready for delivery" as "Pending" — it's waiting on them. */
export function statusLabelKey(status: InvoiceStatus, viewer?: Role) {
  return viewer === 'Courier' && status === 'ReadyForDelivery' ? 'status.Pending' : `status.${status}`;
}

export function StatusBadge({ status, viewer }: { status: InvoiceStatus; viewer?: Role }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      <span className={`size-1.5 rounded-full ${statusDot[status]}`} />
      {t(statusLabelKey(status, viewer))}
    </span>
  );
}
