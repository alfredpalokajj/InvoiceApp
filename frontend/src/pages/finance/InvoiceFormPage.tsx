import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClients, useInvoice, useSaveInvoice } from '../../api/queries';
import { Alert, Button, Card, ErrorAlert, Field, Input, Loading, PageHeader, Select, Textarea } from '../../components/ui';
import { todayIso } from '../../lib/format';

const CURRENCY = 'EUR';

/** Create a new invoice, or edit one that is still in status Created (`/finance/invoices/:id/edit`). */
export function InvoiceFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceId = id ? Number(id) : undefined;

  const clients = useClients();
  const existing = useInvoice(invoiceId);
  const save = useSaveInvoice(invoiceId);

  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(todayIso(30));
  const [details, setDetails] = useState('');

  // Fill the form once the invoice being edited has loaded.
  const loaded = invoiceId ? existing.data : undefined;
  useEffect(() => {
    if (!loaded) return;
    setClientId(String(loaded.client.id));
    setAmount(String(loaded.amount));
    setIssueDate(loaded.issueDate);
    setDueDate(loaded.dueDate);
    setDetails(loaded.details);
  }, [loaded]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const saved = await save.mutateAsync({
      clientId: Number(clientId),
      amount: Number(amount),
      currency: CURRENCY,
      details,
      issueDate,
      dueDate,
    });
    navigate(`/finance/invoices/${saved.id}`);
  }

  if (invoiceId && existing.isPending) return <Loading />;
  if (invoiceId && existing.isError) return <ErrorAlert error={existing.error} />;
  if (loaded && loaded.status !== 'Created') return <Alert>{t('errors.not_editable')}</Alert>;

  const title = loaded ? t('finance.invoiceForm.editTitle', { number: loaded.number }) : t('finance.invoiceForm.newTitle');

  return (
    <>
      <PageHeader title={title} />
      <Card className="max-w-2xl p-6">
        {clients.data?.length === 0 ? (
          <div className="space-y-4">
            <Alert tone="info">{t('finance.invoiceForm.noClients')}</Alert>
            <Link to="/finance/clients/new" className="text-sm font-semibold text-blue-700 hover:underline">
              {t('finance.invoiceForm.addClient')} →
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => submit(e).catch(() => {})} className="space-y-5">
            <Field label={t('invoice.client')}>
              <Select required value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="" disabled>
                  {t('finance.invoiceForm.selectClient')}
                </option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.address}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={`${t('invoice.amount')} (${CURRENCY})`}>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular-nums"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('invoice.issueDate')}>
                <Input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </Field>
              <Field label={t('invoice.dueDate')}>
                <Input type="date" required min={issueDate} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
            </div>

            <Field label={t('invoice.details')}>
              <Textarea
                rows={4}
                maxLength={4000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('finance.invoiceForm.detailsPlaceholder')}
              />
            </Field>

            <ErrorAlert error={save.error} />

            <div className="flex gap-2">
              <Button type="submit" loading={save.isPending}>
                {invoiceId ? t('common.save') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
