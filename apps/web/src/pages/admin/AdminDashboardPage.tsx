import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminDashboardKPIs } from '@agencyos/shared';
import { formatCurrency } from '../../lib/utils';
import {
  Users,
  FolderGit2,
  CalendarClock,
  TrendingUp,
  Receipt,
  Scale,
  Percent,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0284C7', '#DB2777'];

export const AdminDashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30d' | '6m' | '12m'>('6m');

  const { data: kpis, isLoading } = useQuery<AdminDashboardKPIs>({
    queryKey: ['admin-finance-overview', timeframe],
    queryFn: () => api.get(`/finance/overview?timeframe=${timeframe}`),
  });

  if (isLoading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-cream-300/60 animate-pulse rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-cream-300/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Executive Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Audited Ledger
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Verified cash inflow, recognized agency spend, net profitability and live team output
          </p>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-1 p-1 bg-cream-200 border border-cream-300 rounded-lg shadow-sm">
          {(['30d', '6m', '12m'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === t
                  ? 'bg-charcoal-900 text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
              }`}
            >
              {t === '30d' ? 'Last 30 Days' : t === '6m' ? 'Last 6 Months' : 'Last 12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Core Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cleared Cash Inflow */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Verified Cash Inflow</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-charcoal-900 mt-3">{formatCurrency(kpis.monthlyRevenue)}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
            <CheckCircle2 size={12} />
            <span>Strict cleared deposits only</span>
          </div>
        </div>

        {/* Recognized Expenses */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Recognized Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-charcoal-900 mt-3">{formatCurrency(kpis.totalExpenses)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Approved operational disbursements</p>
        </div>

        {/* Net Profit */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Net Profit</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <Scale size={16} />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold mt-3 ${
              kpis.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(kpis.netProfit)}
          </p>
          <p className="text-[11px] text-charcoal-500 mt-1">Formula: Inflow - Recognized Expenses</p>
        </div>

        {/* Agency Profit Margin */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Profit Margin</span>
            <div className="p-2 bg-violet-50 text-violet-700 rounded-lg border border-violet-200">
              <Percent size={16} />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold mt-3 ${
              kpis.profitMargin >= 0 ? 'text-violet-800' : 'text-rose-700'
            }`}
          >
            {kpis.profitMargin}%
          </p>
          <p className="text-[11px] text-charcoal-500 mt-1">
            {kpis.monthlyRevenue > 0 ? '(Net Profit / Cash Inflow) × 100' : 'No cash inflow recorded'}
          </p>
        </div>
      </div>

      {/* Row 2: Recurring & Operating Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Monthly Recurring (MRR)</span>
            <CalendarClock size={16} className="text-cyan-700" />
          </div>
          <p className="text-xl font-bold text-charcoal-900 mt-2">{formatCurrency(kpis.monthlyRecurringRevenue)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">{kpis.activeRetainers} active retainers on schedule</p>
        </div>

        {/* Pending Receivables */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Pending Receivables</span>
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-2">{formatCurrency(kpis.pendingReceivables)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Pending client contract balances</p>
        </div>

        {/* Lifetime Income */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Lifetime Verified Income</span>
            <DollarSign size={16} className="text-emerald-700" />
          </div>
          <p className="text-xl font-bold text-charcoal-900 mt-2">{formatCurrency(kpis.totalLifetimeIncome)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Cumulative audited transactions</p>
        </div>

        {/* Active Workload */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Active Workload</span>
            <FolderGit2 size={16} className="text-blue-700" />
          </div>
          <p className="text-xl font-bold text-charcoal-900 mt-2">
            {kpis.activeProjects} Dev / {kpis.activeRetainers} Retainers
          </p>
          <p className="text-[11px] text-charcoal-500 mt-1">{kpis.activeClients} Active Clients ({kpis.totalClients} Total)</p>
        </div>
      </div>

      {/* Row 3: Revenue vs Expenses and Profit Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Revenue vs Recognized Expenses</h2>
              <p className="text-xs text-charcoal-600">Verified cash inflow vs approved expenditures</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-charcoal-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-charcoal-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Expenses
              </span>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DDD2" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F0',
                    borderColor: '#E3DDD2',
                    borderRadius: '8px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                />
                <Bar dataKey="revenue" name="Verified Inflow" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit Trend */}
        <div className="cream-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Monthly Net Profit Trend</h2>
              <p className="text-xs text-charcoal-600">Realized bottom-line margin evolution</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Positive Yield
            </span>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.profitTrends}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DDD2" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F0',
                    borderColor: '#E3DDD2',
                    borderRadius: '8px',
                    color: '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Net Profit']}
                />
                <Area type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Service Revenue Breakdown & Sales Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Revenue Distribution */}
        <div className="cream-card p-5">
          <h2 className="text-sm font-bold text-charcoal-900 mb-1">Revenue by Category</h2>
          <p className="text-xs text-charcoal-600 mb-4">Payment distribution across services</p>
          <div className="h-56 flex items-center justify-center">
            {kpis.serviceRevenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis.serviceRevenueBreakdown}
                    dataKey="amount"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {kpis.serviceRevenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF7F0',
                      borderColor: '#E3DDD2',
                      borderRadius: '8px',
                      color: '#111827',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-charcoal-500">No payment category data recorded yet</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {kpis.serviceRevenueBreakdown.map((item, idx) => (
              <span key={idx} className="text-[11px] text-charcoal-700 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {item.service}
              </span>
            ))}
          </div>
        </div>

        {/* Sales Team Performance Leaderboard */}
        <div className="cream-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Sales Team Performance Leaderboard</h2>
              <p className="text-xs text-charcoal-600">Revenue attributed and client conversions per member</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cream-200 text-charcoal-800 border border-cream-300">
              Active Quotas
            </span>
          </div>

          <div className="overflow-x-auto border border-cream-300 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Sales Member</th>
                  <th className="py-2.5 px-3">Leads Assigned</th>
                  <th className="py-2.5 px-3">Converted Clients</th>
                  <th className="py-2.5 px-3 text-right">Attributed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300 bg-white">
                {kpis.salesPerformance.length > 0 ? (
                  kpis.salesPerformance.map((member, idx) => (
                    <tr key={idx} className="hover:bg-cream-100/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-charcoal-900">{member.name}</td>
                      <td className="py-3 px-3 text-charcoal-700">{member.leads}</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">{member.conversions}</td>
                      <td className="py-3 px-3 text-right font-bold text-charcoal-900">{formatCurrency(member.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-charcoal-500">
                      No sales members or attributed data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
