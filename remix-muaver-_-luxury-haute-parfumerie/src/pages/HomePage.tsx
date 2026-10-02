import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  ShieldCheck, 
  Droplets, 
  Clock, 
  Crown, 
  Check, 
  Star,
  PackageCheck,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Product, SiteSettings, BannerSlide } from '../types/store';
import { buildWhatsAppOrderUrl, buildGeneralWhatsAppUrl, DEFAULT_WHY_FEATURES, DEFAULT_TESTIMONIALS } from '../services/storeService';
import { HeroSlider } from '../components/HeroSlider';
import { OptimizedImage } from '../components/OptimizedImage';
import { ScrollReveal } from '../components/ScrollReveal';

interface HomePageProps {
  settings: SiteSettings;
  featuredProduct: Product | null;
  banners: BannerSlide[];
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  featuredProduct,
  banners,
  onNavigate,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(
    featuredProduct?.variants?.[0]?.size || '50ml'
  );

  useEffect(() => {
    if (featuredProduct?.variants && featuredProduct.variants.length > 0) {
      setSelectedSize(featuredProduct.variants[0].size);
    }
  }, [featuredProduct?.id]);

  const selectedVariant = 
    featuredProduct?.variants?.find((v) => v.size === selectedSize) || 
    featuredProduct?.variants?.[0];
  
  const activePrice = selectedVariant?.salePrice || selectedVariant?.price || featuredProduct?.price || 0;
  const originalPrice = selectedVariant?.price || featuredProduct?.price || 0;
  const hasDiscount = originalPrice > 0 && selectedVariant?.salePrice && originalPrice > selectedVariant.salePrice;

