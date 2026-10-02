import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Sparkles,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { BannerSlide } from '../types/store';
import { saveBannerSlide, deleteBannerSlide, updateBannersOrder } from '../services/storeService';
import { uploadOptimizedImage } from '../services/imageService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminBannersProps {
  banners: BannerSlide[];
  onRefresh: () => Promise<void>;
}

export const AdminBanners: React.FC<AdminBannersProps> = ({ banners, onRefresh }) => {
  const [localBanners, setLocalBanners] = useState<BannerSlide[]>(banners);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [desktopUploadProgress, setDesktopUploadProgress] = useState<number | null>(null);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [mobileUploadProgress, setMobileUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // In-app Deletion Modal States
  const [bannerToDelete, setBannerToDelete] = useState<BannerSlide | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [deleteBannerError, setDeleteBannerError] = useState<string | null>(null);

  // Keep localBanners in sync with prop updates
  React.useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  // Form state
  const [formData, setFormData] = useState<BannerSlide>({
    id: '',
    desktopImage: '',
    mobileImage: '',
    badgeText: 'ROYAL ATELIER COLLECTION',
    heading: '',
    subheading: '',
    buttonText: 'Discover Collection',
    buttonLink: 'shop',
    isActive: true,
    order: banners.length + 1,
  });

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleStartCreate = () => {
    setEditingBanner(null);
    setIsCreatingNew(true);
    setFormData({
      id: `banner-${Date.now()}`,
      desktopImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
      mobileImage: '',
      badgeText: 'ROYAL ATELIER COLLECTION',
      heading: 'Crafted for Distinction',
      subheading: 'Rare botanical absolutes and master-crafted sillage distilled for royal distinction.',
      buttonText: 'Discover Collection',
      buttonLink: 'shop',
      isActive: true,
      order: banners.length + 1,
    });
  };

  const handleStartEdit = (b: BannerSlide) => {
    setIsCreatingNew(false);
    setEditingBanner(b);
    setFormData({ ...b });
  };

  const handleCancelForm = () => {
    setEditingBanner(null);
    setIsCreatingNew(false);
  };

  // Toggle active on/off
  const handleToggleActive = async (banner: BannerSlide) => {
    try {
      setLoading(true);
      await saveBannerSlide({ ...banner, isActive: !banner.isActive });
      await onRefresh();
      showStatus(`Banner "${banner.heading}" ${!banner.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Error updating status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Move banner order up/down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      setLoading(true);
      await updateBannersOrder(reordered);
      await onRefresh();
      showStatus('Banner order updated successfully', 'success');
    } catch (err: any) {
      showStatus(err.message || 'Error reordering banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete banner trigger (opens confirmation modal)
  const handleDelete = (banner: BannerSlide) => {
    setBannerToDelete(banner);
    setDeleteBannerError(null);
  };

  // Execute delete banner with immediate optimistic UI update & storage purging
  const confirmDeleteBanner = async () => {
    if (!bannerToDelete) return;

    try {
      setIsDeletingBanner(true);
      setDeleteBannerError(null);
      const targetId = bannerToDelete.id;
      const targetHeading = bannerToDelete.heading;

      // 1. Delete from Firestore and purge storage images
      await deleteBannerSlide(targetId);

      // 2. Immediately remove from local list
      setLocalBanners((prev) => prev.filter((b) => b.id !== targetId));

      // 3. Close modal & sync
      setBannerToDelete(null);
      if (onRefresh) await onRefresh();
      showStatus(`Banner "${targetHeading}" permanently deleted.`, 'success');
    } catch (err: any) {
      console.error('Delete banner failed:', err);
      const errMsg = err?.message || String(err);
      setDeleteBannerError(`Delete failed: ${errMsg}`);
      showStatus(`Delete failed: ${errMsg}`, 'error');
    } finally {
      setIsDeletingBanner(false);
    }
  };

  // Upload Desktop image with WebP compression & progress
  const handleDesktopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDesktop(true);
      setDesktopUploadProgress(10);
      const res = await uploadOptimizedImage(file, 'banners', (pct) => {
        setDesktopUploadProgress(pct);
      });
      setFormData((prev) => ({ ...prev, desktopImage: res.fullUrl }));
      showStatus('Desktop banner compressed to WebP and uploaded', 'success');
    } catch (err: any) {
      showStatus(err.message || 'Error uploading image', 'error');
    } finally {
      setUploadingDesktop(false);
      setDesktopUploadProgress(null);
    }
  };

  // Upload Mobile image with WebP compression & progress
  const handleMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMobile(true);
      setMobileUploadProgress(10);
      const res = await uploadOptimizedImage(file, 'banners', (pct) => {
        setMobileUploadProgress(pct);
      });
      setFormData((prev) => ({ ...prev, mobileImage: res.fullUrl }));
      showStatus('Mobile banner compressed to WebP and uploaded', 'success');
    } catch (err: any) {
      showStatus(err.message || 'Error uploading mobile image', 'error');
    } finally {
      setUploadingMobile(false);
      setMobileUploadProgress(null);
    }
  };

  // Submit banner form
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.heading.trim()) {
      showStatus('Please provide a heading', 'error');
      return;
    }
    if (!formData.desktopImage) {
      showStatus('Please provide a desktop image URL or upload one', 'error');
      return;
    }

    try {
      setLoading(true);
      await saveBannerSlide(formData);
      if (onRefresh) await onRefresh();
      handleCancelForm();
      showStatus('Banner saved successfully. Live slider updated.', 'success');
    } catch (err: any) {
      console.error('Save banner failed:', err);
      const errMsg = err?.message || String(err);
      showStatus(`Failed to save banner: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--gold-500)]/20">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold tracking-wide">
            Hero Banner Slider
          </h2>
          <p className="text-xs text-white/60">
            Manage the auto-changing 5s home slider. Banners can be reordered, edited, toggled on/off, and uploaded with automatic compression.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          disabled={loading || isCreatingNew || !!editingBanner}
          className="btn-gold-primary px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Slide</span>
        </button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Modal / Inline Editor */}
      {(isCreatingNew || editingBanner) && (
        <form
          onSubmit={handleSaveBanner}
          className="rounded-2xl bg-[#03091D] border-2 border-[var(--gold-500)]/40 p-6 sm:p-8 space-y-6 shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[var(--gold-300)]" />
              <h3 className="font-heading text-lg font-bold text-white">
                {isCreatingNew ? 'Create New Hero Slide' : `Edit Slide: ${editingBanner?.heading}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Badge Text (Top Label)
                </label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="ROYAL ATELIER COLLECTION"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs sm:text-sm focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Heading (Primary Title) *
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  placeholder="Crafted for Distinction"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs sm:text-sm focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Subheading
                </label>
                <textarea
                  rows={3}
                  value={formData.subheading}
                  onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                  placeholder="Rare botanical absolutes, regal oud, and master-crafted sillage..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs sm:text-sm focus:border-[var(--gold-300)] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="Discover Collection"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Button Target Link
                  </label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="shop or product-id or whatsapp"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Status and Order */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Slide Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formData.isActive
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {formData.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{formData.isActive ? 'Active in Slider' : 'Draft / Off'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Order Sequence
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Images with In-Browser Compression & Upload */}
            <div className="space-y-4">
              {/* Desktop Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)]">
                    Desktop Image (Compressed &lt; 1600px) *
                  </label>
                  <span className="text-[10px] text-white/50">Auto-compressed</span>
                </div>

                {formData.desktopImage ? (
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black border border-[var(--gold-500)]/30 group">
                    <img
                      src={formData.desktopImage}
                      alt="Desktop preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="btn-gold-primary px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDesktopImageUpload}
                          className="hidden"
                          disabled={uploadingDesktop}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[16/9] rounded-xl border-2 border-dashed border-[var(--gold-500)]/30 hover:border-[var(--gold-300)] bg-[var(--navy-900)] cursor-pointer transition-colors p-4 text-center">
                    <Upload className="w-6 h-6 text-[var(--gold-300)] mb-2" />
                    <span className="text-xs font-semibold text-white">Upload Desktop Banner</span>
                    <span className="text-[10px] text-white/40 mt-1">PNG, JPG, WEBP • Max 1600px</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDesktopImageUpload}
                      className="hidden"
                      disabled={uploadingDesktop}
                    />
                  </label>
                )}

                {uploadingDesktop && (
                  <div className="flex items-center gap-2 text-xs text-[var(--gold-300)] font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing and uploading image to storage...</span>
                  </div>
                )}

                <input
                  type="text"
                  value={formData.desktopImage}
                  onChange={(e) => setFormData({ ...formData, desktopImage: e.target.value })}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              {/* Mobile Image (Optional) */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)]">
                    Optional Mobile Image (Portrait)
                  </label>
                  <span className="text-[10px] text-white/40">Uses desktop image if empty</span>
                </div>

                {formData.mobileImage ? (
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden bg-black border border-white/20 group">
                    <img
                      src={formData.mobileImage}
                      alt="Mobile preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mobileImage: '' })}
                        className="px-3 py-1.5 rounded bg-rose-600/80 text-white text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-3 py-3 rounded-lg border border-dashed border-white/20 hover:border-[var(--gold-300)] bg-[var(--navy-900)]/60 cursor-pointer text-xs text-white/70">
                    <Upload className="w-4 h-4 text-[var(--gold-300)]" />
                    <span>Upload Mobile Banner Image (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMobileImageUpload}
                      className="hidden"
                      disabled={uploadingMobile}
                    />
                  </label>
                )}

                {uploadingMobile && (
                  <div className="flex items-center gap-2 text-xs text-[var(--gold-300)] font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing mobile banner...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelForm}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white text-xs uppercase tracking-wider font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || uploadingDesktop || uploadingMobile}
              className="btn-gold-primary px-7 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Slide & Publish</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-white/50 px-2">
          <span>{localBanners.length} Total Banners in Database</span>
          <span>Use arrows to reorder slide sequence</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {localBanners.map((banner, index) => (
            <div
              key={banner.id}
              className="rounded-2xl bg-[#081438] border border-[var(--gold-500)]/25 p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between transition-all hover:border-[var(--gold-500)]/60 shadow-lg"
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                {/* Drag / Sequence handles */}
                <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                  <button
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0 || loading}
                    className="p-1 rounded text-white/40 hover:text-[var(--gold-300)] hover:bg-white/5 disabled:opacity-20"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-[var(--gold-300)]">
                    #{index + 1}
                  </span>
                  <button
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === banners.length - 1 || loading}
                    className="p-1 rounded text-white/40 hover:text-[var(--gold-300)] hover:bg-white/5 disabled:opacity-20"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Image Preview */}
                <div className="w-24 sm:w-36 aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 relative">
                  <img
                    src={banner.desktopImage}
                    alt={banner.heading}
                    className="w-full h-full object-cover"
                  />
                  {banner.mobileImage && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white/80 px-1 py-0.5 rounded font-mono">
                      +Mobile
                    </span>
                  )}
                </div>

                {/* Banner Text Details */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold">
                      {banner.badgeText || 'BANNER'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        banner.isActive !== false
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {banner.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h4 className="font-heading text-sm sm:text-base font-bold text-white truncate">
                    {banner.heading}
                  </h4>

                  <p className="text-xs text-white/60 line-clamp-1">
                    {banner.subheading}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-white/40 pt-1">
                    <span>CTA: <strong className="text-white/80">{banner.buttonText}</strong></span>
                    <span>•</span>
                    <span>Target: <strong className="text-[var(--gold-300)]">{banner.buttonLink}</strong></span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto justify-end">
                {/* On/Off Toggle */}
                <button
                  onClick={() => handleToggleActive(banner)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    banner.isActive !== false
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/50'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-white'
                  }`}
                  title={banner.isActive !== false ? 'Click to disable' : 'Click to enable'}
                >
                  {banner.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{banner.isActive !== false ? 'Live' : 'Hidden'}</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleStartEdit(banner)}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-[var(--gold-300)] hover:border-[var(--gold-300)] text-xs flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(banner)}
                  disabled={loading}
                  className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 transition-colors"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Banner Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(bannerToDelete)}
        title="Delete Hero Banner Slide"
        itemName={bannerToDelete?.heading || 'Banner'}
        message="This banner slide will be permanently deleted from the homepage slider and its images purged from Firebase Storage."
        isDeleting={isDeletingBanner}
        errorMessage={deleteBannerError}
        onConfirm={confirmDeleteBanner}
        onCancel={() => {
          if (!isDeletingBanner) {
            setBannerToDelete(null);
            setDeleteBannerError(null);
          }
        }}
      />
    </div>
  );
};
