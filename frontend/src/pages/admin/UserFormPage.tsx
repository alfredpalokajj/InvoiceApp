import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSaveUser, useUser } from '../../api/queries';
import type { Role } from '../../api/types';
import { Alert, Button, Card, ErrorAlert, Field, Input, Loading, PageHeader, Select } from '../../components/ui';

// Client logins need an address and location, so they're created on the Clients page instead.
const CREATABLE_ROLES: Role[] = ['SuperAdmin', 'Finance', 'Courier'];

/** New user (`/admin/users/new`) or edit (`/admin/users/:id`). The role is fixed once created. */
export function UserFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id ? Number(id) : undefined;
  const existing = useUser(userId);
  const save = useSaveUser(userId);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Finance');

  useEffect(() => {
    const u = existing.data;
    if (!u) return;
    setFullName(u.fullName);
    setEmail(u.email);
  }, [existing.data]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await save.mutateAsync(
      userId ? { fullName, email, password: password || null } : { fullName, email, password, role },
    );
    navigate('/admin');
  }

  if (userId && existing.isPending) return <Loading />;
  if (userId && existing.isError) return <ErrorAlert error={existing.error} />;
  const user = existing.data;

  return (
    <>
      <PageHeader title={userId ? t('admin.users.edit') : t('admin.users.new')} />
      <Card className="max-w-xl p-6">
        <form onSubmit={(e) => submit(e).catch(() => {})} className="space-y-5">
          <Field label={t('admin.users.fullName')}>
            <Input required maxLength={200} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label={t('admin.users.email')}>
            <Input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          {user ? (
            <Field label={t('admin.users.role')} hint={t('admin.users.roleFixed')}>
              <Input value={t(`roles.${user.role}`)} disabled readOnly />
            </Field>
          ) : (
            <Field label={t('admin.users.role')}>
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {CREATABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label={userId ? t('admin.users.newPassword') : t('admin.users.password')}
            hint={userId ? t('admin.users.newPasswordHint') : undefined}
          >
            <Input
              type="text"
              required={!userId}
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {!userId && (
            <Alert tone="info">
              {t('admin.users.clientHint')}{' '}
              <Link to="/finance/clients/new" className="font-semibold underline">
                {t('admin.users.addClient')}
              </Link>
            </Alert>
          )}
          {user?.clientId && (
            <Link to={`/finance/clients/${user.clientId}`} className="block text-sm font-semibold text-blue-700 hover:underline">
              {t('admin.users.editClient')}
            </Link>
          )}

          <ErrorAlert error={save.error} />

          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              {userId ? t('common.save') : t('common.create')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
