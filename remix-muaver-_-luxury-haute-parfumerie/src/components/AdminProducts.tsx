import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  X, 
  Sparkles, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  DollarSign, 
  Tag, 
  Star, 
  FolderPlus,
  SlidersHorizontal,
  Package,
  AlertCircle
} from 'lucide-react';
import { Product, ProductVariant, ProductCategory, FragranceNotes } from '../types/store';
import { 
  saveProduct, 
  deleteProduct, 
  getCategories, 
  saveCategory, 
  deleteCategory 
} from '../services/storeService';
import { uploadOptimizedImage } from '../services/imageService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminProductsProps {
  products: Product[];
  onRefresh: () => Promise<void>;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, onRefresh }) => {
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'active' | 'draft'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync localProducts with parent products
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Modal / Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // In-app Deletion Modal States
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null);

  // New Category input
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Product Form state
  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    edition: 'Royal Reserve • Batch N° 01',
    subtitle: 'Extrait de Parfum • 35% Sillage Concentration',
    slug: '',
    price: 18500,
    compareAtPrice: 22000,
    salePrice: 18500,
    sku: 'MV-001',
    stockQuantity: 50,
    status: 'active',
    variants: [
      { id: 'v1', size: '50ml', label: '50ml Royale Flacon', price: 18500, salePrice: 18500, stock: 25, inStock: true },
      { id: 'v2', size: '100ml', label: '100ml Grand Prestige Flacon', price: 29500, salePrice: 29500, stock: 25, inStock: true },
    ],
    inStock: true,
    stockStatusText: 'In Stock • Limited Royal Batch Allocated',
    category: 'Extrait de Parfum',
    shortDescription: '',
    description: '',
    notes: {
      top: ['Calabrian Bergamot', 'Royal Cardamom'],
      heart: ['Taif Rose Absolue', 'Smoky Somalian Frankincense'],
      base: ['Aged Wild Agarwood (Oud)', 'Warm Ambergris'],
    },
    olfactoryFamily: 'Woody Amber Floral Royale',
    concentration: 'Extrait de Parfum (35% High-Concentration Essence)',
    longevity: '16+ Hours Eternal Sillage',
    sillage: 'Heavy & Majestic Aura',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop'],
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
  });

  // Note raw string inputs for easy comma-separated editing
  const [topNotesInput, setTopNotesInput] = useState('');
  const [heartNotesInput, setHeartNotesInput] = useState('');
  const [baseNotesInput, setBaseNotesInput] = useState('');

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Filtered products list (using localProducts for instant optimistic updates)
  const filteredProducts = localProducts.filter((p) => {
    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchesStatus =
      selectedStatusFilter === 'All' ||
      (selectedStatusFilter === 'active' && p.status !== 'draft') ||
      (selectedStatusFilter === 'draft' && p.status === 'draft');
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Start Create Product
  const handleStartCreate = () => {
    const newId = `mv-${Date.now()}`;
    const defaultCat = categories[0]?.name || 'Extrait de Parfum';
    setFormData({
      id: newId,
      name: '',
      edition: 'Royal Reserve • Batch N° 01',
      subtitle: 'Extrait de Parfum • 35% Sillage Concentration',
      slug: '',
      price: 18000,
      compareAtPrice: 21000,
      salePrice: 18000,
      sku: `MV-${Math.floor(100 + Math.random() * 900)}`,
      stockQuantity: 40,
      status: 'active',
      variants: [
        { id: 'v1', size: '50ml', label: '50ml Royale Flacon', price: 18000, salePrice: 18000, stock: 20, inStock: true },
        { id: 'v2', size: '100ml', label: '100ml Grand Prestige Flacon', price: 29000, salePrice: 29000, stock: 20, inStock: true },
      ],
      inStock: true,
      stockStatusText: 'In Stock • Limited Royal Batch Allocated',
      category: defaultCat,
      shortDescription: '',
      description: '',
      notes: {
        top: ['Calabrian Bergamot', 'Royal Cardamom', 'Pink Peppercorn'],
        heart: ['Taif Rose Absolue', 'Smoky Somalian Frankincense'],
        base: ['Aged Wild Agarwood (Oud)', 'Ambergris', 'Bourbon Vanilla'],
      },
      olfactoryFamily: 'Woody Amber Floral Royale',
      concentration: 'Extrait de Parfum (35% High-Concentration Essence)',
      longevity: '16+ Hours Eternal Sillage',
      sillage: 'Heavy & Majestic Aura',
      images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop'],
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
    });
    setTopNotesInput('Calabrian Bergamot, Royal Cardamom, Pink Peppercorn');
    setHeartNotesInput('Taif Rose Absolue, Smoky Somalian Frankincense');
    setBaseNotesInput('Aged Wild Agarwood (Oud), Ambergris, Bourbon Vanilla');
    setIsCreatingNew(true);
    setIsEditing(false);
  };

  // Start Edit Product
  const handleStartEdit = (product: Product) => {
    setFormData({
      ...product,
      variants: product.variants || [
        { id: 'v1', size: '50ml', label: '50ml Royale Flacon', price: product.price, salePrice: product.salePrice, stock: 20, inStock: true },
      ],
      status: product.status || 'active',
    });
    setTopNotesInput((product.notes?.top || []).join(', '));
    setHeartNotesInput((product.notes?.heart || []).join(', '));
    setBaseNotesInput((product.notes?.base || []).join(', '));
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  // Handle Image Upload with browser WebP compression & progress
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      setUploadProgress(10);
      const newUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const res = await uploadOptimizedImage(file, 'products', (filePct) => {
          const overall = Math.round(((i + filePct / 100) / totalFiles) * 100);
          setUploadProgress(overall);
        });
        newUrls.push(res.fullUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls],
      }));
      showStatus(`${newUrls.length} image(s) compressed to WebP & uploaded`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  // Reorder Images
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= formData.images.length) return;

    const copy = [...formData.images];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setFormData({ ...formData, images: copy });
  };

  // Delete Image
  const handleDeleteImage = (index: number) => {
    if (formData.images.length <= 1) {
      showStatus('At least one product image is required.', 'error');
      return;
    }
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated });
  };

  // Variant operations
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}`,
      size: '30ml',
      label: '30ml Travel Flacon',
      price: formData.price,
      salePrice: formData.salePrice,
      stock: 10,
      inStock: true,
    };
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant],
    });
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, variants: updated });
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      showStatus('A product must have at least one variant.', 'error');
      return;
    }
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  // Trigger delete product dialog (replaces window.confirm)
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteProductError(null);
  };

  // Execute delete product with immediate optimistic UI update & storage purging
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeletingProduct(true);
      setDeleteProductError(null);
      const targetId = productToDelete.id;
      const targetName = productToDelete.name;

      // 1. Delete from Firestore and purge storage images
      await deleteProduct(targetId);

      // 2. Immediately remove from local UI list
      setLocalProducts((prev) => prev.filter((p) => p.id !== targetId));

      // 3. Close modal & re-fetch to ensure sync
      setProductToDelete(null);
      if (onRefresh) await onRefresh();
      showStatus(`Product "${targetName}" permanently deleted.`, 'success');
    } catch (err: any) {
      console.error('Delete product failed:', err);
      const errMsg = err?.message || String(err);
      setDeleteProductError(`Delete failed: ${errMsg}`);
      showStatus(`Delete failed: ${errMsg}`, 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Save product submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showStatus('Product name is required', 'error');
      return;
    }
    if (formData.images.length === 0) {
      showStatus('At least one product image is required', 'error');
      return;
    }

    // Parse fragrance notes from comma-separated inputs
    const parsedNotes: FragranceNotes = {
      top: topNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
      heart: heartNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
      base: baseNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
    };

    // Calculate overall stock & status
    const totalVariantStock = formData.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    const hasStock = totalVariantStock > 0 || (formData.stockQuantity || 0) > 0;

    const payload: Product = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      notes: parsedNotes,
      inStock: hasStock,
      stockQuantity: totalVariantStock > 0 ? totalVariantStock : formData.stockQuantity,
      stockStatusText: hasStock ? 'In Stock • Limited Royal Batch Allocated' : 'Currently Out of Stock • Joining Waiting List',
      seoTitle: formData.seoTitle || `${formData.name} | MUAVER Luxury Perfumes`,
      seoDescription: formData.seoDescription || formData.shortDescription || formData.description.slice(0, 150),
    };

    try {
      setLoading(true);
      await saveProduct(payload);
      if (onRefresh) await onRefresh();
      handleCancelForm();
      showStatus(`Product "${payload.name}" saved successfully.`, 'success');
    } catch (err: any) {
      console.error('Save product failed:', err);
      const errMsg = err?.message || String(err);
      showStatus(`Failed to save product: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Category Management Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newCategory: ProductCategory = {
        id: `cat-${Date.now()}`,
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim(),
        order: categories.length + 1,
      };
      await saveCategory(newCategory);
      await loadCategories();
      setNewCatName('');
      setNewCatDesc('');
      showStatus(`Category "${newCategory.name}" added`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Error saving category', 'error');
    }
  };

  const handleDeleteCategory = (cat: ProductCategory) => {
    setCategoryToDelete(cat);
    setDeleteCategoryError(null);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeletingCategory(true);
      setDeleteCategoryError(null);
      await deleteCategory(categoryToDelete.id);
      await loadCategories();
      showStatus(`Category "${categoryToDelete.name}" deleted`, 'success');
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteCategoryError(err.message || 'Error deleting category');
      showStatus(err.message || 'Error deleting category', 'error');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--gold-500)]/20">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold tracking-wide">
            Product Catalog Management
          </h2>
          <p className="text-xs text-white/60">
            Shopify-style management: Variants, fragrance notes, draft/active visibility, inventory, and automated image compression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="px-4 py-2.5 rounded-lg border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/10 text-xs font-semibold tracking-wider uppercase flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={handleStartCreate}
            disabled={loading || isCreatingNew || isEditing}
            className="btn-gold-primary px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Flacon</span>
          </button>
        </div>
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

      {/* CATEGORY MANAGER MODAL / PANEL */}
      {showCategoryManager && (
        <div className="rounded-2xl bg-[#03091D] border border-[var(--gold-500)]/30 p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-heading text-sm font-bold text-[var(--gold-300)] uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span>Fragrance Categories</span>
            </h3>
            <button
              onClick={() => setShowCategoryManager(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Category Name (e.g. Royal Attars)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Short Description (optional)"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
            />
            <button
              type="submit"
              className="btn-gold-primary px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Existing Categories list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-[var(--navy-900)] border border-white/10 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-white block">{c.name}</span>
                  <span className="text-[10px] text-white/50">{c.description || c.slug}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(c)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT FORM (Shopify-Style Editor) */}
      {(isCreatingNew || isEditing) && (
        <form
          onSubmit={handleSaveProduct}
          className="rounded-2xl bg-[#03091D] border-2 border-[var(--gold-500)]/40 p-6 sm:p-8 space-y-8 shadow-2xl animate-fade-in"
        >
          {/* Top Bar of Form */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[var(--gold-300)]" />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  {isCreatingNew ? 'Create New Flacon Creation' : `Edit Product: ${formData.name}`}
                </h3>
                <span className="text-xs text-white/50">
                  Fill in fragrance architecture, pricing, variants, and imagery.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="btn-gold-primary px-6 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Flacon</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Title (Fragrance Name) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SOUVERAIN D'OR"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-white text-sm focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Edition / Batch
                  </label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g. Royal Reserve • Batch N° 01"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                    Subtitle / Concentration Tag
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Extrait de Parfum • 35% Sillage Concentration"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Short Hook / Excerpt
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="An intoxicating alchemy of rare golden oud and velvet Bulgarian rose..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Full Description & Story *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Crafted for Distinction by AUHS, Souverain D'Or is an opulent tribute to regal presence..."
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs leading-relaxed focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>
            </div>

            {/* Right Column: Status & Category */}
            <div className="space-y-5 bg-[#081438] p-5 rounded-xl border border-white/10">
              {/* Product Status (Active vs Draft) */}
              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Publishing Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.status !== 'draft'
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-[var(--navy-900)] border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Active (Live)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.status === 'draft'
                        ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-[var(--navy-900)] border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Draft</span>
                  </button>
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  Draft products are hidden from the public shop catalogue.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="Extrait de Parfum">Extrait de Parfum</option>
                  )}
                </select>
              </div>

              {/* Featured toggle */}
              <div className="pt-2 border-t border-white/5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--gold-500)] text-[var(--gold-500)] focus:ring-[var(--gold-300)] bg-[var(--navy-900)]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Feature on Homepage
                    </span>
                    <span className="text-[10px] text-white/40">
                      Showcases in the home featured spotlight flacon.
                    </span>
                  </div>
                </label>
              </div>

              {/* Stock Overview */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">Inventory Quantity:</span>
                  <input
                    type="number"
                    value={formData.stockQuantity || 0}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-20 px-2 py-1 rounded bg-[var(--navy-900)] border border-white/10 text-right text-xs text-white"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">SKU Code:</span>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-28 px-2 py-1 rounded bg-[var(--navy-900)] border border-white/10 text-right text-xs text-white font-mono"
                    placeholder="MV-SOUV-01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Image Gallery with Compression & Drag/Move */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--gold-300)]" />
                  <span>Product Imagery</span>
                </h4>
                <p className="text-[11px] text-white/50">
                  Generic unbranded luxury flacon photography. Images are automatically compressed to max 1600px quality 0.8 with small thumbnails.
                </p>
              </div>

              <label className="btn-gold-primary px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {uploadingImage && (
              <div className="p-3.5 rounded-lg bg-[var(--gold-500)]/10 border border-[var(--gold-500)]/30 space-y-2 text-xs text-[var(--gold-300)] font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--gold-300)]" />
                    <span>Compressing images to WebP & uploading...</span>
                  </div>
                  {uploadProgress !== null && <span className="font-bold">{uploadProgress}%</span>}
                </div>
                {uploadProgress !== null && (
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--gold-300)] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {formData.images.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-[4/5] rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col justify-between"
                >
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-[#050F2E]/90 text-[9px] font-mono text-[var(--gold-300)] px-1.5 py-0.5 rounded border border-[var(--gold-500)]/40 font-bold">
                      Cover
                    </span>
                  )}

                  {/* Move & Delete controls */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className="p-1 rounded bg-rose-600/80 text-white hover:bg-rose-600"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'left')}
                        disabled={index === 0}
                        className="p-1 rounded bg-white/20 text-white disabled:opacity-20 hover:bg-white/40"
                        title="Move image earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                      <span className="text-[10px] text-white/70 font-mono">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'right')}
                        disabled={index === formData.images.length - 1}
                        className="p-1 rounded bg-white/20 text-white disabled:opacity-20 hover:bg-white/40"
                        title="Move image later"
                      >
                        <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pricing & Size Variants (Shopify Style) */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--gold-300)]" />
                  <span>Size Variants & Pricing</span>
                </h4>
                <p className="text-[11px] text-white/50">
                  Define flacon sizes (e.g. 30ml, 50ml, 100ml) with their individual price, sale price, and stock levels.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/10 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Base Product Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#081438] p-4 rounded-xl border border-white/10">
              <div>
                <label className="block text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1">
                  Primary Price (PKR) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs font-semibold focus:border-[var(--gold-300)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1">
                  Compare-At Price (Strikethrough / Sale)
                </label>
                <input
                  type="number"
                  value={formData.compareAtPrice || ''}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g. 22000"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1">
                  Sale Price (Active Checkout)
                </label>
                <input
                  type="number"
                  value={formData.salePrice || ''}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g. 18500"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>
            </div>

            {/* Individual Variants Table */}
            <div className="space-y-2">
              {formData.variants.map((v, vIndex) => (
                <div
                  key={v.id || vIndex}
                  className="p-3.5 rounded-xl bg-[var(--navy-900)] border border-white/10 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
                >
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-0.5">
                      Size
                    </label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => handleUpdateVariant(vIndex, 'size', e.target.value)}
                      placeholder="e.g. 50ml"
                      className="w-full px-2.5 py-1.5 rounded bg-[#03091D] border border-white/10 text-white text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-0.5">
                      Variant Display Label
                    </label>
                    <input
                      type="text"
                      value={v.label}
                      onChange={(e) => handleUpdateVariant(vIndex, 'label', e.target.value)}
                      placeholder="e.g. 50ml Royale Flacon"
                      className="w-full px-2.5 py-1.5 rounded bg-[#03091D] border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-0.5">
                      Price (Rs.)
                    </label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleUpdateVariant(vIndex, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#03091D] border border-white/10 text-white text-xs text-right"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-0.5">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      value={v.stock || 0}
                      onChange={(e) => handleUpdateVariant(vIndex, 'stock', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#03091D] border border-white/10 text-white text-xs text-right"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-end gap-2 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateVariant(vIndex, 'inStock', !v.inStock)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        v.inStock
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {v.inStock ? 'In Stock' : 'Out'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(vIndex)}
                      className="p-1 text-white/40 hover:text-rose-400"
                      title="Remove variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Olfactory Architecture (Fragrance Notes) */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--gold-300)]" />
                <span>Fragrance Notes Architecture</span>
              </h4>
              <p className="text-[11px] text-white/50">
                Separate note ingredients with commas (e.g. Taif Rose, Calabrian Bergamot, Oud).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#081438] border border-white/10 space-y-2">
                <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                  Top Notes (Initial 15-30m)
                </span>
                <textarea
                  rows={2}
                  value={topNotesInput}
                  onChange={(e) => setTopNotesInput(e.target.value)}
                  placeholder="Calabrian Bergamot, Royal Cardamom, Pink Peppercorn"
                  className="w-full p-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#081438] border border-white/10 space-y-2">
                <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                  Heart Notes (Core Sillage 2-6h)
                </span>
                <textarea
                  rows={2}
                  value={heartNotesInput}
                  onChange={(e) => setHeartNotesInput(e.target.value)}
                  placeholder="Taif Rose Absolue, Smoky Somalian Frankincense, Velvet Orris"
                  className="w-full p-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#081438] border border-white/10 space-y-2">
                <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                  Base Notes (Dry Down 8-16h)
                </span>
                <textarea
                  rows={2}
                  value={baseNotesInput}
                  onChange={(e) => setBaseNotesInput(e.target.value)}
                  placeholder="Aged Wild Agarwood (Oud), Warm Ambergris, Bourbon Vanilla"
                  className="w-full p-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: SEO Metadata */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-[var(--gold-300)]" />
                <span>Search Engine Optimization (SEO)</span>
              </h4>
              <p className="text-[11px] text-white/50">
                Custom page title and description for search engines and social share previews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="SOUVERAIN D'OR Extrait de Parfum | MUAVER"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading uppercase tracking-widest text-[var(--gold-300)] mb-1.5">
                  SEO Meta Description
                </label>
                <input
                  type="text"
                  value={formData.seoDescription || ''}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Discover Souverain D'Or, crafted with 35% extrait concentration..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
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
              disabled={loading || uploadingImage}
              className="btn-gold-primary px-8 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Publish Flacon</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* PRODUCTS LIST (Shopify Table & Grid) */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-[#081438] p-4 rounded-xl border border-[var(--gold-500)]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[var(--gold-300)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search flacons by name, SKU..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/50">Category:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/50">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="All">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards / Table */}
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-[#081438]/50 rounded-xl border border-white/10 text-white/50 text-xs">
              No products found matching filters.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isDraft = p.status === 'draft';
              const isOutOfStock = !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0);

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#081438] border border-[var(--gold-500)]/20 hover:border-[var(--gold-500)]/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-20 sm:w-20 sm:h-24 aspect-[4/5] rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=300'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {p.images?.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white/80 px-1 rounded font-mono">
                          +{p.images.length - 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold">
                          {p.category}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isDraft
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isDraft ? 'Draft' : 'Active'}
                        </span>

                        {/* Stock badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                              : 'bg-blue-950/70 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${p.stockQuantity ?? 40} in stock`}
                        </span>

                        {p.isFeatured && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-[var(--gold-300)] border border-[var(--gold-500)]/40 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading text-base font-bold text-white truncate">
                        {p.name}
                      </h4>

                      <p className="text-xs text-white/60 line-clamp-1">
                        {p.subtitle} • SKU: <span className="font-mono text-white/80">{p.sku || 'N/A'}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <span className="font-heading font-bold text-[var(--gold-300)]">
                          Rs. {p.price.toLocaleString()}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-white/40 line-through text-[11px]">
                            Rs. {p.compareAtPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-white/40">•</span>
                        <span className="text-[11px] text-white/50">
                          {p.variants?.length || 1} Variant(s) ({p.variants?.map((v) => v.size).join(', ')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleStartEdit(p)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-[var(--gold-300)] hover:border-[var(--gold-300)] text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for Product Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(productToDelete)}
        title="Delete Fragrance Flacon"
        itemName={productToDelete?.name || ''}
        message="This product will be permanently purged from your Firestore catalog, and its images will be deleted from Firebase Storage."
        isDeleting={isDeletingProduct}
        errorMessage={deleteProductError}
        onConfirm={confirmDeleteProduct}
        onCancel={() => {
          if (!isDeletingProduct) {
            setProductToDelete(null);
            setDeleteProductError(null);
          }
        }}
      />

      {/* Confirmation Modal for Category Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Product Category"
        itemName={categoryToDelete?.name || ''}
        message="Are you sure you wish to delete this category? Flacons assigned to this category will not be deleted."
        isDeleting={isDeletingCategory}
        errorMessage={deleteCategoryError}
        onConfirm={confirmDeleteCategory}
        onCancel={() => {
          if (!isDeletingCategory) {
            setCategoryToDelete(null);
            setDeleteCategoryError(null);
          }
        }}
      />
    </div>
  );
};
