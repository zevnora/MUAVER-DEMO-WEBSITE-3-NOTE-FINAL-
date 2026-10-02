import React, { useState, useRef } from 'react';
import { Upload, RotateCcw, Image as ImageIcon, Loader2, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { uploadOptimizedImage } from '../services/imageService';

interface AdminImageUploadProps {
  label: string;
  description?: string;
  currentUrl: string;
  defaultUrl: string;
  onChange: (newUrl: string) => void;
  folder?: 'branding' | 'banners' | 'products';
  aspectRatio?: 'landscape' | 'square' | 'portrait' | 'auto';
  maxPreviewHeight?: string;
}

export const AdminImageUpload: React.FC<AdminImageUploadProps> = ({
  label,
  description,
  currentUrl,
  defaultUrl,
  onChange,
  folder = 'branding',
  aspectRatio = 'auto',
  maxPreviewHeight = 'h-28',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentUrl);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDefault = (currentUrl || '').trim() === (defaultUrl || '').trim();

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(10);
      setFeedback(null);

      // Compress and upload via HTML5 Canvas into WebP (1200px & 400px thumb)
      const res = await uploadOptimizedImage(file, folder, (progress) => {
        setUploadProgress(progress);
      });

      onChange(res.fullUrl);
      setManualUrl(res.fullUrl);
      showStatus('WebP compressed & uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showStatus(err.message || 'Image compression/upload failed.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    onChange(defaultUrl);
    setManualUrl(defaultUrl);
    showStatus('Reverted to default asset', 'success');
  };

  const handleManualApply = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      showStatus('URL applied', 'success');
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[var(--navy-900)] border border-[var(--gold-500)]/20 space-y-3 font-montserrat">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs uppercase font-heading tracking-wider text-[var(--gold-300)] font-bold block">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-white/50 font-light mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Reset to Default Button */}
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isDefault || uploading}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
              isDefault
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/40 border border-white/5'
                : 'bg-amber-950/40 text-[var(--gold-300)] border border-amber-500/40 hover:bg-amber-900/40 cursor-pointer shadow-sm'
            }`}
            title="Reset image to official MUAVER default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to default</span>
          </button>

          {/* Toggle manual URL input */}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] text-white/50 hover:text-white underline transition-colors"
          >
            {showUrlInput ? 'Hide URL' : 'Paste URL'}
          </button>
        </div>
      </div>

      {/* Image Preview Box */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div
          className={`relative rounded-xl overflow-hidden bg-[#03091D] border border-white/10 flex items-center justify-center p-2 group shrink-0 ${
            aspectRatio === 'square'
              ? 'w-24 h-24 sm:w-28 sm:h-28'
              : aspectRatio === 'landscape'
              ? 'w-48 h-20 sm:w-56 sm:h-24'
              : aspectRatio === 'portrait'
              ? 'w-24 h-30 sm:w-28 sm:h-36 aspect-[4/5]'
              : 'w-28 min-h-20 ' + maxPreviewHeight
          }`}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={label}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultUrl;
              }}
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-white/20" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-[var(--gold-300)] gap-1.5 text-[10px] font-medium p-2 text-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Optimizing {uploadProgress !== null ? `${uploadProgress}%` : ''}</span>
              {uploadProgress !== null && (
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-[var(--gold-300)] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-2 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-gold-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-md shadow-amber-950/30 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--navy-900)]" />
              <span>{uploading ? 'Processing...' : 'Upload & Compress'}</span>
            </button>

            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-white/40 hover:text-white text-[11px] flex items-center gap-1"
                title="View full asset"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {feedback && (
              <span
                className={`text-[11px] font-medium flex items-center gap-1 animate-fade-in ${
                  feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{feedback.text}</span>
              </span>
            )}
          </div>

          <p className="text-[10px] text-white/40 font-mono">
            Auto-converts to WebP (display 1200px, thumbnail 400px).
          </p>

          {/* Manual URL Input drawer */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1 animate-fade-in">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 rounded bg-[#03091D] border border-white/15 text-white text-xs font-mono focus:border-[var(--gold-300)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleManualApply}
                className="px-3 py-1.5 rounded bg-[var(--gold-500)]/20 text-[var(--gold-300)] border border-[var(--gold-500)]/40 hover:bg-[var(--gold-500)]/30 text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
