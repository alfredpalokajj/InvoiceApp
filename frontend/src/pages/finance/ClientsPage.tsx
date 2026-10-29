import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClients } from '../../api/queries';
import { Card, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';

export function ClientsPage() {
  const { t } = useTranslation();
  const clients = useClients();

  return (
    <>
      <PageHeader
        title={t('finance.clients.title')}
        subtitle={t('finance.clients.subtitle')}
        actions={
          <Link
            to="/finance/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <span aria-hidden="true">+</span> {t('finance.clients.new')}
          </Link>
        }
      />

      {clients.isPending ? (
        <Loading />
      ) : clients.isError ? (
        <ErrorAlert error={clients.error} />
      ) : clients.data.length === 0 ? (
        <EmptyState>{t('finance.clients.empty')}</EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 md:hidden">
            {clients.data.map((c) => (
              <li key={c.id}>
                <Link to={`/finance/clients/${c.id}`} className="block px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="text-sm font-semibold text-blue-700">{t('common.edit')}</span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{c.email}</p>
                  <p className="text-sm text-slate-600">{c.address}</p>
                  {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('finance.clients.name')}</th>
                  <th className="px-4 py-3">{t('finance.clients.email')}</th>
                  <th className="px-4 py-3">{t('finance.clients.phone')}</th>
                  <th className="px-4 py-3">{t('finance.clients.address')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {clients.data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.address}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/finance/clients/${c.id}`} className="font-semibold text-blue-700 hover:underline">
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
