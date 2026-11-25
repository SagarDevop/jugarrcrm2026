import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Project, Client } from '@agencyos/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  FolderGit2,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building,
  Globe,
  Github,
  Figma,
} from 'lucide-react';

export const AdminProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    category: 'Web Development',
    status: 'Planning' as const,
    totalAmount: 120000,
    quotationBreakdown: {
      frontendDev: 40000,
      backendDev: 40000,
      ecommerce: 20000,
      domain: 2000,
      hosting: 8000,
      maintenance: 10000,
      additional: 0,
    },
    assetLinks: {
      figma: '',
      github: '',
      stagingWebsite: '',
      productionWebsite: '',
    },
  });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['admin-projects'],
    queryFn: () => api.get('/projects'),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['admin-clients-select'],
    queryFn: () => api.get('/clients'),
  });

  const createProjectMutation = useMutation({
    mutationFn: (newProj: any) => api.post('/projects', newProj),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      setShowAddModal(false);
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ projId, mId, status }: { projId: string; mId: string; status: any }) =>
      api.put(`/projects/${projId}/milestones/${mId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate({
      ...formData,
      totalAmount: Number(formData.totalAmount),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Web Development Projects</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Deliverables Tracker
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Quotation cost breakdowns, milestone completion tracking, and production staging deliverables
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Create Web Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading projects...</div>
        ) : projects && projects.length > 0 ? (
          projects.map((proj) => {
            const completedCount = proj.milestones?.filter((m) => m.status === 'Completed').length || 0;
            const totalCount = proj.milestones?.length || 1;
            const progress = Math.round((completedCount / totalCount) * 100);

            return (
              <div key={proj._id} className="cream-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-charcoal-900">{proj.name}</h2>
                    <p className="text-xs text-charcoal-600 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Building size={12} className="text-charcoal-400" />
                      {(proj.clientId as any)?.clientName || (proj.clientId as any)?.businessName || 'Client'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {proj.status}
                  </span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 bg-white border border-cream-300 p-3 rounded-lg text-xs shadow-xs">
                  <div>
                    <span className="text-[10px] text-charcoal-500 block uppercase font-bold tracking-wider">Total Budget</span>
                    <span className="font-extrabold text-charcoal-900">{formatCurrency(proj.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block uppercase font-bold tracking-wider">Paid Amount</span>
                    <span className="font-extrabold text-emerald-700">{formatCurrency(proj.paidAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block uppercase font-bold tracking-wider">Remaining</span>
                    <span className="font-extrabold text-amber-700">{formatCurrency(proj.remainingAmount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-charcoal-600 mb-1 font-medium">
                    <span>Milestones Completed</span>
                    <span className="font-bold text-charcoal-900">
                      {completedCount} / {totalCount} ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden border border-cream-300">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-cream-300 max-h-48 overflow-y-auto pr-1">
                  {proj.milestones?.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-2 rounded bg-white border border-cream-300 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={m.status === 'Completed'}
                          onChange={(e) =>
                            updateMilestoneMutation.mutate({
                              projId: proj._id,
                              mId: m._id!,
                              status: e.target.checked ? 'Completed' : 'In Progress',
                            })
                          }
                          className="rounded border-cream-300 text-charcoal-900 focus:ring-0"
                        />
                        <span className={`truncate font-medium ${m.status === 'Completed' ? 'line-through text-charcoal-400' : 'text-charcoal-800'}`}>
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-charcoal-500 shrink-0 font-semibold">{m.status}</span>
                    </div>
                  ))}
                </div>

                {/* Asset Links */}
                {(proj.assetLinks?.figma || proj.assetLinks?.github || proj.assetLinks?.stagingWebsite) && (
                  <div className="pt-2 border-t border-cream-300 flex items-center gap-3 text-xs">
                    {proj.assetLinks?.figma && (
                      <a href={proj.assetLinks.figma} target="_blank" rel="noreferrer" className="text-violet-700 hover:underline flex items-center gap-1 font-medium">
                        <Figma size={12} /> Figma
                      </a>
                    )}
                    {proj.assetLinks?.github && (
                      <a href={proj.assetLinks.github} target="_blank" rel="noreferrer" className="text-charcoal-700 hover:underline flex items-center gap-1 font-medium">
                        <Github size={12} /> Repo
                      </a>
                    )}
                    {proj.assetLinks?.stagingWebsite && (
                      <a href={proj.assetLinks.stagingWebsite} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-1 font-medium">
                        <Globe size={12} /> Staging
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">
            No projects created yet. Click "Create Web Project" to start tracking.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Create Web Development Project</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Select Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                >
                  <option value="">-- Choose Client --</option>
                  {clients?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.clientName} ({c.businessName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. NextGen E-Commerce Portal"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Total Project Budget (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              {/* Quotation Breakdown */}
              <div className="pt-2 border-t border-cream-300">
                <span className="font-bold text-charcoal-900 block mb-2">Quotation Cost Breakdown</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-charcoal-600 block mb-0.5">Frontend Dev (₹)</label>
                    <input
                      type="number"
                      value={formData.quotationBreakdown.frontendDev}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quotationBreakdown: { ...formData.quotationBreakdown, frontendDev: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-charcoal-600 block mb-0.5">Backend Dev (₹)</label>
                    <input
                      type="number"
                      value={formData.quotationBreakdown.backendDev}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quotationBreakdown: { ...formData.quotationBreakdown, backendDev: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-charcoal-600 block mb-0.5">Hosting & Cloud (₹)</label>
                    <input
                      type="number"
                      value={formData.quotationBreakdown.hosting}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quotationBreakdown: { ...formData.quotationBreakdown, hosting: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-charcoal-600 block mb-0.5">Maintenance (₹)</label>
                    <input
                      type="number"
                      value={formData.quotationBreakdown.maintenance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quotationBreakdown: { ...formData.quotationBreakdown, maintenance: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-white border border-cream-300 rounded p-1.5 text-charcoal-900"
                    />
                  </div>
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
                  disabled={createProjectMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
