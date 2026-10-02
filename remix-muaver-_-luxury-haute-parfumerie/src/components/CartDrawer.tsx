import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ShieldCheck, ArrowRight, MessageCircle, Truck } from 'lucide-react';
import { CartItem, SiteSettings } from '../types/store';
import { calculateOrderCharges, DEFAULT_STATIC_IMAGES } from '../services/storeService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onProceedToCheckout: () => void;
  settings: SiteSettings;
  onNavigateToShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings,
  onNavigateToShop,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const charges = calculateOrderCharges(subtotal, settings.deliverySettings);
  const { deliveryCharges, handlingCharges, isFreeDelivery, totalAmount } = charges;

  // Prefilled WhatsApp message for entire cart
  const handleWhatsAppCartOrder = () => {
    const phone = settings.whatsappRawNumber || '923242404984';
    const lines = [
      `Assalam-o-Alaikum MUAVER Royale Concierge,`,
      `I would like to place an order for the following items in my cart:`,
      ...items.map(
        (item, index) =>
          `${index + 1}. ${item.productName} (${item.size}) - Qty: ${item.quantity} x Rs. ${item.price.toLocaleString()} = Rs. ${(item.price * item.quantity).toLocaleString()}`
      ),
      ``,
      `• Subtotal: Rs. ${subtotal.toLocaleString()}`,
      ...(handlingCharges > 0 ? [`• Product Handling Charges: Rs. ${handlingCharges.toLocaleString()}`] : []),
      `• Delivery Charges: ${isFreeDelivery ? 'Free (Rs. 0)' : `Rs. ${deliveryCharges.toLocaleString()}`}`,
      `• Total: Rs. ${totalAmount.toLocaleString()}`,
      `• Payment Method: Cash on Delivery (COD)`,
      `• Delivery Time: ${settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}`,
      ``,
      `Please confirm availability and dispatch to my address.`
    ];
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-montserrat animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050F2E]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#081438] border-l border-[#D4AF37]/30 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#050F2E]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#F0D27A]" />
              <h2 className="font-cinzel text-lg tracking-widest text-[#F8F4E8] font-bold">
                Royal Flacon Bag
              </h2>
              <span className="text-xs bg-[#D4AF37]/20 text-[#F0D27A] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 font-semibold">
                {totalItemsCount}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-[#F0D27A] transition-colors rounded-full hover:bg-white/5"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cash on Delivery Available & Delivery Time Ribbon */}
          <div className="bg-[#0A1A4F] py-2 px-5 border-b border-[#D4AF37]/20 flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[#25D366]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#25D366]" />
              <span>Cash on Delivery Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}</span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#0A1A4F] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-cinzel text-base text-[#F8F4E8] tracking-wider">
                    Your Flacon Bag is Empty
                  </h3>
                  <p className="text-xs text-[#F8F4E8]/60 max-w-xs leading-relaxed">
                    Indulge in our master-crafted artisanal extraits. Select your signature flacon to begin.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToShop();
                  }}
                  className="btn-gold px-6 py-2.5 text-xs rounded mt-4"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-4 p-4 rounded-lg bg-[#0A1A4F]/60 border border-[#D4AF37]/20 transition-all hover:border-[#D4AF37]/40"
                >
                  <div className="w-18 aspect-[4/5] rounded bg-[#050F2E] overflow-hidden shrink-0 border border-[#D4AF37]/20 relative">
                    <img
                      src={item.productImage || DEFAULT_STATIC_IMAGES.heroFallbackImage}
                      alt={item.productName}
                      width={72}
                      height={90}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_STATIC_IMAGES.heroFallbackImage;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-cinzel text-sm text-[#F8F4E8] font-bold tracking-wide">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.productId, item.size)}
                          className="text-white/40 hover:text-red-400 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-[#F0D27A] tracking-wider uppercase block mt-0.5">
                        {item.size}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#D4AF37]/40 rounded bg-[#050F2E]">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.size, -1)}
                          className="px-2 py-1 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-[#F8F4E8]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.size, 1)}
                          className="px-2 py-1 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-semibold text-[#F0D27A]">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-white/50 block">
                            Rs. {item.price.toLocaleString()} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Actions */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#D4AF37]/25 bg-[#050F2E] space-y-4">
              <div className="space-y-2 text-xs">
                {/* 1. Subtotal */}
                <div className="flex justify-between text-[#F8F4E8]/70">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {/* 2. Product Handling Charges */}
                {handlingCharges > 0 && (
                  <div className="flex justify-between text-[#F8F4E8]/70 items-center">
                    <div>
                      <span>Handling Charges</span>
                      <span className="text-[10px] text-white/40 block">Packaging & Flacon Seal</span>
                    </div>
                    <span className="font-mono text-amber-200">Rs. {handlingCharges.toLocaleString()}</span>
                  </div>
                )}

                {/* 3. Delivery Charges */}
                <div className="flex justify-between text-[#F8F4E8]/70 items-center">
                  <div>
                    <span>Delivery Charges</span>
                    <span className="text-[10px] text-white/40 block">
                      {settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}
                    </span>
                  </div>
                  <span className={isFreeDelivery ? 'text-[#25D366] font-semibold' : 'text-[#F0D27A] font-mono font-semibold'}>
                    {isFreeDelivery ? 'Free (Rs. 0)' : `Rs. ${deliveryCharges.toLocaleString()}`}
                  </span>
                </div>

                {/* Free shipping threshold progress tip if freeDeliveryAbove configured */}
                {!isFreeDelivery && (settings.deliverySettings?.freeDeliveryAbove || settings.deliverySettings?.freeAboveAmount) && (
                  <div className="p-2 rounded bg-[#0A1A4F] text-[10px] text-[var(--gold-300)] border border-[var(--gold-500)]/20">
                    Add Rs. {Math.max(0, (settings.deliverySettings.freeDeliveryAbove || settings.deliverySettings.freeAboveAmount || 5000) - subtotal).toLocaleString()} more to qualify for <strong>Free Delivery</strong>!
                  </div>
                )}

                {/* 4. Total */}
                <div className="flex justify-between text-sm font-cinzel text-[#F0D27A] pt-2 border-t border-white/10 font-bold">
                  <span>Total Payable (COD)</span>
                  <span className="font-mono">Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Primary Action: Cash on Delivery Checkout */}
              <button
                onClick={onProceedToCheckout}
                className="btn-gold w-full py-3.5 px-4 rounded text-xs flex items-center justify-center gap-2 group"
              >
                <span>Proceed to COD Checkout</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Secondary Action: Order on WhatsApp */}
              <button
                onClick={handleWhatsAppCartOrder}
                className="btn-gold-outline w-full py-2.5 px-4 rounded text-xs flex items-center justify-center gap-2 text-white/90"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Order Cart on WhatsApp</span>
              </button>

              <div className="text-center text-[10px] text-[#F8F4E8]/50 pt-1">
                Cash on Delivery • Pay upon inspection at your door
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
