import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadInvoicePdf } from '../api/queries';
import type { Invoice } from '../api/types';
import { Button } from './ui';

/** Downloads the invoice PDF in the current UI language. */
export function DownloadPdfButton({ invoice, className }: { invoice: Pick<Invoice, 'id' | 'number'>; className?: string }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    setBusy(true);
    setFailed(false);
    try {
      await downloadInvoicePdf(invoice, i18n.language);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={download} loading={busy} className={className} title={failed ? t('errors.generic') : undefined}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
        <path d="M10 2a1 1 0 0 1 1 1v7.6l2.3-2.3 1.4 1.4L10 14.4 5.3 9.7l1.4-1.4L9 10.6V3a1 1 0 0 1 1-1ZM4 15h12v2H4z" />
      </svg>
      {failed ? t('errors.generic') : t('common.downloadPdf')}
    </Button>
  );
}
