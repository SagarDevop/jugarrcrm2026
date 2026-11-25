import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SalesDashboardKPIs } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Target,
  Users,
  PhoneCall,
  CalendarCheck2,
  Trophy,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { NavLink } from 'react-router-dom';

export const SalesDashboardPage: React.FC = () => {
  const { data: kpis, isLoading } = useQuery<SalesDashboardKPIs>({
    queryKey: ['sales-dashboard-kpis'],
    queryFn: () => api.get('/sales/dashboard'),
  });

  if (isLoading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-cream-300/60 animate-pulse rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-cream-300/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const targetProgress =
    kpis.monthlyTarget > 0 ? Math.min(100, Math.round((kpis.attributedRevenue / kpis.monthlyTarget) * 100)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Target Banner */}
      <div className="cream-card p-6 relative overflow-hidden bg-gradient-to-r from-[#FAF7F0] via-[#FDFBF7] to-[#F5EFE6]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Personal Performance Track
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 mt-2">Sales Operations Command</h1>
            <p className="text-xs text-charcoal-600 mt-1 max-w-lg">
              Manage your high-velocity lead conversions, log discovery calls, pace scheduled follow-ups and review verified commission incentives.
            </p>
          </div>

          {/* Monthly Target Progress Widget */}
          <div className="bg-white border border-cream-300 p-4 rounded-xl min-w-[280px] shadow-sm">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-charcoal-600 font-medium">Monthly Target:</span>
              <span className="font-bold text-charcoal-900">{formatCurrency(kpis.monthlyTarget)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-charcoal-600 font-medium">Attributed Revenue:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(kpis.attributedRevenue)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden border border-cream-300">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-1.5">
              <span>Quota Pace</span>
              <span className="font-bold text-emerald-700">{targetProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Leads */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Active Pipeline Leads</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <Target size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-charcoal-900 mt-3">{kpis.myActiveLeads}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Out of {kpis.myTotalLeads} total assigned leads</p>
        </div>

        {/* Converted Clients */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Converted Clients</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-3">{kpis.myConvertedClients}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">{kpis.conversionRate}% Conversion Velocity</p>
        </div>

        {/* Call Activity */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Total Calls Logged</span>
            <div className="p-2 bg-violet-50 text-violet-700 rounded-lg border border-violet-200">
              <PhoneCall size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-charcoal-900 mt-3">{kpis.totalCalls}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Discovery calls & client check-ins</p>
        </div>

        {/* Commission Earned */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Earned Commission</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Trophy size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-3">{formatCurrency(kpis.commissionEarned)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Verified cash inflows credited</p>
        </div>
      </div>

      {/* Row 2: Lead Funnel & Upcoming Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage distribution */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Lead Pipeline Distribution</h2>
              <p className="text-xs text-charcoal-600">Breakdown of active prospects across sales stages</p>
            </div>
            <NavLink to="/sales/leads" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              Open Board <ArrowRight size={13} />
            </NavLink>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.leadStageBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DDD2" vertical={false} />
                <XAxis dataKey="stage" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F0',
                    borderColor: '#E3DDD2',
                    borderRadius: '8px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  }}
                />
                <Bar dataKey="count" name="Leads" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Live Team Feed</h2>
              <p className="text-xs text-charcoal-600">Recent events across onboardings, calls and receipts</p>
            </div>
            <span className="text-[11px] font-semibold text-charcoal-600 bg-cream-200 px-2.5 py-0.5 rounded-md border border-cream-300">
              Live Stream
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
            {kpis.recentActivity.length > 0 ? (
              kpis.recentActivity.map((act) => (
                <div key={act._id} className="p-3 bg-white border border-cream-300 rounded-lg flex items-start gap-3 shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-charcoal-900">{act.title}</p>
                    <p className="text-[11px] text-charcoal-600 truncate mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-charcoal-500 whitespace-nowrap">{formatDate(act.createdAt)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-charcoal-500 text-center py-8">No recent activity events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
