import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const SalesPlaybooksPage: React.FC = () => {
  const serviceCatalog = [
    {
      title: 'Full Web Development & Custom Stack',
      typicalBudget: '₹80,000 - ₹2,50,000',
      timeline: '4 - 6 Weeks',
      deliverables: [
        'Custom React / Vite frontend with Tailwind desktop-first design',
        'Scalable Node / Express / MongoDB architecture',
        'Stripe / Razorpay payment gateway integration',
        'Admin control panel & content management',
        'Cloud deployment & domain configuration',
      ],
      idealFor: 'Businesses needing a custom SaaS, portal, or high-conversion modern web app.',
    },
    {
      title: 'Social Media Recurring Retainer',
      typicalBudget: '₹25,000 - ₹60,000 / month',
      timeline: 'Monthly Rolling Contract',
      deliverables: [
        '15 High-impact short-form Reels & TikToks',
        '20 Carousel & static educational posts',
        'Daily story management & community engagement',
        'Weekly growth & reach analytics review',
      ],
      idealFor: 'Brands looking for consistent organic customer acquisition and authority.',
    },
    {
      title: 'Growth Marketing & Full Funnel',
      typicalBudget: '₹50,000 / month + Ad Spend',
      timeline: 'Quarterly Commitment',
      deliverables: [
        'Meta Ads (Instagram / Facebook) campaign management',
        'Google Search & Performance Max ads setup',
        'Landing page conversion rate optimization (CRO)',
        'Weekly pipeline attribution & ROAS reporting',
      ],
      idealFor: 'E-commerce and service businesses looking for predictable paid customer acquisition.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Service Catalog & Pitch Playbooks</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Standard Offerings
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          Authorized agency package offerings, scope boundaries, and standard pricing structures
        </p>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCatalog.map((svc, idx) => (
          <div key={idx} className="cream-card p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Zap size={14} /> Service Package
              </div>
              <h2 className="text-base font-extrabold text-charcoal-900">{svc.title}</h2>
              <div className="mt-2.5 p-3 bg-white border border-cream-300 rounded-lg text-xs shadow-xs">
                <span className="text-charcoal-500 block text-[10px] uppercase font-bold tracking-wider">Standard Pricing</span>
                <span className="font-extrabold text-emerald-700 text-sm">{svc.typicalBudget}</span>
                <span className="text-charcoal-500 block text-[10px] mt-0.5 font-medium">Est. Timeline: {svc.timeline}</span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <span className="text-charcoal-700 block font-bold text-[11px]">Included Deliverables:</span>
                {svc.deliverables.map((item, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2 text-charcoal-800 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-cream-300 text-[11px] text-charcoal-600">
              <strong className="text-charcoal-900 font-bold">Target Buyer:</strong> {svc.idealFor}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
