import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { 
  SiteSettings, 
  Product, 
  Order, 
  CustomerInquiry, 
  BannerSlide, 
  ProductCategory,
  WhyFeature,
  TestimonialItem,
  SectionVisibility,
  DeliverySettings,
  PoliciesConfig,
  PolicySection,
  AdminRole,
  AdminUser,
  ShippingType
} from '../types/store';

/**
 * Remove undefined values recursively from payload before writing to Firestore
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? removeUndefined(item) : item)) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !(value instanceof Date) && typeof (value as any).toMillis !== 'function') {
      result[key] = removeUndefined(value);
    } else {
      result[key] = value;
    }
  }
  return result;
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

  if (!isFirebaseStorage) return;

  try {
    let storageRef;
    try {
      storageRef = ref(storage, imageUrl);
    } catch {
      const matches = imageUrl.match(/\/o\/([^?]+)/);
      if (matches && matches[1]) {
        storageRef = ref(storage, decodeURIComponent(matches[1]));
      }
    }
    if (storageRef) {
      await deleteObject(storageRef);
    }

    try {
      if (!imageUrl.includes('/thumbs/')) {
        const thumbUrl = imageUrl.replace(/%2F([^%]+)\.([^?]+)/, '%2Fthumbs%2F$1_thumb.$2');
        if (thumbUrl !== imageUrl) {
          let thumbRef;
          try {
            thumbRef = ref(storage, thumbUrl);
          } catch {
            const m = thumbUrl.match(/\/o\/([^?]+)/);
            if (m && m[1]) thumbRef = ref(storage, decodeURIComponent(m[1]));
          }
          if (thumbRef) {
            await deleteObject(thumbRef);
          }
        }
      }
    } catch {
      // Best-effort thumbnail deletion
    }
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      console.warn('Storage asset cleanup notice:', err?.message || err);
    }
  }
}

/**
 * Delete multiple image assets from Firebase Storage
 */
export async function deleteStorageImages(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;
  await Promise.allSettled(imageUrls.map((url) => deleteStorageImage(url)));
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryTimeText: '2 to 5 working days',
  deliveryCharges: 250,
  freeDeliveryAbove: 5000,
  handlingCharges: 100,
  shippingType: 'free_above',
  flatRateAmount: 250,
  freeAboveAmount: 5000,
  isEnabled: true,
};

