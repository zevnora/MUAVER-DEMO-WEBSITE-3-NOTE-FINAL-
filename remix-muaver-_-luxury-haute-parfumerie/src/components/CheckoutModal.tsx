import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Truck, Package, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { CartItem, SiteSettings } from '../types/store';
import { createOrder, calculateOrderCharges, DEFAULT_STATIC_IMAGES } from '../services/storeService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (orderNumber: string) => void;
  settings: SiteSettings;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  settings,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    orderId: string;
  } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const charges = calculateOrderCharges(subtotal, settings.deliverySettings);
  const { deliveryCharges, handlingCharges, isFreeDelivery, totalAmount } = charges;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage('');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.fullName.trim()) {
      setErrorMessage('Please provide your full recipient name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setErrorMessage('Please enter a valid Pakistani contact phone number (e.g., 0324 2404984).');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage('Please select or specify your delivery city.');
      return;
    }
    if (!formData.address.trim() || formData.address.trim().length < 10) {
      setErrorMessage('Please enter your complete doorstep street address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const orderResult = await createOrder({
        customer: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim() || undefined,
        },
        items,
        subtotal,
        shippingFee: deliveryCharges,
        handlingFee: handlingCharges,
        totalAmount,
        paymentMethod: 'Cash on Delivery (COD)',
      });

      setCompletedOrder(orderResult);
      onOrderSuccess(orderResult.orderNumber);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setErrorMessage('An unexpected error occurred while placing your order. Please try again or order directly via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    if (!completedOrder) return;
    const phone = settings.whatsappRawNumber || '923242404984';
    const lines = [
      `Assalam-o-Alaikum MUAVER Royale Concierge,`,
      `I have just placed an order on the website:`,
      `• Order Number: ${completedOrder.orderNumber}`,
      `• Name: ${formData.fullName}`,
      `• Phone: ${formData.phone}`,
      `• City: ${formData.city}`,
      `• Address: ${formData.address}`,
      `• Subtotal: Rs. ${subtotal.toLocaleString()}`,
      ...(handlingCharges > 0 ? [`• Handling Charges: Rs. ${handlingCharges.toLocaleString()}`] : []),
      `• Delivery Charges: ${isFreeDelivery ? 'Free (Rs. 0)' : `Rs. ${deliveryCharges.toLocaleString()}`}`,
      `• Total Amount: Rs. ${totalAmount.toLocaleString()} (Cash on Delivery)`,
      ``,
      `Please confirm my order dispatch. Thank you!`
    ];
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-montserrat flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050F2E]/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-2xl bg-[#081438] border border-[#D4AF37]/40 rounded-xl shadow-2xl overflow-hidden z-10 my-8">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-gradient-to-r from-[#050F2E] via-[#0A1A4F] to-[#050F2E]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#F0D27A] font-semibold block">
              MUAVER Haute Parfumerie
            </span>
            <h2 className="font-cinzel text-xl text-[#F8F4E8] font-bold tracking-wide">
              {completedOrder ? 'Imperial Order Reserved' : 'Cash on Delivery Checkout'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-[#F0D27A] transition-colors rounded-full hover:bg-white/5"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-[#0A1A4F] border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                <CheckCircle className="w-10 h-10 text-[#25D366]" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#F0D27A] font-semibold">
                  Thank You, {formData.fullName}
                </span>
                <h3 className="font-cinzel text-2xl text-[#F8F4E8] font-bold tracking-wide">
                  Order Successfully Placed
                </h3>
                <p className="text-sm text-[#F8F4E8]/70 max-w-md mx-auto leading-relaxed">
                  Your bespoke flacon has been reserved with status <strong className="text-[#F0D27A]">Pending</strong>. Our master concierge is preparing your white-glove dispatch.
                </p>
              </div>

              {/* Order Reference Badge */}
              <div className="p-4 bg-[#050F2E] rounded-lg border border-[#D4AF37]/30 max-w-md mx-auto space-y-1">
                <div className="text-[11px] text-white/50 uppercase tracking-widest">
                  Order Reference Number
                </div>
                <div className="font-cinzel text-2xl text-[#F0D27A] font-bold tracking-wider">
                  {completedOrder.orderNumber}
                </div>
                <div className="text-xs text-white/70 pt-1">
                  Pay Rs. {totalAmount.toLocaleString()} via Cash on Delivery
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                <button
                  onClick={handleWhatsAppConfirm}
                  className="btn-gold flex-1 py-3 px-4 rounded text-xs flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#050F2E]" />
                  <span>Confirm on WhatsApp</span>
                </button>
                <button
                  onClick={onClose}
                  className="btn-gold-outline flex-1 py-3 px-4 rounded text-xs"
                >
                  Continue Exploring
                </button>
              </div>

              <p className="text-[11px] text-[#F8F4E8]/50 max-w-sm mx-auto">
                A verification call or SMS may be placed to {formData.phone} prior to parcel courier dispatch.
              </p>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              
              {/* Order Items Preview */}
              <div className="bg-[#050F2E] p-4 rounded-lg border border-[#D4AF37]/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#F0D27A] font-cinzel font-semibold uppercase tracking-wider">
                      Selected Fragrances ({items.reduce((acc, i) => acc + i.quantity, 0)})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Cash on Delivery Available</span>
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#F0D27A]">
                    Subtotal: Rs. {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center justify-between text-xs text-white/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 aspect-[4/5] rounded overflow-hidden border border-[#D4AF37]/30 bg-[#081438] shrink-0">
                          <img
                            src={item.productImage || DEFAULT_STATIC_IMAGES.heroFallbackImage}
                            alt={item.productName}
                            width={32}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_STATIC_IMAGES.heroFallbackImage;
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-white">{item.productName}</span>
                          <span className="text-[11px] text-[#F0D27A] block">{item.size} × {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-[#F0D27A]">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer Delivery Fields */}
              <div className="space-y-4">
                <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#F0D27A] flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Recipient Delivery Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/80 block">
                      Full Name <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Sultan Ahmad"
                      required
                      className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3.5 py-2.5 text-sm text-[#F8F4E8] placeholder-white/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/80 block">
                      Phone Number (WhatsApp Active) <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 0324 2404984"
                      required
                      className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3.5 py-2.5 text-sm text-[#F8F4E8] placeholder-white/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/80 block">
                      Destination City <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Karachi, Lahore, Islamabad, etc."
                      required
                      className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3.5 py-2.5 text-sm text-[#F8F4E8] placeholder-white/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  {/* Payment Method (COD Fixed) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/80 block">
                      Payment Method
                    </label>
                    <div className="w-full bg-[#050F2E]/80 border border-[#D4AF37]/40 rounded px-3.5 py-2.5 text-xs text-[#F0D27A] font-semibold flex items-center justify-between">
                      <span>Cash on Delivery (COD)</span>
                      <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                    </div>
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80 block">
                    Full Doorstep Address <span className="text-[#D4AF37]">*</span>
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House/Apartment #, Street, Block/Phase, Landmark..."
                    required
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3.5 py-2.5 text-sm text-[#F8F4E8] placeholder-white/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Order Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60 block">
                    Special Instructions / Gift Ribbon Note (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g., Deliver after 3 PM, Fragile handle with care"
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3.5 py-2.5 text-sm text-[#F8F4E8] placeholder-white/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* COD Assurances & Full Order Charges Breakdown */}
              <div className="p-4 bg-[#050F2E]/90 rounded-xl border border-[#D4AF37]/25 space-y-2.5 text-xs text-[#F8F4E8]/80">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Courier Delivery Time:</span>
                  </div>
                  <span className="font-semibold text-white">
                    {settings.deliverySettings?.deliveryTimeText || '2 to 5 working days'}
                  </span>
                </div>

                {/* 1. Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Subtotal:</span>
                  <span className="font-mono text-white">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {/* 2. Product Handling Charges */}
                {handlingCharges > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Product Handling Charges:</span>
                    <span className="font-mono text-amber-200">Rs. {handlingCharges.toLocaleString()}</span>
                  </div>
                )}

                {/* 3. Delivery Charges */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Delivery Charges:</span>
                  <span className={isFreeDelivery ? 'text-[#25D366] font-semibold' : 'text-[#F0D27A] font-mono font-semibold'}>
                    {isFreeDelivery ? 'Free (Rs. 0)' : `Rs. ${deliveryCharges.toLocaleString()}`}
                  </span>
                </div>

                {/* 4. Total */}
                <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/30 text-sm font-bold text-[#F0D27A]">
                  <span>Total Payable (COD):</span>
                  <span className="font-mono text-base font-extrabold text-[#F0D27A]">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 px-6 rounded text-xs flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#050F2E] border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Order to Firestore...</span>
                    </div>
                  ) : (
                    <span>Confirm Order • Rs. {totalAmount.toLocaleString()} (COD)</span>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
