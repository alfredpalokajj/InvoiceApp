import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCouriers, useCreateCourier } from '../../api/queries';
import { Alert, Button, Card, EmptyState, ErrorAlert, Field, Input, Loading, PageHeader } from '../../components/ui';

export function CouriersPage() {
  const { t } = useTranslation();
  const couriers = useCouriers();
  const create = useCreateCourier();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ fullName, email, password });
    setFullName('');
    setEmail('');
    setPassword('');
  }

  return (
    <>
      <PageHeader title={t('finance.couriers.title')} subtitle={t('finance.couriers.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {couriers.isPending ? (
            <Loading />
          ) : couriers.isError ? (
            <ErrorAlert error={couriers.error} />
          ) : couriers.data.length === 0 ? (
            <EmptyState>{t('finance.couriers.empty')}</EmptyState>
          ) : (
            <Card>
              <ul className="divide-y divide-slate-100">
                {couriers.data.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-800">
                      {c.fullName
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">{t('finance.couriers.add')}</h2>
          <form onSubmit={(e) => submit(e).catch(() => {})} className="space-y-4">
            <Field label={t('finance.couriers.fullName')}>
              <Input required maxLength={200} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label={t('finance.couriers.email')}>
              <Input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t('finance.couriers.password')}>
              <Input
                type="text"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <ErrorAlert error={create.error} />
            {create.isSuccess && <Alert tone="success">{t('finance.couriers.added')}</Alert>}
            <Button type="submit" loading={create.isPending} className="w-full">
              {t('finance.couriers.add')}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
