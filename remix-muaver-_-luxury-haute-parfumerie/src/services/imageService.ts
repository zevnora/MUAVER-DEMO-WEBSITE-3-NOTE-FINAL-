import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from './firebase';

export interface ImageUploadResult {
  fullUrl: string;
  thumbUrl: string;
}

/**
 * Delete an image asset from Firebase Storage
 */
export async function deleteStorageImage(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  const isFirebaseStorage = 
    imageUrl.includes('firebasestorage.googleapis.com') ||
    imageUrl.includes('.appspot.com') ||
    imageUrl.includes('.firebasestorage.app');

  if (!isFirebaseStorage) {
    return;
  }

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);

    try {
      if (!imageUrl.includes('/thumbs/')) {
        const thumbUrl = imageUrl.replace(/%2F([^%]+)\.([^?]+)/, '%2Fthumbs%2F$1_thumb.$2');
        if (thumbUrl !== imageUrl) {
          const thumbRef = ref(storage, thumbUrl);
          await deleteObject(thumbRef);
        }
      }
    } catch {
      // Thumbnail deletion is best-effort
    }
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      console.warn('Firebase Storage asset cleanup notice:', err?.message || err);
    }
  }
}

/**
 * Delete a list of image assets from Firebase Storage
 */
export async function deleteStorageImages(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;
  await Promise.allSettled(imageUrls.map((url) => deleteStorageImage(url)));
}

/**
 * Resizes and compresses an image in the browser via HTML5 Canvas into WebP (or JPEG fallback)
 * - Constrains width to maxWidth
 * - Uses createImageBitmap / Image with memory cleanup
 * - WebP format for high compression ratio
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down proportionally if larger than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context is unavailable for image compression'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Attempt WebP first
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            resolve({ blob: webpBlob, mimeType: 'image/webp' });
          } else {
            // Fallback to JPEG if browser cannot encode WebP
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve({ blob: jpegBlob, mimeType: 'image/jpeg' });
                } else {
                  reject(new Error('Image compression blob generation failed'));
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file for compression'));
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads an image with browser compression:
 * - Display size: max 1200px wide, WebP
 * - Thumbnail size: max 400px wide, WebP
 * - Tracks upload progress callback
 * - Returns both download URLs
 */
export async function uploadOptimizedImage(
  file: File,
  folder: 'banners' | 'products' | 'branding' = 'products',
  onProgress?: (percent: number) => void
): Promise<ImageUploadResult> {
  // Pre-compression validation
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  if (onProgress) onProgress(10);

  // 1. Generate display size (max 1200px wide, WebP)
  const displayResult = await compressImageToWebP(file, 1200, 0.8);
  if (onProgress) onProgress(30);

  // 2. Generate thumbnail size (max 400px wide, WebP)
  const thumbResult = await compressImageToWebP(file, 400, 0.75);
  if (onProgress) onProgress(50);

  const timestamp = Date.now();
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.[^/.]+$/, '');
  const ext = displayResult.mimeType === 'image/webp' ? 'webp' : 'jpg';

  const fileName = `${timestamp}_${cleanName}.${ext}`;
  const thumbFileName = `${timestamp}_${cleanName}_thumb.${ext}`;

  try {
    const mainRef = ref(storage, `${folder}/${fileName}`);
    const thumbRef = ref(storage, `${folder}/thumbs/${thumbFileName}`);

    // Upload display image
    const mainUploadTask = uploadBytesResumable(mainRef, displayResult.blob, {
      contentType: displayResult.mimeType,
      customMetadata: { 
        originalName: file.name,
        targetWidth: '1200',
        format: 'webp'
      },
    });

    // Monitor progress
    mainUploadTask.on('state_changed', (snapshot) => {
      if (snapshot.totalBytes > 0 && onProgress) {
        const percent = Math.round(50 + (snapshot.bytesTransferred / snapshot.totalBytes) * 35);
        onProgress(percent);
      }
    });

    await mainUploadTask;
    const fullUrl = await getDownloadURL(mainRef);

    // Upload thumbnail
    const thumbUploadTask = uploadBytesResumable(thumbRef, thumbResult.blob, {
      contentType: thumbResult.mimeType,
      customMetadata: { 
        originalName: file.name,
        targetWidth: '400',
        isThumb: 'true',
        format: 'webp'
      },
    });

    await thumbUploadTask;
    const thumbUrl = await getDownloadURL(thumbRef);

    if (onProgress) onProgress(100);

    return { fullUrl, thumbUrl };
  } catch (storageError: any) {
    console.error('Firebase Storage direct upload error:', storageError);
    
    // Check if error is related to permission or CORS
    const isPermissionError = storageError?.code === 'storage/unauthorized' || 
      storageError?.message?.includes('permission') || 
      storageError?.message?.includes('unauthorized');

    if (isPermissionError) {
      console.warn('Storage rules require write permission. Falling back to high-compression WebP data URL.');
    }

    // Resilient fallback to high-compression WebP Data URL so admin is never blocked
    const fullUrl = await blobToDataUrl(displayResult.blob);
    const thumbUrl = await blobToDataUrl(thumbResult.blob);
    
    if (onProgress) onProgress(100);
    return { fullUrl, thumbUrl };
  }
}



function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
