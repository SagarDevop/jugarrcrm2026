import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ServiceCatalogItem } from '@agencyos/shared';
import {
  Layers,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Calculator,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Web Development',
  'Mobile App',
  'Social Media Marketing',
  'Performance Ads',
  'Branding & UI/UX',
  'SaaS MVP Development',
];

export const SalesCatalogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quoteItem, setQuoteItem] = useState<ServiceCatalogItem | null>(null);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [quoteAddons, setQuoteAddons] = useState<string[]>([]);

  const { data: catalogItems = [], isLoading } = useQuery<ServiceCatalogItem[]>({
    queryKey: ['sales-catalog', search, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.append('category', selectedCategory);
      }
      return api.get(`/catalog?${params.toString()}`);
    },
  });

  const copyPitch = (item: ServiceCatalogItem) => {
    const text = `Hi! Here is the package overview we discussed for ${item.title}:\n\n` +
      `📌 *Scope & Deliverables:*\n${item.deliverables.map((d) => `• ${d}`).join('\n')}\n\n` +
      `⏱️ *Estimated Turnaround:* ${item.timeline} (${item.deliveryDays} business days)\n` +
      `🛠️ *Tech Stack:* ${item.techStack.join(', ')}\n\n` +
      `💰 *Investment:* ${item.pricingType === 'Range' ? `₹${item.basePrice.toLocaleString()} - ₹${item.maxPrice?.toLocaleString()}` : `${item.pricingType} ₹${item.basePrice.toLocaleString()}`}\n\n` +
      `Let me know if you would like me to prepare the formal contract or schedule our kickoff call!`;

    navigator.clipboard.writeText(text);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyCustomQuote = () => {
    if (!quoteItem) return;
    const base = quoteItem.basePrice;
    const finalAmount = Math.max(0, base - quoteDiscount);

    const text = `*Jugarr CRM - Official Custom Client Quote*\n` +
      `───────────────────────────────\n` +
      `📦 *Package:* ${quoteItem.title} (${quoteItem.category})\n` +
      `⏱️ *Delivery:* ${quoteItem.timeline}\n` +
      `💵 *Standard Base:* ₹${base.toLocaleString()}\n` +
      (quoteDiscount > 0 ? `🎁 *Special Closing Privilege:* -₹${quoteDiscount.toLocaleString()}\n` : '') +
      `💰 *Net Final Quote:* ₹${finalAmount.toLocaleString()}\n\n` +
      `📋 *Deliverables Included:*\n${quoteItem.deliverables.map((d) => `  ✓ ${d}`).join('\n')}\n` +
      (quoteAddons.length > 0 ? `\n✨ *Included Perks:* ${quoteAddons.join(', ')}\n` : '') +
      `───────────────────────────────\n` +
      `Valid for 48 hours. Let's get your project initiated today!`;

    navigator.clipboard.writeText(text);
    alert('Custom quote copied to clipboard! Ready to send to your prospect.');
  };

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Service Catalog & Pitching Playbook</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-[#991B1B] border border-red-200">
              Verified Pricing & Ammunition
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Browse official agency packages, deliverables, verified pricing brackets, and copy client-ready pitch scripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Official Admin Verified Rates</span>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#991B1B] text-white shadow-md shadow-red-900/20'
                : 'bg-white text-slate-600 border border-[#E5E7EB] hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by package name, target client, or specific deliverables..."
          className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#991B1B]"
        />
      </div>

      {/* Catalog Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-[#E5E7EB] rounded-xl">
          Loading service catalog...
        </div>
      ) : catalogItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-xl">
          <Layers size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No packages in this category</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching category filters or search terms.
          </p>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[11px] font-medium text-slate-300">
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

                  {/* Delivery Timeline */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold bg-[#F5F6F8] px-3 py-1.5 rounded-xl border border-slate-200">
                    <Clock size={13} className="text-[#991B1B]" />
                    <span>Timeline: {item.timeline} ({item.deliveryDays} Days)</span>
                  </div>

                  {/* Target Client Profile */}
                  {item.targetClient && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Best For: </span>
                      <span>{item.targetClient}</span>
                    </div>
                  )}

                  {/* Deliverables Checklist */}
                  {item.deliverables && item.deliverables.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        What Client Gets
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

                  {/* Sales Pitch Ammunition */}
                  {item.pitchTips && (
                    <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#991B1B] uppercase tracking-wide">
                        <Sparkles size={12} />
                        <span>Closing Pitch Argument</span>
                      </div>
                      <p className="text-[11px] text-slate-700 italic">"{item.pitchTips}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center gap-2">
                <button
                  onClick={() => copyPitch(item)}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-[#E5E7EB] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedId === item._id ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">Pitch Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-slate-500" />
                      <span>Copy Client Pitch</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setQuoteItem(item);
                    setQuoteDiscount(0);
                    setQuoteAddons([]);
                  }}
                  className="px-3 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-red-900/10"
                  title="Generate custom quote calculation"
                >
                  <Calculator size={14} />
                  <span>Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Generator Modal */}
      {quoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Custom Quote Calculator</h3>
                <p className="text-[11px] text-slate-400">{quoteItem.title}</p>
              </div>
              <button
                onClick={() => setQuoteItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800">Standard Base Price</div>
                  <div className="text-[11px] text-slate-500">{quoteItem.pricingType}</div>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  ₹{quoteItem.basePrice.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Closing Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={quoteItem.basePrice}
                  value={quoteDiscount}
                  onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
                <span className="text-[10px] text-slate-400">
                  Allows sales discretionary incentive for fast wire closing.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Select High-Value Deal Sweeteners
                </label>
                <div className="space-y-1.5">
                  {[
                    'Priority 7-Day Rush Turnaround',
                    'Free 1-Year Cloud Flare Security Setup',
                    'Complimentary Brand Typography Guidelines',
                    '2 Extra Post-Launch Revision Rounds',
                  ].map((perk) => {
                    const isChecked = quoteAddons.includes(perk);
                    return (
                      <label
                        key={perk}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-red-50/50 border-red-300 text-[#991B1B] font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuoteAddons([...quoteAddons, perk]);
                            } else {
                              setQuoteAddons(quoteAddons.filter((p) => p !== perk));
                            }
                          }}
                          className="rounded text-[#991B1B] focus:ring-0"
                        />
                        <span>{perk}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Net Total Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    Net Client Proposal Quote
                  </div>
                  <div className="text-[11px] text-emerald-600">
                    Includes all negotiated deliverables & perks
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-emerald-700">
                  ₹{Math.max(0, quoteItem.basePrice - quoteDiscount).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuoteItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={copyCustomQuote}
                  className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-red-900/10 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Copy Formatted WhatsApp Quote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
