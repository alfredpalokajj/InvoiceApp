import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

/** A button that asks for an in-page confirmation before running an irreversible status change. */
export function ConfirmAction({
  label,
  question,
  confirmLabel,
  onConfirm,
  loading,
  variant = 'primary',
  className = '',
}: {
  label: ReactNode;
  question: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  loading?: boolean;
  variant?: 'primary' | 'success';
  className?: string;
}) {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button variant={variant} onClick={() => setAsking(true)} className={className}>
        {label}
      </Button>
    );
  }

  return (
    <div className={`rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 ${className}`}>
      <p className="mb-3 text-sm font-medium text-slate-800">{question}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant={variant} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" disabled={loading} onClick={() => setAsking(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
