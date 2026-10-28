import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useInvoiceHub } from '../realtime/useInvoiceHub';
import type { Role } from '../api/types';
import { LanguageToggle } from './LanguageToggle';

const navByRole: Record<Role, { to: string; key: string; end?: boolean }[]> = {
  Finance: [
    { to: '/finance', key: 'nav.dashboard', end: true },
    { to: '/finance/clients', key: 'nav.clients' },
    { to: '/finance/couriers', key: 'nav.couriers' },
  ],
  Courier: [{ to: '/courier', key: 'nav.myDeliveries', end: true }],
  Client: [{ to: '/client', key: 'nav.myInvoices', end: true }],
};

export function Layout() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuth();
  const live = useInvoiceHub(token);
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-bold text-slate-900">{t('app.name')}</span>
          </div>

          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {navByRole[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 text-xs font-medium sm:inline-flex ${live ? 'text-emerald-700' : 'text-slate-400'}`}
              title={live ? t('live.connected') : t('live.disconnected')}
            >
              <span className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {live ? t('live.connected') : t('live.disconnected')}
            </span>
            <LanguageToggle />
            <div className="hidden text-right leading-tight md:block">
              <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-500">{t(`roles.${user.role}`)}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
