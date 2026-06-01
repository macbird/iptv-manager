import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ChangePasswordPage } from './features/auth/pages/ChangePasswordPage';
import { AppShell } from './app/layouts/AppShell';
import { AdminShell } from './app/layouts/AdminShell';
import { PlansPage } from './features/plans/pages/PlansPage';
import { CreatePlanPage } from './features/plans/pages/CreatePlanPage';
import { EditPlanPage } from './features/plans/pages/EditPlanPage';
import { ServersPage } from './features/servers/pages/ServersPage';
import { CreateServerPage } from './features/servers/pages/CreateServerPage';
import { EditServerPage } from './features/servers/pages/EditServerPage';
import { CustomersPage } from './features/customers/pages/CustomersPage';
import { CreateCustomerPage } from './features/customers/pages/CreateCustomerPage';
import { EditCustomerPage } from './features/customers/pages/EditCustomerPage';
import { AdminLoginPage } from './features/admin/pages/AdminLoginPage';
import { AccountsPage } from './features/admin/pages/AccountsPage';
import { CreateAccountPage } from './features/admin/pages/CreateAccountPage';
import { EditAccountPage } from './features/admin/pages/EditAccountPage';
import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { UserProfilePage } from './features/auth/pages/UserProfilePage';
import { TenantSettingsPage } from './features/settings/pages/TenantSettingsPage';
import { InvoicesPage } from './features/billing/pages/InvoicesPage';
import { InvoiceDetailPage } from './features/billing/pages/InvoiceDetailPage';
import { PaymentsPage } from './features/billing/pages/PaymentsPage';
import { PaymentDetailPage } from './features/billing/pages/PaymentDetailPage';
import { AdminProfilePage } from './features/admin/pages/AdminProfilePage';
import { AdminSettingsPage } from './features/admin/pages/AdminSettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={routerFutureFlags}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plans" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <PlansPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plans/new" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreatePlanPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plans/:id/edit" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <EditPlanPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/servers" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <ServersPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/servers/new" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreateServerPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/servers/:id/edit" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <EditServerPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <CustomersPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers/new" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <CreateCustomerPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers/:id/edit" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <EditCustomerPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <UserProfilePage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TenantSettingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <AppShell>
                  <InvoicesPage variant="tenant" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <InvoiceDetailPage variant="tenant" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PaymentsPage variant="tenant" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PaymentDetailPage variant="tenant" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <AdminDashboardPage />
                </AdminShell>
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <AdminProfilePage />
                </AdminShell>
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/accounts" 
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <AccountsPage />
                </AdminShell>
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/accounts/new" 
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <CreateAccountPage />
                </AdminShell>
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/accounts/:id/edit" 
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <EditAccountPage />
                </AdminShell>
              </AdminProtectedRoute>
            } 
          />
          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <AdminSettingsPage />
                </AdminShell>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <InvoicesPage variant="admin" />
                </AdminShell>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/invoices/:id"
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <InvoiceDetailPage variant="admin" />
                </AdminShell>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <PaymentsPage variant="admin" />
                </AdminShell>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/payments/:id"
            element={
              <AdminProtectedRoute>
                <AdminShell>
                  <PaymentDetailPage variant="admin" />
                </AdminShell>
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
