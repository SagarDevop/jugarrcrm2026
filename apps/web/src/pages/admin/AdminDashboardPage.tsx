import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { AdminDashboardKPIs } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  TrendingUp,
  Receipt,
  Scale,
  Percent,
  CalendarClock,
  AlertCircle,
  DollarSign,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  Eye,
  Loader2,
  Layers,
  ArrowUpRight,
  Building,
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

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0284C7', '#DB2777', '#E11D48'];

type MetricType =
  | 'mrr'
  | 'inflow'
  | 'net_profit'
  | 'receivables'
  | 'expenses'
  | 'margin'
  | 'workload'
  | 'lifetime';

export const AdminDashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30d' | '6m' | '12m'>('6m');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('mrr');

  const {
    data: kpis,
    isLoading,
    isFetching,
  } = useQuery<AdminDashboardKPIs>({
    queryKey: ['admin-finance-overview', timeframe],
    queryFn: () => api.get(`/finance/overview?timeframe=${timeframe}`),
    placeholderData: (previousData) => previousData, // Eliminates blank screen flicker!
  });

  if (isLoading && !kpis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-cream-300/70 rounded-lg w-1/4" />
          <div className="h-8 bg-cream-300/70 rounded-lg w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-cream-300/60 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-8 h-96 bg-cream-300/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const data = kpis!;

  // 8 Metrics Config
  const metricsList = [
    {
      id: 'mrr' as MetricType,
      title: 'Monthly Recurring (MRR)',
      value: formatCurrency(data.monthlyRecurringRevenue),
      subtext: `${data.activeRetainers} Active Retainers on schedule`,
      icon: CalendarClock,
      iconColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      tag: 'Monthly Flow',
    },
    {
      id: 'inflow' as MetricType,
      title: 'Verified Cash Inflow',
      value: formatCurrency(data.monthlyRevenue),
      subtext: 'Audited cleared deposits',
      icon: TrendingUp,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      tag: 'Liquid Cash',
    },
    {
      id: 'net_profit' as MetricType,
      title: 'Net Profit',
      value: formatCurrency(data.netProfit),
      subtext: 'Inflow - Recognized Expenses',
      icon: Scale,
      iconColor: data.netProfit >= 0 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-rose-700 bg-rose-50 border-rose-200',
      tag: data.netProfit >= 0 ? 'Positive Margin' : 'Negative',
    },
    {
      id: 'receivables' as MetricType,
      title: 'Pending Receivables',
      value: formatCurrency(data.pendingReceivables),
      subtext: 'Pending client contract balances',
      icon: AlertCircle,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      tag: 'Outstanding',
    },
    {
      id: 'expenses' as MetricType,
      title: 'Recognized Expenses',
      value: formatCurrency(data.totalExpenses),
      subtext: 'Approved operational spend',
      icon: Receipt,
      iconColor: 'text-rose-700 bg-rose-50 border-rose-200',
      tag: 'Operational',
    },
    {
      id: 'margin' as MetricType,
      title: 'Agency Profit Margin',
      value: `${data.profitMargin}%`,
      subtext: data.monthlyRevenue > 0 ? '(Net Profit / Cash Inflow) × 100' : 'No cash recorded',
      icon: Percent,
      iconColor: 'text-violet-700 bg-violet-50 border-violet-200',
      tag: 'Yield Efficiency',
    },
    {
      id: 'workload' as MetricType,
      title: 'Active Workload',
      value: `${data.activeProjects} Dev / ${data.activeRetainers} Retainers`,
      subtext: `${data.activeClients} Active Clients (${data.totalClients} Total)`,
      icon: FolderGit2,
      iconColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      tag: 'Delivery Output',
    },
    {
      id: 'lifetime' as MetricType,
      title: 'Lifetime Verified Income',
      value: formatCurrency(data.totalLifetimeIncome),
      subtext: 'Cumulative audited ledger',
      icon: DollarSign,
      iconColor: 'text-emerald-800 bg-emerald-100/60 border-emerald-300',
      tag: 'Milestone',
    },
  ];

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
            {isFetching && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#991B1B] bg-red-50 border border-red-200">
                <Loader2 size={11} className="animate-spin" />
                <span>Syncing live...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Click any metric box to showcase detailed performance charts and client contribution ledger.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-cream-200 border border-cream-300 rounded-lg shadow-2xs self-start sm:self-auto">
          {(['30d', '6m', '12m'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                timeframe === t
                  ? 'bg-charcoal-900 text-white shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-100'
              }`}
            >
              {t === '30d' ? 'Last 30 Days' : t === '6m' ? 'Last 6 Months' : 'Last 12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Showcase (Left 8 KPI Selector Boxes + Right Dynamic Graph & Breakdown Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 Interactive Metric Boxes */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
          {metricsList.map((m) => {
            const isSelected = selectedMetric === m.id;
            const Icon = m.icon;

            return (
              <motion.button
                key={m.id}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedMetric(m.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white border-[#991B1B] shadow-md ring-2 ring-red-900/15'
                    : 'bg-white/80 hover:bg-white border-cream-300 hover:border-cream-400 shadow-2xs'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeGlowPill"
                    className="absolute -left-1 top-2.5 bottom-2.5 w-1.5 bg-[#991B1B] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border text-xs ${m.iconColor}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-600">
                      {m.title}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                      isSelected
                        ? 'bg-red-50 text-[#991B1B] border-red-200'
                        : 'bg-cream-100 text-charcoal-600 border-cream-200'
                    }`}
                  >
                    {isSelected ? 'Active View' : m.tag}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-xl font-extrabold text-charcoal-900">{m.value}</p>
                  <span className="text-[10px] text-charcoal-500 font-medium flex items-center gap-0.5">
                    {isSelected && <span className="text-[#991B1B] font-bold">Details</span>}
                    <ArrowRight size={11} className={isSelected ? 'text-[#991B1B]' : 'text-charcoal-400'} />
                  </span>
                </div>

                <p className="text-[10px] text-charcoal-500 mt-0.5 truncate">{m.subtext}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Right Column: Dynamic Deep-Dive Graph & Client Breakdown Showcase */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMetric}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="cream-card p-6 border-2 border-cream-300 shadow-sm space-y-6"
            >
              {/* Dynamic Header */}
              {selectedMetric === 'mrr' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800 border border-cyan-200">
                          <CalendarClock size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">
                          Monthly Recurring Revenue (MRR) Breakdown
                        </h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">
                        Live breakdown of monthly retainers: kaunse client se kitna aa raha hai
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Total Monthly MRR</span>
                      <span className="text-2xl font-black text-cyan-800">
                        {formatCurrency(data.monthlyRecurringRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* MRR Trend Area Chart */}
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
                      Monthly Recurring Inflow Trend
                    </h3>
                    <div className="h-56 bg-white p-3 rounded-xl border border-cream-300">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.revenueVsExpenses}>
                          <defs>
                            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0891B2" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#0891B2" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                            formatter={(val: any) => [formatCurrency(Number(val)), 'Cash Inflow']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#0891B2" strokeWidth={2.5} fill="url(#mrrGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Client-wise MRR Contribution Table ("Kaunse se kitna aa raha hai") */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                        Active Retainer Accounts Contribution ({data.mrrBreakdown?.length || 0})
                      </h3>
                      <span className="text-[11px] text-charcoal-500 font-medium">Audited active contracts</span>
                    </div>

                    <div className="overflow-x-auto border border-cream-300 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F6F0] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3.5">Client & Business</th>
                            <th className="py-2.5 px-3">Current Period Cycle</th>
                            <th className="py-2.5 px-3 text-right">Monthly Fee</th>
                            <th className="py-2.5 px-3 text-right">Advance Paid</th>
                            <th className="py-2.5 px-3 text-right">Is Mahine Baki</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                          {data.mrrBreakdown && data.mrrBreakdown.length > 0 ? (
                            data.mrrBreakdown.map((r) => (
                              <tr key={r.retainerId} className="hover:bg-cream-100/60 transition-colors">
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-charcoal-900">{r.clientName}</div>
                                  <div className="text-[11px] text-charcoal-500">{r.businessName}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-mono text-[11px] text-charcoal-700 bg-cream-200 px-1.5 py-0.5 rounded border border-cream-300">
                                    {r.periodDates}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-extrabold text-charcoal-900">
                                  {formatCurrency(r.monthlyFee)}
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-emerald-700">
                                  {formatCurrency(r.tokenAmount)}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span
                                    className={`font-extrabold ${
                                      r.pendingBalance > 0 ? 'text-[#991B1B]' : 'text-emerald-700'
                                    }`}
                                  >
                                    {formatCurrency(r.pendingBalance)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <NavLink
                                    to="/admin/clients"
                                    className="p-1 hover:bg-cream-200 text-charcoal-600 hover:text-charcoal-900 rounded inline-block"
                                    title="View Client Directory"
                                  >
                                    <Eye size={13} />
                                  </NavLink>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-charcoal-500">
                                No active monthly retainers found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Verified Cash Inflow Selected */}
              {selectedMetric === 'inflow' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <TrendingUp size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">Verified Cash Inflow Performance</h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">Cleared deposits and transactions in the selected period</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Total Cleared Inflow</span>
                      <span className="text-2xl font-black text-emerald-700">
                        {formatCurrency(data.monthlyRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* Revenue vs Expenses Bar Graph */}
                  <div className="h-60 bg-white p-3 rounded-xl border border-cream-300">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.revenueVsExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(val: any) => [formatCurrency(Number(val)), 'Inflow']}
                        />
                        <Bar dataKey="revenue" name="Verified Inflow" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recent Verified Payments Table */}
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2.5">
                      Recent Cleared Inflow Transactions
                    </h3>
                    <div className="overflow-x-auto border border-cream-300 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F6F0] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Ref / UTR</th>
                            <th className="py-2.5 px-3 text-right">Cleared Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                          {data.recentInflows && data.recentInflows.length > 0 ? (
                            data.recentInflows.map((p) => (
                              <tr key={p._id} className="hover:bg-cream-100/60 transition-colors">
                                <td className="py-2.5 px-3 text-charcoal-600 font-medium">{formatDate(p.paymentDate)}</td>
                                <td className="py-2.5 px-3 font-bold text-charcoal-900">{p.clientName}</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded bg-cream-200 text-charcoal-800 text-[10px] font-semibold border border-cream-300">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[10px] text-charcoal-600">{p.transactionReference}</td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                                  {formatCurrency(p.amount)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-charcoal-500">
                                No cleared payments recorded in this timeframe.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Pending Receivables Selected */}
              {selectedMetric === 'receivables' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">Pending Receivables & Dues Ledger</h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">Outstanding contract balances awaiting client clearance</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Total Dues Receivable</span>
                      <span className="text-2xl font-black text-amber-700">
                        {formatCurrency(data.pendingReceivables)}
                      </span>
                    </div>
                  </div>

                  {/* Dues List */}
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2.5">
                      Client-Wise Pending Dues Breakdown ({data.receivablesBreakdown?.length || 0})
                    </h3>
                    <div className="overflow-x-auto border border-cream-300 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F6F0] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3.5">Client & Business</th>
                            <th className="py-2.5 px-3">Service Category</th>
                            <th className="py-2.5 px-3 text-right">Contract Value</th>
                            <th className="py-2.5 px-3 text-right">Pending Balance Due</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                          {data.receivablesBreakdown && data.receivablesBreakdown.length > 0 ? (
                            data.receivablesBreakdown.map((c) => (
                              <tr key={c._id} className="hover:bg-cream-100/60 transition-colors">
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-charcoal-900">{c.clientName}</div>
                                  <div className="text-[11px] text-charcoal-500">{c.businessName}</div>
                                </td>
                                <td className="py-3 px-3 text-charcoal-700">{c.serviceCategory}</td>
                                <td className="py-3 px-3 text-right font-semibold text-charcoal-800">
                                  {formatCurrency(c.totalContractAmount)}
                                </td>
                                <td className="py-3 px-3 text-right font-extrabold text-[#991B1B]">
                                  {formatCurrency(c.remainingBalance)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <NavLink
                                    to={`/admin/clients/${c._id}`}
                                    className="px-2.5 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-900 rounded font-semibold text-[11px] inline-flex items-center gap-1 border border-cream-300"
                                  >
                                    <Eye size={12} /> View
                                  </NavLink>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-emerald-700 font-medium">
                                ✓ No pending dues! All clients have cleared their contract balances.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Net Profit Selected */}
              {selectedMetric === 'net_profit' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                          <Scale size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">Monthly Net Profit Trend</h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">Realized bottom-line margin evolution</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Net Realized Profit</span>
                      <span className={`text-2xl font-black ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(data.netProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="h-64 bg-white p-3 rounded-xl border border-cream-300">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.profitTrends}>
                        <defs>
                          <linearGradient id="profitGradShow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(value: any) => [formatCurrency(Number(value)), 'Net Profit']}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2.5} fill="url(#profitGradShow)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Recognized Expenses Selected */}
              {selectedMetric === 'expenses' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                          <Receipt size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">Recognized Expenses & Spend Categories</h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">Operational disbursements approved by finance audit</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Total Recognized Spend</span>
                      <span className="text-2xl font-black text-rose-700">
                        {formatCurrency(data.totalExpenses)}
                      </span>
                    </div>
                  </div>

                  {/* Expenses Distribution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.expensesBreakdown && data.expensesBreakdown.length > 0 ? (
                      data.expensesBreakdown.map((exp, idx) => (
                        <div key={idx} className="p-4 bg-white border border-cream-300 rounded-xl flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">{exp.category}</span>
                            <span className="text-lg font-bold text-charcoal-900">{formatCurrency(exp.total)}</span>
                          </div>
                          <span className="text-xs text-charcoal-600 bg-cream-100 px-2 py-1 rounded-md border border-cream-200 font-medium">
                            Disbursed
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-charcoal-500 bg-white rounded-xl border border-cream-300">
                        No operational expenses recorded yet.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Profit Margin, Workload or Lifetime Selected */}
              {['margin', 'workload', 'lifetime'].includes(selectedMetric) && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Layers size={16} />
                        </span>
                        <h2 className="text-base font-extrabold text-charcoal-900">
                          {selectedMetric === 'margin'
                            ? 'Operating Profit Margin Efficiency'
                            : selectedMetric === 'workload'
                            ? 'Active Operational Deliverables Workload'
                            : 'Cumulative Lifetime Verified Income'}
                        </h2>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1">Multi-cycle performance metrics & resource allocation</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Executive Metric</span>
                      <span className="text-2xl font-black text-charcoal-900">
                        {selectedMetric === 'margin'
                          ? `${data.profitMargin}%`
                          : selectedMetric === 'workload'
                          ? `${data.activeProjects} Dev / ${data.activeRetainers} Retainers`
                          : formatCurrency(data.totalLifetimeIncome)}
                      </span>
                    </div>
                  </div>

                  <div className="h-64 bg-white p-3 rounded-xl border border-cream-300">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.revenueVsExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(value: any) => [formatCurrency(Number(value)), '']}
                        />
                        <Bar dataKey="revenue" name="Inflow" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Secondary Bottom Section: Revenue by Category & Sales Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Service Revenue Distribution */}
        <div className="cream-card p-5">
          <h2 className="text-sm font-bold text-charcoal-900 mb-1">Revenue by Service Category</h2>
          <p className="text-xs text-charcoal-600 mb-4">Payment distribution across offerings</p>
          <div className="h-52 flex items-center justify-center">
            {data.serviceRevenueBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.serviceRevenueBreakdown}
                    dataKey="amount"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {data.serviceRevenueBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-charcoal-500">No payment category data recorded yet</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {data.serviceRevenueBreakdown.map((item, idx) => (
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
              <p className="text-xs text-charcoal-600">Attributed conversions and deal revenue per representative</p>
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
                {data.salesPerformance.length > 0 ? (
                  data.salesPerformance.map((member, idx) => (
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
