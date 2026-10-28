import { useTranslation } from 'react-i18next';
import { INVOICE_STATUSES, type Invoice, type InvoiceStatus } from '../api/types';
import { formatDateTime } from '../lib/format';

const timestampOf: Record<InvoiceStatus, (i: Invoice) => string | null> = {
  Created: (i) => i.createdAt,
  ReadyForDelivery: (i) => i.readyAt,
  InTransit: (i) => i.startedAt,
  Delivered: (i) => i.deliveredAt,
  Paid: (i) => i.paidAt,
};

export function StatusTimeline({ invoice }: { invoice: Invoice }) {
  const { t, i18n } = useTranslation();
  const currentIndex = INVOICE_STATUSES.indexOf(invoice.status);

  return (
    <ol className="space-y-0">
      {INVOICE_STATUSES.map((status, index) => {
        const done = index <= currentIndex;
        const at = timestampOf[status](invoice);
        const last = index === INVOICE_STATUSES.length - 1;
        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
            <span
              className={`relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-2 ${
                done ? 'bg-blue-600 ring-blue-600' : 'bg-white ring-slate-300'
              }`}
            >
              {done && (
                <svg viewBox="0 0 20 20" className="size-3 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M7.7 13.3 4.4 10l-1.1 1.1 4.4 4.4 9.4-9.4-1.1-1.1z" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${done ? 'text-slate-900' : 'text-slate-400'}`}>{t(`status.${status}`)}</p>
              {at && done && <p className="text-xs text-slate-500">{formatDateTime(at, i18n.language)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
