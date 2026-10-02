import React, { useState } from 'react';
import { 
  ChevronRight, 
  ShoppingBag, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Clock, 
  Droplets, 
  Sparkles, 
  Check, 
  Plus, 
  Minus,
  Crown,
  AlertCircle
} from 'lucide-react';
import { Product, SiteSettings } from '../types/store';
import { buildWhatsAppOrderUrl } from '../services/storeService';
import { OptimizedImage } from '../components/OptimizedImage';

interface ProductPageProps {
  product: Product;
  settings: SiteSettings;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onNavigate: (page: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  settings,
  onAddToCart,
  onNavigate,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.variants?.[0]?.size || '50ml'
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const currentVariant = product.variants?.find((v) => v.size === selectedSize) || product.variants?.[0];
  const unitPrice = currentVariant?.salePrice || currentVariant?.price || product.price;
  const regularPrice = product.compareAtPrice || currentVariant?.price || product.price;
  const hasDiscount = regularPrice > unitPrice;

  const isVariantOutOfStock = currentVariant && (currentVariant.inStock === false || (currentVariant.stock !== undefined && currentVariant.stock <= 0));
  const isProductOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0) || isVariantOutOfStock;

  const handleAddToCart = () => {
    if (isProductOutOfStock) return;
    onAddToCart(product, selectedSize, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleOrderOnWhatsApp = () => {
    const url = buildWhatsAppOrderUrl(
      product.name,
      currentVariant?.label || selectedSize,
      quantity,
      unitPrice,
      window.location.href,
      settings.whatsappRawNumber
    );
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-[#F8F4E8]/60 font-montserrat">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#F0D27A] transition-colors"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        <button
          onClick={() => onNavigate('shop')}
          className="hover:text-[#F0D27A] transition-colors"
        >
          The Collection
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        <span className="text-[#F0D27A] truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Column: Image Gallery (unbranded generic flacon) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image with Zero Layout Shift */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#081438] border border-[#D4AF37]/30 shadow-2xl">
            <OptimizedImage
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              aspectRatio="portrait"
              priority={true}
              width={600}
              height={750}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="w-full h-full object-cover object-center transition-all duration-500"
              containerClassName="w-full h-full"
            />

            {/* Edition Overlay */}
            <div className="absolute top-4 left-4 bg-[#050F2E]/90 border border-[#D4AF37]/50 px-3 py-1 rounded text-[10px] uppercase tracking-widest text-[#F0D27A] font-semibold backdrop-blur-sm z-20">
              {product.edition || 'PREMIER FLACON • N° 01'}
            </div>

            {/* Concentration Tag */}
            <div className="absolute bottom-4 left-4 bg-[#050F2E]/90 border border-[#D4AF37]/40 px-3 py-1 rounded text-[10px] text-white/80 font-medium backdrop-blur-sm z-20">
              {product.concentration || '35% Extrait de Parfum'}
            </div>

            {/* Out of Stock overlay if sold out */}
            {isProductOutOfStock && (
              <div className="absolute top-4 right-4 bg-rose-950/90 border border-rose-500/50 px-3 py-1 rounded text-[10px] uppercase tracking-widest text-rose-300 font-bold backdrop-blur-sm z-20">
                Out of Stock
              </div>
            )}
          </div>

          {/* Thumbnails strip */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-102'
                      : 'border-[#D4AF37]/20 opacity-70 hover:opacity-100 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <OptimizedImage
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    aspectRatio="square"
                    width={100}
                    height={100}
                    sizes="100px"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details, Form, and Actions */}
        <div className="lg:col-span-6 space-y-7">
          
          {/* Title & Brand Badge */}
          <div className="space-y-2 border-b border-white/10 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Crafted by AUHS</span>
              </span>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  isProductOutOfStock
                    ? 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                    : 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30'
                }`}
              >
                {isProductOutOfStock ? 'Sold Out' : (product.stockStatusText || 'In Stock')}
              </span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#F8F4E8]">
              {product.name}
            </h1>
            <p className="text-sm font-montserrat text-[#F0D27A] tracking-wider uppercase">
              {product.subtitle}
            </p>
          </div>

          {/* Pricing & Delivery Section */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-baseline gap-4">
                <span className="font-cinzel text-3xl sm:text-4xl font-bold text-[#F0D27A]">
                  Rs. {unitPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-white/40 line-through">
                    Rs. {regularPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Cash on Delivery Available Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Cash on Delivery Available</span>
              </div>
            </div>

            {/* Delivery Time & Shipping Charge Pill Box */}
            <div className="p-3.5 rounded-xl bg-[#081438] border border-[#D4AF37]/25 space-y-1.5 text-xs text-[#F8F4E8]/85">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#F0D27A] font-medium">
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Delivery Time:</span>
                </span>
                <span className="font-semibold text-white">
                  {settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-white/60">Shipping Charge:</span>
                <span className="font-semibold text-[#25D366]">
                  {!settings.deliverySettings || settings.deliverySettings.isEnabled === false || settings.deliverySettings.shippingType === 'free' || (settings.deliverySettings.shippingType === 'free_above' && (unitPrice * quantity) >= (settings.deliverySettings.freeAboveAmount || 5000))
                    ? 'Free (Rs. 0)'
                    : `Rs. ${(settings.deliverySettings.flatRateAmount || 250).toLocaleString()}`}
                  {settings.deliverySettings?.shippingType === 'free_above' && (unitPrice * quantity) < (settings.deliverySettings.freeAboveAmount || 5000) && (
                    <span className="text-[10px] text-white/40 block text-right font-normal">
                      (Free above Rs. {settings.deliverySettings.freeAboveAmount?.toLocaleString()})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-[#F8F4E8]/80 leading-relaxed font-light">
            {product.description}
          </p>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs uppercase font-cinzel tracking-widest text-[#D4AF37] font-semibold block">
                Select Flacon Volume
              </label>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedSize === v.size;
                  const isSoldOut = v.inStock === false || (v.stock !== undefined && v.stock <= 0);

                  return (
                    <button
                      key={v.size}
                      onClick={() => setSelectedSize(v.size)}
                      className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#0A1A4F] ring-1 ring-[#D4AF37] text-white shadow-lg'
                          : 'border-[#D4AF37]/25 bg-[#050F2E] text-white/70 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-cinzel text-sm font-bold">{v.size}</span>
                        {isSoldOut ? (
                          <span className="text-[10px] text-rose-400 font-sans">Sold Out</span>
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-[#D4AF37]" />
                        ) : null}
                      </div>
                      <span className="text-[11px] text-[#F0D27A] block mt-1">
                        Rs. {(v.salePrice || v.price).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-[#D4AF37]/40 rounded-lg bg-[#050F2E] h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isProductOutOfStock}
                  className="px-3.5 h-full text-white/70 hover:text-white transition-colors disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm text-[#F8F4E8]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isProductOutOfStock}
                  className="px-3.5 h-full text-white/70 hover:text-white transition-colors disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart (Gold gradient button) */}
              <button
                onClick={handleAddToCart}
                disabled={isProductOutOfStock}
                className={`flex-1 h-12 rounded-lg text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isProductOutOfStock
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'btn-gold cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isProductOutOfStock
                    ? 'Sold Out'
                    : `Add to Cart • Rs. ${(unitPrice * quantity).toLocaleString()}`}
                </span>
              </button>
            </div>

            {/* Order on WhatsApp Button */}
            <button
              onClick={handleOrderOnWhatsApp}
              className="btn-gold-outline w-full h-12 rounded-lg text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Order Directly on WhatsApp</span>
            </button>

            {/* Toast feedback */}
            {addedToast && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 text-center animate-fade-in flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Flacon added to your velvet presentation bag.</span>
              </div>
            )}
          </div>

          {/* Delivery & Trust Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-[#F8F4E8]/70">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              <span>COD Across All Pakistan Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>100% Authentic AUHS Extrait</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>16+ Hours Eternal Sillage</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#D4AF37]" />
              <span>35% High Oil Saturation</span>
            </div>
          </div>

        </div>

      </div>

      {/* Fragrance Notes Architecture */}
      <div className="space-y-8 pt-8 border-t border-[#D4AF37]/20">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Olfactory Architecture
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wider text-[#F8F4E8]">
            THE FRAGRANCE PYRAMID
          </h2>
          <p className="text-xs text-[#F8F4E8]/70 font-light">
            Engineered through fractional distillation to unravel across the day into distinct sensory chapters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Notes */}
          <div className="bg-[#081438] p-6 rounded-xl border border-[#D4AF37]/25 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-sm uppercase tracking-widest text-[#F0D27A] font-bold">
                Top Notes
              </span>
              <span className="text-[10px] text-white/40 uppercase">Initial 30 Min</span>
            </div>
            <ul className="space-y-2">
              {product.notes.top.map((note, index) => (
                <li key={index} className="text-xs text-[#F8F4E8]/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Heart Notes */}
          <div className="bg-[#081438] p-6 rounded-xl border border-[#D4AF37]/40 space-y-4 relative overflow-hidden shadow-lg shadow-[#D4AF37]/5">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-sm uppercase tracking-widest text-[#F0D27A] font-bold">
                Heart Notes
              </span>
              <span className="text-[10px] text-white/40 uppercase">2 to 6 Hours</span>
            </div>
            <ul className="space-y-2">
              {product.notes.heart.map((note, index) => (
                <li key={index} className="text-xs text-[#F8F4E8]/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F0D27A]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Base Notes */}
          <div className="bg-[#081438] p-6 rounded-xl border border-[#D4AF37]/25 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-sm uppercase tracking-widest text-[#F0D27A] font-bold">
                Base Notes
              </span>
              <span className="text-[10px] text-white/40 uppercase">Dry Down (16+ Hrs)</span>
            </div>
            <ul className="space-y-2">
              {product.notes.base.map((note, index) => (
                <li key={index} className="text-xs text-[#F8F4E8]/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A67C1A]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
