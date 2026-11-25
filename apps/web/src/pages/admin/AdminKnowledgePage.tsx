import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { KnowledgeResource, KNOWLEDGE_CATEGORIES, KnowledgeCategory } from '@agencyos/shared';
import { BookOpen, Plus, Search, Tag, Eye } from 'lucide-react';

export const AdminKnowledgePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeResource | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Sales Pitch Scripts' as KnowledgeCategory,
    richContent: '',
    searchTags: 'pitch, sales, cold call',
    isPublished: true,
  });

  const { data: resources, isLoading } = useQuery<KnowledgeResource[]>({
    queryKey: ['admin-knowledge', search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      return api.get(`/knowledge?${params.toString()}`);
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: (newRes: any) => api.post('/knowledge', newRes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge'] });
      setShowAddModal(false);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResourceMutation.mutate({
      ...formData,
      searchTags: formData.searchTags.split(',').map((t) => t.trim()),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Company Knowledge Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              SOPs & Battlecards
            </span>
          </div>
          <p className="text-xs text-charcoal-600 mt-1">
            Internal sales scripts, objection handling playbooks, service catalogs, and standard operating procedures
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-lg shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Publish New Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="text-charcoal-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title, description or tag..."
            className="w-full bg-white border border-cream-300 rounded-lg pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-charcoal-900"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-cream-300 rounded-lg px-3 py-2 text-xs text-charcoal-800 focus:outline-none focus:border-charcoal-900"
        >
          <option value="">All Categories</option>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading knowledge base...</div>
        ) : resources && resources.length > 0 ? (
          resources.map((res) => (
            <div
              key={res._id}
              onClick={() => setSelectedDoc(res)}
              className="cream-card p-5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cream-200 text-charcoal-800 border border-cream-300">
                  {res.category}
                </span>
                <h2 className="text-sm font-bold text-charcoal-900 mt-2.5 line-clamp-1">{res.title}</h2>
                <p className="text-xs text-charcoal-600 mt-1.5 line-clamp-2">{res.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-cream-300 flex items-center justify-between text-[11px] text-charcoal-500">
                <span className="flex items-center gap-1 font-medium">
                  <Tag size={12} /> {res.searchTags?.slice(0, 2).join(', ')}
                </span>
                <span className="text-charcoal-900 font-bold flex items-center gap-1">
                  Read <Eye size={12} />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">
            No resources found matching the criteria.
          </div>
        )}
      </div>

      {/* Resource Detail Reader Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-2 border-cream-300">
            <div className="flex items-start justify-between pb-3 border-b border-cream-300">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream-200 text-charcoal-800 border border-cream-300">
                  {selectedDoc.category}
                </span>
                <h2 className="text-base font-bold text-charcoal-900 mt-1">{selectedDoc.title}</h2>
                <p className="text-xs text-charcoal-600 mt-0.5">{selectedDoc.description}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-2.5 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-800 font-semibold rounded text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-4 text-xs text-charcoal-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-4 rounded-lg border border-cream-300">
              {selectedDoc.richContent}
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="cream-card p-6 max-w-lg w-full text-xs shadow-2xl border-2 border-cream-300">
            <h2 className="text-base font-bold text-charcoal-900 mb-3">Publish Knowledge Resource</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise Objection Handling: Price vs ROI"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                >
                  {KNOWLEDGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary for quick reference..."
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Rich Content & Scripts *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.richContent}
                  onChange={(e) => setFormData({ ...formData, richContent: e.target.value })}
                  placeholder="Enter full step-by-step guidance, verbatim talk tracks, and battle cards..."
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 font-mono text-xs focus:outline-none focus:border-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-charcoal-800 font-semibold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.searchTags}
                  onChange={(e) => setFormData({ ...formData, searchTags: e.target.value })}
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
                  disabled={createResourceMutation.isPending}
                  className="px-4 py-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded font-semibold shadow-md shadow-red-900/20 cursor-pointer"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