export const DEFAULT_POLICIES: PoliciesConfig = {
  'delivery-info': {
    title: 'Delivery & White-Glove Dispatch',
    content: `All MUAVER fragrance orders are prepared with utmost care and dispatched directly from our Karachi central reserve with inspection seals.\n\n• Standard Delivery Time: 2 to 5 working days nationwide across Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Multan, Faisalabad, and all provincial cities.\n• White-Glove Logistics Partners: TCS, Leopards, and PostEx Express with real-time SMS & WhatsApp tracking.\n• Insured Courier Handling: Every luxury crystal flacon is encased in custom shock-absorbing velvet presentation boxes to guarantee pristine transit.\n• Doorstep Inspection: Parcels carry tamper-evident security seals allowing exterior verification before receiving.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
  'returns': {
    title: 'Return and Exchange Privilege',
    content: `At MUAVER, we pride ourselves on exceptional craftsmanship. If your flacon arrives damaged or does not match your order, we offer a dedicated exchange privilege within 7 calendar days of delivery.\n\n• Eligibility: Flacons must remain sealed, unopened, and in original packaging with intact security seals due to hygienic and purity standards for Extrait de Parfum.\n• Process: Contact our Royale WhatsApp Concierge (+92 324 2404984) with your order number and unboxing photos.\n• Reverse Pickup: We arrange complimentary reverse courier pickup across all major cities in Pakistan.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
  'refund-policy': {
    title: 'Refund Policy & Guarantees',
    content: `Your complete satisfaction is the hallmark of MUAVER Haute Parfumerie.\n\n• Transit Damage or Faulty Atomizer: If verified upon receipt, we immediately dispatch a replacement flacon or process a 100% refund.\n• Refund Channels: Refunds are remitted directly via Bank Transfer (IBFT), JazzCash, or Raast within 3 to 5 business days after returning parcel verification.\n• Inquiries: Contact hellomuaver@gmail.com or message our Concierge on WhatsApp for instant assistance.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
  'privacy-policy': {
    title: 'Patron Privacy & Discretion',
    content: `MUAVER is committed to safeguarding the personal privacy of all patrons and collectors.\n\n• Information Collected: Recipient full name, mobile number, doorstep address, and delivery city are collected exclusively to facilitate white-glove order dispatch.\n• Data Protection: We never sell, rent, or disclose patron information to third-party marketing brokers.\n• Secure Communications: Order notifications and delivery status alerts are transmitted securely via WhatsApp or direct SMS.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
  'terms': {
    title: 'Terms of Service',
    content: `By purchasing from MUAVER, you agree to our terms of master artisanship.\n\n• Product Formulation: All creations are formulated at 35% pure perfume oils (Extrait de Parfum) handcrafted in limited batches by AUHS.\n• Order Confirmation: Cash on Delivery orders may be confirmed via phone call or WhatsApp message prior to dispatch to prevent delivery failures.\n• Pricing & Taxes: All prices listed on the site are in Pakistani Rupees (PKR) and inclusive of packaging and applicable sales taxes.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
  'cod-policy': {
    title: 'Cash on Delivery (COD) Policy',
    content: `We proudly offer nationwide Cash on Delivery across Pakistan to give our patrons total peace of mind.\n\n• Zero Advance Payment: Pay the courier representative in cash only when the parcel arrives at your doorstep.\n• Inspection Seal: Exterior parcels feature a tamper-proof MUAVER seal. You may inspect the outer package before paying.\n• Doorstep Readiness: Please keep the exact cash amount ready upon delivery arrival to ensure swift courier handover.`,
    isEnabled: true,
    lastUpdated: 'September 2026',
  },
};

export const DEFAULT_STATIC_IMAGES = {
  landscapeLogoUrl: 'https://i.ibb.co/8n6t1tQH/Untitled-design.png',
  fullSquareLogoUrl: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  iconUrl: 'https://i.ibb.co/M5Dq0xS9/Icon.png',
  brandStoryImage: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  aboutStoryImage: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  heroFallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
};

export const DEFAULT_WHY_FEATURES: WhyFeature[] = [
  {
    id: 'wf-1',
    icon: 'crown',
    title: 'Authentic',
    description: '100% genuine master perfumery extracts and pure botanical absolutes. Certified unadulterated formulation honoring classical haute parfumerie.',
  },
  {
    id: 'wf-2',
    icon: 'clock',
    title: 'Long Lasting',
    description: 'Distilled at an extraordinary 35% Extrait de Parfum concentration, commanding 16+ hours of hypnotic, aristocratic projection.',
  },
  {
    id: 'wf-3',
    icon: 'shield',
    title: 'COD Nationwide',
    description: 'White-glove Cash on Delivery across Karachi, Lahore, Islamabad, and all cities throughout Pakistan. Inspect and pay at your doorstep.',
  },
  {
    id: 'wf-4',
    icon: 'package',
    title: 'Premium Packaging',
    description: 'Custom-molded jewel-cut crystal flacon, gold metallic atomizer, and couture velvet-lined presentation box sealed with the AUHS crest.',
  },
];

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Hamza K.',
    city: 'Lahore, Pakistan',
    role: 'Verified Patron',
    rating: 5,
    comment: "The dry-down of the royal bespoke blend is breathtaking. The Taif rose and ambergris linger on my sherwani for two whole days. Unequivocally international niche quality.",
    isActive: true,
  },
  {
    id: 't-2',
    name: 'Barrister Daniyal R.',
    city: 'Karachi, Pakistan',
    role: 'Verified Patron',
    rating: 5,
    comment: 'Ordered via WhatsApp and received the parcel with Cash on Delivery in Karachi within 48 hours. The heavy flacon and royal gold box are truly magnificent.',
    isActive: true,
  },
  {
    id: 't-3',
    name: 'Syed Ali Raza',
    city: 'Islamabad, Pakistan',
    role: 'Haute Connoisseur',
    rating: 5,
    comment: 'An opulent symphony of pure golden oud and Bulgarian rose. This is not just a perfume; it is an aura of royal prestige crafted for distinction.',
    isActive: true,
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'MUAVER | Luxury Brand',
  tagline: 'CRAFTED FOR DISTINCTION By AUHS',
  brandStoryBadge: 'The AUHS Legacy',
  brandStoryTitle: 'CRAFTED FOR DISTINCTION By AUHS',
  brandStorySnippet: 'In an era saturated by mass-market, diluted aromas, MUAVER was conceived with a solitary royal conviction: to revive the regal authority of master perfumery. The emblem — a radiant gold crown poised above the interlocked "MV" monogram, enveloped by ceremonial laurel flourishes — symbolizes nobility of spirit, precision formulation, and unyielding distinction.',
  brandStoryText2: 'Every formulation is orchestrated by AUHS with a generous 35% concentration of pure perfume essences (Extrait de Parfum). This rare saturation allows the olfactory notes to unfold organically upon the skin over hours, leaving an aristocratic sillage that commands reverence before you utter a single word.',
  brandStoryImage: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  brandStoryButtonText: 'Read The Full Chronicle',
  landscapeLogoUrl: 'https://i.ibb.co/8n6t1tQH/Untitled-design.png',
  fullSquareLogoUrl: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  iconUrl: 'https://i.ibb.co/M5Dq0xS9/Icon.png',
  faviconUrl: 'https://i.ibb.co/M5Dq0xS9/Icon.png',
  contactPhone: '+92 324 2404984',
  whatsappNumber: '+92 324 2404984',
  whatsappRawNumber: '923242404984',
  contactEmail: 'hellomuaver@gmail.com',
  socialLinks: {
    instagram: 'https://www.instagram.com/muaver.co',
    tiktok: 'https://www.tiktok.com/@muaver.co',
    facebook: 'https://www.facebook.com/people/Muaver-Luxury-Brand/61592411954625/',
  },
  announcementText: 'Complimentary White-Glove Cash on Delivery Across Pakistan • Handcrafted in Limited Small Batches',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  freeShippingNotice: 'Free Expedited White-Glove Dispatch on All Orders',

  visibility: {
    showAnnouncementBar: true,
    showHeroSlider: true,
    showFeaturedProduct: true,
    showBrandStory: true,
    showWhyFeatures: true,
    showTestimonials: true,
    showWhatsAppStrip: true,
  },

  heroFallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
  heroDefaultBadge: 'ROYAL ATELIER COLLECTION',
  heroDefaultHeading: 'Crafted for Distinction',
  heroDefaultSubheading: 'Rare botanical absolutes, regal oud, and master-crafted sillage distilled for those who command distinction.',

  featuredProductId: '',
  featuredSectionBadge: 'Flagship Masterpiece',
  featuredSectionTitle: 'THE IMPERIAL CREATION',

  whyFeatures: DEFAULT_WHY_FEATURES,
  testimonials: DEFAULT_TESTIMONIALS,

  aboutBadge: 'CRAFTED FOR DISTINCTION By AUHS',
  aboutTitle: 'THE MAISON CHRONICLE',
  aboutSubtitle: 'Born out of an unwavering reverence for master-grade perfumery and noble heritage.',
  aboutStoryTitle: 'Heraldry of The Imperial Crown',
  aboutStoryP1: 'The insignia of MUAVER tells the story of our philosophy: a sovereign gold crown resting regally above the interlocked "MV" monogram, wrapped in ceremonial laurel flourishes. Metallic gold cast against an abyss of deep royal navy — a colorway chosen across centuries by royalty to symbolize authority, depth, and eternal prestige.',
  aboutStoryP2: 'Behind the brand stands AUHS — dedicated to crafting singular fragrant works of art without compromise, without synthetic short-cuts, and without ordinary formulations.',
  aboutStoryImage: 'https://i.ibb.co/ynpdPdvP/Full-Logo.png',
  aboutCreedTitle: 'THE THREE LAWS OF MUAVER',
  aboutLaw1Title: 'Pure Extrait Saturation',
  aboutLaw1Desc: 'Formulated at 35% pure perfume oils, ensuring every application produces a deep, persistent aura that endures from dusk till dawn.',
  aboutLaw2Title: 'Authentic Botanical Absolutes',
  aboutLaw2Desc: 'We strictly source rare Bulgarian rose, wild Cambodian agarwood, and aged ambergris without synthetic dilution.',
  aboutLaw3Title: 'Architectural Artisanship',
  aboutLaw3Desc: 'Each flacon is encased in custom crystal glass, topped with an imperial gold crown cap and packaged in velvet couture.',

  contactBadge: 'Personal Assistance',
  contactTitle: 'ROYALE CONCIERGE & CONTACT',
  contactSubtitle: 'Our fragrance advisors are at your service for bespoke consultations, Cash on Delivery orders, and order status updates.',
  contactHours: 'Mon - Sat: 10:00 AM - 10:00 PM PKT',
  contactDispatchNotice: 'Dispatches courier parcels nationwide directly from Karachi central reserve with inspection seals.',

  footerTagline: 'CRAFTED FOR DISTINCTION By AUHS',
  footerBlurb: 'Distilled at the apex of artistic expression. Rare oils, timeless bottle craftsmanship, and commanding sillage for connoisseurs of regal elegance.',
  footerCopyright: '© 2026 MUAVER Haute Parfumerie. All rights reserved. Crafted for Distinction by AUHS.',

  deliverySettings: DEFAULT_DELIVERY_SETTINGS,
  policies: DEFAULT_POLICIES,
};

export const DEFAULT_BANNERS: BannerSlide[] = [
  {
    id: 'banner-1',
    desktopImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop',
    badgeText: 'ROYAL ATELIER COLLECTION',
    heading: 'Crafted for Distinction',
    subheading: 'Rare botanical absolutes, regal oud, and master-crafted sillage distilled for those who command distinction.',
    buttonText: 'Discover Collection',
    buttonLink: 'shop',
    isActive: true,
    order: 1,
  },
  {
    id: 'banner-2',
    desktopImage: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=2000&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=900&auto=format&fit=crop',
    badgeText: 'HAUTE PARFUMERIE BY AUHS',
    heading: 'The Art of Eternal Sillage',
    subheading: 'Experience pure 35% Extrait de Parfum concentration crafted with legendary longevity and royal distinction.',
    buttonText: 'Acquire Flacon',
    buttonLink: 'product-mv-001',
    isActive: true,
    order: 2,
  },
  {
    id: 'banner-3',
    desktopImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=2000&auto=format&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=900&auto=format&fit=crop',
    badgeText: 'BESPOKE ARTISANAL EXTRACTION',
    heading: 'Imperial Royal Reserve',
    subheading: 'Gold-infused ambergris, aged wild Taif rose, and precious Cambodian oud. Now available with nationwide Cash on Delivery.',
    buttonText: 'Order on WhatsApp',
    buttonLink: 'whatsapp',
    isActive: true,
    order: 3,
  },
];

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', name: 'Extrait de Parfum', slug: 'extrait-de-parfum', description: 'Highest concentration royal extracts (30-35%)', order: 1 },
  { id: 'cat-2', name: 'Eau de Parfum', slug: 'eau-de-parfum', description: 'Classic refined daytime and evening sillage', order: 2 },
  { id: 'cat-3', name: 'Royal Attars & Oils', slug: 'royal-attars-oils', description: 'Pure concentrated non-alcoholic perfume essences', order: 3 },
  { id: 'cat-4', name: 'Bespoke Discovery Sets', slug: 'bespoke-discovery-sets', description: 'Curated tasting collections in velvet presentation', order: 4 },
];

// Generic, unbranded luxury perfume bottle images with zero visible brand text or logos
export const DEFAULT_PRODUCT: Product = {
  id: 'mv-001',
  name: 'SOUVERAIN D\'OR',
  edition: 'Royal Reserve • Batch N° 01',
  subtitle: 'Extrait de Parfum • 35% Sillage Concentration',
  slug: 'souverain-dor-extrait-de-parfum',
  price: 18500,
  compareAtPrice: 22000,
  salePrice: 18500,
  sku: 'MV-SOUV-01',
  stockQuantity: 45,
  status: 'active',
  variants: [
    { id: 'v1', size: '50ml', label: '50ml Royale Flacon', price: 18500, salePrice: 18500, stock: 25, inStock: true },
    { id: 'v2', size: '100ml', label: '100ml Grand Prestige Flacon', price: 29500, salePrice: 29500, stock: 20, inStock: true },
  ],
  inStock: true,
  stockStatusText: 'In Stock • Limited Royal Batch Allocated',
  category: 'Extrait de Parfum',
  shortDescription: 'An intoxicating alchemy of rare golden oud, velvet Bulgarian rose, and crystalline ambergris, bottled in master-cut crystal.',
  description: 'Crafted for Distinction by AUHS, Souverain D\'Or is an opulent tribute to regal presence. Distilled at an unprecedented 35% concentration of pure perfume essences, each drop radiates commanding warmth, sublime complexity, and an unforgettable sillage that lingers long after you leave the room.',
  notes: {
    top: ['Calabrian Bergamot', 'Royal Cardamom', 'Pink Peppercorn', 'Saffron Infusion'],
    heart: ['Taif Rose Absolue', 'Smoky Somalian Frankincense', 'Velvet Orris', 'Cashmere Wood'],
    base: ['Aged Wild Agarwood (Oud)', 'Warm Ambergris', 'Smoked Vetiver', 'Bourbon Vanilla Bean'],
  },
  olfactoryFamily: 'Woody Amber Floral Royale',
  concentration: 'Extrait de Parfum (35% High-Concentration Essence)',
  longevity: '16+ Hours Eternal Sillage',
  sillage: 'Heavy & Majestic Aura',
  images: [
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop',
  ],
  isFeatured: true,
  seoTitle: "SOUVERAIN D'OR Extrait de Parfum | MUAVER Luxury Perfumes",
  seoDescription: "An intoxicating alchemy of rare golden oud, velvet rose, and crystalline ambergris distilled by AUHS.",
};

/**
 * Fetch site settings from Firestore (or seed defaults)
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, 'settings', 'general');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const resolvedTitle = 
        data.siteTitle && data.siteTitle !== 'MUAVER | Luxury Haute Parfumerie' && data.siteTitle !== 'MUAVER'
          ? data.siteTitle
          : 'MUAVER | Luxury Brand';
      const resolvedIcon = data.iconUrl || 'https://i.ibb.co/M5Dq0xS9/Icon.png';
      const resolvedFavicon = data.faviconUrl || resolvedIcon;

      // Migrate Firestore in background if old title was stored or favicon was missing
      if (
        data.siteTitle === 'MUAVER | Luxury Haute Parfumerie' ||
        data.siteTitle === 'MUAVER' ||
        !data.siteTitle ||
        !data.faviconUrl ||
        !data.iconUrl
      ) {
        setDoc(docRef, { siteTitle: resolvedTitle, iconUrl: resolvedIcon, faviconUrl: resolvedFavicon }, { merge: true }).catch(() => {});
      }

      return {
        ...DEFAULT_SETTINGS,
        ...data,
        siteTitle: resolvedTitle,
        iconUrl: resolvedIcon,
        faviconUrl: resolvedFavicon,
        socialLinks: {
          ...DEFAULT_SETTINGS.socialLinks,
          ...(data.socialLinks || {}),
        },
        visibility: {
          ...DEFAULT_SETTINGS.visibility,
          ...(data.visibility || {}),
        },
        deliverySettings: {
          ...DEFAULT_DELIVERY_SETTINGS,
          ...(data.deliverySettings || {}),
          deliveryCharges: data.deliverySettings?.deliveryCharges ?? data.deliverySettings?.flatRateAmount ?? DEFAULT_DELIVERY_SETTINGS.deliveryCharges,
          freeDeliveryAbove: data.deliverySettings?.freeDeliveryAbove !== undefined ? data.deliverySettings.freeDeliveryAbove : (data.deliverySettings?.freeAboveAmount ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryAbove),
          handlingCharges: data.deliverySettings?.handlingCharges ?? DEFAULT_DELIVERY_SETTINGS.handlingCharges,
        },
        policies: {
          'delivery-info': { ...DEFAULT_POLICIES['delivery-info'], ...(data.policies?.['delivery-info'] || {}) },
          'returns': { ...DEFAULT_POLICIES['returns'], ...(data.policies?.['returns'] || {}) },
          'refund-policy': { ...DEFAULT_POLICIES['refund-policy'], ...(data.policies?.['refund-policy'] || {}) },
          'privacy-policy': { ...DEFAULT_POLICIES['privacy-policy'], ...(data.policies?.['privacy-policy'] || {}) },
          'terms': { ...DEFAULT_POLICIES['terms'], ...(data.policies?.['terms'] || {}) },
          'cod-policy': { ...DEFAULT_POLICIES['cod-policy'], ...(data.policies?.['cod-policy'] || {}) },
        },
        whyFeatures: data.whyFeatures && Array.isArray(data.whyFeatures) && data.whyFeatures.length > 0 
          ? data.whyFeatures 
          : DEFAULT_WHY_FEATURES,
        testimonials: data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 0 
          ? data.testimonials 
          : DEFAULT_TESTIMONIALS,
      } as SiteSettings;
    } else {
      await setDoc(docRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.warn('Using default settings due to Firestore read/seed fallback:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update site settings
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'general');
  const payload = {
    ...settings,
    faviconUrl: settings.faviconUrl || settings.iconUrl || 'https://i.ibb.co/M5Dq0xS9/Icon.png',
  };
  await setDoc(docRef, payload, { merge: true });
}

/**
 * One-time initialization helper: Seeds defaults ONLY if store settings document does not exist yet.
 * Never reseeds deleted products or banners after initial setup.
 */
export async function initializeStoreDefaultsIfNeeded(): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'general');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, DEFAULT_SETTINGS);

      // Seed initial product if collection is empty
      const prodSnap = await getDocs(collection(db, 'products'));
      if (prodSnap.empty) {
        await setDoc(doc(db, 'products', DEFAULT_PRODUCT.id), removeUndefined(DEFAULT_PRODUCT));
      }

      // Seed initial banners if collection is empty
      const bannerSnap = await getDocs(collection(db, 'banners'));
      if (bannerSnap.empty) {
        for (const banner of DEFAULT_BANNERS) {
          await setDoc(doc(db, 'banners', banner.id), removeUndefined(banner));
        }
      }

      // Seed initial categories if collection is empty
      const catSnap = await getDocs(collection(db, 'categories'));
      if (catSnap.empty) {
        for (const cat of DEFAULT_CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.id), removeUndefined(cat));
        }
      }
    }
  } catch (err) {
    console.warn('Initial store bootstrap notice:', err);
  }
}

/**
 * Real-time subscription to Site Settings
 */
export function subscribeSiteSettings(
  onUpdate: (settings: SiteSettings) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, 'settings', 'general');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const resolvedTitle = 
          data.siteTitle && data.siteTitle !== 'MUAVER | Luxury Haute Parfumerie' && data.siteTitle !== 'MUAVER'
            ? data.siteTitle
            : 'MUAVER | Luxury Brand';
        const resolvedIcon = data.iconUrl || 'https://i.ibb.co/M5Dq0xS9/Icon.png';
        const resolvedFavicon = data.faviconUrl || resolvedIcon;

        onUpdate({
          ...DEFAULT_SETTINGS,
          ...data,
          siteTitle: resolvedTitle,
          iconUrl: resolvedIcon,
          faviconUrl: resolvedFavicon,
          socialLinks: {
            ...DEFAULT_SETTINGS.socialLinks,
            ...(data.socialLinks || {}),
          },
          visibility: {
            ...DEFAULT_SETTINGS.visibility,
            ...(data.visibility || {}),
          },
          deliverySettings: {
            ...DEFAULT_DELIVERY_SETTINGS,
            ...(data.deliverySettings || {}),
            deliveryCharges: data.deliverySettings?.deliveryCharges ?? data.deliverySettings?.flatRateAmount ?? DEFAULT_DELIVERY_SETTINGS.deliveryCharges,
            freeDeliveryAbove: data.deliverySettings?.freeDeliveryAbove !== undefined ? data.deliverySettings.freeDeliveryAbove : (data.deliverySettings?.freeAboveAmount ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryAbove),
            handlingCharges: data.deliverySettings?.handlingCharges ?? DEFAULT_DELIVERY_SETTINGS.handlingCharges,
          },
          policies: {
            'delivery-info': { ...DEFAULT_POLICIES['delivery-info'], ...(data.policies?.['delivery-info'] || {}) },
            'returns': { ...DEFAULT_POLICIES['returns'], ...(data.policies?.['returns'] || {}) },
            'refund-policy': { ...DEFAULT_POLICIES['refund-policy'], ...(data.policies?.['refund-policy'] || {}) },
            'privacy-policy': { ...DEFAULT_POLICIES['privacy-policy'], ...(data.policies?.['privacy-policy'] || {}) },
            'terms': { ...DEFAULT_POLICIES['terms'], ...(data.policies?.['terms'] || {}) },
            'cod-policy': { ...DEFAULT_POLICIES['cod-policy'], ...(data.policies?.['cod-policy'] || {}) },
          },
          whyFeatures: data.whyFeatures && Array.isArray(data.whyFeatures) && data.whyFeatures.length > 0 
            ? data.whyFeatures 
            : DEFAULT_WHY_FEATURES,
          testimonials: data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 0 
            ? data.testimonials 
            : DEFAULT_TESTIMONIALS,
        } as SiteSettings);
      } else {
        // If not found, trigger one-time initialization
        initializeStoreDefaultsIfNeeded();
      }
    },
    (err) => {
      console.error('Settings live listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to Hero Banners
 */
export function subscribeBanners(
  onUpdate: (banners: BannerSlide[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'banners');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const banners: BannerSlide[] = [];
      snapshot.forEach((d) => {
        banners.push({ id: d.id, ...d.data() } as BannerSlide);
      });
      banners.sort((a, b) => (a.order || 0) - (b.order || 0));
      onUpdate(banners);
    },
    (err) => {
      console.error('Banners live listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch hero banners from Firestore (one-time fetch)
 */
export async function getBanners(): Promise<BannerSlide[]> {
  try {
    const colRef = collection(db, 'banners');
    const snap = await getDocs(colRef);
    const banners: BannerSlide[] = [];
    snap.forEach((d) => {
      banners.push({ id: d.id, ...d.data() } as BannerSlide);
    });
    return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Error fetching banners:', error);
    return [];
  }
}

/**
 * Save or update a banner slide
 */
export async function saveBannerSlide(banner: BannerSlide): Promise<void> {
  if (!banner.heading || !banner.heading.trim()) {
    throw new Error('Banner heading is required.');
  }
  if (!banner.desktopImage || !banner.desktopImage.trim()) {
    throw new Error('Banner desktop image is required.');
  }

  const docId = banner.id && banner.id.trim() ? banner.id.trim() : `banner-${Date.now()}`;
  const docRef = doc(db, 'banners', docId);
  const data = removeUndefined({
    ...banner,
    id: docId,
    order: typeof banner.order === 'number' ? banner.order : 1,
    isActive: banner.isActive !== false,
    updatedAt: serverTimestamp(),
  });
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete a banner slide and purge its images from Firebase Storage
 */
export async function deleteBannerSlide(bannerId: string): Promise<void> {
  if (!bannerId) throw new Error('Banner ID is required for deletion.');
  const docRef = doc(db, 'banners', bannerId);

  // 1. Purge images from Firebase Storage
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BannerSlide;
      const urls = [data.desktopImage, data.mobileImage].filter(Boolean) as string[];
      if (urls.length > 0) {
        await deleteStorageImages(urls);
      }
    }
  } catch (err) {
    console.warn('Storage image cleanup notice on banner delete:', err);
  }

  // 2. Permanently delete document from Firestore
  await deleteDoc(docRef);
}

/**
 * Reorder banners batch update
 */
export async function updateBannersOrder(banners: BannerSlide[]): Promise<void> {
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    const docRef = doc(db, 'banners', b.id);
    await updateDoc(docRef, { order: i + 1 });
  }
}

/**
 * Categories management
 */
export async function getCategories(): Promise<ProductCategory[]> {
  try {
    const colRef = collection(db, 'categories');
    const snap = await getDocs(colRef);
    const cats: ProductCategory[] = [];
    snap.forEach((d) => {
      cats.push({ id: d.id, ...d.data() } as ProductCategory);
    });
    return cats.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Using default categories fallback:', error);
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategory(category: ProductCategory): Promise<void> {
  const docId = category.id || `cat-${Date.now()}`;
  const docRef = doc(db, 'categories', docId);
  await setDoc(docRef, removeUndefined({ ...category, id: docId }), { merge: true });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  if (!categoryId) throw new Error('Category ID is required for deletion.');
  const docRef = doc(db, 'categories', categoryId);
  await deleteDoc(docRef);
}

/**
 * Real-time subscription to Products catalog
 */
export function subscribeProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((d) => {
        products.push({ id: d.id, ...d.data() } as Product);
      });
      onUpdate(products);
    },
    (err) => {
      console.error('Products live listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch products from Firestore (one-time fetch)
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    const products: Product[] = [];
    snap.forEach((d) => {
      products.push({ id: d.id, ...d.data() } as Product);
    });
    return products;
  } catch (error) {
    console.warn('Error fetching products:', error);
    return [];
  }
}

/**
 * Save or update a product
 */
export async function saveProduct(product: Product): Promise<void> {
  if (!product.name || !product.name.trim()) {
    throw new Error('Product name is required.');
  }
  if (!product.images || product.images.length === 0) {
    throw new Error('At least one product image is required.');
  }

  const docId = product.id && product.id.trim() ? product.id.trim() : `mv-${Date.now()}`;
  const docRef = doc(db, 'products', docId);
  const data = removeUndefined({
    ...product,
    id: docId,
    status: product.status || 'active',
    updatedAt: serverTimestamp(),
  });
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete a product and purge its images from Firebase Storage
 */
export async function deleteProduct(productId: string): Promise<void> {
  if (!productId) throw new Error('Product ID is required for deletion.');
  const docRef = doc(db, 'products', productId);

  // 1. Purge images from Firebase Storage
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Product;
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        await deleteStorageImages(data.images);
      }
    }
  } catch (err) {
    console.warn('Storage image cleanup notice on product delete:', err);
  }

  // 2. Permanently delete document from Firestore
  await deleteDoc(docRef);
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
    return DEFAULT_PRODUCT.id === id ? DEFAULT_PRODUCT : null;
  } catch (err) {
    console.warn('Error fetching product by ID:', err);
    return DEFAULT_PRODUCT;
  }
}

/**
 * Real-time subscription to Orders
 */
export function subscribeOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        orders.push({ id: d.id, ...d.data() } as Order);
      });
      orders.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0)).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0)).getTime();
        return timeB - timeA;
      });
      onUpdate(orders);
    },
    (err) => {
      console.error('Orders live listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch all orders from Firestore sorted by date
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    const orders: Order[] = [];
    snap.forEach((d) => {
      orders.push({ id: d.id, ...d.data() } as Order);
    });
    // Sort descending by date (newest first)
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0)).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0)).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('Error fetching orders:', error);
    return [];
  }
}

/**
 * Place an order in Firestore with:
 * 1. Snapshot of product name, price, size, and image at purchase time
 * 2. Automatic stock deduction for each product variant and overall inventory
 */
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
): Promise<{ orderId: string; orderNumber: string }> {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `MV-${randomSuffix}`;

  // 1. Snapshot items ensuring purchase-time price, name, and image are frozen
  const snapshottedItems = orderPayload.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    size: item.size,
    price: Number(item.price),
    quantity: Number(item.quantity),
  }));

  const newOrder: Omit<Order, 'id'> = {
    ...orderPayload,
    items: snapshottedItems,
    orderNumber,
    status: 'Pending',
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, 'orders');
  const docRef = await addDoc(colRef, newOrder);

  // 2. Automatically reduce stock in products
  try {
    for (const item of snapshottedItems) {
      if (!item.productId) continue;
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const prodData = productSnap.data() as Product;
        const updatedVariants = (prodData.variants || []).map((v) => {
          if (v.size === item.size) {
            const currentStock = v.stock !== undefined ? v.stock : 20;
            const newStock = Math.max(0, currentStock - item.quantity);
            return {
              ...v,
              stock: newStock,
              inStock: newStock > 0,
            };
          }
          return v;
        });

        const currentTotalStock = prodData.stockQuantity !== undefined ? prodData.stockQuantity : 40;
        const newTotalStock = Math.max(0, currentTotalStock - item.quantity);
        const hasAnyStock = updatedVariants.some((v) => v.inStock) || newTotalStock > 0;

        await updateDoc(productRef, {
          variants: updatedVariants,
          stockQuantity: newTotalStock,
          inStock: hasAnyStock,
          stockStatusText: hasAnyStock
            ? 'In Stock • Limited Royal Batch Allocated'
            : 'Currently Out of Stock • Joining Waiting List',
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (stockError) {
    console.warn('Stock decrement note during order creation:', stockError);
  }

  return {
    orderId: docRef.id,
    orderNumber,
  };
}

/**
 * Update order status and handle inventory restoration on cancellation
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status'],
  adminNotes?: string
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;

  const currentOrder = orderSnap.data() as Order;
  const previousStatus = currentOrder.status;

  const updateData: any = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  await updateDoc(orderRef, updateData);

  // If order was transitioned TO 'Cancelled' from an active status, restore stock!
  if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
    try {
      for (const item of currentOrder.items || []) {
        if (!item.productId) continue;
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const prodData = productSnap.data() as Product;
          const updatedVariants = (prodData.variants || []).map((v) => {
            if (v.size === item.size) {
              const currentStock = v.stock !== undefined ? v.stock : 0;
              const newStock = currentStock + (item.quantity || 1);
              return {
                ...v,
                stock: newStock,
                inStock: true,
              };
            }
            return v;
          });

          const currentTotalStock = prodData.stockQuantity !== undefined ? prodData.stockQuantity : 0;
          const newTotalStock = currentTotalStock + (item.quantity || 1);

          await updateDoc(productRef, {
            variants: updatedVariants,
            stockQuantity: newTotalStock,
            inStock: true,
            stockStatusText: 'In Stock • Limited Royal Batch Allocated',
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (restoreError) {
      console.warn('Stock restore note on order cancellation:', restoreError);
    }
  } else if (previousStatus === 'Cancelled' && newStatus !== 'Cancelled') {
    // If order was uncancelled, deduct stock again
    try {
      for (const item of currentOrder.items || []) {
        if (!item.productId) continue;
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const prodData = productSnap.data() as Product;
          const updatedVariants = (prodData.variants || []).map((v) => {
            if (v.size === item.size) {
              const currentStock = v.stock !== undefined ? v.stock : 0;
              const newStock = Math.max(0, currentStock - (item.quantity || 1));
              return {
                ...v,
                stock: newStock,
                inStock: newStock > 0,
              };
            }
            return v;
          });

          const currentTotalStock = prodData.stockQuantity !== undefined ? prodData.stockQuantity : 0;
          const newTotalStock = Math.max(0, currentTotalStock - (item.quantity || 1));

          await updateDoc(productRef, {
            variants: updatedVariants,
            stockQuantity: newTotalStock,
            inStock: newTotalStock > 0,
            stockStatusText: newTotalStock > 0
              ? 'In Stock • Limited Royal Batch Allocated'
              : 'Currently Out of Stock • Joining Waiting List',
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (deductError) {
      console.warn('Stock deduction note on reinstating order:', deductError);
    }
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string): Promise<void> {
  if (!orderId) throw new Error('Order ID is required for deletion.');
  const docRef = doc(db, 'orders', orderId);
  await deleteDoc(docRef);
}

/**
 * Submit contact inquiry to Firestore
 */
export async function submitContactInquiry(inquiry: {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const colRef = collection(db, 'inquiries');
  return await addDoc(colRef, {
    ...inquiry,
    createdAt: serverTimestamp(),
  });
}

/**
 * Build prefilled WhatsApp ordering link
 */
export function buildWhatsAppOrderUrl(
  productName: string,
  size: string,
  quantity: number,
  price: number,
  productUrl?: string,
  rawPhone: string = '923242404984'
): string {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const totalPrice = price * quantity;
  const currentUrl = productUrl || (typeof window !== 'undefined' ? window.location.href : 'https://muaver.com');

  const message = [
    `Assalam-o-Alaikum MUAVER Royale Concierge,`,
    `I would like to place an order for:`,
    `• Product: ${productName}`,
    `• Variant: ${size}`,
    `• Quantity: ${quantity}`,
    `• Price: Rs. ${totalPrice.toLocaleString()}`,
    `• Link: ${currentUrl}`,
    ``,
    `Please confirm availability and dispatch details for Cash on Delivery. Thank you!`
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Build general concierge WhatsApp link
 */
export function buildGeneralWhatsAppUrl(rawPhone: string = '923242404984'): string {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const message = `Assalam-o-Alaikum MUAVER Luxury Concierge,\nI would like to inquire about your bespoke fragrances and orders.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface OrderChargesCalculation {
  subtotal: number;
  deliveryCharges: number;
  handlingCharges: number;
  isFreeDelivery: boolean;
  totalAmount: number;
}

/**
 * Calculate live order charges based on admin settings:
 * - Subtotal
 * - Product Handling Charges (applied per order in addition to delivery)
 * - Delivery Charges (replaced by 0 if Free Delivery Above Amount is met)
 * - Total = Subtotal + Handling Charges + Delivery Charges
 */
export function calculateOrderCharges(
  subtotal: number,
  deliverySettings?: DeliverySettings
): OrderChargesCalculation {
  const ds = deliverySettings || DEFAULT_DELIVERY_SETTINGS;

  const handlingCharges = Number(ds.handlingCharges ?? 0);
  const baseDelivery = Number(ds.deliveryCharges ?? ds.flatRateAmount ?? 250);

  const freeThreshold = ds.freeDeliveryAbove !== undefined && ds.freeDeliveryAbove !== null
    ? Number(ds.freeDeliveryAbove)
    : (ds.freeAboveAmount ? Number(ds.freeAboveAmount) : null);

  let deliveryCharges = baseDelivery;
  let isFreeDelivery = false;

  if (ds.isEnabled === false || ds.shippingType === 'free') {
    deliveryCharges = 0;
    isFreeDelivery = true;
  } else if (freeThreshold !== null && freeThreshold > 0 && subtotal >= freeThreshold) {
    deliveryCharges = 0;
    isFreeDelivery = true;
  }

  const totalAmount = subtotal + handlingCharges + deliveryCharges;

  return {
    subtotal,
    deliveryCharges,
    handlingCharges,
    isFreeDelivery,
    totalAmount,
  };
}

export function calculateShippingFee(
  subtotal: number,
  deliverySettings?: DeliverySettings
): number {
  return calculateOrderCharges(subtotal, deliverySettings).deliveryCharges;
}

/**
 * =========================================================================
 * ADMIN ACCESS & HANDOVER MANAGEMENT (Strictly Firestore collection "admins")
 * =========================================================================
 */

/**
 * Real-time subscription to Admins collection
 */
export function subscribeAdmins(
  onUpdate: (admins: AdminUser[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'admins');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AdminUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          email: data.email || d.id,
          role: data.role || 'admin',
          displayName: data.displayName || data.email || d.id,
          createdAt: data.createdAt,
          addedBy: data.addedBy,
        });
      });
      list.sort((a, b) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (a.role !== 'owner' && b.role === 'owner') return 1;
        return a.email.localeCompare(b.email);
      });
      onUpdate(list);
    },
    (err) => {
      console.error('Admins live listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch all registered admins from the 'admins' collection
 */
export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, 'admins');
    const snap = await getDocs(colRef);
    const list: AdminUser[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        email: data.email || d.id,
        role: data.role || 'admin',
        displayName: data.displayName || data.email || d.id,
        createdAt: data.createdAt,
        addedBy: data.addedBy,
      });
    });
    // Sort owners first, then alphabetical by email
    return list.sort((a, b) => {
      if (a.role === 'owner' && b.role !== 'owner') return -1;
      if (a.role !== 'owner' && b.role === 'owner') return 1;
      return a.email.localeCompare(b.email);
    });
  } catch (error) {
    console.error('Error fetching admins collection:', error);
    throw error;
  }
}

