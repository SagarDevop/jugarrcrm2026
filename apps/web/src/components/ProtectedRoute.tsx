import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole, Permission, USER_ROLES } from '@agencyos/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Authenticating AgencyOS session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a sales member tries to access an admin route, send them safely to sales dashboard
    if (user.role === USER_ROLES.SALES_MEMBER) {
      return <Navigate to="/sales/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Permission validation
  if (requiredPermission && user.role !== USER_ROLES.SUPER_ADMIN) {
    if (!user.permissions?.includes(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-900 text-slate-300">
          <div className="glass-panel p-8 rounded-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-400 mb-4">
              You do not have permission to access this module ({requiredPermission}).
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
