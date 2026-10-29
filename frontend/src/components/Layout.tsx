import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath, useAuth } from '../auth/AuthContext';
import { useInvoiceHub } from '../realtime/useInvoiceHub';
import type { Role } from '../api/types';
import { LanguageToggle } from './LanguageToggle';

type NavItem = { to: string; key: string; end?: boolean };

const financeNav: NavItem[] = [
  { to: '/finance', key: 'nav.dashboard', end: true },
  { to: '/finance/clients', key: 'nav.clients' },
  { to: '/finance/couriers', key: 'nav.couriers' },
];

const navByRole: Record<Role, NavItem[]> = {
  SuperAdmin: [...financeNav, { to: '/admin', key: 'nav.users' }],
  Finance: financeNav,
  Courier: [{ to: '/courier', key: 'nav.myDeliveries', end: true }],
  Client: [{ to: '/client', key: 'nav.myInvoices', end: true }],
};

const linkTone = (isActive: boolean) =>
  isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

export function Layout() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuth();
  const live = useInvoiceHub(token);
  const { pathname } = useLocation();
  // Remembers the page the menu was opened on, so navigating anywhere closes it.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;
  const closeMenu = () => setMenuOpenAt(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpenAt(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (!user) return null;
  const nav = navByRole[user.role];
  const liveLabel = live ? t('live.connected') : t('live.disconnected');
  const liveDot = <span className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-300'}`} />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 lg:gap-6">
          <Link to={homePath(user.role)} className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-bold text-slate-900">{t('app.name')}</span>
          </Link>

          <nav className="hidden gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${linkTone(isActive)}`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${live ? 'text-emerald-700' : 'text-slate-400'}`}
              title={liveLabel}
            >
              {liveDot}
              <span className="hidden lg:inline">{liveLabel}</span>
            </span>
            <LanguageToggle />
            <div className="hidden text-right leading-tight lg:block">
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

          <button
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpenAt(pathname))}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.menu')}
            className="-mr-2 ml-auto rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div
            id="main-menu"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) => `rounded-lg px-3 py-2.5 text-base font-medium transition ${linkTone(isActive)}`}
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>

            <div className="space-y-4 border-t border-slate-200 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-medium text-slate-900">{user.fullName}</p>
                  <p className="text-sm text-slate-500">{t(`roles.${user.role}`)}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${live ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {liveDot}
                  {liveLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <LanguageToggle />
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Tap outside the menu to close it. Kept outside the header: its backdrop-blur would trap `fixed`. */}
      {menuOpen && <div className="fixed inset-0 z-10 bg-slate-900/20 md:hidden" onClick={closeMenu} aria-hidden="true" />}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
