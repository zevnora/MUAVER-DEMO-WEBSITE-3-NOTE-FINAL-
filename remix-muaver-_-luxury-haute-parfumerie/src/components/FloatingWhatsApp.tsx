import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SiteSettings } from '../types/store';

interface FloatingWhatsAppProps {
  settings: SiteSettings;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ settings }) => {
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = settings.whatsappRawNumber || '923242404984';
  const prefilledMessage = encodeURIComponent(
    'Assalam-o-Alaikum MUAVER Royale Concierge,\nI would like to inquire about your bespoke perfumes and assistance with placing an order.'
  );
  const waUrl = `https://wa.me/${phone}?text=${prefilledMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-end gap-3 font-montserrat">
      {/* Interactive Tooltip Callout */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-[#0A1A4F] text-[#F8F4E8] text-xs py-2 px-3.5 rounded-full border border-[#D4AF37]/50 shadow-2xl animate-fade-in backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping shrink-0" />
          <span className="text-[11px] font-medium tracking-wide">
            Need perfume advice? Chat with Concierge
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-white/60 hover:text-white ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_10px_35px_rgba(212,175,55,0.6)] border-2 border-[#D4AF37] transition-all duration-300 transform hover:scale-110 active:scale-95"
        aria-label="Chat on WhatsApp with MUAVER Concierge"
      >
        <MessageCircle className="w-7 h-7 text-white fill-current transition-transform duration-300 group-hover:rotate-12" />
        
        {/* Subtle royal pulse ring */}
        <span className="absolute -inset-1 rounded-full border border-[#D4AF37]/60 animate-ping opacity-60 pointer-events-none" />
        
        {/* Floating pill badge on mobile */}
        <span className="sr-only">WhatsApp Concierge</span>
      </a>
    </div>
  );
};