  const handleWhatsAppDirect = () => {
    if (!featuredProduct) {
      window.open(buildGeneralWhatsAppUrl(settings.whatsappRawNumber), '_blank', 'noopener,noreferrer');
      return;
    }
    const url = buildWhatsAppOrderUrl(
      featuredProduct.name,
      selectedVariant?.label || selectedSize,
      1,
      activePrice,
      window.location.href,
      settings.whatsappRawNumber
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-24 sm:space-y-32 md:space-y-36 pb-24 text-[var(--ivory)] font-montserrat">
      
      {/* 1. HERO BANNER SLIDER */}
      {settings.visibility?.showHeroSlider !== false && (
        <HeroSlider
          banners={banners}
          onNavigate={onNavigate}
          featuredProduct={featuredProduct || undefined}
          settings={settings}
        />
      )}

      {/* 2. FEATURED FLACON SPOTLIGHT */}
      {settings.visibility?.showFeaturedProduct !== false && (
        featuredProduct ? (
          <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            {/* Subtle section header */}
            <div className="text-center space-y-3 mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-500)]/10 border border-[var(--gold-500)]/30 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-300)]" />
                <span>{settings.featuredSectionBadge || 'Flagship Masterpiece'}</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-white">
                {settings.featuredSectionTitle || 'THE IMPERIAL CREATION'}
              </h2>
              <div className="gold-divider max-w-xs mx-auto pt-2">
                <span className="gold-diamond" />
              </div>
            </div>

            <ScrollReveal className="relative rounded-3xl bg-gradient-to-br from-[#081438] via-[#050F2E] to-[#0A1A4F] border border-[var(--gold-500)]/35 overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-16">
              {/* Ambient gold glow */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--gold-500)]/15 rounded-full blur-[140px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--navy-700)]/30 rounded-full blur-[140px] pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
                
                {/* Product Imagery (Generic Unbranded Luxury Flacon) */}
                <div className="lg:col-span-6 space-y-4">
                  <div 
                    className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#03091D] border border-[var(--gold-500)]/30 shadow-2xl shadow-black/80 group cursor-pointer relative"
                    onClick={() => onNavigate('product', featuredProduct.id)}
                  >
                    <OptimizedImage
                      src={featuredProduct.images[0]}
                      alt={featuredProduct.name}
                      aspectRatio="portrait"
                      width={600}
                      height={750}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute top-4 left-4 bg-[var(--navy-900)]/90 border border-[var(--gold-500)]/50 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-[var(--gold-300)] font-semibold backdrop-blur-md shadow-md z-20">
                      {featuredProduct.edition || 'PREMIER FLACON • BATCH N° 01'}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-[11px] text-white/90 border border-white/10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-20">
                      <span>Explore Details</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--gold-300)]" />
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {featuredProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {featuredProduct.images.slice(0, 4).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => onNavigate('product', featuredProduct.id)}
                          className="aspect-square rounded-xl border border-[var(--gold-500)]/30 overflow-hidden hover:border-[var(--gold-300)] transition-all bg-[#03091D] opacity-80 hover:opacity-100"
                        >
                          <OptimizedImage
                            src={img}
                            alt={`View ${idx + 1}`}
                            aspectRatio="square"
                            width={120}
                            height={120}
                            sizes="120px"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Specifications & CTAs */}
                <div className="lg:col-span-6 space-y-6 sm:space-y-8">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs text-[var(--gold-300)] uppercase tracking-[0.25em] font-semibold mb-2">
                      <Crown className="w-3.5 h-3.5 text-[var(--gold-300)]" />
                      <span>Haute Parfumerie Royale</span>
                    </div>
                    <h3 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide leading-tight">
                      {featuredProduct.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-montserrat text-[var(--gold-300)] uppercase tracking-[0.2em] mt-1.5">
                      {featuredProduct.subtitle}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#03091D]/70 border border-[var(--gold-500)]/25 flex flex-wrap items-baseline gap-4 shadow-inner">
                    <span className="font-heading text-3xl sm:text-4xl font-bold text-[var(--gold-300)]">
                      Rs. {activePrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-base sm:text-lg text-white/40 line-through">
                        Rs. {originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[11px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                      Cash on Delivery Available
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--ivory)]/85 leading-relaxed font-light">
                    {featuredProduct.description}
                  </p>

                  {/* Size Selection */}
                  {featuredProduct.variants && featuredProduct.variants.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--gold-300)] font-heading uppercase tracking-widest font-semibold text-[11px]">
                          Select Volume Edition:
                        </span>
                        <span className="text-white/60 text-[11px]">
                          Selected: <strong className="text-white">{selectedVariant?.label || selectedSize}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {featuredProduct.variants.map((variant) => {
                          const isSelected = selectedSize === variant.size;
                          return (
                            <button
                              key={variant.size}
                              onClick={() => setSelectedSize(variant.size)}
                              className={`px-5 py-3 rounded-xl text-xs font-medium tracking-wider transition-all duration-200 border flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-500)] text-[var(--navy-900)] border-[var(--gold-300)] font-semibold shadow-lg shadow-amber-500/20'
                                  : 'bg-[var(--navy-900)]/80 text-[var(--ivory)]/80 border-[var(--gold-500)]/30 hover:border-[var(--gold-300)]'
                              }`}
                            >
                              <span>{variant.size}</span>
                              <span className="text-[10px] opacity-80">
                                (Rs. {(variant.salePrice || variant.price).toLocaleString()})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Olfactory Notes Preview */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#03091D]/70 border border-[var(--gold-500)]/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading text-xs uppercase tracking-[0.2em] text-[var(--gold-300)] font-bold">
                        Olfactory Architecture
                      </h4>
                      <span className="text-[10px] text-white/50">35% Extrait Oil</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Top Notes</span>
                        <span className="text-white/90 font-medium text-[11px]">{featuredProduct.notes.top.slice(0, 2).join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Heart Notes</span>
                        <span className="text-white/90 font-medium text-[11px]">{featuredProduct.notes.heart.slice(0, 2).join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">Base Notes</span>
                        <span className="text-white/90 font-medium text-[11px]">{featuredProduct.notes.base.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                    <button
                      onClick={() => onAddToCart(featuredProduct, selectedSize, 1)}
                      className="btn-gold-primary flex-1 py-4 px-6 rounded-xl text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-amber-950/40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                      <ShoppingBag className="w-4 h-4 text-[var(--navy-900)]" />
                      <span>Add to Flacon Bag</span>
                    </button>

                    <button
                      onClick={handleWhatsAppDirect}
                      className="btn-gold-outline flex-1 py-4 px-6 rounded-xl text-xs sm:text-sm font-medium tracking-[0.14em] uppercase flex items-center justify-center gap-2.5 bg-[var(--navy-900)]/60 hover:bg-[var(--gold-500)]/10 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Order on WhatsApp</span>
                    </button>
                  </div>

                  {/* Flacon Specs Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-white/60 border-t border-white/10">
                    <button
                      onClick={() => onNavigate('product', featuredProduct.id)}
                      className="text-[var(--gold-300)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Inspect Full Master Specifications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {featuredProduct.stockStatusText}
                    </span>
                  </div>

                </div>

              </div>

            </ScrollReveal>
          </section>
        ) : (
          <section className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-500)]/10 border border-[var(--gold-500)]/30 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-300)]" />
                <span>{settings.featuredSectionBadge || 'Royal Atelier'}</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-wide text-white">
                {settings.featuredSectionTitle || 'THE IMPERIAL CREATION'}
              </h2>
              <div className="gold-divider max-w-xs mx-auto pt-2">
                <span className="gold-diamond" />
              </div>
            </div>

            <ScrollReveal className="relative rounded-3xl bg-gradient-to-br from-[#081438] via-[#050F2E] to-[#0A1A4F] border border-[var(--gold-500)]/25 p-8 sm:p-14 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[var(--navy-800)] border border-[var(--gold-500)]/40 flex items-center justify-center mx-auto text-[var(--gold-300)] shadow-lg shadow-amber-950/30">
                <Crown className="w-8 h-8 text-[var(--gold-300)]" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold block">
                  Royal Reserve • Formulating
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl text-white font-bold tracking-wide">
                  New Royal Creations Coming Soon
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ivory)]/70 max-w-lg mx-auto font-light leading-relaxed">
                  Our master parfumeurs are currently distilling the next limited edition batch under the AUHS standard. Inquire with our Royale Concierge for bespoke commissions and advance allocations.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => onNavigate('shop')}
                  className="btn-gold px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Discover The Atelier</span>
                </button>
                <button
                  onClick={handleWhatsAppDirect}
                  className="btn-gold-outline px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-medium flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Royale Concierge WhatsApp</span>
                </button>
              </div>
            </ScrollReveal>
          </section>
        )
      )}

      {/* 3. BRAND STORY (CRAFTED FOR DISTINCTION BY AUHS) */}
      {settings.visibility?.showBrandStory !== false && (
        <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="gold-divider mb-14 md:mb-20">
            <span className="gold-diamond" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Imperial Crest Presentation */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative p-8 rounded-3xl bg-gradient-to-tr from-[#03091D] via-[#0A1A4F] to-[#10286E] border-2 border-[var(--gold-500)]/50 shadow-[0_15px_50px_rgba(212,175,55,0.25)] text-center group">
                <OptimizedImage
                  src={settings.brandStoryImage || settings.fullSquareLogoUrl || 'https://i.ibb.co/ynpdPdvP/Full-Logo.png'}
                  alt="MUAVER Royal Crest"
                  aspectRatio="square"
                  width={288}
                  height={288}
                  sizes="(max-width: 640px) 256px, 288px"
                  className="w-full h-full object-contain mx-auto transition-transform duration-700 ease-out group-hover:scale-105"
                  containerClassName="w-64 h-64 sm:w-72 sm:h-72 mx-auto"
                />
                <div className="pt-5 border-t border-[var(--gold-500)]/30 text-[11px] uppercase tracking-[0.25em] text-[var(--gold-300)] font-heading font-semibold">
                  Imperial Seal of Distinction
                </div>
              </div>
            </div>

            {/* Philosophy Text */}
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
                <Crown className="w-4 h-4 text-[var(--gold-300)]" />
                <span>{settings.brandStoryBadge || 'The AUHS Legacy'}</span>
              </div>

              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide leading-tight">
                {settings.brandStoryTitle ? (
                  settings.brandStoryTitle
                ) : (
                  <>
                    CRAFTED FOR DISTINCTION <br />
                    <span className="text-gold-gradient font-light italic">By AUHS</span>
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-[var(--ivory)]/85 leading-relaxed font-light">
                {settings.brandStorySnippet ||
                  'In an era saturated by mass-market, diluted aromas, MUAVER was conceived with a solitary royal conviction: to revive the regal authority of master perfumery. The emblem — a radiant gold crown poised above the interlocked "MV" monogram, enveloped by ceremonial laurel flourishes — symbolizes nobility of spirit, precision formulation, and unyielding distinction.'}
              </p>

              {settings.brandStoryText2 && (
                <p className="text-xs sm:text-sm text-[var(--ivory)]/85 leading-relaxed font-light">
                  {settings.brandStoryText2}
                </p>
              )}

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('about')}
                  className="btn-gold-outline px-8 py-3.5 rounded-xl text-xs tracking-[0.16em] uppercase font-semibold"
                >
                  {settings.brandStoryButtonText || 'Read The Full Chronicle'}
                </button>
              </div>
            </div>

          </div>

          <div className="gold-divider mt-14 md:mb-20">
            <span className="gold-diamond" />
          </div>
        </section>
      )}

      {/* 4. "WHY MUAVER" - DYNAMIC ICON FEATURES */}
      {settings.visibility?.showWhyFeatures !== false && (
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
              Pillars of Haute Parfumerie
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wider">
              WHY MUAVER
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto font-light">
              Four uncompromised standards defining every drop formulated under the AUHS standard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(settings.whyFeatures && settings.whyFeatures.length > 0 ? settings.whyFeatures : DEFAULT_WHY_FEATURES).map((feature, idx) => {
              const iconType = feature.icon?.toLowerCase() || '';
              return (
                <ScrollReveal
                  key={feature.id || idx}
                  delayIndex={(idx % 4) + 1}
                  className="p-7 rounded-2xl bg-gradient-to-b from-[#081438] to-[#050F2E] border border-[var(--gold-500)]/25 hover:border-[var(--gold-300)] hover:shadow-xl hover:shadow-amber-950/20 transition-all duration-300 space-y-4 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--navy-800)] border border-[var(--gold-500)]/40 flex items-center justify-center text-[var(--gold-300)] group-hover:scale-105 transition-transform">
                    {iconType.includes('clock') ? (
                      <Clock className="w-7 h-7" />
                    ) : iconType.includes('shield') ? (
                      <ShieldCheck className="w-7 h-7" />
                    ) : iconType.includes('package') ? (
                      <PackageCheck className="w-7 h-7" />
                    ) : iconType.includes('sparkle') ? (
                      <Sparkles className="w-7 h-7" />
                    ) : iconType.includes('droplet') ? (
                      <Droplets className="w-7 h-7" />
                    ) : (
                      <Crown className="w-7 h-7" />
                    )}
                  </div>
                  <h3 className="font-heading text-lg text-white font-bold tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--ivory)]/75 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. CUSTOMER REVIEWS / TESTIMONIALS */}
      {settings.visibility?.showTestimonials !== false && (
        <section className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
              Patron Acclaim
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wider">
              WHISPERS OF DISTINCTION
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto font-light">
              Unfiltered impressions from patrons who command distinction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(settings.testimonials && settings.testimonials.length > 0 ? settings.testimonials : DEFAULT_TESTIMONIALS)
              .filter((t) => t.isActive !== false)
              .map((review, idx) => (
                <ScrollReveal
                  key={review.id}
                  delayIndex={(idx % 3) + 1}
                  className="p-7 rounded-2xl bg-gradient-to-b from-[#081438] to-[#050F2E] border border-[var(--gold-500)]/30 flex flex-col justify-between space-y-5 shadow-xl"
                >
                  <div className="space-y-3.5">
                    <div className="flex text-[var(--gold-300)] gap-1">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--ivory)]/85 italic leading-relaxed font-light">
                      "{review.comment}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[var(--gold-500)]/15">
                    <span className="font-heading text-xs text-[var(--gold-300)] font-bold block">
                      {review.name}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {review.city} {review.role ? `• ${review.role}` : '• Verified Patron'}
                    </span>
                  </div>
                </ScrollReveal>
              ))}
          </div>
        </section>
      )}

      {/* 6. WHATSAPP ORDER CALL-TO-ACTION STRIP */}
      {settings.visibility?.showWhatsAppStrip !== false && (
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#03091D] via-[#0A1A4F] to-[#03091D] border-2 border-[var(--gold-500)]/45 p-8 sm:p-12 shadow-2xl shadow-black/80">
            {/* Subtle gold ornamentation */}
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-[var(--gold-500)]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--navy-900)]/90 border border-[var(--gold-500)]/40 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--gold-300)] font-semibold">
                  <Crown className="w-3.5 h-3.5 text-[var(--gold-300)]" />
                  <span>Private Client Concierge</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-wide">
                  Prefer Instant Assistance? Order Directly via WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ivory)]/80 font-light leading-relaxed">
                  Connect directly with our fragrance concierge at <strong className="text-[var(--gold-300)] font-semibold">{settings.contactPhone || '+92 324 2404984'}</strong>. Confirm notes, arrange Cash on Delivery, and request personalized gift sealing in seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <button
                  onClick={handleWhatsAppDirect}
                  className="btn-gold-primary px-8 py-4 rounded-xl text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase inline-flex items-center gap-3 shadow-xl shadow-amber-950/50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <MessageCircle className="w-5 h-5 fill-current text-[var(--navy-900)]" />
                  <span>Instant WhatsApp Order</span>
                </button>

                <button
                  onClick={() => onNavigate('shop')}
                  className="btn-gold-outline px-7 py-4 rounded-xl text-xs sm:text-sm font-medium tracking-[0.14em] uppercase inline-flex items-center gap-2 bg-[var(--navy-900)]/70 hover:bg-[var(--gold-500)]/10"
                >
                  <span>Browse The Shop</span>
                  <ArrowRight className="w-4 h-4 text-[var(--gold-300)]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. SOCIAL DISCOVERY */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="bg-[#050F2E] border border-[var(--gold-500)]/30 rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-xl">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--gold-300)] font-semibold">
            <Sparkles className="w-4 h-4 text-[var(--gold-300)]" />
            <span>Join The Inner Circle</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-wide">
            FOLLOW @MUAVER.CO
          </h2>

          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed font-light">
            Witness behind-the-scenes compounding, secret olfactory notes, and private reserve batch announcements on our official social channels.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {settings.socialLinks?.instagram && (
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-primary px-7 py-3 rounded-xl text-xs inline-flex items-center gap-2 font-semibold uppercase tracking-wider"
              >
                <span>Instagram @muaver.co</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {settings.socialLinks?.tiktok && (
              <a
                href={settings.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline px-7 py-3 rounded-xl text-xs inline-flex items-center gap-2 font-medium uppercase tracking-wider bg-[#03091D]/60"
              >
                <span>TikTok @muaver.co</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {settings.socialLinks?.facebook && (
              <a
                href={settings.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold-outline px-7 py-3 rounded-xl text-xs inline-flex items-center gap-2 font-medium uppercase tracking-wider bg-[#03091D]/60"
              >
                <span>Facebook Muaver Luxury</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
