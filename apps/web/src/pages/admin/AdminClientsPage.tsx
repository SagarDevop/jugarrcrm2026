import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api } from '../../lib/api';
import { Client, CLIENT_STATUSES, ClientStatus } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Users, Plus, Search, Phone, Mail, Building, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    businessName: '',
    phone: '',
    whatsapp: '',
    email: '',
    industry: '',
    website: '',
    serviceCategory: 'Web Development',
    totalContractAmount: 0,
    initialToken: 0,
    advancePayment: 0,
    paymentTerms: 'Standard (50% Advance, 50% on Delivery)',
    status: 'Active' as ClientStatus,
  });

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['admin-clients', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      return api.get(`/clients?${params.toString()}`);
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (newClient: any) => api.post('/clients', newClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      setShowAddModal(false);
      setFormError(null);
      setFormData({
        clientName: '',
        businessName: '',
        phone: '',
        whatsapp: '',
        email: '',
        industry: '',
        website: '',
        serviceCategory: 'Web Development',
        totalContractAmount: 0,
        initialToken: 0,
        advancePayment: 0,
        paymentTerms: 'Standard',
        status: 'Active',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create client');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createClientMutation.mutate({
      ...formData,
      totalContractAmount: Number(formData.totalContractAmount),
      initialToken: Number(formData.initialToken),
      advancePayment: Number(formData.advancePayment),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Client Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cream-200 text-charcoal-800 border border-cream-300">
              {clients?.length || 0} Accounts
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Complete company portfolio, contract valuations, remaining balances and account lifecycle
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Register New Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="text-charcoal-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, business, phone or email..."
            className="w-full bg-white border border-cream-300 rounded-lg pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-charcoal-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-800 focus:outline-none focus:border-charcoal-800"
        >
          <option value="">All Statuses</option>
          {CLIENT_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Clients Table */}
      <div className="cream-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Client & Business</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4">Pending Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-500">
                    Loading clients...
                  </td>
                </tr>
              ) : clients && clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900">{client.clientName}</div>
                      <div className="text-[11px] text-charcoal-600 flex items-center gap-1 mt-0.5">
                        <Building size={12} className="text-charcoal-400" /> {client.businessName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-charcoal-800 flex items-center gap-1">
                        <Phone size={12} className="text-charcoal-400" /> {client.phone}
                      </div>
                      <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} className="text-charcoal-400" /> {client.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-cream-200 text-[11px] font-medium text-charcoal-800 border border-cream-300">
                        {client.serviceCategory || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">
                      {formatCurrency(client.totalContractAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          client.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(client.remainingBalance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          client.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : client.status === 'On Hold'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-cream-200 text-charcoal-700 border-cream-300'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <NavLink
                        to={`/admin/clients/${client._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded text-xs font-semibold transition-colors"
                      >
                        <Eye size={12} /> Profile
                      </NavLink>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-charcoal-500">
                    No clients found. Click "Register New Client" to add your first account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">Client Registration & Onboarding</h2>
                <p className="text-xs text-charcoal-600">Register new client and configure initial payment terms</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-xs font-semibold px-2 py-1 rounded hover:bg-cream-200"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Client Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                    placeholder="e.g. Acme Brands LLC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Phone Number (Unique) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Email Address (Unique) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                    placeholder="contact@acme.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                    placeholder="e.g. Healthcare, E-Commerce"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Service Category</label>
                  <select
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Social Media Retainer">Social Media Retainer</option>
                    <option value="Full Digital Marketing">Full Digital Marketing</option>
                    <option value="Branding & Design">Branding & Design</option>
                    <option value="Custom Software">Custom Software</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Total Contract Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalContractAmount}
                    onChange={(e) => setFormData({ ...formData, totalContractAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Initial Token Payment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialToken}
                    onChange={(e) => setFormData({ ...formData, initialToken: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Advance Payment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    {CLIENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/20 cursor-pointer"
                >
                  {createClientMutation.isPending ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
