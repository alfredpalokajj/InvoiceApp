import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClient, useSaveClient } from '../../api/queries';
import { Alert, Button, Card, ErrorAlert, Field, Input, Loading, PageHeader } from '../../components/ui';
import { LocationPicker, type LatLng } from '../../maps';

/** New client (`/finance/clients/new`) or edit (`/finance/clients/:id`). */
export function ClientFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const clientId = id ? Number(id) : undefined;
  const existing = useClient(clientId);
  const save = useSaveClient(clientId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [missingLocation, setMissingLocation] = useState(false);

  useEffect(() => {
    const c = existing.data;
    if (!c) return;
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setLocation({ lat: c.latitude, lng: c.longitude });
  }, [existing.data]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!location) {
      setMissingLocation(true);
      return;
    }
    await save.mutateAsync({
      name,
      email,
      phone,
      address,
      latitude: location.lat,
      longitude: location.lng,
      ...(clientId ? {} : { password }),
    });
    navigate('/finance/clients');
  }

  if (clientId && existing.isPending) return <Loading />;
  if (clientId && existing.isError) return <ErrorAlert error={existing.error} />;

  return (
    <>
      <PageHeader title={clientId ? t('finance.clients.edit') : t('finance.clients.new')} />
      <Card className="max-w-3xl p-6">
        <form onSubmit={(e) => submit(e).catch(() => {})} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('finance.clients.name')}>
              <Input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('finance.clients.phone')}>
              <Input type="tel" maxLength={50} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t('finance.clients.email')}>
              <Input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {!clientId && (
              <Field label={t('finance.clients.password')} hint={t('finance.clients.passwordHint')}>
                <Input
                  type="text"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
          </div>

          <Field label={t('finance.clients.address')}>
            <Input required maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">{t('finance.clients.location')}</p>
            <p className="mb-2 text-xs text-slate-500">{t('maps.hint')}</p>
            <LocationPicker
              value={location}
              onChange={(pos, foundAddress) => {
                setLocation(pos);
                setMissingLocation(false);
                // Fill the address from search results, but never overwrite what the user typed.
                if (foundAddress && !address.trim()) setAddress(foundAddress);
              }}
            />
            {location && (
              <p className="mt-2 text-xs tabular-nums text-slate-500">
                {t('maps.selected', { lat: location.lat.toFixed(5), lng: location.lng.toFixed(5) })}
              </p>
            )}
          </div>

          {missingLocation && <Alert>{t('finance.clients.locationRequired')}</Alert>}
          <ErrorAlert error={save.error} />

          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              {clientId ? t('common.save') : t('common.create')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/finance/clients')}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
