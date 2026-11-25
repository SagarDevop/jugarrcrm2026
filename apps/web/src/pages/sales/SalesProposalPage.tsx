import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuthStore } from '../../stores/authStore';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  CreditCard,
  ShieldCheck,
  Send,
  Eye,
} from 'lucide-react';

interface ProposalTemplate {
  name: string;
  category: string;
  title: string;
  totalAmount: number;
  advanceAmount: number;
  timeline: string;
  scopeSummary: string;
  deliverables: string[];
  terms: string;
}

const TEMPLATES: ProposalTemplate[] = [
  {
    name: 'Modern Web & E-Commerce Portal',
    category: 'Web Development',
    title: 'Custom Headless E-Commerce & Growth Web Architecture',
    totalAmount: 65000,
    advanceAmount: 32500,
    timeline: '3 - 4 Weeks (21 Business Days)',
    scopeSummary:
      'End-to-end design and custom web application engineering optimized for sub-second page loads, automated customer conversion funnels, integrated payment gateways, and admin management dashboard.',
    deliverables: [
      'Custom React / Next.js High-Conversion Frontend UX',
      'Integrated Razorpay / Stripe Payment Gateway',
      'Automated Order Notifications & WhatsApp Abandoned Cart Alerts',
      'Complete Admin Inventory & Content Management Panel',
      'Sub-second 95+ Google Lighthouse Performance Optimization',
      '30-Day Post-Launch Technical Support & Warranty',
    ],
    terms:
      '50% Advance Token required to initiate sprint backlog. 50% upon milestone completion prior to production deployment. All source code and IP rights transfer to client upon final clearance.',
  },
  {
    name: 'Social Media Viral Retainer',
    category: 'Social Media Marketing',
    title: 'Monthly High-Ticket Brand Growth & Reels Production Retainer',
    totalAmount: 35000,
    advanceAmount: 35000,
    timeline: 'Monthly Rolling Contract (30-Day Sprints)',
    scopeSummary:
      'Complete social media content architecture including professional short-form video scripting, editing, graphic carousels, daily engagement, and conversion tracking.',
    deliverables: [
      '16 High-Engagement Instagram Reels / YouTube Shorts',
      '12 Brand Identity Graphic Carousels',
      '25 Daily Interactive Story Sequences',
      'Viral Hook & Trend Audio Research Matrix',
      'End-of-Month Analytics & Inflow Conversion Report',
    ],
    terms:
      'Monthly retainer fees are invoiced and cleared at the start of each 30-day billing period. Deliverable calendar locked 7 days prior to monthly sprint.',
  },
  {
    name: 'Corporate Brand Portal & Lead Funnel',
    category: 'Corporate Web',
    title: 'Enterprise Corporate Presence & High-Ticket Lead Engine',
    totalAmount: 45000,
    advanceAmount: 22500,
    timeline: '2 - 3 Weeks (14 Business Days)',
    scopeSummary:
      'Enterprise grade corporate brand website featuring case studies, automated client inquiry routing, SEO metadata architecture, and high-trust aesthetics.',
    deliverables: [
      '8 - 12 Bespoke Responsive Pages (Desktop & Mobile)',
      'Lead Capture CRM Routing & Instant Alert Integration',
      'Full SEO Schema Markup & Social OpenGraph Tags',
      'Interactive Interactive Service Catalog & Portfolio Showcase',
      'Fast CDN Deployment on Cloud Infrastructure',
    ],
    terms:
      '50% token upon project kickoff. Balance 50% upon client review and live server configuration. Includes 2 rounds of UI revisions.',
  },
];

