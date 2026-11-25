import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Call, CALL_OUTCOMES, INTEREST_LEVELS } from '@agencyos/shared';
import { formatDate } from '../../lib/utils';
import { PhoneCall, Plus, Clock, UserCheck } from 'lucide-react';

export const SalesCallsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    durationMinutes: 10,
    outcome: 'Connected' as any,
    interestLevel: 'High' as any,
    conversationNotes: '',
    nextAction: '',
  });

  const { data: calls, isLoading } = useQuery<Call[]>({
    queryKey: ['sales-calls'],
    queryFn: () => api.get('/calls'),
  });

  const recordCallMutation = useMutation({
    mutationFn: (newCall: any) => api.post('/calls', newCall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-calls'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard-kpis'] });
      setShowAddModal(false);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordCallMutation.mutate({
      ...formData,
      durationMinutes: Number(formData.durationMinutes),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Call History & Interaction Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Interaction Log
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Log client discovery calls, track prospect interest level, and record follow-up actions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Log Call Record
        </button>
      </div>

      {/* Calls Table */}
      <div className="cream-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Contact / Client</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Interest</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Notes & Next Action</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-500">
                    Loading call logs...
                  </td>
                </tr>
              ) : calls && calls.length > 0 ? (
                calls.map((c) => (
                  <tr key={c._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">{c.clientName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {c.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold ${
                          c.interestLevel === 'High' ? 'text-emerald-700' : 'text-charcoal-700'
                        }`}
                      >
                        {c.interestLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-medium">{c.durationMinutes} mins</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-charcoal-800 line-clamp-1">{c.conversationNotes}</p>
                      {c.nextAction && (
                        <p className="text-[11px] text-blue-700 mt-0.5 font-bold">Next: {c.nextAction}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-charcoal-600 font-medium">{formatDate(c.callDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-500">
                    No calls recorded yet. Click "Log Call Record" to log your first call.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Call Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Log Call Interaction</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Outcome</label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    {CALL_OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Conversation Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.conversationNotes}
                  onChange={(e) => setFormData({ ...formData, conversationNotes: e.target.value })}
                  placeholder="Key discussion points, timeline, scope..."
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Next Action</label>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  placeholder="e.g. Follow up on Monday with contract draft"
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
                  disabled={recordCallMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Save Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
