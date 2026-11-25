import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ServiceCatalogItem } from '@agencyos/shared';
import {
  Layers,
  Plus,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Tag,
  DollarSign,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

const CATEGORIES = [
  'Web Development',
  'Mobile App',
  'Social Media Marketing',
  'Performance Ads',
  'Branding & UI/UX',
  'SaaS MVP Development',
];

export const AdminCatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    description: '',
    pricingType: 'Starting At' as 'Fixed' | 'Range' | 'Starting At',
    basePrice: 45000,
    maxPrice: 85000,
    deliveryDays: 21,
    timeline: '3 - 4 Weeks',
    deliverables: 'Custom UI/UX Design, Full responsive build, Payment gateway integration, Admin dashboard, Speed optimization',
    techStack: 'React, Next.js, Tailwind CSS, Node.js, MongoDB',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    targetClient: 'Fast-growing startups, D2C brands, and established enterprise accounts',
    pitchTips: 'Highlight lost revenue from legacy websites. Position this custom build as an automated customer conversion asset.',
  });

  const { data: catalogItems = [], isLoading } = useQuery<ServiceCatalogItem[]>({
    queryKey: ['admin-catalog', search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      return api.get(`/catalog?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/catalog', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/catalog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setEditingItem(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Web Development',
      description: '',
      pricingType: 'Starting At',
      basePrice: 45000,
      maxPrice: 85000,
      deliveryDays: 21,
      timeline: '3 - 4 Weeks',
      deliverables: 'Custom UI/UX Design, Full responsive build, Payment gateway integration, Speed optimization',
      techStack: 'React, Next.js, Tailwind CSS, Node.js, MongoDB',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      targetClient: 'Fast-growing startups and established enterprise accounts',
      pitchTips: 'Focus on business ROI and conversion rates over raw tech specs.',
    });
  };

  const handleOpenEdit = (item: ServiceCatalogItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      pricingType: item.pricingType,
      basePrice: item.basePrice,
      maxPrice: item.maxPrice || 0,
      deliveryDays: item.deliveryDays,
      timeline: item.timeline,
      deliverables: item.deliverables.join(', '),
      techStack: item.techStack.join(', '),
      imageUrl: item.imageUrl || '',
      targetClient: item.targetClient || '',
      pitchTips: item.pitchTips || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      basePrice: Number(formData.basePrice),
      maxPrice: formData.pricingType === 'Range' ? Number(formData.maxPrice) : undefined,
      deliveryDays: Number(formData.deliveryDays),
      deliverables: formData.deliverables.split(',').map((s) => s.trim()).filter(Boolean),
      techStack: formData.techStack.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyPitch = (item: ServiceCatalogItem) => {
    const text = `*${item.title}* (${item.category})\n` +
      `💰 Pricing: ${item.pricingType === 'Range' ? `₹${item.basePrice.toLocaleString()} - ₹${item.maxPrice?.toLocaleString()}` : `${item.pricingType} ₹${item.basePrice.toLocaleString()}`}\n` +
      `⏱️ Delivery Timeline: ${item.timeline}\n\n` +
      `📦 Included Deliverables:\n${item.deliverables.map((d) => `• ${d}`).join('\n')}\n\n` +
      `🎯 Ideal For: ${item.targetClient || 'Growing businesses'}\n` +
      `💡 Key Pitch Proposition:\n"${item.pitchTips || item.description}"`;

    navigator.clipboard.writeText(text);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalPackages = catalogItems.length;
  const avgBasePrice = totalPackages > 0
    ? Math.round(catalogItems.reduce((acc, curr) => acc + curr.basePrice, 0) / totalPackages)
    : 0;

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Service Catalog & Pricing Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
              Agency Master Catalog
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configure official packages, transparent pricing brackets, deliverables, and sales pitching playbooks.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-xs rounded-xl shadow-md shadow-red-900/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Add New Service Package
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Active Packages</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#991B1B] flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalPackages}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for instant sales pitching</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Average Base Price</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">₹{avgBasePrice.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified baseline deal size</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pitch Enablement</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">100% Synced</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Live on all Sales team dashboards</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages by service name, deliverables, or tech stack..."
            className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#991B1B]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#991B1B] w-full sm:w-auto"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-[#E5E7EB] rounded-xl">
          Loading service packages...
        </div>
      ) : catalogItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-xl">
          <Layers size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No service packages found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first official agency package with deliverables and pricing to empower your sales reps.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-[#991B1B] text-white text-xs font-semibold rounded-xl hover:bg-[#7F1D1D] transition-all"
          >
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catalogItems.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Banner */}
                {item.imageUrl ? (
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-xs font-medium text-slate-200">
                        {item.pricingType}
                      </div>
                      <div className="text-xl font-extrabold text-white">
                        {item.pricingType === 'Range'
                          ? `₹${item.basePrice.toLocaleString()} - ₹${item.maxPrice?.toLocaleString()}`
                          : `₹${item.basePrice.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-red-100 text-[#991B1B] text-[10px] font-bold rounded-md">
                      {item.category}
                    </span>
                    <div className="text-base font-bold text-[#991B1B]">
                      {item.pricingType === 'Range'
                        ? `₹${item.basePrice.toLocaleString()} - ₹${item.maxPrice?.toLocaleString()}`
                        : `${item.pricingType} ₹${item.basePrice.toLocaleString()}`}
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  {/* Timeline Badge */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold bg-[#F5F6F8] px-3 py-1.5 rounded-xl border border-slate-200">
                    <Clock size={13} className="text-[#991B1B]" />
                    <span>Estimated Turnaround: {item.timeline} ({item.deliveryDays} Days)</span>
                  </div>

                  {/* Deliverables Checklist */}
                  {item.deliverables && item.deliverables.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Included Deliverables
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {item.deliverables.map((deliv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{deliv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack Pills */}
                  {item.techStack && item.techStack.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Technologies & Tools
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.techStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pitch Tips */}
                  {item.pitchTips && (
                    <div className="p-3 bg-red-50/60 border border-red-200/70 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#991B1B] uppercase tracking-wide">
                        <Sparkles size={12} />
                        <span>Sales Pitch Ammunition</span>
                      </div>
                      <p className="text-[11px] text-slate-700 italic">"{item.pitchTips}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                <button
                  onClick={() => copyPitch(item)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Copy pitch text for WhatsApp or Email"
                >
                  {copiedId === item._id ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Pitch</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                    title="Edit Package"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                        deleteMutation.mutate(item._id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Package"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Service Package' : 'Create New Service Package'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Set deliverables, pricing brackets, timeline and pitch guidance for sales reps
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Service Package Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Modern E-Commerce Storefront & Automation"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pricing Model</label>
                  <select
                    value={formData.pricingType}
                    onChange={(e) =>
                      setFormData({ ...formData, pricingType: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  >
                    <option value="Starting At">Starting At (e.g. Starting At ₹45,000)</option>
                    <option value="Fixed">Fixed Contract (e.g. ₹60,000)</option>
                    <option value="Range">Price Range (e.g. ₹50,000 - ₹90,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                {formData.pricingType === 'Range' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Max Price (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.maxPrice}
                      onChange={(e) => setFormData({ ...formData, maxPrice: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Timeline Description
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g. 3 - 4 Weeks or Monthly Retainer"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Turnaround Days (Numeric)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({ ...formData, deliveryDays: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cover Image URL (Unsplash or CDN)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 h-24 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as any).style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Overview of the service and value proposition..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deliverables Checklist (Comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliverables}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    placeholder="Custom Next.js UX, Razorpay Gateway, Admin Dashboard, WhatsApp recovery alerts"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                  <span className="text-[10px] text-slate-400">Separate each deliverable with a comma</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tech Stack & Tools (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="React, Next.js, Tailwind CSS, Node.js, Stripe"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Client Profile
                  </label>
                  <input
                    type="text"
                    value={formData.targetClient}
                    onChange={(e) => setFormData({ ...formData, targetClient: e.target.value })}
                    placeholder="D2C Brands, Real Estate Developers, Tech Consultancies"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sales Pitch Guidance & Key Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    value={formData.pitchTips}
                    onChange={(e) => setFormData({ ...formData, pitchTips: e.target.value })}
                    placeholder="Point out conversion drops from slow legacy sites. Highlight sub-second speed..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold rounded-xl shadow-md transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingItem
                    ? 'Update Package'
                    : 'Publish Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