export const SalesProposalPage: React.FC = () => {
  const { user } = useAuthStore();
  const pdfRef = useRef<HTMLDivElement>(null);

  const [clientName, setClientName] = useState('Vikram Singhania');
  const [clientCompany, setClientCompany] = useState('LuxeLiving Interior Decor Pvt Ltd');
  const [clientEmail, setClientEmail] = useState('vikram@luxelivingdecor.in');
  const [clientPhone, setClientPhone] = useState('+91 98765 43210');

  const [proposalTitle, setProposalTitle] = useState(TEMPLATES[0].title);
  const [refNumber, setRefNumber] = useState(
    `JUG-PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [validDays, setValidDays] = useState(14);

  const [totalAmount, setTotalAmount] = useState<number>(TEMPLATES[0].totalAmount);
  const [advanceAmount, setAdvanceAmount] = useState<number>(TEMPLATES[0].advanceAmount);
  const [timeline, setTimeline] = useState(TEMPLATES[0].timeline);
  const [scopeSummary, setScopeSummary] = useState(TEMPLATES[0].scopeSummary);
  const [deliverables, setDeliverables] = useState<string[]>(TEMPLATES[0].deliverables);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [terms, setTerms] = useState(TEMPLATES[0].terms);
  const [customNote, setCustomNote] = useState(
    'We are excited about the potential partnership with your team and look forward to accelerating your digital growth.'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const remainingBalance = Math.max(0, totalAmount - advanceAmount);

  // Apply template
  const handleApplyTemplate = (tpl: ProposalTemplate) => {
    setProposalTitle(tpl.title);
    setTotalAmount(tpl.totalAmount);
    setAdvanceAmount(tpl.advanceAmount);
    setTimeline(tpl.timeline);
    setScopeSummary(tpl.scopeSummary);
    setDeliverables([...tpl.deliverables]);
    setTerms(tpl.terms);
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  // 1. Generate Downloadable PDF with jsPDF & html2canvas
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsGenerating(true);

    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Jugarr-Proposal-${(clientCompany || clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try Native Print/PDF button as an alternative.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Native Print / Save as PDF
  const handleNativePrint = () => {
    window.print();
  };

  // 3. Copy formatted summary for WhatsApp/Email
  const handleCopySummary = () => {
    const text = `*Jugarr Agency — Commercial Proposal & Quotation*\n` +
      `───────────────────────────────\n` +
      `👤 *Client:* ${clientName} (${clientCompany})\n` +
      `📋 *Reference:* ${refNumber}\n` +
      `📌 *Scope:* ${proposalTitle}\n` +
      `⏱️ *Timeline:* ${timeline}\n\n` +
      `💰 *Total Investment:* ₹${totalAmount.toLocaleString()}\n` +
      `💵 *Initial Token (50%):* ₹${advanceAmount.toLocaleString()}\n` +
      `💳 *Balance on Delivery:* ₹${remainingBalance.toLocaleString()}\n\n` +
      `📦 *Key Deliverables:*\n${deliverables.map((d) => `  ✓ ${d}`).join('\n')}\n\n` +
      `Official PDF proposal has been generated and ready for your sign-off!`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-full">
      {/* Non-print Header & Toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proposal & PDF Quotation Generator</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-[#991B1B] border border-red-200">
              White & Red Jugarr Branding
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Write custom proposal text, select instant presets, and generate high-resolution branded client PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedSummary ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleNativePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Print or Save as Vector PDF via browser dialog"
          >
            <Printer size={14} />
            <span>Print / Vector PDF</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-red-900/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={15} />
            <span>{isGenerating ? 'Generating PDF...' : 'Download Branded PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Editor (Left) & PDF Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* LEFT COLUMN: Editor Form (Hidden on Print) */}
        <div className="print:hidden lg:col-span-5 space-y-5">
          {/* Preset Template Selector */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#991B1B]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Quick 1-Click Templates
              </h3>
            </div>
            <div className="space-y-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#991B1B] hover:bg-red-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-[#991B1B]">
                      {tpl.name}
                    </div>
                    <div className="text-[10px] text-slate-500">₹{tpl.totalAmount.toLocaleString()} • {tpl.timeline}</div>
                  </div>
                  <span className="text-[10px] text-[#991B1B] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Load Preset →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Client & Metadata Form */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User size={15} className="text-[#991B1B]" />
              <span>Client & Proposal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Proposal Subject / Title *</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Ref ID</label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#991B1B]" />
                <span>Financial Scope & Milestones</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Fee (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Token / Advance (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Timeline</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            {/* Scope Summary Description */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block font-semibold text-slate-700">Project Executive Scope</label>
              <textarea
                rows={3}
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
              />
            </div>

            {/* Deliverables List */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block font-semibold text-slate-700">Included Deliverables</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {deliverables.map((deliv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs text-slate-800 leading-tight">✓ {deliv}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="text-slate-400 hover:text-red-700 p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDeliverable();
                    }
                  }}
                  placeholder="Add custom deliverable..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#991B1B]"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Terms and Custom Note */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commercial Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Personal Note / Closing Message</label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live A4 PDF Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-1 print:hidden">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-[#991B1B]" />
              <span>Live White & Red PDF Preview (A4 Format)</span>
            </span>
            <span className="text-[11px] text-slate-400">Updates in real time as you type</span>
          </div>

          {/* THE ACTUAL PRINTABLE / PDF ELEMENT */}
          <div
            ref={pdfRef}
            id="proposal-document"
            className="w-full max-w-[794px] bg-white text-slate-900 shadow-xl border border-slate-200 rounded-2xl overflow-hidden font-sans p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none print:rounded-none"
            style={{ minHeight: '1123px' }} // Standard A4 Aspect Ratio
          >
            {/* Top Red Accent Brand Header */}
            <div className="border-b-4 border-[#991B1B] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Left Brand Identity */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#991B1B] to-[#7F1D1D] text-white flex items-center justify-center font-black text-xl shadow-md shadow-red-900/30">
                    J
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                      Jugarr Agency
                    </h2>
                    <span className="text-[10px] font-bold text-[#991B1B] uppercase tracking-widest block mt-0.5">
                      Digital Engineering & Growth Systems
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs pt-1 leading-tight">
                  High-converting web platforms, full-stack architectures, and growth media engines.
                </p>
              </div>

              {/* Right Proposal Meta Badge */}
              <div className="sm:text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-red-50 border border-red-200 text-[#991B1B] text-xs font-bold rounded-lg uppercase tracking-wider">
                  Commercial Proposal
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Ref: <span className="font-mono text-[#991B1B]">{refNumber}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Date: <span className="font-medium text-slate-700">{proposalDate}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Valid Until:{' '}
                  <span className="font-medium text-slate-700">
                    {new Date(Date.now() + validDays * 86400000).toLocaleDateString()} ({validDays} Days)
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient / Client Bar */}
            <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Prepared Specifically For:
                </span>
                <div className="text-base font-bold text-slate-900">{clientName || 'Valued Client'}</div>
                <div className="text-xs font-semibold text-[#991B1B]">{clientCompany || 'Company / Brand'}</div>
                {clientEmail && <div className="text-xs text-slate-600 mt-0.5">{clientEmail}</div>}
                {clientPhone && <div className="text-xs text-slate-600">{clientPhone}</div>}
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Issued By:
                </span>
                <div className="text-xs font-bold text-slate-900">Jugarr Agency Operations</div>
                <div className="text-xs text-slate-600">
                  Account Exec: <span className="font-semibold text-slate-800">{user?.name || 'Sarah Jenkins'}</span>
                </div>
                <div className="text-xs text-slate-600">contact@jugarr.in • official portal</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center sm:justify-end gap-1">
                  <ShieldCheck size={12} /> Verified Commercial Quotation
                </div>
              </div>
            </div>

            {/* Proposal Scope Title & Summary */}
            <div className="space-y-3">
              <div className="border-l-4 border-[#991B1B] pl-4">
                <span className="text-[10px] font-bold text-[#991B1B] uppercase tracking-wider block">
                  Project Engagement Scope
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                  {proposalTitle}
                </h3>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-[#FDFEFE] p-4 rounded-xl border border-slate-100">
                {scopeSummary}
              </p>
            </div>

            {/* Deliverables Checklist Box */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
                <span>Scope Deliverables & Specifications</span>
              </h4>

              <div className="grid grid-cols-1 gap-2 border border-slate-200 rounded-xl p-4 bg-white">
                {deliverables.map((deliv, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 py-1 border-b border-slate-100 last:border-none">
                    <CheckCircle2 size={15} className="text-[#991B1B] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{deliv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Investment Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
                <span>Investment & Milestone Schedule</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#991B1B] text-white">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Milestone / Scope Component</th>
                      <th className="py-2.5 px-4 font-bold">Schedule</th>
                      <th className="py-2.5 px-4 font-bold text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Sprint 1: Initiation Token & Architectural Setup
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">Due Upon Signing</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        ₹{advanceAmount.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        Sprint 2: Final Verification, Review & Deployment
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{timeline}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        ₹{remainingBalance.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-red-50/70 border-t-2 border-[#991B1B]/40 font-bold">
                      <td className="py-3 px-4 text-slate-900 text-sm">Total Project Investment</td>
                      <td className="py-3 px-4 text-[#991B1B] font-semibold">{timeline}</td>
                      <td className="py-3 px-4 text-right text-base text-[#991B1B] font-extrabold">
                        ₹{totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Terms & Notes */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Standard Commercial Terms
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{terms}</p>
              {customNote && (
                <p className="text-[11px] text-[#991B1B] italic pt-1 border-t border-slate-200">
                  Note: "{customNote}"
                </p>
              )}
            </div>

            {/* Official Sign-off & Acceptance Blocks */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Authorized Signatory (Jugarr Agency)
                </span>
                <div className="h-14 flex items-end">
                  <div className="font-serif italic text-lg text-slate-800 font-bold tracking-wider">
                    Ethan Vance / Jugarr HQ
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500">
                  Super Admin & Founder • Apex Digital Labs / Jugarr
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Accepted & Confirmed by Client
                </span>
                <div className="h-14 border-b border-dashed border-slate-400 flex items-center justify-center text-slate-400 text-[11px]">
                  [Signature & Company Seal]
                </div>
                <div className="pt-1 text-[10px] text-slate-500 flex justify-between">
                  <span>Authorized Signature: {clientName}</span>
                  <span>Date: ____/____/2026</span>
                </div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Jugarr CRM Proposal Engine • Generated securely</span>
              <span className="text-[#991B1B] font-semibold">Jugarr Agency • All Rights Reserved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