/**
 * Fetch a specific admin user document by email
 */
export async function getAdminUser(email: string): Promise<AdminUser | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const docRef = doc(db, 'admins', cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        email: data.email || snap.id,
        role: data.role || 'admin',
        displayName: data.displayName || cleanEmail,
        createdAt: data.createdAt,
        addedBy: data.addedBy,
      };
    }
    return null;
  } catch (error) {
    console.warn(`Error getting admin user for ${cleanEmail}:`, error);
    return null;
  }
}

/**
 * Verify user admin access or bootstrap the first "owner" on fresh setup.
 * Rule: The first login on a fresh setup creates the first "owner".
 * Subsequent logins require document in "admins" collection.
 */
export async function verifyOrBootstrapAdmin(user: {
  email: string;
  displayName?: string | null;
}): Promise<{ isAuthorized: boolean; admin: AdminUser | null; isFirstOwnerCreated: boolean; errorReason?: string }> {
  if (!user || !user.email) {
    return { isAuthorized: false, admin: null, isFirstOwnerCreated: false, errorReason: 'No authenticated email provided.' };
  }

  const cleanEmail = user.email.trim().toLowerCase();

  try {
    // 1. Check if the user already has an admin record
    const existingAdmin = await getAdminUser(cleanEmail);
    if (existingAdmin) {
      // If an existing admin logged in, ensure hellomuaver@gmail.com is also provisioned if not already
      if (cleanEmail !== 'hellomuaver@gmail.com') {
        const helloRef = doc(db, 'admins', 'hellomuaver@gmail.com');
        const helloSnap = await getDoc(helloRef);
        if (!helloSnap.exists()) {
          await setDoc(helloRef, {
            id: 'hellomuaver@gmail.com',
            email: 'hellomuaver@gmail.com',
            role: 'admin',
            displayName: 'MUAVER Admin',
            createdAt: serverTimestamp(),
            addedBy: cleanEmail,
          }, { merge: true }).catch(() => {});
        }
      }
      return { isAuthorized: true, admin: existingAdmin, isFirstOwnerCreated: false };
    }

    // 2. Check if the admins collection is empty (fresh setup bootstrap)
    const adminsColRef = collection(db, 'admins');
    const existingAdminsSnap = await getDocs(adminsColRef);

    if (existingAdminsSnap.empty) {
      // First login on fresh setup! Create first Owner document.
      const newOwner: AdminUser = {
        id: cleanEmail,
        email: cleanEmail,
        role: 'owner',
        displayName: user.displayName || cleanEmail,
        createdAt: serverTimestamp(),
        addedBy: 'Initial Setup Bootstrap',
      };

      const adminDocRef = doc(db, 'admins', cleanEmail);
      await setDoc(adminDocRef, newOwner);

      // Pre-seed hellomuaver@gmail.com as second admin
      if (cleanEmail !== 'hellomuaver@gmail.com') {
        const helloRef = doc(db, 'admins', 'hellomuaver@gmail.com');
        await setDoc(helloRef, {
          id: 'hellomuaver@gmail.com',
          email: 'hellomuaver@gmail.com',
          role: 'admin',
          displayName: 'MUAVER Admin',
          createdAt: serverTimestamp(),
          addedBy: cleanEmail,
        }, { merge: true }).catch(() => {});
      }

      // Record setup initialization in settings/security to lock bootstrapping
      try {
        const securityDocRef = doc(db, 'settings', 'security');
        await setDoc(securityDocRef, {
          initialOwner: cleanEmail,
          initializedAt: serverTimestamp(),
        }, { merge: true });
      } catch (secErr) {
        console.warn('Security metadata flag write notice:', secErr);
      }

      return {
        isAuthorized: true,
        admin: newOwner,
        isFirstOwnerCreated: true,
      };
    }

    // 3. Auto-authorize designated executive accounts
    if (cleanEmail === 'hellomuaver@gmail.com' || cleanEmail === 'zevnora.agency@gmail.com') {
      const designatedRole = cleanEmail === 'hellomuaver@gmail.com' ? 'admin' : 'owner';
      const designatedAdmin: AdminUser = {
        id: cleanEmail,
        email: cleanEmail,
        role: designatedRole,
        displayName: user.displayName || cleanEmail.split('@')[0],
        createdAt: serverTimestamp(),
        addedBy: 'Designated Executive Access',
      };

      const adminDocRef = doc(db, 'admins', cleanEmail);
      await setDoc(adminDocRef, designatedAdmin, { merge: true });

      return {
        isAuthorized: true,
        admin: designatedAdmin,
        isFirstOwnerCreated: false,
      };
    }

    // 3. Collection is not empty and user is not in admins collection -> Reject entry
    return {
      isAuthorized: false,
      admin: null,
      isFirstOwnerCreated: false,
      errorReason: `Access Denied: The account "${cleanEmail}" is not listed in the authorized administrators registry. Only designated Owner and Admin accounts may access the executive console.`,
    };
  } catch (error: any) {
    console.error('Error verifying admin authorization:', error);
    return {
      isAuthorized: false,
      admin: null,
      isFirstOwnerCreated: false,
      errorReason: error.message || 'Authorization check failed.',
    };
  }
}

