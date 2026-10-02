import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { SiteSettings } from '../types/store';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasInstagram = Boolean(settings.socialLinks?.instagram && settings.socialLinks.instagram.trim() !== '');
  const hasTikTok = Boolean(settings.socialLinks?.tiktok && settings.socialLinks.tiktok.trim() !== '');
  const hasFacebook = Boolean(settings.socialLinks?.facebook && settings.socialLinks.facebook.trim() !== '');

  return (
    <footer className="bg-[#03091D] border-t border-[#D4AF37]/25 pt-16 pb-12 text-[#F8F4E8]/80 font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-5 lg:col-span-1">
            <div className="flex items-center">
              <img
                src={settings.landscapeLogoUrl || 'https://i.ibb.co/8n6t1tQH/Untitled-design.png'}
                alt="MUAVER"
                width={200}
                height={56}
                decoding="async"
                className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)]"
                loading="lazy"
              />
            </div>
            <p className="text-xs uppercase tracking-widest text-[#F0D27A] font-semibold">
              {settings.footerTagline || settings.tagline || 'CRAFTED FOR DISTINCTION By AUHS'}
            </p>
            <p className="text-xs leading-relaxed text-[#F8F4E8]/65 font-light">
              {settings.footerBlurb ||
                'Distilled at the apex of artistic expression. Rare oils, timeless bottle craftsmanship, and commanding sillage for connoisseurs of regal elegance.'}
            </p>

            {/* Social Icons (Dynamic: hides if empty field) */}
            <div className="pt-2 flex items-center space-x-4">
              {hasInstagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#F0D27A] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:scale-105 transition-all"
                  aria-label="Follow MUAVER on Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}

              {hasTikTok && (
                <a
                  href={settings.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#F0D27A] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:scale-105 transition-all"
                  aria-label="Follow MUAVER on TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.3 6.3 0 0 0 1.9-4.47V8.62a8.27 8.27 0 0 0 4.88 1.58V6.75a4.85 4.85 0 0 1-1-.06z"/>
                  </svg>
                </a>
              )}

              {hasFacebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#F0D27A] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:scale-105 transition-all"
                  aria-label="Follow MUAVER on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.6 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>
              )}

              <a
                href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/15 hover:border-[#25D366] hover:scale-105 transition-all"
                aria-label="Direct WhatsApp Concierge"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#F0D27A] font-cinzel font-bold">
              The Maison
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => handleNav('home')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none"
                >
                  The Entrance (Home)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('shop')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none"
                >
                  The Royal Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('about')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none"
                >
                  Crafted by AUHS Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none"
                >
                  Royale Concierge & Enquiries
                </button>
              </li>
            </ul>
          </div>

          {/* Policies & White-Glove Service Column */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#F0D27A] font-cinzel font-bold">
              Policies & Delivery
            </h4>
            <ul className="space-y-2.5 text-xs text-[#F8F4E8]/80">
              <li>
                <button
                  onClick={() => handleNav('delivery-info')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Delivery Information</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('returns')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Return and Exchange</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('refund-policy')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Refund Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('cod-policy')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Cash on Delivery Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('privacy-policy')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('terms')}
                  className="hover:text-[#F0D27A] transition-colors focus:outline-none flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></span>
                  <span>Terms of Service</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Concierge Column */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#F0D27A] font-cinzel font-bold">
              Royale Concierge
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Phone & WhatsApp</span>
                  <a
                    href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#F0D27A] transition-colors font-medium text-white/90"
                  >
                    {settings.contactPhone || '+92 324 2404984'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Official Inquiries</span>
                  <a
                    href={`mailto:${settings.contactEmail || 'hellomuaver@gmail.com'}`}
                    className="hover:text-[#F0D27A] transition-colors font-medium text-white/90"
                  >
                    {settings.contactEmail || 'hellomuaver@gmail.com'}
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}?text=${encodeURIComponent('Assalam-o-Alaikum MUAVER Concierge, I would like assistance.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold-outline inline-flex items-center gap-2 px-4 py-2 text-[11px] rounded"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Instant WhatsApp Order</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Gold divider with diamond ornament */}
        <div className="gold-divider my-8">
          <span className="gold-diamond"></span>
        </div>

        {/* Bottom Credits & Tagline */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F8F4E8]/50 gap-4">
          <div>
            {settings.footerCopyright || `© ${new Date().getFullYear()} MUAVER. All rights reserved. Crafted for Distinction by AUHS.`}
          </div>
          <div className="flex items-center gap-6">
            <span>Haute Parfumerie</span>
            <span>•</span>
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>Pakistan Nationwide</span>
          </div>
        </div>

        {/* Website by Zevnora Credit */}
        <div className="mt-4 pt-3 border-t border-[#D4AF37]/10 flex justify-center text-[10px] tracking-wider text-[#F8F4E8]/40">
          <span>
            Website by{' '}
            <a
              href="https://zevnora.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37]/80 hover:text-[#F0D27A] transition-colors underline decoration-[#D4AF37]/30 hover:decoration-[#F0D27A] font-medium"
            >
              Zevnora
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
