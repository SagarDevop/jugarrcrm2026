import React, { useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Client, Project, Retainer, Payment, Call, FollowUp, CLIENT_STATUSES, ClientStatus } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Building,
  Phone,
  Mail,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  CreditCard,
  FolderGit2,
  CalendarClock,
  PhoneCall,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';

export const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRetainerModal, setShowAddRetainerModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    clientName: '',
    businessName: '',
    phone: '',
    email: '',
    startDate: '',
    status: 'Active' as ClientStatus,
  });

  const [retainerFormData, setRetainerFormData] = useState({
    serviceName: 'Full Social Media Growth Retainer',
    monthlyFee: 3000,
    anchorDateDay: 22,
    startDate: new Date().toISOString().split('T')[0],
    packageDetails: {
      reelsCount: 15,
      staticPostsCount: 20,
      graphicDesignsCount: 10,
      storiesCount: 30,
    },
  });

  const { data, isLoading, isError, error, refetch } = useQuery<{
    client: Client;
    projects: Project[];
    retainers: Retainer[];
    calls: Call[];
    followups: FollowUp[];
    payments: Payment[];
  }>({
    queryKey: ['client-details', id],
    queryFn: () => api.get(`/clients/${id}`),
    enabled: !!id,
    retry: 1,
  });

  const updateClientMutation = useMutation({
    mutationFn: (updated: any) => api.put(`/clients/${id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setShowEditModal(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update client');
    },
  });

  const createRetainerMutation = useMutation({
    mutationFn: (newRet: any) => api.post('/retainers', newRet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      setShowAddRetainerModal(false);
    },
  });

  if (isError) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">Unable to Load Client Profile</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {(error as any)?.message || 'Your session may have expired or this client record could not be retrieved.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
          >
            Retry Loading
          </button>
          <NavLink
            to="/admin/clients"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Back to Directory
          </NavLink>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-cream-300/60 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-cream-300/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  const { client, projects, retainers, calls, followups, payments } = data;

  const handleOpenEdit = () => {
    if (!client) return;
    const initialDate = client.startDate || client.createdAt;
    setEditFormData({
      clientName: client.clientName,
      businessName: client.businessName,
      phone: client.phone,
      email: client.email,
      startDate: initialDate ? new Date(initialDate).toISOString().split('T')[0] : '',
      status: client.status,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    updateClientMutation.mutate({
      clientName: editFormData.clientName,
      businessName: editFormData.businessName,
      phone: editFormData.phone,
      email: editFormData.email,
      status: editFormData.status,
      startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : undefined,
      createdAt: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Action Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs text-charcoal-600 hover:text-charcoal-900 font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>

        {isSuperAdmin && (
          <button
            onClick={handleOpenEdit}
            className="px-3.5 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg border border-cream-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 size={13} /> Edit Client / Date
          </button>
        )}
      </div>

      {/* Client Summary Header */}
      <div className="cream-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-charcoal-900">{client.clientName}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                client.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-cream-200 text-charcoal-700 border-cream-300'
              }`}
            >
              {client.status}
            </span>
          </div>
          <p className="text-xs text-charcoal-600 flex items-center gap-1.5 mt-1 font-medium">
            <Building size={14} className="text-charcoal-400" /> {client.businessName} • {client.industry || 'General Industry'}
          </p>
        </div>

        {/* Financial Overview (If authorized) */}
        {client.totalContractAmount !== undefined && (
          <div className="flex items-center gap-4 bg-white border border-cream-300 p-3.5 rounded-xl shadow-xs">
            <div>
              <span className="text-[10px] text-charcoal-500 block uppercase font-bold tracking-wider">Contract Value</span>
              <span className="text-base font-extrabold text-charcoal-900">{formatCurrency(client.totalContractAmount)}</span>
            </div>
            <div className="w-px h-8 bg-cream-300" />
            <div>
              <span className="text-[10px] text-charcoal-500 block uppercase font-bold tracking-wider">Remaining Balance</span>
              <span
                className={`text-base font-extrabold ${
                  client.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(client.remainingBalance)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Contact Information & Associated Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Business Details */}
        <div className="space-y-6">
          <div className="cream-card p-5">
            <h2 className="text-sm font-bold text-charcoal-900 mb-3">Contact Information</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-charcoal-800">
                <Phone size={14} className="text-charcoal-400" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal-800">
                <Mail size={14} className="text-charcoal-400" />
                <span>{client.email}</span>
              </div>
              {client.website && (
                <div className="flex items-center gap-2 text-charcoal-800">
                  <Globe size={14} className="text-charcoal-400" />
                  <a href={client.website} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                    {client.website}
                  </a>
                </div>
              )}
              {client.instagramUrl && (
                <div className="flex items-center gap-2 text-charcoal-800">
                  <Instagram size={14} className="text-charcoal-400" />
                  <a href={client.instagramUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                    Instagram Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Service & Attribution */}
          <div className="cream-card p-5">
            <h2 className="text-sm font-bold text-charcoal-900 mb-3">Service & Assignment</h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-charcoal-600">Category:</span>{' '}
                <span className="text-charcoal-900 font-semibold">{client.serviceCategory || 'Standard'}</span>
              </div>
              <div>
                <span className="text-charcoal-600">Assigned Sales Member:</span>{' '}
                <span className="text-charcoal-900 font-semibold">
                  {(client.assignedSalesMember as any)?.name || 'Direct / Founder'}
                </span>
              </div>
              <div>
                <span className="text-charcoal-600">Payment Terms:</span>{' '}
                <span className="text-charcoal-900 font-semibold">{client.paymentTerms || 'Standard Terms'}</span>
              </div>
              <div>
                <span className="text-charcoal-600">Onboarded / Joined:</span>{' '}
                <span className="text-charcoal-900 font-semibold">
                  {formatDate(client.startDate || client.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Projects, Retainers & Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Web Development Projects */}
          <div className="cream-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <FolderGit2 size={16} className="text-blue-700" /> Development Projects ({projects.length})
              </h2>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj._id} className="p-3 bg-white border border-cream-300 rounded-lg flex items-center justify-between shadow-xs">
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">{proj.name}</p>
                      <p className="text-[11px] text-charcoal-600">
                        {proj.milestones?.filter((m) => m.status === 'Completed').length || 0} / {proj.milestones?.length || 0} Milestones Completed
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {proj.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-500">No development projects active for this client.</p>
            )}
          </div>

          {/* Social Media Retainers */}
          <div className="cream-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <CalendarClock size={16} className="text-cyan-700" /> Social Media Retainers ({retainers.length})
              </h2>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const start = client.startDate || client.createdAt || new Date().toISOString();
                    const day = new Date(start).getDate() || 20;
                    setRetainerFormData({
                      serviceName: `${client.businessName} - Social Media Growth Retainer`,
                      monthlyFee: client.totalContractAmount > 0 ? client.totalContractAmount : 3000,
                      anchorDateDay: day,
                      startDate: new Date(start).toISOString().split('T')[0],
                      packageDetails: {
                        reelsCount: 15,
                        staticPostsCount: 20,
                        graphicDesignsCount: 10,
                        storiesCount: 30,
                      },
                    });
                    setShowAddRetainerModal(true);
                  }}
                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add Retainer Contract
                </button>
              )}
            </div>
            {retainers.length > 0 ? (
              <div className="space-y-3">
                {retainers.map((ret) => (
                  <div key={ret._id} className="p-3 bg-white border border-cream-300 rounded-lg shadow-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-charcoal-900">{ret.serviceName}</p>
                      <span className="text-xs font-extrabold text-emerald-700">{formatCurrency(ret.monthlyFee)}/mo</span>
                    </div>
                    <p className="text-[11px] text-charcoal-600 mt-1">
                      Period #{ret.currentPeriod?.periodNumber || 1} • Anchor Day: {ret.anchorDateDay}th of every month
                    </p>
                    <div className="mt-2 text-[11px] text-charcoal-800 grid grid-cols-4 gap-2 bg-cream-100 p-2 rounded border border-cream-300">
                      <div>Reels: <strong>{ret.packageDetails?.reelsCount || 0}</strong></div>
                      <div>Posts: <strong>{ret.packageDetails?.staticPostsCount || 0}</strong></div>
                      <div>Graphics: <strong>{ret.packageDetails?.graphicDesignsCount || 0}</strong></div>
                      <div>Stories: <strong>{ret.packageDetails?.storiesCount || 0}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-500">No active social media retainers.</p>
            )}
          </div>

          {/* Verified Payments Ledger (Admin / Finance permitted only) */}
          {payments.length > 0 && (
            <div className="cream-card p-5">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-emerald-700" /> Verified Payment History
              </h2>
              <div className="space-y-2">
                {payments.map((pmt) => (
                  <div key={pmt._id} className="p-2.5 bg-white border border-cream-300 rounded flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <span className="font-bold text-charcoal-900">{formatCurrency(pmt.amount)}</span>
                      <span className="text-[11px] text-charcoal-600 ml-2">({pmt.category} - {pmt.paymentMethod})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-charcoal-500">{formatDate(pmt.paymentDate)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {pmt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Client Date & Details Modal (Admin Only) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">Edit Client Date & Profile</h2>
                <p className="text-xs text-charcoal-600">Update joining date, contact details or account status</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#991B1B]" />
                  <span>Joining / Onboarding Date (Manual Date) *</span>
                </label>
                <input
                  type="date"
                  required
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
                <p className="text-[10px] text-charcoal-500 mt-1">
                  Yahan se aap kisi bhi purane client ki actual joining date set kar sakte hain
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Client Contact Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.clientName}
                  onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.businessName}
                  onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Account Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ClientStatus })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                >
                  {CLIENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateClientMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/20 cursor-pointer"
                >
                  {updateClientMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Social Media Retainer Modal */}
      {showAddRetainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">Configure Retainer Contract</h2>
                <p className="text-xs text-charcoal-600">Setup recurring monthly contract for {client.businessName}</p>
              </div>
              <button
                onClick={() => setShowAddRetainerModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRetainerMutation.mutate({
                  clientId: id,
                  serviceName: retainerFormData.serviceName,
                  monthlyFee: Number(retainerFormData.monthlyFee),
                  anchorDateDay: Number(retainerFormData.anchorDateDay),
                  startDate: retainerFormData.startDate,
                  packageDetails: retainerFormData.packageDetails,
                });
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Retainer Service Name *</label>
                <input
                  type="text"
                  required
                  value={retainerFormData.serviceName}
                  onChange={(e) => setRetainerFormData({ ...retainerFormData, serviceName: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Monthly Recurring Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={retainerFormData.monthlyFee}
                    onChange={(e) => setRetainerFormData({ ...retainerFormData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Anchor Billing Day (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={retainerFormData.anchorDateDay}
                    onChange={(e) => setRetainerFormData({ ...retainerFormData, anchorDateDay: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#991B1B]" />
                  <span>Contract Start Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={retainerFormData.startDate}
                  onChange={(e) => setRetainerFormData({ ...retainerFormData, startDate: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">Monthly Deliverables</label>
                <div className="grid grid-cols-2 gap-2 bg-cream-100 p-2.5 rounded-lg border border-cream-300">
                  <div>
                    <label className="text-[10px] text-charcoal-600 block">Reels per Month</label>
                    <input
                      type="number"
                      min="0"
                      value={retainerFormData.packageDetails.reelsCount}
                      onChange={(e) =>
                        setRetainerFormData({
                          ...retainerFormData,
                          packageDetails: { ...retainerFormData.packageDetails, reelsCount: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-charcoal-600 block">Posts per Month</label>
                    <input
                      type="number"
                      min="0"
                      value={retainerFormData.packageDetails.staticPostsCount}
                      onChange={(e) =>
                        setRetainerFormData({
                          ...retainerFormData,
                          packageDetails: { ...retainerFormData.packageDetails, staticPostsCount: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddRetainerModal(false)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRetainerMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/20 cursor-pointer"
                >
                  {createRetainerMutation.isPending ? 'Activating...' : 'Activate Retainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
