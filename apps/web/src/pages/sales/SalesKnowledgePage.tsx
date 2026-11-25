import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { KnowledgeResource } from '@agencyos/shared';
import { BookOpen, Search, Tag, Eye } from 'lucide-react';

export const SalesKnowledgePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeResource | null>(null);

  const { data: resources, isLoading } = useQuery<KnowledgeResource[]>({
    queryKey: ['sales-knowledge', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      return api.get(`/knowledge?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Sales Knowledge Base</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Battlecards & Scripts
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          Battle-tested pitch scripts, objection handling talk tracks, and packaging guidance
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="text-charcoal-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sales battlecards, objection handling scripts, and SOPs..."
          className="w-full bg-white border border-cream-300 rounded-lg pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-emerald-700"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading resources...</div>
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
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  Read Script <Eye size={12} />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">No published resources found.</div>
        )}
      </div>

      {/* Detail Reader Modal */}
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
    </div>
  );
};
