import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminDashboardKPIs } from '@agencyos/shared';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  Receipt,
  Scale,
  Percent,
  CalendarClock,
  AlertCircle,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminFinancePage: React.FC = () => {
  const { data: kpis, isLoading } = useQuery<AdminDashboardKPIs>({
    queryKey: ['admin-finance-overview', '12m'],
    queryFn: () => api.get('/finance/overview?timeframe=12m'),
  });

  if (isLoading || !kpis) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-cream-300/60 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-cream-300/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Financial Reports & Profitability</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Audited GAAP
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          Audited accounting distinguishing verified cash inflow, recognized expenses and outstanding receivables
        </p>
      </div>

      {/* Accounting Principles Callout */}
      <div className="cream-card p-5 flex items-start gap-3 bg-gradient-to-r from-[#FAF7F0] to-[#F5EFE6]">
        <Scale className="text-charcoal-900 shrink-0 mt-0.5" size={20} />
        <div className="text-xs text-charcoal-800">
          <p className="font-bold text-charcoal-900 text-sm">Strict Cash Accounting & Financial Verification Rule</p>
          <p className="text-charcoal-600 mt-1 leading-relaxed">
            Pending payments and verbal commitments are strictly excluded from cleared income. Profit is calculated exclusively from verified receipts minus approved expenses: <strong>Net Profit = ₹{kpis.monthlyRevenue.toLocaleString()} - ₹{kpis.totalExpenses.toLocaleString()} = {formatCurrency(kpis.netProfit)}</strong>.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cream-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Total Cleared Receipts</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{formatCurrency(kpis.monthlyRevenue)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Verified cash deposited into agency accounts</p>
        </div>

        <div className="cream-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Recognized Expenses</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">{formatCurrency(kpis.totalExpenses)}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Approved agency operations spend</p>
        </div>

        <div className="cream-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-600">Realized Profit Margin</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{kpis.profitMargin}%</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Net profit as percentage of verified inflow</p>
        </div>
      </div>

      {/* Receivables & MRR Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cream-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> Outstanding Receivables
            </h2>
            <span className="text-base font-extrabold text-amber-700">{formatCurrency(kpis.pendingReceivables)}</span>
          </div>
          <p className="text-xs text-charcoal-600">
            Total active client balances that have not yet been cleared into bank accounts.
          </p>
          <div className="p-3 bg-white border border-cream-300 rounded-lg text-xs flex justify-between shadow-xs">
            <span className="text-charcoal-600 font-medium">Active Retainers Monthly Potential</span>
            <span className="font-bold text-charcoal-900">{formatCurrency(kpis.monthlyRecurringRevenue)}</span>
          </div>
        </div>

        <div className="cream-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <CalendarClock size={16} className="text-cyan-700" /> Recurring MRR
            </h2>
            <span className="text-base font-extrabold text-cyan-800">{formatCurrency(kpis.monthlyRecurringRevenue)}</span>
          </div>
          <p className="text-xs text-charcoal-600">
            Total predictable monthly cash flow generated across {kpis.activeRetainers} active retainers.
          </p>
          <div className="p-3 bg-white border border-cream-300 rounded-lg text-xs flex justify-between shadow-xs">
            <span className="text-charcoal-600 font-medium">Total Lifetime Cleared Income</span>
            <span className="font-bold text-emerald-700">{formatCurrency(kpis.totalLifetimeIncome)}</span>
          </div>
        </div>
      </div>

      {/* 12-Month Profitability Chart */}
      <div className="cream-card p-5">
        <h2 className="text-sm font-bold text-charcoal-900 mb-1">12-Month Profitability Trajectory</h2>
        <p className="text-xs text-charcoal-600 mb-4">Historical monthly bottom line</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpis.profitTrends}>
              <defs>
                <linearGradient id="finProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
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
              <Area type="monotone" dataKey="profit" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#finProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
