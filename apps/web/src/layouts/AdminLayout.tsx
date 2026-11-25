import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  FolderGit2,
  CalendarClock,
  CreditCard,
  Receipt,
  TrendingUp,
  UserCheck,
  BookOpen,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const navigationItems = [
  { name: 'Executive Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Lead Pipeline', href: '/admin/leads', icon: Target },
  { name: 'Client Directory', href: '/admin/clients', icon: Users },
  { name: 'Web Dev Projects', href: '/admin/projects', icon: FolderGit2 },
  { name: 'Social Media Retainers', href: '/admin/retainers', icon: CalendarClock },
  { name: 'Service Catalog', href: '/admin/catalog', icon: Layers },
  { name: 'Proposal PDF Generator', href: '/admin/proposals', icon: FileText },
  { name: 'Team Live Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Payments Ledger', href: '/admin/payments', icon: CreditCard },
  { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
  { name: 'Financial Reports', href: '/admin/finance', icon: TrendingUp },
  { name: 'Sales Team Management', href: '/admin/team', icon: UserCheck },
  { name: 'Knowledge Center', href: '/admin/knowledge', icon: BookOpen },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, organization, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen max-w-full bg-[#F5F6F8] flex font-sans overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300 flex flex-col fixed inset-y-0 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#DC2626] to-[#7F1D1D] flex items-center justify-center font-bold text-white text-xs shadow-md shadow-red-900/30">
                J
              </div>
              <div className="truncate">
                <span className="font-bold text-white tracking-tight text-xs block">Jugarr CRM</span>
                <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider block">
                  Super Admin
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-[#DC2626] to-[#7F1D1D] flex items-center justify-center font-bold text-white text-xs">
              J
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#991B1B] text-white shadow-md shadow-red-900/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1E293B]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#090D16] border border-[#1E293B]">
            <div className="w-8 h-8 rounded-full bg-red-900 text-red-200 border border-red-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!collapsed && (
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{organization?.name}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Body */}
      <div className={`flex-1 min-w-0 max-w-full flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] sticky top-0 z-20 px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 rounded-full">
              Super Admin Executive Portal
            </span>
            <span className="text-gray-300 text-xs">•</span>
            <span className="text-xs text-gray-700 font-semibold">{organization?.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/admin/notifications"
              className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 relative transition-colors"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
            </NavLink>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-xs text-gray-700 font-mono font-medium">{user?.email}</span>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
