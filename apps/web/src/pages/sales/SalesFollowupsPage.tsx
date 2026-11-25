import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { FollowUp } from '@agencyos/shared';
import { formatDate } from '../../lib/utils';
import { CalendarCheck2, Plus, CheckCircle2, Clock } from 'lucide-react';

export const SalesFollowupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'Medium' as any,
  });

  const { data: followups, isLoading } = useQuery<FollowUp[]>({
    queryKey: ['sales-followups'],
    queryFn: () => api.get('/followups'),
  });

  const createFollowupMutation = useMutation({
    mutationFn: (newFollowup: any) => api.post('/followups', newFollowup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard-kpis'] });
      setShowAddModal(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/followups/${id}/status`, { status: 'Completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-followups'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard-kpis'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFollowupMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Scheduled Follow-ups</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Deal Momentum
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Upcoming touchpoints, discovery check-ins and deal momentum tasks
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Schedule Follow-up
        </button>
      </div>

      {/* Follow-ups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading follow-ups...</div>
        ) : followups && followups.length > 0 ? (
          followups.map((f) => (
            <div key={f._id} className="cream-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h2 className={`text-sm font-bold ${f.status === 'Completed' ? 'line-through text-charcoal-400' : 'text-charcoal-900'}`}>
                    {f.title}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      f.status === 'Completed'
                        ? 'bg-cream-200 text-charcoal-500 border-cream-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
                {f.description && <p className="text-xs text-charcoal-600 mt-1.5">{f.description}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-cream-300 flex items-center justify-between text-xs">
                <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                  <Clock size={12} /> Due: {formatDate(f.dueDate)}
                </span>
                {f.status !== 'Completed' && (
                  <button
                    onClick={() => completeMutation.mutate(f._id)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Mark Done
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">No scheduled follow-ups found.</div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Schedule Follow-up</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Check in on contract review with CTO"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
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
                  disabled={createFollowupMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
