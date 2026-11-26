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
  ExternalLink,
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
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-cream-300/70 rounded-lg w-1/4" />
          <div className="h-8 bg-cream-300/70 rounded-lg w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 bg-cream-300/60 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-cream-300/60 rounded-xl" />
      </div>
    );
  }

  const data = kpis!;

  // 8 Compact Metric Cards
  const metricsList = [
    {
      id: 'mrr' as MetricType,
      title: 'Monthly Recurring (MRR)',
      value: formatCurrency(data.monthlyRecurringRevenue),
      subtext: `${data.activeRetainers} Active Retainers`,
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
      subtext: 'Pending client balances',
      icon: AlertCircle,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      tag: 'Outstanding',
    },
    {
      id: 'expenses' as MetricType,
      title: 'Recognized Expenses',
      value: formatCurrency(data.totalExpenses),
      subtext: 'Operational disbursements',
      icon: Receipt,
      iconColor: 'text-rose-700 bg-rose-50 border-rose-200',
      tag: 'Operational',
    },
    {
      id: 'margin' as MetricType,
      title: 'Agency Profit Margin',
      value: `${data.profitMargin}%`,
      subtext: data.monthlyRevenue > 0 ? '(Profit / Inflow) × 100' : 'No cash recorded',
      icon: Percent,
      iconColor: 'text-violet-700 bg-violet-50 border-violet-200',
      tag: 'Yield Efficiency',
    },
    {
      id: 'workload' as MetricType,
      title: 'Active Workload',
      value: `${data.activeProjects} Dev / ${data.activeRetainers} Retainers`,
      subtext: `${data.activeClients} Active Clients`,
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
    <div className="space-y-4 pb-12">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">Executive Control Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Audited Ledger
            </span>
            {isFetching && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#991B1B] bg-red-50 border border-red-200">
                <Loader2 size={11} className="animate-spin" />
                <span>Syncing live...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-600 mt-0.5">
            Verified cash inflow, recognized agency spend, net profitability and live team output.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-cream-200 border border-cream-300 rounded-lg shadow-2xs self-start sm:self-auto">
          {(['30d', '6m', '12m'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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

      {/* Top Standard Grid: 8 Compact Interactive KPI Metric Cards (2 rows of 4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {metricsList.map((m) => {
          const isSelected = selectedMetric === m.id;
          const Icon = m.icon;

          return (
            <motion.button
              key={m.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(m.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-[#991B1B] shadow-md ring-2 ring-red-900/15'
                  : 'bg-white hover:bg-cream-50/60 border-cream-300 hover:border-cream-400 shadow-2xs'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`p-1 rounded-md border text-xs shrink-0 ${m.iconColor}`}>
                    <Icon size={13} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-charcoal-600 truncate">
                    {m.title}
                  </span>
                </div>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#991B1B] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-charcoal-400 bg-cream-100 px-1.5 py-0.5 rounded border border-cream-200 shrink-0">
                    {m.tag}
                  </span>
                )}
              </div>

              {/* Value */}
              <div className="mt-1.5">
                <p className="text-lg sm:text-xl font-black text-charcoal-900 tracking-tight leading-tight">
                  {m.value}
                </p>
                <p className="text-[10px] text-charcoal-500 truncate mt-0.5 font-medium">{m.subtext}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Main Dynamic Deep-Dive Console: Side-by-side Chart and Client Breakdown */}
      <div className="cream-card p-4 sm:p-5 border border-cream-300 shadow-xs rounded-2xl bg-white space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMetric}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* Dynamic Showcase Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cream-200 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-50 text-[#991B1B] border border-red-200">
                  {selectedMetric === 'mrr' && <CalendarClock size={18} />}
                  {selectedMetric === 'inflow' && <TrendingUp size={18} />}
                  {selectedMetric === 'net_profit' && <Scale size={18} />}
                  {selectedMetric === 'receivables' && <AlertCircle size={18} />}
                  {selectedMetric === 'expenses' && <Receipt size={18} />}
                  {selectedMetric === 'margin' && <Percent size={18} />}
                  {selectedMetric === 'workload' && <FolderGit2 size={18} />}
                  {selectedMetric === 'lifetime' && <DollarSign size={18} />}
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-charcoal-900 leading-tight">
                    {selectedMetric === 'mrr' && 'Monthly Recurring Revenue (MRR) Breakdown'}
                    {selectedMetric === 'inflow' && 'Verified Cash Inflow Performance'}
                    {selectedMetric === 'net_profit' && 'Monthly Net Profit & Margin Trend'}
                    {selectedMetric === 'receivables' && 'Pending Receivables & Outstanding Dues'}
                    {selectedMetric === 'expenses' && 'Recognized Operational Expenses'}
                    {selectedMetric === 'margin' && 'Operating Margin Yield Efficiency'}
                    {selectedMetric === 'workload' && 'Active Operational Deliverables Workload'}
                    {selectedMetric === 'lifetime' && 'Cumulative Lifetime Verified Income'}
                  </h2>
                  <p className="text-xs text-charcoal-600">
                    {selectedMetric === 'mrr' && 'Live breakdown of monthly retainers: kaunse client se kitna aa raha hai'}
                    {selectedMetric === 'inflow' && 'Audited cleared deposits and transaction timeline'}
                    {selectedMetric === 'net_profit' && 'Realized bottom-line margin after operational spend deductions'}
                    {selectedMetric === 'receivables' && 'Outstanding client contract balances awaiting clearance'}
                    {selectedMetric === 'expenses' && 'Operational disbursements approved by finance audit'}
                    {selectedMetric === 'margin' && 'Net profitability margin ratio across selected cycle'}
                    {selectedMetric === 'workload' && 'Current live projects and active monthly retainer contracts'}
                    {selectedMetric === 'lifetime' && 'Historical cumulative audited gross receipts'}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Metric Total</span>
                <span className="text-xl sm:text-2xl font-black text-charcoal-900">
                  {selectedMetric === 'mrr' && formatCurrency(data.monthlyRecurringRevenue)}
                  {selectedMetric === 'inflow' && formatCurrency(data.monthlyRevenue)}
                  {selectedMetric === 'net_profit' && formatCurrency(data.netProfit)}
                  {selectedMetric === 'receivables' && formatCurrency(data.pendingReceivables)}
                  {selectedMetric === 'expenses' && formatCurrency(data.totalExpenses)}
                  {selectedMetric === 'margin' && `${data.profitMargin}%`}
                  {selectedMetric === 'workload' && `${data.activeProjects} Dev / ${data.activeRetainers} Retainers`}
                  {selectedMetric === 'lifetime' && formatCurrency(data.totalLifetimeIncome)}
                </span>
              </div>
            </div>

            {/* Split Grid: Left = Graph (lg:col-span-7), Right = Client / Ledger Breakdown (lg:col-span-5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* LEFT COLUMN: High-Fidelity Interactive Graph */}
              <div className="lg:col-span-7 bg-[#FAF9F5] p-3.5 rounded-xl border border-cream-300 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                    {selectedMetric === 'mrr' && 'Monthly Recurring Inflow Trend'}
                    {selectedMetric === 'inflow' && 'Verified Inflow Trajectory'}
                    {selectedMetric === 'net_profit' && 'Realized Net Profit Evolution'}
                    {selectedMetric === 'receivables' && 'Monthly Revenue vs Expenses Inflow'}
                    {selectedMetric === 'expenses' && 'Expense Disbursements vs Inflow'}
                    {['margin', 'workload', 'lifetime'].includes(selectedMetric) && 'Multi-Cycle Revenue vs Spend'}
                  </h3>
                  <span className="text-[10px] text-charcoal-500 font-semibold bg-white px-2 py-0.5 rounded border border-cream-200">
                    {timeframe === '30d' ? '30 Days' : timeframe === '6m' ? '6 Months' : '12 Months'}
                  </span>
                </div>

                <div className="h-64 sm:h-72 bg-white p-2.5 rounded-lg border border-cream-300">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedMetric === 'mrr' ? (
                      <AreaChart data={data.revenueVsExpenses}>
                        <defs>
                          <linearGradient id="mrrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0891B2" stopOpacity={0.28} />
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
                        <Area type="monotone" dataKey="revenue" stroke="#0891B2" strokeWidth={2.5} fill="url(#mrrAreaGrad)" />
                      </AreaChart>
                    ) : selectedMetric === 'inflow' ? (
                      <BarChart data={data.revenueVsExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(val: any) => [formatCurrency(Number(val)), 'Verified Inflow']}
                        />
                        <Bar dataKey="revenue" name="Inflow" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : selectedMetric === 'net_profit' ? (
                      <AreaChart data={data.profitTrends}>
                        <defs>
                          <linearGradient id="netProfitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(val: any) => [formatCurrency(Number(val)), 'Net Profit']}
                        />
                        <Area type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2.5} fill="url(#netProfitGrad)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={data.revenueVsExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FAF7F0', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                          formatter={(val: any) => [formatCurrency(Number(val)), '']}
                        />
                        <Bar dataKey="revenue" name="Inflow" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RIGHT COLUMN: Client Contribution Ledger & Detail Breakdown */}
              <div className="lg:col-span-5 bg-[#FAF9F5] p-3.5 rounded-xl border border-cream-300 flex flex-col justify-between">
                {/* MRR Client Breakdown */}
                {selectedMetric === 'mrr' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                        Client Retainer Ledger ({data.mrrBreakdown?.length || 0})
                      </h3>
                      <span className="text-[10px] text-charcoal-500 font-medium">Kaunse se kitna</span>
                    </div>

                    <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1">
                      {data.mrrBreakdown && data.mrrBreakdown.length > 0 ? (
                        data.mrrBreakdown.map((r) => (
                          <div
                            key={r.retainerId}
                            className="p-2.5 bg-white rounded-lg border border-cream-300 hover:border-cream-400 transition-all shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-charcoal-900 block truncate">
                                  {r.clientName}
                                </span>
                                <span className="text-[10px] text-charcoal-500 truncate block">
                                  {r.businessName}
                                </span>
                              </div>
                              <span className="font-mono text-[9px] text-charcoal-600 bg-cream-100 px-1.5 py-0.5 rounded border border-cream-200 shrink-0">
                                {r.periodDates}
                              </span>
                            </div>

                            <div className="mt-2 pt-2 border-t border-cream-200 flex items-center justify-between text-[11px]">
                              <div>
                                <span className="text-[9px] text-charcoal-400 uppercase font-semibold block">Monthly Fee</span>
                                <span className="font-bold text-charcoal-900">{formatCurrency(r.monthlyFee)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-charcoal-400 uppercase font-semibold block">Advance Paid</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(r.tokenAmount)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-charcoal-400 uppercase font-semibold block">Is Mahine Baki</span>
                                <span className={`font-extrabold ${r.pendingBalance > 0 ? 'text-[#991B1B]' : 'text-emerald-700'}`}>
                                  {formatCurrency(r.pendingBalance)}
                                </span>
                              </div>
                              <NavLink
                                to={r.clientId ? `/admin/clients/${r.clientId}` : `/admin/clients`}
                                className="px-2 py-1 bg-cream-100 hover:bg-cream-200 text-charcoal-700 rounded text-[10px] font-semibold border border-cream-300 flex items-center gap-0.5 shrink-0"
                                title="Open Client Profile"
                              >
                                <Eye size={11} /> Profile
                              </NavLink>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-xs text-charcoal-500">
                          No active retainer contracts found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cash Inflow Transactions Breakdown */}
                {selectedMetric === 'inflow' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                        Recent Cleared Inflows ({data.recentInflows?.length || 0})
                      </h3>
                      <span className="text-[10px] text-charcoal-500 font-medium">Audited receipts</span>
                    </div>

                    <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1">
                      {data.recentInflows && data.recentInflows.length > 0 ? (
                        data.recentInflows.map((p) => (
                          <div
                            key={p._id}
                            className="p-2.5 bg-white rounded-lg border border-cream-300 hover:border-cream-400 transition-all shadow-2xs flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-charcoal-900 block truncate">{p.clientName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-charcoal-500">{formatDate(p.paymentDate)}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cream-100 text-charcoal-700 border border-cream-200 font-medium">
                                  {p.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-sm text-emerald-700 block">
                                {formatCurrency(p.amount)}
                              </span>
                              <span className="text-[9px] font-mono text-charcoal-400">{p.transactionReference}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-xs text-charcoal-500">
                          No cleared payment receipts in this period.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Receivables Breakdown */}
                {selectedMetric === 'receivables' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                        Client Dues Ledger ({data.receivablesBreakdown?.length || 0})
                      </h3>
                      <span className="text-[10px] text-[#991B1B] font-bold">Unsettled Balances</span>
                    </div>

                    <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1">
                      {data.receivablesBreakdown && data.receivablesBreakdown.length > 0 ? (
                        data.receivablesBreakdown.map((c) => (
                          <div
                            key={c._id}
                            className="p-2.5 bg-white rounded-lg border border-cream-300 hover:border-cream-400 transition-all shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-charcoal-900 block truncate">{c.clientName}</span>
                                <span className="text-[10px] text-charcoal-500">{c.businessName}</span>
                              </div>
                              <span className="text-xs font-extrabold text-[#991B1B] shrink-0">
                                {formatCurrency(c.remainingBalance)} due
                              </span>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-cream-200 flex items-center justify-between text-[10px]">
                              <span className="text-charcoal-600">Contract: {formatCurrency(c.totalContractAmount)}</span>
                              <NavLink
                                to={`/admin/clients/${c._id}`}
                                className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-[#991B1B] font-bold rounded border border-red-200 flex items-center gap-1"
                              >
                                View Client <ArrowRight size={10} />
                              </NavLink>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-xs text-emerald-700 font-semibold">
                          ✓ All clients have fully settled their balances!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Net Profit Summary */}
                {selectedMetric === 'net_profit' && (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
                        Realized Profit Breakdown
                      </h3>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700 font-medium">Verified Inflow</span>
                          <span className="text-xs font-extrabold text-emerald-700">
                            {formatCurrency(data.monthlyRevenue)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700 font-medium">Recognized Spend</span>
                          <span className="text-xs font-extrabold text-rose-700">
                            - {formatCurrency(data.totalExpenses)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border-2 border-emerald-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-900 font-bold">Net Realized Profit</span>
                          <span className="text-sm font-black text-emerald-800">
                            {formatCurrency(data.netProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-cream-100 rounded-lg border border-cream-300 text-[10px] text-charcoal-600 mt-2">
                      <span className="font-bold text-charcoal-800">Formula:</span> Realized Net Profit = Audited Cleared Inflow minus Approved Operational Disbursements.
                    </div>
                  </div>
                )}

                {/* Recognized Expenses Breakdown */}
                {selectedMetric === 'expenses' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                        Disbursement Categories
                      </h3>
                      <span className="text-[10px] text-rose-700 font-bold">Operational</span>
                    </div>

                    <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1">
                      {data.expensesBreakdown && data.expensesBreakdown.length > 0 ? (
                        data.expensesBreakdown.map((exp, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between shadow-2xs"
                          >
                            <span className="font-bold text-xs text-charcoal-800">{exp.category}</span>
                            <span className="text-xs font-black text-rose-700">{formatCurrency(exp.total)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-center text-xs text-charcoal-500">
                          No operational expenses recorded in this timeframe.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Margin, Workload, Lifetime Metrics */}
                {['margin', 'workload', 'lifetime'].includes(selectedMetric) && (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
                        {selectedMetric === 'margin' && 'Efficiency Overview'}
                        {selectedMetric === 'workload' && 'Active Production Units'}
                        {selectedMetric === 'lifetime' && 'Audited Lifetime Milestones'}
                      </h3>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700">Web Dev Projects Active</span>
                          <span className="text-xs font-bold text-charcoal-900">{data.activeProjects}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700">Monthly Retainers Active</span>
                          <span className="text-xs font-bold text-charcoal-900">{data.activeRetainers}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700">Total Active Clients</span>
                          <span className="text-xs font-bold text-charcoal-900">{data.activeClients}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-cream-300 flex items-center justify-between">
                          <span className="text-xs text-charcoal-700">Agency Profit Margin</span>
                          <span className="text-xs font-black text-emerald-700">{data.profitMargin}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-cream-100 rounded-lg border border-cream-300 text-[10px] text-charcoal-600 mt-2">
                      Real-time aggregated health statistics audited across active contracts and delivery milestones.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Secondary Bottom Section: Revenue by Category & Sales Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Service Revenue Distribution */}
        <div className="cream-card p-4">
          <h2 className="text-sm font-bold text-charcoal-900 mb-0.5">Revenue by Service Category</h2>
          <p className="text-xs text-charcoal-600 mb-3">Payment distribution across offerings</p>
          <div className="h-48 flex items-center justify-center">
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
                    outerRadius={70}
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
        <div className="cream-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Sales Team Performance Leaderboard</h2>
              <p className="text-xs text-charcoal-600">Attributed conversions and deal revenue per representative</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-cream-200 text-charcoal-800 border border-cream-300">
              Active Quotas
            </span>
          </div>

          <div className="overflow-x-auto border border-cream-300 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-3">Sales Member</th>
                  <th className="py-2 px-3">Leads Assigned</th>
                  <th className="py-2 px-3">Converted Clients</th>
                  <th className="py-2 px-3 text-right">Attributed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300 bg-white">
                {data.salesPerformance.length > 0 ? (
                  data.salesPerformance.map((member, idx) => (
                    <tr key={idx} className="hover:bg-cream-100/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-charcoal-900">{member.name}</td>
                      <td className="py-2.5 px-3 text-charcoal-700">{member.leads}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{member.conversions}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">{formatCurrency(member.revenue)}</td>
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
