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
  RefreshCw,
  History,
  Trash2,
  Send,
  Check,
  Loader2,
} from 'lucide-react';

export const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRetainerModal, setShowAddRetainerModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modals for Retainer Billing Periods
  const [selectedPeriodForPayment, setSelectedPeriodForPayment] = useState<{
    retainerId: string;
    periodNumber: number;
    periodLabel: string;
    monthlyFee: number;
    pendingBalance: number;
  } | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    notes: '',
  });

  const [selectedRetainerForRenew, setSelectedRetainerForRenew] = useState<Retainer | null>(null);
  const [renewForm, setRenewForm] = useState({
    startDate: '',
    endDate: '',
    monthlyFee: 0,
    tokenAmount: 0,
    paymentMethod: 'UPI',
    notes: '',
  });

  const [selectedPeriodForEdit, setSelectedPeriodForEdit] = useState<{
    retainerId: string;
    periodNumber: number;
    startDate: string;
    endDate: string;
    monthlyFee: number;
    tokenAmount: number;
    pendingBalance: number;
    billingStatus: string;
  } | null>(null);

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

  const recordPeriodPaymentMutation = useMutation({
    mutationFn: ({ retainerId, data }: { retainerId: string; data: any }) =>
      api.post(`/retainers/${retainerId}/period-payment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSelectedPeriodForPayment(null);
    },
  });

  const renewPeriodMutation = useMutation({
    mutationFn: ({ retainerId, data }: { retainerId: string; data?: any }) =>
      api.post(`/retainers/${retainerId}/renew`, data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSelectedRetainerForRenew(null);
    },
  });

  const updatePeriodMutation = useMutation({
    mutationFn: ({ retainerId, data }: { retainerId: string; data: any }) =>
      api.put(`/retainers/${retainerId}/period`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSelectedPeriodForEdit(null);
    },
  });

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    emailType: 'custom' as 'custom' | 'reminder',
  });
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [sentReceipts, setSentReceipts] = useState<Record<string, boolean>>({});

  const sendEmailMutation = useMutation({
    mutationFn: (emailPayload: any) => api.post('/emails/send-client', emailPayload),
    onSuccess: () => {
      setEmailSuccessMsg('Email delivered successfully via Brevo!');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccessMsg(null);
      }, 2500);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.delete(`/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setPaymentToDelete(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err?.message || 'Failed to delete payment');
    },
  });

  const sendReceiptMutation = useMutation({
    mutationFn: (paymentId: string) => api.post(`/emails/send-payment-receipt/${paymentId}`),
    onSuccess: (_, paymentId) => {
      setSentReceipts((prev) => ({ ...prev, [paymentId]: true }));
      setTimeout(() => {
        setSentReceipts((prev) => ({ ...prev, [paymentId]: false }));
      }, 4000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err?.message || 'Failed to send receipt email via Brevo');
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

        <div className="flex items-center gap-2">
          {client.email && (
            <button
              onClick={() => {
                setEmailForm({
                  subject: `Update regarding ${client.businessName} - Jugarr Technologies`,
                  message: `Hello ${client.clientName},\n\nHere is an update regarding your account with Jugarr Technologies.\n\nBest regards,\nSagar`,
                  emailType: 'custom',
                });
                setShowEmailModal(true);
              }}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Mail size={13} className="text-blue-700" /> Send Email (Brevo)
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={handleOpenEdit}
              className="px-3.5 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg border border-cream-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit3 size={13} /> Edit Client / Date
            </button>
          )}
        </div>
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
              <div className="space-y-4">
                {retainers.map((ret) => {
                  const currentPending = ret.currentPeriod?.pendingBalance || 0;
                  const totalPendingAllPeriods =
                    currentPending +
                    (ret.historyPeriods || []).reduce((acc, p) => acc + (p.pendingBalance || 0), 0);

                  return (
                    <div
                      key={ret._id}
                      className="p-4 bg-white border border-cream-300 rounded-xl shadow-xs space-y-3.5"
                    >
                      {/* Retainer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cream-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-charcoal-900">{ret.serviceName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              Monthly Retainer
                            </span>
                          </div>
                          <p className="text-[11px] text-charcoal-500 mt-0.5">
                            Anchor Day: <strong>{ret.anchorDateDay}th of every month</strong> • Monthly Base:{' '}
                            <strong className="text-charcoal-900">{formatCurrency(ret.monthlyFee)}/mo</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextStart = new Date(ret.currentPeriod?.endDate || Date.now())
                                  .toISOString()
                                  .split('T')[0];
                                setSelectedRetainerForRenew(ret);
                                setRenewForm({
                                  startDate: nextStart,
                                  endDate: '',
                                  monthlyFee: ret.monthlyFee,
                                  tokenAmount: 0,
                                  paymentMethod: 'UPI',
                                  notes: `Advance for Period #${(ret.currentPeriod?.periodNumber || 1) + 1}`,
                                });
                              }}
                              className="px-3 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Start Next Billing Cycle / Month"
                            >
                              <RefreshCw size={12} />
                              <span>Start Next Month Cycle</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CURRENT BILLING PERIOD (Highlighted Card) */}
                      <div className="p-3.5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF6EE] border-2 border-amber-300/80 rounded-xl shadow-2xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                              Current Period #{ret.currentPeriod?.periodNumber || 1}
                            </span>
                            <span className="text-xs font-bold text-charcoal-900 flex items-center gap-1">
                              <Calendar size={13} className="text-amber-700" />
                              {formatDate(ret.currentPeriod?.startDate)} - {formatDate(ret.currentPeriod?.endDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                currentPending === 0
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : (ret.currentPeriod?.tokenAmount || 0) > 0
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {currentPending === 0
                                ? '✓ Paid Full'
                                : (ret.currentPeriod?.tokenAmount || 0) > 0
                                ? 'Partially Paid (Advance)'
                                : 'Pending Payment'}
                            </span>

                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPeriodForEdit({
                                    retainerId: ret._id,
                                    periodNumber: ret.currentPeriod.periodNumber,
                                    startDate: new Date(ret.currentPeriod.startDate)
                                      .toISOString()
                                      .split('T')[0],
                                    endDate: new Date(ret.currentPeriod.endDate)
                                      .toISOString()
                                      .split('T')[0],
                                    monthlyFee: ret.currentPeriod.monthlyFee,
                                    tokenAmount: ret.currentPeriod.tokenAmount || 0,
                                    pendingBalance: ret.currentPeriod.pendingBalance,
                                    billingStatus: ret.currentPeriod.billingStatus,
                                  })
                                }
                                className="text-charcoal-400 hover:text-charcoal-800 p-1 rounded hover:bg-cream-200 transition-colors"
                                title="Edit Current Period Numbers & Dates"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Breakdown: Fee vs Advance vs Is Mahine Baki */}
                        <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-amber-200/60 text-xs shadow-2xs">
                          <div>
                            <span className="text-[10px] text-charcoal-500 block uppercase font-semibold">
                              Total Period Fee
                            </span>
                            <span className="text-sm font-extrabold text-charcoal-900">
                              {formatCurrency(ret.currentPeriod?.monthlyFee || ret.monthlyFee)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-emerald-700 block uppercase font-semibold">
                              Advance / Received
                            </span>
                            <span className="text-sm font-extrabold text-emerald-700">
                              {formatCurrency(ret.currentPeriod?.tokenAmount || 0)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-rose-700 block uppercase font-bold">
                              Is Mahine Baki (Due)
                            </span>
                            <span
                              className={`text-sm font-extrabold ${
                                currentPending > 0 ? 'text-[#991B1B]' : 'text-emerald-700'
                              }`}
                            >
                              {formatCurrency(currentPending)}
                            </span>
                          </div>
                        </div>

                        {/* Record Payment button on Current Period */}
                        {isSuperAdmin && currentPending > 0 && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPeriodForPayment({
                                  retainerId: ret._id,
                                  periodNumber: ret.currentPeriod.periodNumber,
                                  periodLabel: `Period #${ret.currentPeriod.periodNumber} (${formatDate(ret.currentPeriod.startDate)} - ${formatDate(ret.currentPeriod.endDate)})`,
                                  monthlyFee: ret.currentPeriod.monthlyFee,
                                  pendingBalance: currentPending,
                                });
                                setPaymentForm({
                                  amount: currentPending,
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  paymentMethod: 'UPI',
                                  notes: `Payment for Period #${ret.currentPeriod.periodNumber}`,
                                });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                            >
                              <CreditCard size={13} />
                              <span>Record Payment / Advance (₹{currentPending})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* PREVIOUS MONTHS BILLING HISTORY */}
                      {ret.historyPeriods && ret.historyPeriods.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-800 mb-2">
                            <History size={14} className="text-charcoal-500" />
                            <span>Previous Months Billing History ({ret.historyPeriods.length})</span>
                          </div>

                          <div className="space-y-2">
                            {ret.historyPeriods.map((p) => {
                              const pPending = p.pendingBalance || 0;
                              return (
                                <div
                                  key={p._id || p.periodNumber}
                                  className="p-3 bg-cream-50 border border-cream-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-charcoal-900">
                                        Period #{p.periodNumber}
                                      </span>
                                      <span className="text-charcoal-600">
                                        {formatDate(p.startDate)} - {formatDate(p.endDate)}
                                      </span>
                                      <span
                                        className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                                          pPending === 0
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : 'bg-rose-50 text-rose-800 border-rose-300'
                                        }`}
                                      >
                                        {pPending === 0 ? '✓ Paid Full' : 'Pending Due'}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-[11px] text-charcoal-600 mt-1">
                                      <span>
                                        Fee: <strong>{formatCurrency(p.monthlyFee)}</strong>
                                      </span>
                                      <span>
                                        Paid:{' '}
                                        <strong className="text-emerald-700">
                                          {formatCurrency(p.tokenAmount || 0)}
                                        </strong>
                                      </span>
                                      <span>
                                        Pending:{' '}
                                        <strong
                                          className={
                                            pPending > 0 ? 'text-[#991B1B] font-bold' : 'text-emerald-700 font-bold'
                                          }
                                        >
                                          {formatCurrency(pPending)}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>

                                  {isSuperAdmin && pPending > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPeriodForPayment({
                                          retainerId: ret._id,
                                          periodNumber: p.periodNumber,
                                          periodLabel: `Period #${p.periodNumber} (${formatDate(p.startDate)} - ${formatDate(p.endDate)})`,
                                          monthlyFee: p.monthlyFee,
                                          pendingBalance: pPending,
                                        });
                                        setPaymentForm({
                                          amount: pPending,
                                          paymentDate: new Date().toISOString().split('T')[0],
                                          paymentMethod: 'UPI',
                                          notes: `Clear pending for Period #${p.periodNumber}`,
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold cursor-pointer shrink-0"
                                    >
                                      Clear Pending (₹{pPending})
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Content Deliverables for current month */}
                      <div className="pt-2 border-t border-cream-200">
                        <span className="text-[10px] text-charcoal-500 uppercase font-bold tracking-wider block mb-1.5">
                          Current Month Deliverables Scope
                        </span>
                        <div className="grid grid-cols-4 gap-2 bg-cream-100 p-2 rounded-lg border border-cream-300 text-[11px] text-charcoal-800">
                          <div>
                            Reels: <strong>{ret.packageDetails?.reelsCount || 0}</strong>
                          </div>
                          <div>
                            Posts: <strong>{ret.packageDetails?.staticPostsCount || 0}</strong>
                          </div>
                          <div>
                            Graphics: <strong>{ret.packageDetails?.graphicDesignsCount || 0}</strong>
                          </div>
                          <div>
                            Stories: <strong>{ret.packageDetails?.storiesCount || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-charcoal-500">{formatDate(pmt.paymentDate)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {pmt.status}
                      </span>

                      {/* Email Receipt Button */}
                      {pmt.status === 'Verified' && (
                        sentReceipts[pmt._id] ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check size={10} /> Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={sendReceiptMutation.isPending}
                            onClick={() => sendReceiptMutation.mutate(pmt._id)}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Send Brevo Email Receipt to Client"
                          >
                            {sendReceiptMutation.isPending && (sendReceiptMutation.variables === pmt._id) ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Mail size={10} />
                            )}
                            <span>Receipt</span>
                          </button>
                        )
                      )}

                      {/* Delete Payment Button */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setPaymentToDelete(pmt)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete payment record & revert balance"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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

      {/* Record Period Payment / Advance Modal */}
      {selectedPeriodForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">Record Period Payment / Advance</h2>
                <p className="text-xs text-charcoal-600">{selectedPeriodForPayment.periodLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPeriodForPayment(null)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-charcoal-600">
                <span>Period Monthly Fee:</span>
                <span className="font-bold text-charcoal-900">{formatCurrency(selectedPeriodForPayment.monthlyFee)}</span>
              </div>
              <div className="flex justify-between text-charcoal-600">
                <span>Pending Balance Due:</span>
                <span className="font-bold text-[#991B1B]">{formatCurrency(selectedPeriodForPayment.pendingBalance)}</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordPeriodPaymentMutation.mutate({
                  retainerId: selectedPeriodForPayment.retainerId,
                  data: {
                    periodNumber: selectedPeriodForPayment.periodNumber,
                    amount: Number(paymentForm.amount),
                    paymentDate: paymentForm.paymentDate,
                    paymentMethod: paymentForm.paymentMethod,
                    notes: paymentForm.notes,
                  },
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Amount Received / Advance (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900 font-bold"
                />
                <p className="text-[10px] text-charcoal-500 mt-0.5">
                  Ye amount is period ke paid balance me add hoga aur ledger me entry banega
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>
              </div>

              {recordPeriodPaymentMutation.isError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {(recordPeriodPaymentMutation.error as any)?.message ||
                    (recordPeriodPaymentMutation.error as any)?.response?.data?.error ||
                    'Payment save karne me error aya. Kripya details verify karein.'}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. ₹500 Advance for next month or GPay Ref"
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodForPayment(null)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPeriodPaymentMutation.isPending || paymentForm.amount <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  {recordPeriodPaymentMutation.isPending ? 'Recording...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Next Month Period Modal */}
      {selectedRetainerForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">Start Next Month Period</h2>
                <p className="text-xs text-charcoal-600">
                  Renewing for Period #{(selectedRetainerForRenew.currentPeriod?.periodNumber || 1) + 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRetainerForRenew(null)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                renewPeriodMutation.mutate({
                  retainerId: selectedRetainerForRenew._id,
                  data: {
                    startDate: renewForm.startDate,
                    endDate: renewForm.endDate || undefined,
                    monthlyFee: Number(renewForm.monthlyFee),
                    tokenAmount: Number(renewForm.tokenAmount || 0),
                    paymentMethod: renewForm.paymentMethod,
                    notes: renewForm.notes,
                  },
                });
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-900">
                Pichhla period history me save ho jayega aur naya mahina start hoga with clean anchor billing date.
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Next Period Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.startDate}
                  onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Period Monthly Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={renewForm.monthlyFee}
                  onChange={(e) => setRenewForm({ ...renewForm, monthlyFee: Number(e.target.value) })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Advance Payment for this new period (₹) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={renewForm.tokenAmount}
                  onChange={(e) => setRenewForm({ ...renewForm, tokenAmount: Number(e.target.value) })}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  placeholder="e.g. 500 advance"
                />
                <p className="text-[10px] text-charcoal-500 mt-0.5">
                  Agar client ne naye mahine ke liye advance diya hai (jaise ₹500), yahan enter karein
                </p>
              </div>

              {renewForm.tokenAmount > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Advance Payment Method</label>
                  <select
                    value={renewForm.paymentMethod}
                    onChange={(e) => setRenewForm({ ...renewForm, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>
              )}

              {renewPeriodMutation.isError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {(renewPeriodMutation.error as any)?.message ||
                    (renewPeriodMutation.error as any)?.response?.data?.error ||
                    'Next period renew karne me error aya.'}
                </div>
              )}

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRetainerForRenew(null)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewPeriodMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/20 cursor-pointer"
                >
                  {renewPeriodMutation.isPending ? 'Starting...' : 'Start Next Month Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Period Details Modal */}
      {selectedPeriodForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full shadow-2xl border-2 border-cream-300">
            <div className="flex items-center justify-between pb-4 border-b border-cream-300">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">
                  Adjust Period #{selectedPeriodForEdit.periodNumber} Details
                </h2>
                <p className="text-xs text-charcoal-600">Manually update period fee, advance or pending balance</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPeriodForEdit(null)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePeriodMutation.mutate({
                  retainerId: selectedPeriodForEdit.retainerId,
                  data: {
                    periodNumber: selectedPeriodForEdit.periodNumber,
                    startDate: selectedPeriodForEdit.startDate,
                    endDate: selectedPeriodForEdit.endDate,
                    monthlyFee: Number(selectedPeriodForEdit.monthlyFee),
                    tokenAmount: Number(selectedPeriodForEdit.tokenAmount),
                    pendingBalance: Number(selectedPeriodForEdit.pendingBalance),
                    billingStatus: selectedPeriodForEdit.billingStatus,
                  },
                });
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={selectedPeriodForEdit.startDate}
                    onChange={(e) =>
                      setSelectedPeriodForEdit({ ...selectedPeriodForEdit, startDate: e.target.value })
                    }
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={selectedPeriodForEdit.endDate}
                    onChange={(e) =>
                      setSelectedPeriodForEdit({ ...selectedPeriodForEdit, endDate: e.target.value })
                    }
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Period Fee (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={selectedPeriodForEdit.monthlyFee}
                  onChange={(e) => {
                    const fee = Number(e.target.value);
                    setSelectedPeriodForEdit({
                      ...selectedPeriodForEdit,
                      monthlyFee: fee,
                      pendingBalance: Math.max(0, fee - selectedPeriodForEdit.tokenAmount),
                    });
                  }}
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Paid / Advance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedPeriodForEdit.tokenAmount}
                    onChange={(e) => {
                      const advance = Number(e.target.value);
                      setSelectedPeriodForEdit({
                        ...selectedPeriodForEdit,
                        tokenAmount: advance,
                        pendingBalance: Math.max(0, selectedPeriodForEdit.monthlyFee - advance),
                      });
                    }}
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 text-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">Is Mahine Baki (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedPeriodForEdit.pendingBalance}
                    onChange={(e) =>
                      setSelectedPeriodForEdit({
                        ...selectedPeriodForEdit,
                        pendingBalance: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900 text-[#991B1B] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">Billing Status</label>
                <select
                  value={selectedPeriodForEdit.billingStatus}
                  onChange={(e) =>
                    setSelectedPeriodForEdit({ ...selectedPeriodForEdit, billingStatus: e.target.value })
                  }
                  className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-900"
                >
                  <option value="Paid">Paid Full</option>
                  <option value="Invoiced">Invoiced (Partially Paid)</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {updatePeriodMutation.isError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {(updatePeriodMutation.error as any)?.message ||
                    (updatePeriodMutation.error as any)?.response?.data?.error ||
                    'Period adjust karne me error aya.'}
                </div>
              )}

              <div className="pt-4 border-t border-cream-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodForEdit(null)}
                  className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-charcoal-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePeriodMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/20 cursor-pointer"
                >
                  {updatePeriodMutation.isPending ? 'Saving...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal (Brevo / Bravo API) */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full text-xs shadow-2xl border-2 border-cream-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Mail size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">Send Email to Client</h2>
                  <p className="text-[11px] text-charcoal-600">Powered by Brevo (Bravo) Transactional Email API</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 p-1 rounded-lg hover:bg-cream-200"
              >
                <X size={16} />
              </button>
            </div>

            {emailSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} /> {emailSuccessMsg}
              </div>
            )}

            {sendEmailMutation.isError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                {(sendEmailMutation.error as any)?.response?.data?.error ||
                  (sendEmailMutation.error as any)?.message ||
                  'Failed to deliver email. Please check your BREVO_API_KEY.'}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendEmailMutation.mutate({
                  clientId: client._id,
                  subject: emailForm.subject,
                  message: emailForm.message,
                  emailType: emailForm.emailType,
                });
              }}
              className="space-y-3"
            >
              <div className="p-2.5 bg-cream-100 rounded-lg border border-cream-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-500 block uppercase font-bold">Recipient</span>
                  <span className="font-bold text-charcoal-900">{client.clientName} ({client.businessName})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-charcoal-500 block uppercase font-bold">Email</span>
                  <span className="font-mono text-blue-700 font-semibold">{client.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Email Type / Template</label>
                <select
                  value={emailForm.emailType}
                  onChange={(e) => {
                    const type = e.target.value as 'custom' | 'reminder';
                    if (type === 'reminder') {
                      setEmailForm({
                        emailType: type,
                        subject: `Monthly Retainer Billing Cycle Update - ${client.businessName} - Jugarr Technologies`,
                        message: `Dear ${client.clientName},\n\nThis is a reminder regarding your current monthly retainer cycle. Please find the statement attached in this email.\n\nBest regards,\nSagar | Jugarr Technologies`,
                      });
                    } else {
                      setEmailForm({
                        emailType: type,
                        subject: `Update regarding ${client.businessName} - Jugarr Technologies`,
                        message: `Hello ${client.clientName},\n\nWe wanted to share an update with you regarding your ongoing deliverables and services.\n\nBest regards,\nSagar`,
                      });
                    }
                  }}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                >
                  <option value="custom">Custom Client Message / Notice</option>
                  <option value="reminder">Retainer Billing Cycle Reminder & Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Email Message / Body *</label>
                <textarea
                  rows={5}
                  required
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="pt-3 border-t border-cream-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3.5 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendEmailMutation.isPending || !emailForm.subject.trim()}
                  className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold shadow-md shadow-blue-900/20 cursor-pointer flex items-center gap-1.5"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Sending via Brevo...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Send Email Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-sm w-full text-xs shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle size={18} />
              <span>Delete Payment Record?</span>
            </div>

            <p className="text-charcoal-700 leading-relaxed">
              Kya aap sach me ye transaction record delete karna chahte hain?
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-600">Amount:</span>
                <span className="font-extrabold text-charcoal-900">{formatCurrency(paymentToDelete.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Ref / UTR:</span>
                <span className="font-mono text-charcoal-700">{paymentToDelete.transactionReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Category:</span>
                <span className="font-semibold text-charcoal-800">{paymentToDelete.category}</span>
              </div>
            </div>

            <p className="text-[11px] text-charcoal-500 italic">
              * Note: Is payment ko delete karne par client ka remaining balance aur period calculation automatically revert ho jayega.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-cream-300">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="px-3.5 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletePaymentMutation.isPending}
                onClick={() => deletePaymentMutation.mutate(paymentToDelete._id)}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-lg font-semibold shadow-md shadow-rose-900/20 cursor-pointer flex items-center gap-1.5"
              >
                {deletePaymentMutation.isPending ? 'Deleting...' : 'Yes, Delete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
