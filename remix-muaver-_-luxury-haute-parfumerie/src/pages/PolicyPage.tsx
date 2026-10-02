import React from 'react';
import { 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  DollarSign, 
  Lock, 
  FileText, 
  Banknote, 
  MessageCircle, 
  Crown, 
  Clock, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { SiteSettings, PoliciesConfig } from '../types/store';

export type PolicySlug = 
  | 'delivery-info' 
  | 'returns' 
  | 'refund-policy' 
  | 'privacy-policy' 
  | 'terms' 
  | 'cod-policy';

interface PolicyPageProps {
  slug: PolicySlug;
  settings: SiteSettings;
  onNavigate: (page: string) => void;
}

interface PolicyMeta {
  slug: PolicySlug;
  label: string;
  icon: React.ElementType;
}

const ALL_POLICIES: PolicyMeta[] = [
  { slug: 'delivery-info', label: 'Delivery Information', icon: Truck },
  { slug: 'returns', label: 'Return and Exchange', icon: RotateCcw },
  { slug: 'refund-policy', label: 'Refund Policy', icon: DollarSign },
  { slug: 'privacy-policy', label: 'Privacy Policy', icon: Lock },
  { slug: 'terms', label: 'Terms of Service', icon: FileText },
  { slug: 'cod-policy', label: 'Cash on Delivery Policy', icon: Banknote },
];

export const PolicyPage: React.FC<PolicyPageProps> = ({
  slug,
  settings,
  onNavigate,
}) => {
  const currentPolicyConfig = settings.policies?.[slug];
  const isEnabled = currentPolicyConfig?.isEnabled !== false;

  const currentMeta = ALL_POLICIES.find((p) => p.slug === slug) || ALL_POLICIES[0];
  const IconComp = currentMeta.icon;

  // Render paragraphs and bullets cleanly
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    const blocks = text.split('\n\n');

    return (
      <div className="space-y-4 text-xs sm:text-sm text-[#F8F4E8]/80 leading-relaxed font-light font-sans">
        {blocks.map((block, idx) => {
          const lines = block.split('\n');

          // If block consists of bullet points
          const isBulletList = lines.some((l) => l.trim().startsWith('•') || l.trim().startsWith('-'));

          if (isBulletList) {
            return (
              <ul key={idx} className="space-y-2.5 my-3 pl-2">
                {lines.map((line, lineIdx) => {
                  const cleanText = line.replace(/^[•\-]\s*/, '').trim();
                  if (!cleanText) return null;

                  // Format bold keywords before colon e.g. "Standard Delivery Time:"
                  const colonSplit = cleanText.split(':');
                  if (colonSplit.length > 1) {
                    return (
                      <li key={lineIdx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                        <span>
                          <strong className="text-[#F0D27A] font-semibold">{colonSplit[0]}:</strong>
                          {colonSplit.slice(1).join(':')}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={lineIdx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                      <span>{cleanText}</span>
                    </li>
                  );
                })}
              </ul>
            );
          }

          return (
            <p key={idx} className="leading-relaxed">
              {block}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12 font-montserrat">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-[#F8F4E8]/60">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#F0D27A] transition-colors"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        <span className="text-white/40">Maison Policies</span>
        <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        <span className="text-[#F0D27A] truncate font-semibold">
          {currentPolicyConfig?.title || currentMeta.label}
        </span>
      </nav>

      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#D4AF37]/40 bg-[#0A1A4F]/80 shadow-md">
          <Crown className="w-3.5 h-3.5 text-[#F0D27A]" />
          <span className="text-[11px] uppercase tracking-widest text-[#F0D27A] font-semibold">
            AUHS Royal Client Care
          </span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#F8F4E8]">
          {currentPolicyConfig?.title || currentMeta.label}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#F8F4E8]/50 pt-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Updated: {currentPolicyConfig?.lastUpdated || 'September 2026'}</span>
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">
            Cash on Delivery Available Nationwide
          </span>
        </div>
      </div>

      {/* Main Grid: Policy Nav Drawer (Left) + Document Content (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Quick Policy Switcher */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#081438] border border-[#D4AF37]/25 space-y-3 shadow-xl">
            <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#F0D27A] font-bold pb-2 border-b border-white/10">
              Policy Index
            </h3>
            <div className="space-y-1.5">
              {ALL_POLICIES.map((p) => {
                const ItemIcon = p.icon;
                const isSelected = p.slug === slug;
                const policyObj = settings.policies?.[p.slug];
                const active = policyObj?.isEnabled !== false;

                return (
                  <button
                    key={p.slug}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.history) {
                        window.history.pushState(null, '', `/${p.slug}`);
                      }
                      onNavigate(p.slug);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F0D27A] text-[#050F2E] shadow-md font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ItemIcon className={`w-4 h-4 ${isSelected ? 'text-[#050F2E]' : 'text-[#D4AF37]'}`} />
                      <span>{policyObj?.title || p.label}</span>
                    </div>
                    {!active && (
                      <span className="text-[10px] text-zinc-500 font-mono">Draft</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concierge Assistance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0A1A4F] to-[#081438] border border-[#D4AF37]/25 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-[#F0D27A] font-semibold">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Royale WhatsApp Concierge</span>
            </div>
            <p className="text-xs text-[#F8F4E8]/70 leading-relaxed font-light">
              Have specific questions regarding delivery schedules, exchange processes, or custom fragrance requests?
            </p>
            <a
              href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}?text=${encodeURIComponent(`Assalam-o-Alaikum MUAVER Concierge, I have an inquiry about your ${currentPolicyConfig?.title || 'policies'}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-outline w-full py-2.5 rounded-lg text-xs flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Message Fragrance Advisor</span>
            </a>
          </div>
        </div>

        {/* Right Column: Policy Document Body */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-10 rounded-2xl bg-[#081438] border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
            {/* Ambient Corner Crest Watermark */}
            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
              <img
                src={settings.iconUrl || 'https://i.ibb.co/M5Dq0xS9/Icon.png'}
                alt=""
                width={192}
                height={192}
                loading="lazy"
                decoding="async"
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Document Header */}
            <div className="pb-6 border-b border-[#D4AF37]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0A1A4F] border border-[#D4AF37]/40 text-[#F0D27A]">
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F8F4E8]">
                    {currentPolicyConfig?.title || currentMeta.label}
                  </h2>
                  <span className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-widest block">
                    Certified AUHS Provision
                  </span>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="py-6">
              {!isEnabled ? (
                <div className="p-6 rounded-xl bg-[#050F2E] border border-amber-500/30 text-amber-300 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Scheduled Atelier Revision</span>
                  </div>
                  <p className="leading-relaxed text-amber-200/80">
                    This policy section is temporarily undergoing scheduled review and update. For immediate assistance or questions regarding our procedures, please connect directly with our WhatsApp Concierge advisor.
                  </p>
                </div>
              ) : (
                renderFormattedContent(currentPolicyConfig?.content || '')
              )}
            </div>

            {/* Delivery & COD Assurance Strip */}
            <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#F8F4E8]/70">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#050F2E] border border-white/5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Nationwide Cash on Delivery with Doorstep Inspection</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#050F2E] border border-white/5">
                <Truck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  Delivery: <strong>{settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
