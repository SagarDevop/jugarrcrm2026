import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ContentItem } from '@agencyos/shared';
import { Sparkles, Copy, Check } from 'lucide-react';

export const AdminContentStudioPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('E-Commerce & D2C');
  const [promptType, setPromptType] = useState<'video_script' | 'reel_idea' | 'caption'>('video_script');
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: contentItems } = useQuery<ContentItem[]>({
    queryKey: ['admin-content-items'],
    queryFn: () => api.get('/content'),
  });

  const generateAiMutation = useMutation({
    mutationFn: (payload: any) => api.post('/content/ai-assistant', payload),
    onSuccess: (data: any) => {
      setGeneratedResult(data.generatedContent);
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateAiMutation.mutate({
      promptType,
      topic,
      industry,
    });
  };

  const copyToClipboard = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Content & Intelligence Studio</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">
            Creative Copilot
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          AI marketing assistants, viral video scripts, social media copy and industry briefs
        </p>
      </div>

      {/* AI Assistant Interactive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cream-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
            <Sparkles className="text-violet-700" size={18} />
            <span>AI Content & Pitch Assistant</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3 text-xs">
            <div>
              <label className="block text-charcoal-800 font-semibold mb-1">Generation Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['video_script', 'reel_idea', 'caption'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPromptType(t)}
                    className={`py-2 px-3 rounded-lg font-semibold capitalize text-center transition-all ${
                      promptType === t
                        ? 'bg-charcoal-900 text-white shadow-sm'
                        : 'bg-white border border-cream-300 text-charcoal-700 hover:bg-cream-100'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-charcoal-800 font-semibold mb-1">Target Industry / Niche</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
                placeholder="e.g. Real Estate, SaaS, Fitness"
              />
            </div>

            <div>
              <label className="block text-charcoal-800 font-semibold mb-1">Topic or Pain Point *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why standard websites lose 90% of paid ad visitors"
                className="w-full bg-white border border-cream-300 rounded px-3 py-2 text-charcoal-900 focus:outline-none focus:border-charcoal-900"
              />
            </div>

            <button
              type="submit"
              disabled={generateAiMutation.isPending}
              className="w-full py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold rounded-lg shadow-md shadow-red-900/20 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
            >
              <Sparkles size={14} />
              {generateAiMutation.isPending ? 'Generating Intelligence...' : 'Generate AI Studio Copy'}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="cream-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-cream-300">
              <span className="text-xs font-bold text-charcoal-900">Output Preview</span>
              {generatedResult && (
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-900 rounded text-[11px] font-semibold flex items-center gap-1 border border-cream-300"
                >
                  {copied ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy Script'}
                </button>
              )}
            </div>

            {generatedResult ? (
              <div className="bg-white p-4 rounded-lg border border-cream-300 text-xs text-charcoal-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                {generatedResult}
              </div>
            ) : (
              <div className="py-20 text-center text-charcoal-500 text-xs">
                Fill the form on the left and click "Generate AI Studio Copy" to produce scripts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
