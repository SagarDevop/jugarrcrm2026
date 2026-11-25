import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { SalesLayout } from './layouts/SalesLayout';

// Auth
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminRetainersPage } from './pages/admin/AdminRetainersPage';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminExpensesPage } from './pages/admin/AdminExpensesPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';
import { AdminKnowledgePage } from './pages/admin/AdminKnowledgePage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Sales Pages
import { SalesDashboardPage } from './pages/sales/SalesDashboardPage';
import { SalesLeadsPage } from './pages/sales/SalesLeadsPage';
import { SalesClientsPage } from './pages/sales/SalesClientsPage';
import { SalesCatalogPage } from './pages/sales/SalesCatalogPage';
import { SalesProposalPage } from './pages/sales/SalesProposalPage';
import { SalesCallsPage } from './pages/sales/SalesCallsPage';
import { SalesFollowupsPage } from './pages/sales/SalesFollowupsPage';
import { SalesTargetsPage } from './pages/sales/SalesTargetsPage';
import { SalesKnowledgePage } from './pages/sales/SalesKnowledgePage';
import { SalesPlaybooksPage } from './pages/sales/SalesPlaybooksPage';

// Shared
import { ClientDetailsPage } from './pages/common/ClientDetailsPage';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { ChatPage } from './pages/common/ChatPage';

export const App: React.FC = () => {
  const { checkAuth, user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Super Admin Workspace Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailsPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="retainers" element={<AdminRetainersPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="proposals" element={<SalesProposalPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="expenses" element={<AdminExpensesPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="team" element={<AdminTeamPage />} />
        <Route path="knowledge" element={<AdminKnowledgePage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Sales Workspace Routes */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['SALES_MEMBER', 'SUPER_ADMIN']}>
            <SalesLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="dashboard" element={<SalesDashboardPage />} />
        <Route path="leads" element={<SalesLeadsPage />} />
        <Route path="clients" element={<SalesClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailsPage />} />
        <Route path="catalog" element={<SalesCatalogPage />} />
        <Route path="proposals" element={<SalesProposalPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="calls" element={<SalesCallsPage />} />
        <Route path="followups" element={<SalesFollowupsPage />} />
        <Route path="targets" element={<SalesTargetsPage />} />
        <Route path="knowledge" element={<SalesKnowledgePage />} />
        <Route path="playbooks" element={<SalesPlaybooksPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-400">
              Loading AgencyOS...
            </div>
          ) : isAuthenticated && user ? (
            user.role === 'SUPER_ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/sales/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
