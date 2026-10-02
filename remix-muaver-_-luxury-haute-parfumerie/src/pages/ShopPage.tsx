import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Sparkles, MessageCircle, ShoppingBag, Eye, ArrowUpDown, AlertCircle } from 'lucide-react';
import { Product, SiteSettings } from '../types/store';
import { buildWhatsAppOrderUrl } from '../services/storeService';
import { OptimizedImage } from '../components/OptimizedImage';
import { ScrollReveal } from '../components/ScrollReveal';

interface ShopPageProps {
  products: Product[];
  settings: SiteSettings;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  settings,
  onNavigate,
  onAddToCart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured');

  // Filter out Draft products from the storefront entirely
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.status !== 'draft');
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    activeProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.notes && Object.values(p.notes).flat().some(n => n.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          const priceA = a.variants?.[0]?.salePrice || a.variants?.[0]?.price || a.price;
          const priceB = b.variants?.[0]?.salePrice || b.variants?.[0]?.price || b.price;
          return priceA - priceB;
        }
        if (sortBy === 'price-high') {
          const priceA = a.variants?.[0]?.salePrice || a.variants?.[0]?.price || a.price;
          const priceB = b.variants?.[0]?.salePrice || b.variants?.[0]?.price || b.price;
          return priceB - priceA;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [activeProducts, searchTerm, selectedCategory, sortBy]);

  const handleWhatsAppBuy = (product: Product) => {
    const defaultVariant = product.variants?.[0];
    const price = defaultVariant?.salePrice || defaultVariant?.price || product.price;
    const url = buildWhatsAppOrderUrl(
      product.name,
      defaultVariant?.label || 'Standard Flacon',
      1,
      price,
      undefined,
      settings.whatsappRawNumber
    );
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
          The Royal Vault
        </span>
        <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-[#F8F4E8]">
          HAUTE PARFUMERIE COLLECTION
        </h1>
        <p className="text-xs sm:text-sm text-[#F8F4E8]/70 leading-relaxed font-light">
          Each creation is formulated in limited batches, macerated for distinction, and delivered in bespoke weighted crystal.
        </p>
      </div>

      {/* Filter and Search Bar (Shopify style) */}
      <div className="bg-[#081438] p-4 sm:p-6 rounded-xl border border-[#D4AF37]/25 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by note, name, family..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#050F2E] border border-[#D4AF37]/30 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-[#F8F4E8]/60">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#050F2E] text-white text-xs px-3 py-2 rounded-lg border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Category Pills (Shopify Collection Bar) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F0D27A] text-[#050F2E] font-bold shadow-md'
                  : 'bg-[#050F2E] text-[#F8F4E8]/80 hover:text-white border border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Count Display */}
      <div className="flex justify-between items-center text-xs text-[#F8F4E8]/60 px-1">
        <span>Showing {filteredProducts.length} flacon creation(s)</span>
        <span className="text-[#D4AF37]">Complimentary COD across Pakistan</span>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#081438]/50 rounded-xl border border-[#D4AF37]/20 space-y-4">
          <p className="font-cinzel text-lg text-[#F8F4E8]">No flacons match your selection.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="btn-gold-outline px-6 py-2.5 rounded text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => {
            const variant = product.variants?.[0];
            const currentPrice = variant?.salePrice || variant?.price || product.price;
            const originalPrice = product.compareAtPrice || (variant?.salePrice ? variant.price : null);
            const isOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);

            return (
              <ScrollReveal
                key={product.id}
                delayIndex={(index % 4) + 1}
                className="group relative bg-[#081438] rounded-xl border border-[#D4AF37]/25 hover:border-[#D4AF37]/70 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
              >
                {/* Image Container with Badges */}
                <div 
                  className="relative aspect-[4/5] bg-[#050F2E] overflow-hidden cursor-pointer"
                  onClick={() => onNavigate('product', product.id)}
                >
                  <OptimizedImage
                    src={product.images[0]}
                    alt={product.name}
                    aspectRatio="portrait"
                    priority={index === 0}
                    width={400}
                    height={500}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    containerClassName="w-full h-full"
                  />

                  {/* Edition Tag */}
                  <div className="absolute top-3 left-3 bg-[#050F2E]/90 border border-[#D4AF37]/50 px-2.5 py-1 rounded text-[10px] uppercase tracking-widest text-[#F0D27A] font-semibold backdrop-blur-sm">
                    {product.edition || 'PREMIER FLACON'}
                  </div>

                  {/* Stock Tag / Out of Stock */}
                  <div className="absolute top-3 right-3 backdrop-blur-sm">
                    {isOutOfStock ? (
                      <span className="bg-rose-950/90 border border-rose-500/50 px-2.5 py-1 rounded text-[10px] text-rose-300 font-bold">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="bg-[#050F2E]/90 border border-[#25D366]/50 px-2.5 py-1 rounded text-[10px] text-[#25D366] font-medium">
                        COD Available
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay with Quick Details */}
                  <div className="absolute inset-0 bg-[#050F2E]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center">
                    <span className="btn-gold-outline px-4 py-2 rounded text-xs flex items-center gap-1.5 backdrop-blur-md">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Flacon</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] block font-semibold">
                      {product.category} • {product.concentration || 'Extrait de Parfum'}
                    </span>
                    <h3 
                      onClick={() => onNavigate('product', product.id)}
                      className="font-cinzel text-xl text-[#F8F4E8] font-bold tracking-wide hover:text-[#F0D27A] transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#F8F4E8]/60 line-clamp-2 leading-relaxed">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  {/* Fragrance Notes Tag Strip */}
                  {product.notes?.top && product.notes.top.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {product.notes.top.slice(0, 3).map((note, i) => (
                        <span key={i} className="text-[10px] bg-[#0A1A4F] border border-[#D4AF37]/20 text-[#F8F4E8]/80 px-2 py-0.5 rounded">
                          {note}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-cinzel text-xl font-bold text-[#F0D27A]">
                        Rs. {currentPrice.toLocaleString()}
                      </span>
                      {originalPrice && originalPrice > currentPrice && (
                        <span className="text-xs text-white/40 line-through">
                          Rs. {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50">
                      {variant?.size || '50ml'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => !isOutOfStock && onAddToCart(product, variant?.size || '50ml', 1)}
                      disabled={isOutOfStock}
                      className={`py-2.5 px-3 rounded text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                        isOutOfStock
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          : 'btn-gold cursor-pointer'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                    </button>

                    <button
                      onClick={() => handleWhatsAppBuy(product)}
                      className="btn-gold-outline py-2.5 px-3 rounded text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Royal Guarantee Strip */}
      <div className="gold-divider">
        <span className="gold-diamond" />
      </div>

      <div className="p-8 rounded-xl bg-gradient-to-r from-[#050F2E] via-[#0A1A4F] to-[#050F2E] border border-[#D4AF37]/30 text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#F0D27A] font-semibold">
          Nationwide Cash on Delivery
        </span>
        <p className="text-xs text-[#F8F4E8]/70 max-w-xl mx-auto">
          Every parcel is dispatched with insured delivery tracking and tamper-proof security seals. Pay conveniently in cash at your doorstep across Pakistan.
        </p>
      </div>

    </div>
  );
};
