import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Payment, Client, PAYMENT_METHODS, PAYMENT_CATEGORIES } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Building,
  Trash2,
  Mail,
  Check,
  Loader2,
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [sentReceipts, setSentReceipts] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    clientId: '',
    amount: 25000,
    paymentMethod: 'Bank Transfer' as any,
    transactionReference: '',
    category: 'Advance' as any,
    notes: '',
  });

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['admin-payments', filterStatus],
    queryFn: () => {
      const url = filterStatus ? `/payments?status=${filterStatus}` : '/payments';
      return api.get(url);
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['admin-clients-select'],
    queryFn: () => api.get('/clients'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (newPayment: any) => api.post('/payments', newPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      setShowAddModal(false);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Verified' | 'Rejected' }) =>
      api.post(`/payments/${id}/verify`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retainers'] });
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

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Payments Ledger & Verification</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Audited Ledger
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Centralized financial transactions ledger with two-stage verification and audit trail
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Record Inflow Transaction
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['', 'Pending', 'Verified', 'Rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === st
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-white border border-cream-300 text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-100'
            }`}
          >
            {st || 'All Payments'}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="cream-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Category & Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-500">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments && payments.length > 0 ? (
                payments.map((pmt) => (
                  <tr key={pmt._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-charcoal-800 font-bold bg-cream-200 px-2 py-0.5 rounded border border-cream-300">
                        {pmt.transactionReference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900">{(pmt.clientId as any)?.clientName}</div>
                      <div className="text-[11px] text-charcoal-600">{(pmt.clientId as any)?.businessName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-charcoal-900">{pmt.category}</span>
                      <span className="text-[11px] text-charcoal-600 block">{pmt.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-charcoal-900 text-sm">{formatCurrency(pmt.amount)}</td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-medium">{formatDate(pmt.paymentDate)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          pmt.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : pmt.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {pmt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {pmt.status === 'Pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => verifyPaymentMutation.mutate({ id: pmt._id, status: 'Verified' })}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 size={12} /> Verify
                            </button>
                            <button
                              onClick={() => verifyPaymentMutation.mutate({ id: pmt._id, status: 'Rejected' })}
                              className="px-2.5 py-1 bg-cream-200 hover:bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : pmt.status === 'Verified' ? (
                          <div className="inline-flex items-center gap-2">
                            {sentReceipts[pmt._id] ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check size={11} /> Receipt Sent
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={sendReceiptMutation.isPending}
                                onClick={() => sendReceiptMutation.mutate(pmt._id)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Send Brevo Email Receipt to Client"
                              >
                                {sendReceiptMutation.isPending && (sendReceiptMutation.variables === pmt._id) ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Mail size={12} />
                                )}
                                <span>Email Receipt</span>
                              </button>
                            )}
                          </div>
                        ) : null}

                        {/* Delete Payment Button */}
                        <button
                          type="button"
                          onClick={() => setPaymentToDelete(pmt)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Delete this payment record & revert balance"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-charcoal-500">
                    No transactions found in this ledger view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Record Received Payment</h2>
            <form onSubmit={handleRecordSubmit} className="space-y-3">
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
                <label className="block text-charcoal-800 font-semibold mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Transaction Ref / UTR / Check # *</label>
                <input
                  type="text"
                  required
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  placeholder="e.g. UPI-9876543210 or NEFT-123456"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  >
                    {PAYMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
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
                  disabled={recordPaymentMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Submit Payment
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
                <span className="text-charcoal-600">Client:</span>
                <span className="font-semibold text-charcoal-800">{(paymentToDelete.clientId as any)?.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Ref / UTR:</span>
                <span className="font-mono text-charcoal-700">{paymentToDelete.transactionReference}</span>
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
