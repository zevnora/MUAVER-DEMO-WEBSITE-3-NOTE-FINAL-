import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BannerSlide, Product, SiteSettings } from '../types/store';
import { ChevronLeft, ChevronRight, Crown, Sparkles, MessageCircle } from 'lucide-react';
import { buildWhatsAppOrderUrl, buildGeneralWhatsAppUrl } from '../services/storeService';
import { getOptimizedImageUrl } from './OptimizedImage';

interface HeroSliderProps {
  banners: BannerSlide[];
  onNavigate: (page: string, productId?: string) => void;
  featuredProduct?: Product;
  settings: SiteSettings;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  banners,
  onNavigate,
  featuredProduct,
  settings,
}) => {
  // Filter active banners and sort
  const activeBanners = banners
    .filter((b) => b.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const total = activeBanners.length;

  // Auto-adjust index if active banner was deleted
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Auto-play interval: every 5 seconds (paused when user hovers or touches)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diffX = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 45;
      if (diffX > minSwipeDistance) {
        // Swiped left -> next slide
        nextSlide();
      } else if (diffX < -minSwipeDistance) {
        // Swiped right -> prev slide
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Button action handler
  const handleButtonClick = (slide: BannerSlide) => {
    const link = slide.buttonLink?.toLowerCase().trim() || 'shop';
    if (link === 'whatsapp') {
      if (featuredProduct) {
        window.open(
          buildWhatsAppOrderUrl(
            featuredProduct.name,
            featuredProduct.variants[0]?.size || '50ml',
            1,
            featuredProduct.variants[0]?.salePrice || featuredProduct.variants[0]?.price || featuredProduct.price,
            window.location.href,
            settings.whatsappRawNumber
          ),
          '_blank',
          'noopener,noreferrer'
        );
      } else {
        window.open(buildGeneralWhatsAppUrl(settings.whatsappRawNumber), '_blank', 'noopener,noreferrer');
      }
    } else if (link === 'product' && featuredProduct) {
      onNavigate('product', featuredProduct.id);
    } else if (link === 'shop') {
      onNavigate('shop');
    } else if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(link);
    }
  };

  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full overflow-hidden select-none bg-[var(--navy-900)] border-b border-[var(--gold-500)]/20"
      aria-label="Hero Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Viewport */}
      <div className="relative w-full h-[580px] sm:h-[640px] md:h-[720px] lg:h-[780px] xl:h-[840px]">
        {activeBanners.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Media with WebP, responsive srcset & zero layout shift */}
              <picture className="w-full h-full block">
                {slide.mobileImage && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={getOptimizedImageUrl(slide.mobileImage, { quality: 75, width: 720 })}
                    type="image/webp"
                  />
                )}
                <source
                  srcSet={`${getOptimizedImageUrl(slide.desktopImage, { quality: 80, width: 900 })} 900w, ${getOptimizedImageUrl(slide.desktopImage, { quality: 80, width: 1400 })} 1400w, ${getOptimizedImageUrl(slide.desktopImage, { quality: 85, width: 1920 })} 1920w`}
                  sizes="100vw"
                  type="image/webp"
                />
                <img
                  src={getOptimizedImageUrl(slide.desktopImage, { quality: 80, width: 1400 })}
                  alt={slide.heading}
                  width={1400}
                  height={840}
                  className={`w-full h-full object-cover object-center transform transition-transform duration-[7000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </picture>

              {/* Multi-layered cinematic royal vignette & dark gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#050F2E]/95 via-[#050F2E]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050F2E] via-transparent to-[#050F2E]/40" />
              <div className="absolute inset-0 bg-radial from-transparent via-[#050F2E]/30 to-[#050F2E]/80 pointer-events-none" />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full">
                  <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6">
                    {/* Royal Badge */}
                    <div
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--navy-900)]/80 backdrop-blur-md border border-[var(--gold-500)]/40 shadow-lg shadow-black/40 transition-all duration-700 delay-100 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-[var(--gold-300)] animate-pulse" />
                      <span className="font-heading tracking-[0.25em] text-[10px] sm:text-xs text-[var(--gold-300)] uppercase font-semibold">
                        {slide.badgeText || 'ROYAL ATELIER COLLECTION'}
                      </span>
                    </div>

                    {/* Main Heading */}
                    <h1
                      className={`font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] transition-all duration-700 delay-200 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                      }`}
                    >
                      <span className="block drop-shadow-md">
                        {slide.heading}
                      </span>
                    </h1>

                    {/* Subtitle / Description */}
                    <p
                      className={`text-sm sm:text-base md:text-lg text-[var(--ivory)]/85 max-w-xl font-light leading-relaxed drop-shadow transition-all duration-700 delay-300 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                      }`}
                    >
                      {slide.subheading}
                    </p>

                    {/* Action Buttons */}
                    <div
                      className={`pt-2 sm:pt-4 flex flex-wrap items-center gap-3.5 sm:gap-4 transition-all duration-700 delay-400 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                      }`}
                    >
                      <button
                        onClick={() => handleButtonClick(slide)}
                        className="btn-gold-primary px-7 py-3.5 sm:px-9 sm:py-4 rounded text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase inline-flex items-center gap-2.5 shadow-xl shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                      >
                        {slide.buttonLink === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4 fill-current text-[var(--navy-900)]" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[var(--navy-900)]" />
                        )}
                        <span>{slide.buttonText || 'Discover Collection'}</span>
                      </button>

                      {slide.buttonLink !== 'whatsapp' && (
                        <button
                          onClick={() => {
                            if (featuredProduct) {
                              window.open(
                                buildWhatsAppOrderUrl(
                                  featuredProduct.name,
                                  featuredProduct.variants[0]?.size || '50ml',
                                  1,
                                  featuredProduct.variants[0]?.salePrice || featuredProduct.variants[0]?.price || featuredProduct.price,
                                  window.location.href,
                                  settings.whatsappRawNumber
                                ),
                                '_blank',
                                'noopener,noreferrer'
                              );
                            } else {
                              window.open(buildGeneralWhatsAppUrl(settings.whatsappRawNumber), '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="btn-gold-outline px-6 py-3.5 sm:px-8 sm:py-4 rounded text-xs sm:text-sm font-medium tracking-[0.15em] uppercase inline-flex items-center gap-2 bg-[var(--navy-900)]/60 backdrop-blur-sm hover:bg-[var(--gold-500)]/10"
                        >
                          <MessageCircle className="w-4 h-4 text-[var(--gold-300)]" />
                          <span>Order on WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (Prev / Next) */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[var(--gold-500)]/40 bg-[var(--navy-900)]/70 backdrop-blur-md text-[var(--gold-300)] flex items-center justify-center hover:bg-[var(--gold-500)] hover:text-[var(--navy-900)] hover:border-[var(--gold-300)] transition-all duration-300 shadow-xl shadow-black/50 group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[var(--gold-500)]/40 bg-[var(--navy-900)]/70 backdrop-blur-md text-[var(--gold-300)] flex items-center justify-center hover:bg-[var(--gold-500)] hover:text-[var(--navy-900)] hover:border-[var(--gold-300)] transition-all duration-300 shadow-xl shadow-black/50 group"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Dots / Indicators with timer pause cue */}
      {total > 1 && (
        <div className="absolute bottom-5 sm:bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-2.5 sm:gap-3">
          {activeBanners.map((_, dotIdx) => {
            const isCurrent = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                onClick={() => goToSlide(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-500 rounded-full h-2 sm:h-2.5 focus:outline-none ${
                  isCurrent
                    ? 'w-8 sm:w-10 bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-500)] shadow-md shadow-amber-500/40'
                    : 'w-2 sm:w-2.5 bg-white/30 hover:bg-[var(--gold-300)]/60'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Subtle royal bottom edge accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-500)]/40 to-transparent z-20" />
    </section>
  );
};
