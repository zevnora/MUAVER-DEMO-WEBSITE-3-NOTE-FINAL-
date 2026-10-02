import React, { useState, useEffect } from 'react';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'portrait' | 'square' | 'landscape' | 'banner' | 'auto';
  priority?: boolean; // True for first hero/product image
  sizes?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Generate optimized WebP URL with custom dimensions and quality
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; quality?: number; blur?: number } = {}
): string {
  if (!url) return '';

  const { width, quality = 80, blur } = options;

  // Unsplash CDN dynamic optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fm', 'webp');
      parsed.searchParams.set('q', quality.toString());
      if (width) {
        parsed.searchParams.set('w', width.toString());
      }
      if (blur) {
        parsed.searchParams.set('blur', blur.toString());
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Generate responsive srcset for mobile and desktop screens
 */
export function generateSrcSet(url: string): string | undefined {
  if (!url) return undefined;

  if (url.includes('images.unsplash.com')) {
    const w400 = getOptimizedImageUrl(url, { width: 400, quality: 75 });
    const w800 = getOptimizedImageUrl(url, { width: 800, quality: 75 });
    const w1200 = getOptimizedImageUrl(url, { width: 1200, quality: 80 });
    return `${w400} 400w, ${w800} 800w, ${w1200} 1200w`;
  }

  return undefined;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  className = '',
  containerClassName = '',
  aspectRatio = 'portrait', // Default to 4:5 portrait for perfume flacons
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px',
  width,
  height,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset load state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const activeSrc = hasError || !src ? fallbackSrc : src;
  const primaryWebpSrc = getOptimizedImageUrl(activeSrc, { quality: 80 });
  const srcSet = !hasError ? generateSrcSet(activeSrc) : undefined;

  // Compute low-resolution blurred placeholder
  const lowResPlaceholder =
    activeSrc && activeSrc.includes('images.unsplash.com')
      ? getOptimizedImageUrl(activeSrc, { width: 40, quality: 20, blur: 20 })
      : null;

  // Consistent aspect ratio to avoid layout shift (portrait 4:5 by default)
  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'landscape'
      ? 'aspect-[16/9]'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9]'
      : '';

  return (
    <div
      className={`relative overflow-hidden bg-[#050F2E] ${aspectClass} ${containerClassName}`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    >
      {/* 1. Low-Res Blurred Placeholder or Shimmer Skeleton (Blur-Up Effect) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-tr from-[#081438] via-[#0D2163] to-[#081438] animate-pulse z-0 transition-opacity duration-300"
          style={
            lowResPlaceholder
              ? {
                  backgroundImage: `url(${lowResPlaceholder})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(12px)',
                  transform: 'scale(1.08)',
                }
              : undefined
          }
        />
      )}

      {/* 2. Responsive Main Image with Strict Object Cover and Zero Layout Shift */}
      <img
        src={primaryWebpSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || 'MUAVER Fragrance'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-cover object-center transition-opacity duration-500 z-10 relative ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
