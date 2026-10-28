import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ClientFormPage } from './pages/finance/ClientFormPage';
import { ClientsPage } from './pages/finance/ClientsPage';
import { CouriersPage } from './pages/finance/CouriersPage';
import { DashboardPage } from './pages/finance/DashboardPage';
import { InvoiceDetailPage } from './pages/finance/InvoiceDetailPage';
import { InvoiceFormPage } from './pages/finance/InvoiceFormPage';
import { CourierHomePage } from './pages/courier/CourierHomePage';
import { CourierInvoicePage } from './pages/courier/CourierInvoicePage';
import { ClientHomePage } from './pages/client/ClientHomePage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePath(user.role) : '/login'} replace />;
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-slate-600">{t('common.notFound')}</p>
      <Link to="/" className="font-semibold text-blue-700 hover:underline">
        {t('common.goHome')}
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/finance"
        element={
          <RequireRole role="Finance">
            <Layout />
          </RequireRole>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="invoices/new" element={<InvoiceFormPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientFormPage />} />
        <Route path="clients/:id" element={<ClientFormPage />} />
        <Route path="couriers" element={<CouriersPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/courier"
        element={
          <RequireRole role="Courier">
            <Layout />
          </RequireRole>
        }
      >
        <Route index element={<CourierHomePage />} />
        <Route path="invoices/:id" element={<CourierInvoicePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/client"
        element={
          <RequireRole role="Client">
            <Layout />
          </RequireRole>
        }
      >
        <Route index element={<ClientHomePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