/**
 * Add a new administrator or owner (Owner privilege)
 */
export async function addAdminUser(
  email: string,
  role: AdminRole,
  addedBy: string,
  displayName?: string
): Promise<AdminUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const docRef = doc(db, 'admins', cleanEmail);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error(`Administrator with email "${cleanEmail}" already exists.`);
  }

  const newAdmin: AdminUser = {
    id: cleanEmail,
    email: cleanEmail,
    role,
    displayName: displayName?.trim() || cleanEmail.split('@')[0],
    createdAt: serverTimestamp(),
    addedBy: addedBy.toLowerCase().trim(),
  };

  await setDoc(docRef, newAdmin);
  return newAdmin;
}

/**
 * Update an admin's role (Owner privilege)
 * Prevents demoting the last owner!
 */
export async function updateAdminRole(
  email: string,
  newRole: AdminRole,
  requesterEmail: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const docRef = doc(db, 'admins', cleanEmail);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Administrator record not found.');
  }

  const currentData = snap.data() as AdminUser;

  // If demoting from owner to admin, check if there are other owners
  if (currentData.role === 'owner' && newRole === 'admin') {
    const allAdmins = await getAdmins();
    const ownerCount = allAdmins.filter((a) => a.role === 'owner').length;
    if (ownerCount <= 1) {
      throw new Error('Operation Blocked: You cannot demote the last remaining Owner. At least one Owner must exist to manage executive access.');
    }
  }

  await updateDoc(docRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
    updatedBy: requesterEmail.toLowerCase().trim(),
  });
}

/**
 * Remove an administrator from the admins collection (Owner privilege)
 * Prevents removing the last owner!
 */
export async function removeAdminUser(
  email: string,
  requesterEmail: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const docRef = doc(db, 'admins', cleanEmail);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Administrator record not found.');
  }

  const targetAdmin = snap.data() as AdminUser;

  // If target is an owner, verify there is at least one other owner
  if (targetAdmin.role === 'owner') {
    const allAdmins = await getAdmins();
    const ownerCount = allAdmins.filter((a) => a.role === 'owner').length;
    if (ownerCount <= 1) {
      throw new Error('Operation Blocked: You cannot remove the last remaining Owner. The system requires at least one active Owner to maintain console control.');
    }
  }

  await deleteDoc(docRef);
}

