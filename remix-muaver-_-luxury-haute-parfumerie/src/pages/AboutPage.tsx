import React from 'react';
import { Crown, Sparkles, Droplets, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { SiteSettings } from '../types/store';
import { OptimizedImage } from '../components/OptimizedImage';

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 space-y-20 font-montserrat">
      
      {/* Hero Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#D4AF37]/40 bg-[#0A1A4F]/80">
          <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#F0D27A] font-semibold">
            {settings.aboutBadge || settings.tagline || 'CRAFTED FOR DISTINCTION By AUHS'}
          </span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-[#F8F4E8] leading-tight">
          {settings.aboutTitle || 'THE MAISON CHRONICLE'}
        </h1>
        <p className="text-sm sm:text-base text-[#F8F4E8]/75 font-light leading-relaxed">
          {settings.aboutSubtitle || 'Born out of an unwavering reverence for master-grade perfumery and noble heritage.'}
        </p>
      </div>

      {/* Royal Crest Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center bg-[#081438] p-8 sm:p-14 rounded-2xl border border-[#D4AF37]/35 shadow-2xl">
        <div className="md:col-span-5 flex justify-center">
          <div className="relative p-6 rounded-2xl bg-gradient-to-tr from-[#050F2E] via-[#0A1A4F] to-[#10286E] border-2 border-[#D4AF37]/60 shadow-[0_10px_40px_rgba(212,175,55,0.25)] text-center">
            <OptimizedImage
              src={settings.aboutStoryImage || settings.fullSquareLogoUrl || 'https://i.ibb.co/ynpdPdvP/Full-Logo.png'}
              alt="MUAVER Royal Crest"
              aspectRatio="square"
              width={288}
              height={288}
              sizes="(max-width: 640px) 256px, 288px"
              className="w-full h-full object-contain mx-auto"
              containerClassName="w-64 h-64 sm:w-72 sm:h-72 mx-auto"
            />
            <div className="pt-3 border-t border-[#D4AF37]/30 text-[11px] uppercase tracking-widest text-[#F0D27A] font-cinzel">
              The Heraldic Royal Seal
            </div>
          </div>
        </div>

        <div className="md:col-span-7 space-y-5">
          <h2 className="font-cinzel text-2xl sm:text-3xl text-[#F8F4E8] font-bold tracking-wide">
            {settings.aboutStoryTitle || 'Heraldry of The Imperial Crown'}
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F4E8]/80 leading-relaxed font-light">
            {settings.aboutStoryP1 ||
              'The insignia of MUAVER tells the story of our philosophy: a sovereign gold crown resting regally above the interlocked "MV" monogram, wrapped in ceremonial laurel flourishes. Metallic gold cast against an abyss of deep royal navy — a colorway chosen across centuries by royalty to symbolize authority, depth, and eternal prestige.'}
          </p>
          <p className="text-xs sm:text-sm text-[#F8F4E8]/80 leading-relaxed font-light">
            {settings.aboutStoryP2 ||
              'Behind the brand stands AUHS — dedicated to crafting singular fragrant works of art without compromise, without synthetic short-cuts, and without ordinary formulations.'}
          </p>

          <div className="pt-2">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#050F2E] rounded border border-[#D4AF37]/20">
                <span className="font-cinzel text-[#F0D27A] font-bold block">Deep Royal Navy</span>
                <span className="text-[10px] text-white/50">#050F2E • Timeless Depth</span>
              </div>
              <div className="p-3 bg-[#050F2E] rounded border border-[#D4AF37]/20">
                <span className="font-cinzel text-[#F0D27A] font-bold block">Imperial Gold</span>
                <span className="text-[10px] text-white/50">#D4AF37 • Noble Distinction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Triad */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
            Our Guiding Creed
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl text-[#F8F4E8] font-bold tracking-wider">
            {settings.aboutCreedTitle || 'THE THREE LAWS OF MUAVER'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-[#081438] border border-[#D4AF37]/25 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[#0A1A4F] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base text-[#F8F4E8] font-bold">
              {settings.aboutLaw1Title || 'Pure Extrait Saturation'}
            </h3>
            <p className="text-xs text-[#F8F4E8]/70 leading-relaxed font-light">
              {settings.aboutLaw1Desc ||
                'Formulated at 35% pure perfume oils, ensuring every application produces a deep, persistent aura that endures from dusk till dawn.'}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#081438] border border-[#D4AF37]/25 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[#0A1A4F] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base text-[#F8F4E8] font-bold">
              {settings.aboutLaw2Title || 'Authentic Botanical Absolutes'}
            </h3>
            <p className="text-xs text-[#F8F4E8]/70 leading-relaxed font-light">
              {settings.aboutLaw2Desc ||
                'We strictly source rare Bulgarian rose, wild Cambodian agarwood, and aged ambergris without synthetic dilution.'}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#081438] border border-[#D4AF37]/25 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[#0A1A4F] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base text-[#F8F4E8] font-bold">
              {settings.aboutLaw3Title || 'Architectural Artisanship'}
            </h3>
            <p className="text-xs text-[#F8F4E8]/70 leading-relaxed font-light">
              {settings.aboutLaw3Desc ||
                'Each flacon is encased in custom crystal glass, topped with an imperial gold crown cap and packaged in velvet couture.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-10 space-y-6">
        <h3 className="font-cinzel text-2xl text-[#F8F4E8] font-bold">
          Ready to Experience Distinction?
        </h3>
        <button
          onClick={() => onNavigate('shop')}
          className="btn-gold px-8 py-3.5 rounded text-xs tracking-widest inline-flex items-center gap-2"
        >
          <span>Explore The Royal Collection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
