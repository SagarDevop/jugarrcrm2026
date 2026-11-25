import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Commission, SalesDashboardKPIs } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Trophy, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';

export const SalesTargetsPage: React.FC = () => {
  const { data: kpis } = useQuery<SalesDashboardKPIs>({
    queryKey: ['sales-dashboard-kpis'],
    queryFn: () => api.get('/sales/dashboard'),
  });

  const { data: commissions, isLoading } = useQuery<Commission[]>({
    queryKey: ['sales-commissions'],
    queryFn: () => api.get('/commissions'),
  });

  const progress =
    kpis && kpis.monthlyTarget > 0 ? Math.min(100, Math.round((kpis.attributedRevenue / kpis.monthlyTarget) * 100)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Sales Targets & Commission Payouts</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified Incentive Track
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          Real-time target pacing and verified commissions earned on cleared deals
        </p>
      </div>

      {/* Target Progress Banner */}
      <div className="cream-card p-6 bg-gradient-to-r from-[#FAF7F0] via-[#FDFBF7] to-[#F5EFE6]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-xs text-charcoal-500 block uppercase font-bold tracking-wider">Monthly Quota</span>
            <span className="text-2xl font-extrabold text-charcoal-900 mt-1 block">
              {formatCurrency(kpis?.monthlyTarget || 50000)}
            </span>
          </div>

          <div>
            <span className="text-xs text-charcoal-500 block uppercase font-bold tracking-wider">Attributed Cleared Revenue</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
              {formatCurrency(kpis?.attributedRevenue || 0)}
            </span>
          </div>

          <div>
            <span className="text-xs text-charcoal-500 block uppercase font-bold tracking-wider">Total Commission Earned</span>
            <span className="text-2xl font-extrabold text-amber-700 mt-1 block">
              {formatCurrency(kpis?.commissionEarned || 0)}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-cream-300">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-charcoal-700 font-semibold">Target Completion Velocity</span>
            <span className="font-extrabold text-emerald-700">{progress}%</span>
          </div>
          <div className="w-full bg-cream-200 h-3 rounded-full overflow-hidden border border-cream-300">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verified Commission Ledger */}
      <div className="cream-card overflow-hidden">
        <div className="p-4 border-b border-cream-300 flex items-center justify-between">
          <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
            <Trophy size={16} className="text-amber-600" /> Verified Commission Records
          </h2>
          <span className="text-xs text-charcoal-500 font-medium">
            Commission calculated strictly on verified cash deposits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Verified Deposit</th>
                <th className="py-3 px-4">Rate (%)</th>
                <th className="py-3 px-4">Commission Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-500">
                    Loading commissions...
                  </td>
                </tr>
              ) : commissions && commissions.length > 0 ? (
                commissions.map((comm) => (
                  <tr key={comm._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">
                      {(comm.clientId as any)?.clientName || 'Client'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-charcoal-800">
                      {formatCurrency(comm.verifiedPaymentAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-medium">{comm.commissionRate}%</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(comm.commissionAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-charcoal-600 font-medium">{formatDate(comm.calculatedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-500">
                    No commission payouts yet. Verified client payments will automatically calculate your incentive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
