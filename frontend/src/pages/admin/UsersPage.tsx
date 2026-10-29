import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../../api/queries';
import { ROLES, type Role } from '../../api/types';
import { Card, EmptyState, ErrorAlert, Loading, PageHeader, Select } from '../../components/ui';

export function UsersPage() {
  const { t } = useTranslation();
  const users = useUsers();
  const [role, setRole] = useState<Role | ''>('');

  const filtered = useMemo(
    () => (role ? users.data?.filter((u) => u.role === role) : users.data) ?? [],
    [users.data, role],
  );

  return (
    <>
      <PageHeader
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          <>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role | '')} className="sm:w-auto">
              <option value="">{t('common.all')}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </Select>
            <Link
              to="/admin/users/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <span aria-hidden="true">+</span> {t('admin.users.new')}
            </Link>
          </>
        }
      />

      {users.isPending ? (
        <Loading />
      ) : users.isError ? (
        <ErrorAlert error={users.error} />
      ) : filtered.length === 0 ? (
        <EmptyState>{t('admin.users.empty')}</EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((u) => (
              <li key={u.id}>
                <Link to={`/admin/users/${u.id}`} className="block px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{u.fullName}</span>
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {t(`roles.${u.role}`)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{u.email}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('admin.users.fullName')}</th>
                  <th className="px-4 py-3">{t('admin.users.email')}</th>
                  <th className="px-4 py-3">{t('admin.users.role')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {t(`roles.${u.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/users/${u.id}`} className="font-semibold text-blue-700 hover:underline">
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
