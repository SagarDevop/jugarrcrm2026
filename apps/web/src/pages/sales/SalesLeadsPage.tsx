import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Lead, LEAD_STATUSES, LeadStatus, LEAD_PRIORITIES } from '@agencyos/shared';
import { formatCurrency } from '../../lib/utils';
import {
  Target,
  Plus,
  Phone,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Building,
  Search,
  Kanban,
  List,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const STAGE_COLORS: Record<string, { border: string; text: string; dot: string }> = {
  New: { border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500' },
  Contacted: { border: 'border-cyan-500', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  Interested: { border: 'border-indigo-500', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Meeting Scheduled': { border: 'border-purple-500', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Proposal Sent': { border: 'border-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' },
  Negotiation: { border: 'border-orange-500', text: 'text-orange-700', dot: 'bg-orange-500' },
  Converted: { border: 'border-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Lost: { border: 'border-slate-400', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const SalesLeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<Lead | null>(null);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    industry: '',
    interestedService: 'Web Development',
    estimatedBudget: 50000,
    leadPriority: 'Medium' as any,
    leadSource: 'Outbound Prospecting',
    conversationSummary: '',
  });

  const [convertData, setConvertData] = useState({
    totalContractAmount: 50000,
    initialToken: 10000,
    advancePayment: 15000,
    paymentTerms: '50% Advance, 50% on Delivery',
  });

  const [callData, setCallData] = useState({
    outcome: 'Connected' as const,
    durationMinutes: 15,
    conversationNotes: '',
    interestLevel: 'High' as const,
    nextAction: 'Send Proposal',
  });

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['sales-leads'],
    queryFn: () => api.get('/leads'),
  });

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      return (
        !search ||
        l.businessName.toLowerCase().includes(search.toLowerCase()) ||
        l.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search)
      );
    });
  }, [leads, search]);

  const createLeadMutation = useMutation({
    mutationFn: (newLead: any) => api.post('/leads', newLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      setShowAddModal(false);
      setFormError(null);
    },
    onError: (err: any) => setFormError(err.message || 'Failed to add lead'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => api.put(`/leads/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-leads'] }),
  });

  const convertLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/leads/${id}/convert`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      setSelectedLeadForConvert(null);
    },
  });

  const recordCallMutation = useMutation({
    mutationFn: (data: any) => api.post('/calls', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] });
      setSelectedLeadForCall(null);
    },
  });

  return (
    <div className="space-y-6 pb-16 font-sans min-w-0 max-w-full">
      {/* Control Bar */}
      <div className="cream-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">Sales Lead Pipeline</h1>
          <p className="text-xs text-charcoal-600 mt-0.5">
            Advance prospects through deal stages and track pipeline momentum
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="text-charcoal-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my leads..."
              className="bg-cream-50 border border-cream-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-charcoal-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center p-1 bg-canvas-dark rounded-xl border border-canvas-border">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'board'
                  ? 'bg-cream-100 text-charcoal-900 shadow-sm border border-cream-border'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Kanban size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-cream-100 text-charcoal-900 shadow-sm border border-cream-border'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <List size={14} /> List
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-xl shadow-md shadow-red-900/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="w-full max-w-full overflow-x-auto pb-6 pt-1">
          <div className="inline-flex gap-4 min-w-max items-start pr-4">
            {LEAD_STATUSES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const colorInfo = STAGE_COLORS[stage] || {
                border: 'border-slate-400',
                text: 'text-slate-600',
                dot: 'bg-slate-400',
              };

              return (
                <div
                  key={stage}
                  className="w-80 pipeline-column rounded-2xl p-3.5 flex flex-col shrink-0 shadow-sm border border-canvas-border"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-canvas-border/80 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.dot}`} />
                      <span className="text-xs font-bold text-charcoal-900 tracking-tight">{stage}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-200 text-charcoal-700 border border-cream-border">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[660px] pr-0.5">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        className="cream-card cream-card-hover p-4 rounded-xl border border-cream-border text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-charcoal-900 text-sm tracking-tight">
                            {lead.businessName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream-300 text-charcoal-700">
                            {lead.leadPriority}
                          </span>
                        </div>

                        <p className="text-[11px] text-charcoal-600 mt-1">{lead.contactPerson}</p>

                        <div className="mt-2.5 py-1.5 px-2 bg-cream-100 rounded-lg border border-cream-border flex items-center justify-between">
                          <span className="text-[10px] text-charcoal-500 font-medium">Budget:</span>
                          <span className="text-xs font-bold text-charcoal-900 font-mono">
                            {formatCurrency(lead.estimatedBudget || 0)}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-cream-border flex items-center justify-between gap-1">
                          <button
                            onClick={() => setSelectedLeadForCall(lead)}
                            className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-300 text-charcoal-700 border border-cream-border transition-colors"
                            title="Log Call"
                          >
                            <PhoneCall size={12} />
                          </button>

                          {lead.status !== 'Converted' && (
                            <button
                              onClick={() => {
                                setSelectedLeadForConvert(lead);
                                setConvertData({
                                  totalContractAmount: lead.estimatedBudget || 50000,
                                  initialToken: 10000,
                                  advancePayment: 15000,
                                  paymentTerms: '50% Advance, 50% on Delivery',
                                });
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold text-[10px] rounded-lg"
                            >
                              Convert
                            </button>
                          )}

                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStageMutation.mutate({ id: lead._id, status: e.target.value as LeadStatus })
                            }
                            className="bg-cream-100 border border-cream-border text-[10px] font-semibold text-charcoal-800 rounded-lg px-2 py-1"
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="cream-card rounded-2xl border border-cream-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-200 text-charcoal-600 uppercase text-[10px] tracking-wider border-b border-cream-border font-bold">
              <tr>
                <th className="py-3 px-4">Business & Contact</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border bg-cream-50">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="hover:bg-cream-100 transition-colors">
                  <td className="py-3 px-4 font-bold text-charcoal-900">
                    {lead.businessName}
                    <span className="text-[11px] font-normal text-charcoal-600 block">{lead.contactPerson}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-charcoal-700">{lead.phone}</td>
                  <td className="py-3 px-4 text-charcoal-700">{lead.interestedService || 'General'}</td>
                  <td className="py-3 px-4 font-bold font-mono text-charcoal-900">
                    {formatCurrency(lead.estimatedBudget || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cream-300 text-charcoal-800 border border-cream-border">
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLeadForCall(lead)}
                      className="px-2 py-1 bg-cream-200 hover:bg-cream-300 border border-cream-border text-charcoal-800 rounded font-semibold text-[11px] mr-2"
                    >
                      Call
                    </button>
                    {lead.status !== 'Converted' && (
                      <button
                        onClick={() => setSelectedLeadForConvert(lead)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-[11px]"
                      >
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Convert Modal */}
      {selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
          <div className="cream-card p-6 rounded-3xl border border-cream-border max-w-md w-full shadow-cream-lg text-xs">
            <h2 className="text-base font-bold text-charcoal-900 mb-1">Convert Lead to Client</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                convertLeadMutation.mutate({
                  id: selectedLeadForConvert._id,
                  data: {
                    totalContractAmount: Number(convertData.totalContractAmount),
                    initialToken: Number(convertData.initialToken),
                    advancePayment: Number(convertData.advancePayment),
                    paymentTerms: convertData.paymentTerms,
                  },
                });
              }}
              className="space-y-3 mt-3"
            >
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Total Contract (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={convertData.totalContractAmount}
                  onChange={(e) => setConvertData({ ...convertData, totalContractAmount: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Advance Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={convertData.advancePayment}
                  onChange={(e) => setConvertData({ ...convertData, advancePayment: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono"
                />
              </div>
              <div className="pt-4 border-t border-cream-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForConvert(null)}
                  className="px-3 py-1.5 bg-cream-200 text-charcoal-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertLeadMutation.isPending}
                  className="px-4 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-cream-100 rounded-xl font-semibold shadow-md"
                >
                  Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Call Modal */}
      {selectedLeadForCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
          <div className="cream-card p-6 rounded-3xl border border-cream-border max-w-md w-full shadow-cream-lg text-xs">
            <h2 className="text-base font-bold text-charcoal-900 mb-1">Log Call Interaction</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordCallMutation.mutate({
                  leadId: selectedLeadForCall._id,
                  clientName: selectedLeadForCall.contactPerson,
                  ...callData,
                  durationMinutes: Number(callData.durationMinutes),
                });
              }}
              className="space-y-3 mt-3"
            >
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Outcome</label>
                <select
                  value={callData.outcome}
                  onChange={(e) => setCallData({ ...callData, outcome: e.target.value as any })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                >
                  <option value="Connected">Connected</option>
                  <option value="Interested">Interested</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="Call Back Requested">Call Back Requested</option>
                  <option value="No Answer">No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={callData.conversationNotes}
                  onChange={(e) => setCallData({ ...callData, conversationNotes: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                />
              </div>
              <div className="pt-4 border-t border-cream-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForCall(null)}
                  className="px-3 py-1.5 bg-cream-200 text-charcoal-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordCallMutation.isPending}
                  className="px-4 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-cream-100 rounded-xl font-semibold shadow-md"
                >
                  Save Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
          <div className="cream-card p-6 rounded-3xl border border-cream-border max-w-lg w-full text-xs">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Add Sales Lead</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createLeadMutation.mutate({
                  ...formData,
                  estimatedBudget: Number(formData.estimatedBudget),
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-cream-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-cream-200 text-charcoal-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
