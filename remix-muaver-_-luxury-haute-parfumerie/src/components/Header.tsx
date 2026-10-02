import React, { useState } from 'react';
import { ShoppingBag, Menu, X, MessageCircle, Sparkles } from 'lucide-react';
import { SiteSettings } from '../types/store';

interface HeaderProps {
  settings: SiteSettings;
  activePage: string;
  onNavigate: (page: string, productId?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activePage,
  onNavigate,
  cartCount,
  onOpenCart,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'The Collection' },
    { id: 'about', label: 'Maison Story' },
    { id: 'contact', label: 'Concierge & Contact' },
  ];

  const handleLinkClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050F2E]/95 backdrop-blur-md border-b border-[#D4AF37]/20 transition-all duration-300">
      {/* Top Royal Announcement Bar */}
      {settings.visibility?.showAnnouncementBar !== false && (
        <div className="bg-gradient-to-r from-[#050F2E] via-[#0A1A4F] to-[#050F2E] border-b border-[#D4AF37]/15 py-1.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs md:text-xs font-montserrat tracking-widest text-[#F0D27A]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
            <span className="uppercase font-medium tracking-wider">
              {settings.announcementText || 'Complimentary Royal White-Glove Delivery Across Pakistan | Cash on Delivery'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse hidden sm:inline" />
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#F0D27A] hover:text-[#FFFFFF] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo (Landscape Header Logo - 44px mobile, 60-70px desktop) */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start items-center">
            <button
              onClick={() => handleLinkClick('home')}
              className="group flex items-center gap-3 focus:outline-none py-1 transition-transform active:scale-95"
            >
              <img
                src={settings.landscapeLogoUrl || 'https://i.ibb.co/8n6t1tQH/Untitled-design.png'}
                alt="MUAVER"
                width={220}
                height={64}
                decoding="async"
                className="h-11 sm:h-12 md:h-16 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90 drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)]"
                loading="eager"
              />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`text-sm tracking-widest font-montserrat uppercase transition-all duration-200 relative py-1 focus:outline-none ${
                    isActive
                      ? 'text-[#F0D27A] font-semibold'
                      : 'text-[#F8F4E8]/80 hover:text-[#F0D27A]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* WhatsApp Concierge Quick Link */}
            <a
              href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}?text=${encodeURIComponent('Assalam-o-Alaikum MUAVER Royale Concierge, I would like to inquire about your bespoke fragrances.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#F0D27A] hover:text-[#FFFFFF] border border-[#D4AF37]/40 hover:border-[#D4AF37] px-3 py-1.5 rounded-full transition-all duration-300 hover:bg-[#D4AF37]/10"
              title="Speak with Royale Concierge"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="tracking-wider uppercase font-medium">Concierge</span>
            </a>

            {/* Shopping Bag / Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-[#F0D27A] hover:text-[#FFFFFF] hover:bg-[#0A1A4F] rounded-full transition-all duration-200 focus:outline-none"
              aria-label="Open Cart Drawer"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D4AF37] to-[#A67C1A] text-[#050F2E] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/20 bg-[#050F2E] px-6 pt-4 pb-8 space-y-4 animate-fade-in shadow-2xl">
          <div className="text-center pb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/70">
              {settings.tagline}
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`py-3 px-4 text-left text-sm font-montserrat uppercase tracking-widest rounded-lg transition-colors ${
                  activePage === link.id
                    ? 'bg-[#0A1A4F] text-[#F0D27A] font-semibold border-l-2 border-[#D4AF37]'
                    : 'text-[#F8F4E8]/80 hover:bg-[#0A1A4F]/50 hover:text-[#F0D27A]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#D4AF37]/15 flex flex-col gap-3">
            <a
              href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}?text=${encodeURIComponent('Assalam-o-Alaikum MUAVER Concierge, I would like to inquire about your perfumes.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-outline w-full py-2.5 text-center text-xs flex items-center justify-center gap-2 rounded-lg"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp Royale Concierge</span>
            </a>
            <div className="text-center text-[11px] text-[#F8F4E8]/60 font-montserrat">
              Tel: {settings.contactPhone}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
