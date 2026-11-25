import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Lead, LEAD_STATUSES, LeadStatus, LEAD_PRIORITIES, LeadPriority } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Target,
  Plus,
  Phone,
  Mail,
  Building,
  UserCheck,
  ChevronRight,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  Kanban,
  List,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
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

export const AdminLeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<Lead | null>(null);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Lead Form State
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    industry: '',
    interestedService: 'Web Development',
    estimatedBudget: 60000,
    leadPriority: 'Medium' as LeadPriority,
    leadSource: 'Inbound Executive Reach',
    conversationSummary: '',
  });

  // Convert Form State
  const [convertData, setConvertData] = useState({
    totalContractAmount: 60000,
    initialToken: 15000,
    advancePayment: 20000,
    paymentTerms: '50% Advance on Scope Approval, 50% on Handover',
  });

  // Call Record Form State
  const [callData, setCallData] = useState({
    outcome: 'Connected' as const,
    durationMinutes: 15,
    conversationNotes: '',
    interestLevel: 'High' as const,
    nextAction: 'Deliver Architecture Proposal & Quotation',
  });

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: () => api.get('/leads'),
  });

  // Pipeline metrics
  const pipelineMetrics = useMemo(() => {
    if (!leads) return { total: 0, activeValue: 0, convertedCount: 0, conversionRate: 0 };
    const total = leads.length;
    const activeLeads = leads.filter((l) => l.status !== 'Lost' && l.status !== 'Converted');
    const activeValue = activeLeads.reduce((acc, l) => acc + (l.estimatedBudget || 0), 0);
    const convertedCount = leads.filter((l) => l.status === 'Converted').length;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
    return { total, activeValue, convertedCount, conversionRate };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      const matchSearch =
        !search ||
        l.businessName.toLowerCase().includes(search.toLowerCase()) ||
        l.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search) ||
        l.email.toLowerCase().includes(search.toLowerCase());
      const matchPriority = !priorityFilter || l.leadPriority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [leads, search, priorityFilter]);

  const createLeadMutation = useMutation({
    mutationFn: (newLead: any) => api.post('/leads', newLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setShowAddModal(false);
      setFormError(null);
      setFormData({
        businessName: '',
        contactPerson: '',
        phone: '',
        email: '',
        city: '',
        industry: '',
        interestedService: 'Web Development',
        estimatedBudget: 60000,
        leadPriority: 'Medium',
        leadSource: 'Inbound Executive Reach',
        conversationSummary: '',
      });
    },
    onError: (err: any) => setFormError(err.message || 'Failed to create lead'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => api.put(`/leads/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leads'] }),
  });

  const convertLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/leads/${id}/convert`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSelectedLeadForConvert(null);
    },
  });

  const recordCallMutation = useMutation({
    mutationFn: (data: any) => api.post('/calls', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setSelectedLeadForCall(null);
    },
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      ...formData,
      estimatedBudget: Number(formData.estimatedBudget),
    });
  };

  const handleConvertLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForConvert) return;
    convertLeadMutation.mutate({
      id: selectedLeadForConvert._id,
      data: {
        totalContractAmount: Number(convertData.totalContractAmount),
        initialToken: Number(convertData.initialToken),
        advancePayment: Number(convertData.advancePayment),
        paymentTerms: convertData.paymentTerms,
      },
    });
  };

  const handleRecordCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForCall) return;
    recordCallMutation.mutate({
      leadId: selectedLeadForCall._id,
      clientName: selectedLeadForCall.contactPerson,
      ...callData,
      durationMinutes: Number(callData.durationMinutes),
    });
  };

  return (
    <div className="space-y-6 pb-16 font-sans min-w-0 max-w-full">
      {/* Top Banner: Pipeline Velocity Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cream-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
              Active Pipeline Potential
            </span>
            <span className="text-xl font-bold text-charcoal-900 mt-1 block">
              {formatCurrency(pipelineMetrics.activeValue)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="cream-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
              Total Inbound Leads
            </span>
            <span className="text-xl font-bold text-charcoal-900 mt-1 block">{pipelineMetrics.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <Target size={18} />
          </div>
        </div>

        <div className="cream-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
              Converted Deals
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{pipelineMetrics.convertedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="cream-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
              Conversion Win Rate
            </span>
            <span className="text-xl font-bold text-charcoal-900 mt-1 block">{pipelineMetrics.conversionRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Switcher & Action */}
      <div className="cream-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="text-charcoal-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by business, contact, phone..."
              className="w-full bg-cream-50 border border-cream-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-charcoal-900"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-xs text-charcoal-800 font-medium focus:outline-none"
          >
            <option value="">All Priorities</option>
            {LEAD_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-canvas-dark rounded-xl border border-canvas-border">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'board'
                  ? 'bg-cream-100 text-charcoal-900 shadow-sm border border-cream-border'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
              title="Board View"
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
              title="Table List View"
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

      {/* Main View: Kanban Board */}
      {viewMode === 'board' ? (
        <div className="w-full max-w-full overflow-x-auto pb-6 pt-1">
          <div className="inline-flex gap-4 min-w-max items-start pr-4">
            {LEAD_STATUSES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const stageValue = stageLeads.reduce((acc, l) => acc + (l.estimatedBudget || 0), 0);
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
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-canvas-border/80 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.dot}`} />
                      <span className="text-xs font-bold text-charcoal-900 tracking-tight">{stage}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-200 text-charcoal-700 border border-cream-border">
                        {stageLeads.length}
                      </span>
                      {stageValue > 0 && (
                        <span className="text-[10px] font-semibold text-charcoal-500 font-mono">
                          {formatCurrency(stageValue)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stage Leads Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[660px] pr-0.5">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        className="cream-card cream-card-hover p-4 rounded-xl border border-cream-border text-xs relative group"
                      >
                        {/* Priority & Service Tag */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              lead.leadPriority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : lead.leadPriority === 'High'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-cream-300 text-charcoal-700 border border-cream-border'
                            }`}
                          >
                            {lead.leadPriority}
                          </span>

                          <span className="text-[10px] font-semibold text-charcoal-500 truncate bg-cream-200 px-2 py-0.5 rounded border border-cream-border">
                            {lead.interestedService || 'General'}
                          </span>
                        </div>

                        {/* Business & Contact Name */}
                        <h3 className="font-bold text-charcoal-900 text-sm tracking-tight">{lead.businessName}</h3>
                        <p className="text-[11px] text-charcoal-600 mt-0.5 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-cream-300 border border-cream-border text-[10px] font-bold flex items-center justify-center text-charcoal-700 shrink-0">
                            {lead.contactPerson[0]?.toUpperCase() || 'C'}
                          </span>
                          <span className="font-medium text-charcoal-800">{lead.contactPerson}</span>
                        </p>

                        {/* Financial Estimated Deal Amount */}
                        <div className="mt-3 py-2 px-2.5 bg-cream-100 rounded-lg border border-cream-border flex items-center justify-between">
                          <span className="text-[10px] text-charcoal-500 font-medium">Deal Budget:</span>
                          <span className="text-xs font-bold text-charcoal-900 font-mono">
                            {formatCurrency(lead.estimatedBudget || 0)}
                          </span>
                        </div>

                        {/* Contact details & summary */}
                        <div className="mt-2.5 space-y-1 text-[11px] text-charcoal-600">
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-charcoal-400" />
                            <span className="font-mono">{lead.phone}</span>
                          </div>
                          {lead.conversationSummary && (
                            <p className="line-clamp-2 text-[10px] text-charcoal-500 italic mt-1 bg-cream-50 p-1.5 rounded border border-cream-border">
                              "{lead.conversationSummary}"
                            </p>
                          )}
                        </div>

                        {/* Card Interactive Footer Actions */}
                        <div className="mt-3 pt-2.5 border-t border-cream-border flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
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
                                    totalContractAmount: lead.estimatedBudget || 60000,
                                    initialToken: 15000,
                                    advancePayment: 20000,
                                    paymentTerms: '50% Advance on Scope Approval, 50% on Handover',
                                  });
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={11} /> Convert
                              </button>
                            )}
                          </div>

                          {/* 1-Click Stage Selector */}
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStageMutation.mutate({ id: lead._id, status: e.target.value as LeadStatus })
                            }
                            className="bg-cream-100 border border-cream-border text-[10px] font-semibold text-charcoal-800 rounded-lg px-2 py-1 focus:outline-none"
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

                    {stageLeads.length === 0 && (
                      <div className="py-12 text-center text-charcoal-400 text-[11px] border border-dashed border-canvas-border rounded-xl">
                        No deals in {stage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table List View */
        <div className="cream-card rounded-2xl border border-cream-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-200 text-charcoal-600 uppercase text-[10px] tracking-wider border-b border-cream-border font-bold">
              <tr>
                <th className="py-3 px-4">Business & Contact</th>
                <th className="py-3 px-4">Phone & Email</th>
                <th className="py-3 px-4">Interested Service</th>
                <th className="py-3 px-4">Deal Value</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border bg-cream-50">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="hover:bg-cream-100 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-charcoal-900 block">{lead.businessName}</span>
                    <span className="text-[11px] text-charcoal-600">{lead.contactPerson}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-charcoal-700">
                    <div>{lead.phone}</div>
                    <div className="text-[10px] text-charcoal-500 font-sans">{lead.email}</div>
                  </td>
                  <td className="py-3 px-4 text-charcoal-700 font-medium">{lead.interestedService || 'General'}</td>
                  <td className="py-3 px-4 font-bold text-charcoal-900 font-mono">
                    {formatCurrency(lead.estimatedBudget || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.leadPriority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : lead.leadPriority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-cream-300 text-charcoal-700'
                      }`}
                    >
                      {lead.leadPriority}
                    </span>
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
                        onClick={() => {
                          setSelectedLeadForConvert(lead);
                          setConvertData({
                            totalContractAmount: lead.estimatedBudget || 60000,
                            initialToken: 15000,
                            advancePayment: 20000,
                            paymentTerms: '50% Advance, 50% on Delivery',
                          });
                        }}
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

      {/* Convert Lead to Client Modal */}
      {selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
          <div className="cream-card p-6 rounded-3xl border border-cream-border max-w-md w-full shadow-cream-lg text-xs">
            <h2 className="text-base font-bold text-charcoal-900 mb-1">Convert Lead to Client Account</h2>
            <p className="text-charcoal-600 mb-4">
              Converting <strong>{selectedLeadForConvert.businessName}</strong> ({selectedLeadForConvert.contactPerson})
            </p>

            <form onSubmit={handleConvertLead} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Contract Total Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={convertData.totalContractAmount}
                  onChange={(e) => setConvertData({ ...convertData, totalContractAmount: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Initial Token Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={convertData.initialToken}
                  onChange={(e) => setConvertData({ ...convertData, initialToken: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Advance Payment Deposited (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={convertData.advancePayment}
                  onChange={(e) => setConvertData({ ...convertData, advancePayment: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Agreed Payment Terms</label>
                <input
                  type="text"
                  value={convertData.paymentTerms}
                  onChange={(e) => setConvertData({ ...convertData, paymentTerms: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
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
                  {convertLeadMutation.isPending ? 'Converting...' : 'Confirm Client Onboarding'}
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
            <p className="text-charcoal-600 mb-4">
              Recording call with <strong>{selectedLeadForCall.contactPerson}</strong> ({selectedLeadForCall.phone})
            </p>

            <form onSubmit={handleRecordCall} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Call Outcome</label>
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
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={callData.durationMinutes}
                  onChange={(e) => setCallData({ ...callData, durationMinutes: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Conversation Discussion Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={callData.conversationNotes}
                  onChange={(e) => setCallData({ ...callData, conversationNotes: e.target.value })}
                  placeholder="Key discussion points, budget confirmation, pain points..."
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Next Action Item</label>
                <input
                  type="text"
                  value={callData.nextAction}
                  onChange={(e) => setCallData({ ...callData, nextAction: e.target.value })}
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
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
          <div className="cream-card p-6 rounded-3xl border border-cream-border max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-cream-lg text-xs">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Add Pipeline Lead</h2>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                    placeholder="e.g. Apex Studio"
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
                    placeholder="e.g. Priya Nair"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Phone Number (Unique) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Email Address (Unique) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                    placeholder="priya@apex.com"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Interested Service</label>
                  <input
                    type="text"
                    value={formData.interestedService}
                    onChange={(e) => setFormData({ ...formData, interestedService: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-bold mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-charcoal-800 font-bold mb-1">Conversation Summary & Notes</label>
                <textarea
                  rows={2}
                  value={formData.conversationSummary}
                  onChange={(e) => setFormData({ ...formData, conversationSummary: e.target.value })}
                  placeholder="Discovery discussion highlights..."
                  className="w-full bg-cream-50 border border-cream-border rounded-xl px-3 py-2 text-charcoal-900"
                />
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
                  {createLeadMutation.isPending ? 'Saving...' : 'Add Lead to Funnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
