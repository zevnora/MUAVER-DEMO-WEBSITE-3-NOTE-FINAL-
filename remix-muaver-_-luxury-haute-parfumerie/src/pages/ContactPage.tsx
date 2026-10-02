import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Send, CheckCircle, ExternalLink, MapPin, Clock } from 'lucide-react';
import { SiteSettings } from '../types/store';
import { submitContactInquiry } from '../services/storeService';

interface ContactPageProps {
  settings: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasInstagram = Boolean(settings.socialLinks?.instagram && settings.socialLinks.instagram.trim() !== '');
  const hasTikTok = Boolean(settings.socialLinks?.tiktok && settings.socialLinks.tiktok.trim() !== '');
  const hasFacebook = Boolean(settings.socialLinks?.facebook && settings.socialLinks.facebook.trim() !== '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.message) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await submitContactInquiry({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || 'General Parfumerie Inquiry',
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setErrorMsg('Could not transmit your message. Please reach out directly on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 space-y-16 font-montserrat">
      
      {/* Page Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
          {settings.contactBadge || 'Personal Assistance'}
        </span>
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-[#F8F4E8]">
          {settings.contactTitle || 'ROYALE CONCIERGE & CONTACT'}
        </h1>
        <p className="text-xs sm:text-sm text-[#F8F4E8]/70 font-light leading-relaxed">
          {settings.contactSubtitle || 'Our fragrance advisors are at your service for bespoke consultations, Cash on Delivery orders, and order status updates.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Contact Form */}
        <div className="lg:col-span-7 bg-[#081438] p-6 sm:p-10 rounded-2xl border border-[#D4AF37]/30 shadow-2xl">
          <h2 className="font-cinzel text-xl text-[#F8F4E8] font-bold tracking-wide mb-6">
            Dispatch a Message
          </h2>

          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#0A1A4F] border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#25D366]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-cinzel text-xl text-[#F8F4E8] font-bold">
                Message Received by Concierge
              </h3>
              <p className="text-xs text-[#F8F4E8]/70 max-w-md mx-auto">
                Thank you. An AUHS fragrance representative will review your dispatch and reply via email or WhatsApp promptly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn-gold-outline px-6 py-2 rounded text-xs mt-4"
              >
                Send Another Dispatch
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-xs text-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 block">
                    Full Name <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Sultan Ahmad"
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 block">
                    Email Address <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="patron@example.com"
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 block">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0324 2404984"
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 block">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Fragrance consultation, order status..."
                    className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-white/80 block">
                  Your Dispatch / Note <span className="text-[#D4AF37]">*</span>
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="How may our concierge assist your fragrance journey?"
                  className="w-full bg-[#050F2E] border border-[#D4AF37]/30 rounded px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-3.5 px-6 rounded text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message to Concierge</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right: Direct Concierge Channels */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Direct Card */}
          <div className="bg-[#081438] p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 space-y-6">
            <h3 className="font-cinzel text-lg text-[#F8F4E8] font-bold tracking-wide">
              Official Communication Channels
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* WhatsApp & Phone */}
              <div className="flex items-start gap-4 p-3.5 rounded-lg bg-[#050F2E] border border-[#D4AF37]/20">
                <div className="p-2 rounded bg-[#0A1A4F] text-[#25D366]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 block">
                    WhatsApp & Phone
                  </span>
                  <a
                    href={`https://wa.me/${settings.whatsappRawNumber || '923242404984'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#F0D27A] hover:underline block text-sm"
                  >
                    {settings.contactPhone || '+92 324 2404984'}
                  </a>
                  <span className="text-[10px] text-white/50 block">
                    Available for instant orders & consultations
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-3.5 rounded-lg bg-[#050F2E] border border-[#D4AF37]/20">
                <div className="p-2 rounded bg-[#0A1A4F] text-[#D4AF37]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 block">
                    Official Email
                  </span>
                  <a
                    href={`mailto:${settings.contactEmail || 'hellomuaver@gmail.com'}`}
                    className="font-semibold text-white/90 hover:text-[#F0D27A] transition-colors block text-sm"
                  >
                    {settings.contactEmail || 'hellomuaver@gmail.com'}
                  </a>
                  <span className="text-[10px] text-white/50 block">
                    Corporate & VIP Concierge
                  </span>
                </div>
              </div>

              {/* Concierge Hours */}
              <div className="flex items-start gap-4 p-3.5 rounded-lg bg-[#050F2E] border border-[#D4AF37]/20">
                <div className="p-2 rounded bg-[#0A1A4F] text-[#D4AF37]">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 block">
                    Concierge Hours
                  </span>
                  <span className="font-medium text-white/90 block">
                    {settings.contactHours || 'Monday – Sunday: 10:00 AM – 10:00 PM PKT'}
                  </span>
                  <span className="text-[10px] text-[#25D366] block">
                    {settings.contactDispatchNotice || 'WhatsApp active for instant orders & consultations'}
                  </span>
                </div>
              </div>

            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#F0D27A] font-semibold block">
                Official Digital Presences
              </span>
              <div className="flex flex-col gap-2">
                {hasInstagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded bg-[#050F2E] border border-[#D4AF37]/20 hover:border-[#D4AF37] text-xs text-white/80 hover:text-white transition-all"
                  >
                    <span>Instagram: @muaver.co</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </a>
                )}

                {hasTikTok && (
                  <a
                    href={settings.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded bg-[#050F2E] border border-[#D4AF37]/20 hover:border-[#D4AF37] text-xs text-white/80 hover:text-white transition-all"
                  >
                    <span>TikTok: @muaver.co</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </a>
                )}

                {hasFacebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded bg-[#050F2E] border border-[#D4AF37]/20 hover:border-[#D4AF37] text-xs text-white/80 hover:text-white transition-all"
                  >
                    <span>Facebook: Muaver Luxury Brand</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
