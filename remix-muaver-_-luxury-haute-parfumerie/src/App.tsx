/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { HeroSkeleton, ProductCardSkeleton } from './components/LuxurySkeleton';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

// Helper to auto-retry dynamic route import once on transient network or module-fetch blips
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((err) => {
      console.warn('Dynamic route chunk fetch notice, attempting retry...', err);
      return new Promise<{ default: T }>((resolve, reject) => {
        setTimeout(() => {
          factory().then(resolve).catch(reject);
        }, 500);
      });
    })
  );
}

// Code-split routes: admin panel & secondary pages
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ShopPage = lazyWithRetry(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductPage = lazyWithRetry(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PolicyPage = lazyWithRetry(() => import('./pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));

import { 
  getSiteSettings, 
  getProducts, 
  getBanners,
  subscribeSiteSettings,
  subscribeProducts,
  subscribeBanners,
  initializeStoreDefaultsIfNeeded,
  DEFAULT_SETTINGS, 
  DEFAULT_PRODUCT,
  DEFAULT_BANNERS
} from './services/storeService';
import { SiteSettings, Product, CartItem, BannerSlide, PolicySlug } from './types/store';

// Helper to determine active route from URL path, hash, or query parameter
function resolveRouteFromUrl(): string {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');

  if (path === '/adminauhs' || hash === 'adminauhs') return 'adminAUHS';
  if (path === '/delivery-info' || hash === 'delivery-info') return 'delivery-info';
  if (path === '/returns' || hash === 'returns') return 'returns';
  if (path === '/refund-policy' || hash === 'refund-policy') return 'refund-policy';
  if (path === '/privacy-policy' || hash === 'privacy-policy') return 'privacy-policy';
  if (path === '/terms' || hash === 'terms') return 'terms';
  if (path === '/cod-policy' || hash === 'cod-policy') return 'cod-policy';
  if (path === '/shop' || hash === 'shop') return 'shop';
  if (path === '/about' || hash === 'about') return 'about';
  if (path === '/contact' || hash === 'contact') return 'contact';

  const queryParam = new URLSearchParams(window.location.search).get('page');
  if (queryParam) return queryParam;

  return 'home';
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>(DEFAULT_BANNERS);
  const [loading, setLoading] = useState(true);

  // Navigation state (initial check for URL route including /adminAUHS and policy pages)
  const [activePage, setActivePage] = useState<string>(() => resolveRouteFromUrl());
  const [activeProductId, setActiveProductId] = useState<string>('');

  // Cart & Checkout state with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('muaver_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Listen to browser forward/back buttons & URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setActivePage(resolveRouteFromUrl());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('muaver_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to storage:', e);
    }
  }, [cartItems]);

  // Dynamically synchronize browser tab title and favicon with Firestore site settings
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Browser Tab Title
    const baseTitle = settings.siteTitle || 'MUAVER | Luxury Brand';
    let fullTitle = baseTitle;
    if (activePage === 'shop') {
      fullTitle = `The Collection | ${baseTitle}`;
    } else if (activePage === 'about') {
      fullTitle = `The Maison Chronicle | ${baseTitle}`;
    } else if (activePage === 'contact') {
      fullTitle = `Royale Concierge | ${baseTitle}`;
    } else if (activePage === 'adminAUHS') {
      fullTitle = `Admin Reserve | ${baseTitle}`;
    } else if (activePage === 'product') {
      const activeProd = products.find((p) => p.id === activeProductId);
      fullTitle = activeProd ? `${activeProd.name} | ${baseTitle}` : fullTitle;
    } else if (['delivery-info', 'returns', 'refund-policy', 'privacy-policy', 'terms', 'cod-policy'].includes(activePage)) {
      const policyTitle = settings.policies?.[activePage as PolicySlug]?.title || 'Store Policy';
      fullTitle = `${policyTitle} | ${baseTitle}`;
    }
    document.title = fullTitle;

    // 2. Favicon Link Tags Synchronization
    const faviconUrl = settings.faviconUrl || settings.iconUrl || 'https://i.ibb.co/M5Dq0xS9/Icon.png';
    const updateFavicon = (selector: string, rel: string, sizes?: string) => {
      let link = document.querySelector<HTMLLinkElement>(selector);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (sizes) link.setAttribute('sizes', sizes);
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    };

    updateFavicon("link[rel='icon'][sizes='32x32']", 'icon', '32x32');
    updateFavicon("link[rel='icon'][sizes='16x16']", 'icon', '16x16');
    updateFavicon("link[rel='icon']:not([sizes])", 'icon');
    updateFavicon("link[rel='shortcut icon']", 'shortcut icon');
    updateFavicon("link[rel='apple-touch-icon'][sizes='180x180']", 'apple-touch-icon', '180x180');
    updateFavicon("link[rel='apple-touch-icon']:not([sizes])", 'apple-touch-icon');
  }, [settings.siteTitle, settings.iconUrl, settings.faviconUrl, activePage, activeProductId, products, settings.policies]);

  const refreshStoreData = async () => {
    try {
      const [loadedSettings, loadedProducts, loadedBanners] = await Promise.all([
        getSiteSettings(),
        getProducts(),
        getBanners(),
      ]);
      setSettings(loadedSettings);
      setProducts(loadedProducts);
      setBanners(loadedBanners);
    } catch (err) {
      console.error('Error refreshing store data:', err);
    }
  };

  // Real-time live Firestore listeners for settings, products & banners
  useEffect(() => {
    let isMounted = true;

    // Check store initial bootstrap on startup
    initializeStoreDefaultsIfNeeded();

    // 1. Live subscription to site settings
    const unsubSettings = subscribeSiteSettings(
      (liveSettings) => {
        if (isMounted) {
          setSettings(liveSettings);
        }
      },
      (err) => {
        console.warn('Settings live listener note:', err);
      }
    );

    // 2. Live subscription to products catalog
    const unsubProducts = subscribeProducts(
      (liveProducts) => {
        if (isMounted) {
          setProducts(liveProducts);
          // If active product was deleted, switch to next available flacon or clear
          setActiveProductId((currentId) => {
            if (liveProducts.some((p) => p.id === currentId)) {
              return currentId;
            }
            return liveProducts.length > 0 ? liveProducts[0].id : '';
          });
          setLoading(false);
        }
      },
      (err) => {
        console.warn('Products live listener note:', err);
        if (isMounted) setLoading(false);
      }
    );

    // 3. Live subscription to hero banners
    const unsubBanners = subscribeBanners(
      (liveBanners) => {
        if (isMounted) {
          setBanners(liveBanners);
        }
      },
      (err) => {
        console.warn('Banners live listener note:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubSettings();
      unsubProducts();
      unsubBanners();
    };
  }, []);

  // Navigation handler with browser URL synchronization
  const handleNavigate = (page: string, productId?: string) => {
    setActivePage(page);
    if (productId) {
      setActiveProductId(productId);
    }
    if (typeof window !== 'undefined' && window.history) {
      if (page === 'home') {
        window.history.pushState(null, '', '/');
      } else if (page === 'adminAUHS') {
        window.history.pushState(null, '', '/adminAUHS');
      } else if ([
        'delivery-info',
        'returns',
        'refund-policy',
        'privacy-policy',
        'terms',
        'cod-policy',
        'shop',
        'about',
        'contact'
      ].includes(page)) {
        window.history.pushState(null, '', `/${page}`);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit Admin back to public storefront
  const handleExitAdmin = () => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', '/');
    }
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to cart
  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.size === size
      );

      const variant = product.variants?.find((v) => v.size === size);
      const price = variant?.salePrice || variant?.price || product.price;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            productImage: product.images[0] || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop',
            size: size,
            price: price,
            quantity: quantity,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, size: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string, size: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.size === size))
    );
  };

  // Open checkout from cart drawer
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Handle successful order completion
  const handleOrderSuccess = (_orderNumber: string) => {
    setCartItems([]);
    try {
      localStorage.removeItem('muaver_cart');
    } catch {}
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Dynamically synchronize browser favicon with settings.iconUrl
  useEffect(() => {
    if (settings.iconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.iconUrl;
    }
  }, [settings.iconUrl]);

  // Resolve featured product dynamically from live Firestore products
  const featuredProduct: Product | null = 
    (settings.featuredProductId && products.find((p) => p.id === settings.featuredProductId)) ||
    products.find((p) => p.isFeatured) ||
    (products.length > 0 ? products[0] : null);

  // Resolve current active product for product detail page
  const currentProduct: Product | null =
    (activeProductId && products.find((p) => p.id === activeProductId)) ||
    featuredProduct ||
    (products.length > 0 ? products[0] : null);

  // Instant Non-blocking Skeleton State during first-time cold boot
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--navy-900)] text-[var(--ivory)] flex flex-col font-montserrat">
        <Header
          settings={DEFAULT_SETTINGS}
          activePage="home"
          onNavigate={() => {}}
          cartCount={0}
          onOpenCart={() => {}}
        />
        <main className="flex-1">
          <HeroSkeleton />
        </main>
        <Footer settings={DEFAULT_SETTINGS} onNavigate={() => {}} />
      </div>
    );
  }

  // Admin Route (/adminAUHS) - strictly code-split & isolated; customers NEVER download this chunk
  if (activePage === 'adminAUHS') {
    return (
      <Suspense fallback={<HeroSkeleton />}>
        <AdminPage
          settings={settings}
          products={products}
          banners={banners}
          onExitAdmin={handleExitAdmin}
          onRefreshData={refreshStoreData}
        />
      </Suspense>
    );
  }

  // Public Storefront
  return (
    <div className="min-h-screen bg-[var(--navy-900)] text-[var(--ivory)] flex flex-col font-montserrat selection:bg-[var(--gold-500)]/30 selection:text-[var(--gold-300)]">
      
      {/* Header */}
      <Header
        settings={settings}
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Page Routing with Suspense Boundaries */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            settings={settings}
            featuredProduct={featuredProduct}
            banners={banners}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        )}

        <Suspense fallback={<div className="max-w-7xl mx-auto px-5 py-12"><HeroSkeleton /></div>}>
          {activePage === 'shop' && (
            <ShopPage
              products={products}
              settings={settings}
              onNavigate={handleNavigate}
              onAddToCart={handleAddToCart}
            />
          )}

          {activePage === 'product' && (
            currentProduct ? (
              <ProductPage
                product={currentProduct}
                settings={settings}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigate}
              />
            ) : (
              <div className="max-w-4xl mx-auto px-5 py-24 text-center space-y-4 font-montserrat">
                <h2 className="font-heading text-2xl text-white font-bold">Flacon Edition Archived</h2>
                <p className="text-xs text-white/60 max-w-md mx-auto">This creation is currently not available in the royal reserve.</p>
                <div className="pt-2">
                  <button onClick={() => handleNavigate('shop')} className="btn-gold px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider">
                    Explore Available Flacons
                  </button>
                </div>
              </div>
            )
          )}

          {activePage === 'about' && (
            <AboutPage
              settings={settings}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'contact' && (
            <ContactPage
              settings={settings}
            />
          )}

          {/* Public Policy Pages */}
          {['delivery-info', 'returns', 'refund-policy', 'privacy-policy', 'terms', 'cod-policy'].includes(activePage) && (
            <PolicyPage
              slug={activePage as PolicySlug}
              settings={settings}
              onNavigate={handleNavigate}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onNavigate={handleNavigate}
      />

      {/* Interactive Overlays */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={handleProceedToCheckout}
          settings={settings}
          onNavigateToShop={() => handleNavigate('shop')}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cartItems}
          onOrderSuccess={handleOrderSuccess}
          settings={settings}
        />
      )}

      {/* Floating WhatsApp Concierge Button */}
      <FloatingWhatsApp settings={settings} />

    </div>
  );
}
