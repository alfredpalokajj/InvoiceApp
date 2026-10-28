import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath, useAuth } from '../auth/AuthContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { Button, Card, ErrorAlert, Field, Input } from '../components/ui';
import type { Role } from '../api/types';

const DEMO_PASSWORD = 'Demo123!';
const demoAccounts: { email: string; role: Role }[] = [
  { email: 'finance@demo.com', role: 'Finance' },
  { email: 'postieri1@demo.com', role: 'Courier' },
  { email: 'postieri2@demo.com', role: 'Courier' },
  { email: 'alfa@demo.com', role: 'Client' },
  { email: 'gama@demo.com', role: 'Client' },
];

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePath(user.role)} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith(homePath(u.role)) ? from : homePath(u.role), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/favicon.svg" alt="" className="mb-3 size-12" />
        <h1 className="text-2xl font-bold text-slate-900">{t('app.name')}</h1>
        <p className="text-sm text-slate-500">{t('app.tagline')}</p>
      </div>

      <Card className="w-full max-w-sm p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{t('login.title')}</h2>
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('login.email')}>
            <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('login.password')}>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorAlert error={error} />
          <Button type="submit" loading={busy} className="w-full">
            {t('login.submit')}
          </Button>
        </form>
      </Card>

      {import.meta.env.DEV && (
        <Card className="mt-4 w-full max-w-sm p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('login.demoAccounts')}</p>
          <div className="grid gap-1">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
              >
                <span className="text-slate-800">{a.email}</span>
                <span className="text-xs text-slate-500">{t(`roles.${a.role}`)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{t('login.demoHint', { password: DEMO_PASSWORD })}</p>
        </Card>
      )}
    </div>
  );
}
