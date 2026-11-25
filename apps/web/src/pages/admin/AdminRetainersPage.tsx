import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Retainer, Client } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Video,
  Image,
  Layers,
} from 'lucide-react';

export const AdminRetainersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    serviceName: 'Full Social Media Growth Retainer',
    monthlyFee: 35000,
    anchorDateDay: 20,
    startDate: new Date().toISOString().split('T')[0],
    packageDetails: {
      reelsCount: 15,
      staticPostsCount: 20,
      graphicDesignsCount: 10,
      storiesCount: 30,
    },
  });

  const { data: retainers, isLoading } = useQuery<Retainer[]>({
    queryKey: ['admin-retainers'],
    queryFn: () => api.get('/retainers'),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['admin-clients-select'],
    queryFn: () => api.get('/clients'),
  });

  const createRetainerMutation = useMutation({
    mutationFn: (newRet: any) => api.post('/retainers', newRet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      setShowAddModal(false);
    },
  });

  const renewPeriodMutation = useMutation({
    mutationFn: (id: string) => api.post(`/retainers/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRetainerMutation.mutate({
      ...formData,
      monthlyFee: Number(formData.monthlyFee),
      anchorDateDay: Number(formData.anchorDateDay),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Social Media Retainer Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
              Recurring Engine
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Recurring monthly deliverables, anchor date preservation and multi-period billing automation
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> New Retainer Package
        </button>
      </div>

      {/* Retainers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading retainers...</div>
        ) : retainers && retainers.length > 0 ? (
          retainers.map((ret) => (
            <div key={ret._id} className="cream-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">{ret.serviceName}</h2>
                  <p className="text-xs text-charcoal-600 flex items-center gap-1.5 mt-0.5 font-medium">
                    <Building size={12} className="text-charcoal-400" />
                    {(ret.clientId as any)?.clientName || (ret.clientId as any)?.businessName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-700">{formatCurrency(ret.monthlyFee)}/mo</span>
                  <span className="text-[10px] text-charcoal-500 block font-semibold">
                    Anchor: {ret.anchorDateDay}th of month
                  </span>
                </div>
              </div>

              {/* Current Period Banner */}
              <div className="p-3.5 bg-white border border-cream-300 rounded-lg text-xs space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-800">
                    Active Period #{ret.currentPeriod?.periodNumber || 1}
                  </span>
                  <span className="text-charcoal-600 text-[11px] font-medium">
                    {formatDate(ret.currentPeriodStart)} - {formatDate(ret.currentPeriodEnd)}
                  </span>
                </div>

                {/* Deliverables Tracker */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-cream-300 text-[11px]">
                  <div className="bg-cream-100 p-2 rounded text-center border border-cream-300">
                    <Video size={13} className="mx-auto text-rose-600 mb-1" />
                    <span className="text-charcoal-600 block text-[10px]">Reels</span>
                    <span className="font-bold text-charcoal-900">
                      {ret.currentPeriod?.deliverablesStatus?.reelsCompleted || 0} / {ret.packageDetails?.reelsCount || 0}
                    </span>
                  </div>
                  <div className="bg-cream-100 p-2 rounded text-center border border-cream-300">
                    <Image size={13} className="mx-auto text-blue-600 mb-1" />
                    <span className="text-charcoal-600 block text-[10px]">Posts</span>
                    <span className="font-bold text-charcoal-900">
                      {ret.currentPeriod?.deliverablesStatus?.staticPostsCompleted || 0} / {ret.packageDetails?.staticPostsCount || 0}
                    </span>
                  </div>
                  <div className="bg-cream-100 p-2 rounded text-center border border-cream-300">
                    <Layers size={13} className="mx-auto text-purple-600 mb-1" />
                    <span className="text-charcoal-600 block text-[10px]">Graphics</span>
                    <span className="font-bold text-charcoal-900">
                      {ret.currentPeriod?.deliverablesStatus?.graphicsCompleted || 0} / {ret.packageDetails?.graphicDesignsCount || 0}
                    </span>
                  </div>
                  <div className="bg-cream-100 p-2 rounded text-center border border-cream-300">
                    <CalendarClock size={13} className="mx-auto text-amber-600 mb-1" />
                    <span className="text-charcoal-600 block text-[10px]">Stories</span>
                    <span className="font-bold text-charcoal-900">
                      {ret.currentPeriod?.deliverablesStatus?.storiesCompleted || 0} / {ret.packageDetails?.storiesCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewal Action */}
              <div className="pt-2 border-t border-cream-300 flex items-center justify-between">
                <span className="text-[11px] text-charcoal-500 font-medium">
                  {ret.historyPeriods?.length || 0} Archived Historical Periods
                </span>

                <button
                  onClick={() => renewPeriodMutation.mutate(ret._id)}
                  disabled={renewPeriodMutation.isPending}
                  className="px-3 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw size={12} className={renewPeriodMutation.isPending ? 'animate-spin' : ''} />
                  Archive & Renew Next Period
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">
            No retainers configured. Click "New Retainer Package" to create one.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Configure Recurring Retainer</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                >
                  <option value="">-- Select Client --</option>
                  {clients?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.clientName} ({c.businessName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Monthly Retainer Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Anchor Date Day (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.anchorDateDay}
                    onChange={(e) => setFormData({ ...formData, anchorDateDay: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
              </div>

              {/* Package quantities */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div>
                  <label className="text-charcoal-600 block mb-1">Reels</label>
                  <input
                    type="number"
                    value={formData.packageDetails.reelsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        packageDetails: { ...formData.packageDetails, reelsCount: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="text-charcoal-600 block mb-1">Posts</label>
                  <input
                    type="number"
                    value={formData.packageDetails.staticPostsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        packageDetails: { ...formData.packageDetails, staticPostsCount: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="text-charcoal-600 block mb-1">Graphics</label>
                  <input
                    type="number"
                    value={formData.packageDetails.graphicDesignsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        packageDetails: { ...formData.packageDetails, graphicDesignsCount: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="text-charcoal-600 block mb-1">Stories</label>
                  <input
                    type="number"
                    value={formData.packageDetails.storiesCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        packageDetails: { ...formData.packageDetails, storiesCount: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-cream-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRetainerMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Create Retainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
