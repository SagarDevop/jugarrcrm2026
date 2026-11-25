import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { User, USER_ROLES } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  UserCheck,
  Plus,
  KeyRound,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminTeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    salesTarget: 50000,
    commissionPercentage: 10,
    role: USER_ROLES.SALES_MEMBER as any,
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-team-users'],
    queryFn: () => api.get('/team'),
  });

  const createMemberMutation = useMutation({
    mutationFn: (newMember: any) => api.post('/team', newMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-users'] });
      setShowAddModal(false);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/team/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post(`/team/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      setResetSuccess('Password has been securely reset!');
      setTimeout(() => {
        setSelectedUserForReset(null);
        setResetSuccess(null);
        setNewPassword('');
        setShowResetPassword(false);
      }, 1500);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-users'] });
    },
  });

  const handleDeleteMember = (u: User) => {
    if (confirm(`Are you sure you want to permanently delete team member "${u.name}" (${u.email})?`)) {
      deleteMemberMutation.mutate(u._id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMemberMutation.mutate({
      ...formData,
      salesTarget: Number(formData.salesTarget),
      commissionPercentage: Number(formData.commissionPercentage),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Sales Team Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">
              Access & Targets
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Create sales accounts, assign monthly targets, commission rules, and secure access permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      {/* Users Table */}
      <div className="cream-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Monthly Target</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-500">
                    Loading team accounts...
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900">{u.name}</div>
                      <div className="text-[11px] text-charcoal-600">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cream-200 border border-cream-300 text-charcoal-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-charcoal-900">{formatCurrency(u.salesTarget || 0)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">{u.commissionPercentage || 10}%</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: u._id, isActive: !u.isActive })}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-rose-50 hover:text-rose-800'
                            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                        title="Click to toggle active status"
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUserForReset(u);
                            setNewPassword('');
                            setShowResetPassword(false);
                          }}
                          className="px-2.5 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded-lg text-xs inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          <KeyRound size={12} /> Reset Password
                        </button>

                        {u.role !== USER_ROLES.SUPER_ADMIN && (
                          <button
                            onClick={() => handleDeleteMember(u)}
                            disabled={deleteMemberMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title={`Delete ${u.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-500">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-sm w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-1">Reset Member Password</h2>
            <p className="text-charcoal-600 mb-4">
              Setting new secure password for <strong>{selectedUserForReset.name}</strong> ({selectedUserForReset.email})
            </p>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 mb-3 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={16} /> {resetSuccess}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetPasswordMutation.mutate({ id: selectedUserForReset._id, newPassword });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 pr-10 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-cream-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-3 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-4 py-1.5 bg-charcoal-900 hover:bg-black text-white rounded font-semibold shadow-sm"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-md w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Add Sales Team Member</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sarah@agency.com"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-white border border-cream-300 rounded-lg px-3 pr-10 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showAddPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAddPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salesTarget}
                    onChange={(e) => setFormData({ ...formData, salesTarget: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-800 font-semibold mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionPercentage}
                    onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                    className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
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
                  disabled={createMemberMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
