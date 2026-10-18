'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Store,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Sparkles,
  Package,
  Calendar,
  Tag,
  Eye,
  SlidersHorizontal,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';
import {
  CollectionListItem,
  CollectionDetail,
  CollectionProductItem,
  AvailableProduct,
  fetchManagedCollections,
  fetchCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  fetchAvailableProductsForCollection,
} from '@/lib/collection/fetcher';

interface VendorInfo {
  id: string;
  businessName: string;
  contactName: string;
  mobile: string;
  vendorCode: string;
  city?: string;
  state?: string;
  isActive: boolean;
  collectionCount?: number;
  productCount?: number;
}

const PRESET_TAGS = [
  'Festive Edit',
  'Daily Wear',
  'Wedding Specials',
  'Bridal Couture',
  'Summer 2026',
  'Pure Silk',
  'Handloom',
  'New Arrivals',
  'Cotton Everyday',
  'Boutique Exclusive',
];

export default function AdminCollectionsPage() {
  const { addToast } = useApp();

  // Dark & Light Mode Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('iccha_admin_theme') as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('iccha_admin_theme', next);
    } catch {
      // ignore
    }
  };

  const isDark = theme === 'dark';

  // Role & Current User
  const [role, setRole] = useState<string | null>(null);
  const [currentUserVendorId, setCurrentUserVendorId] = useState<string | null>(null);
  const [currentUserVendorName, setCurrentUserVendorName] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Data
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Admin View State
  const [activeTab, setActiveTab] = useState<'vendors' | 'platform' | 'all'>('vendors');
  const [selectedVendor, setSelectedVendor] = useState<VendorInfo | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Modal State: Create / Edit Collection
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formMediaAssetId, setFormMediaAssetId] = useState<string | null>(null);
  const [formCustomImageUrl, setFormCustomImageUrl] = useState<string | null>(null);
  const [formVendorId, setFormVendorId] = useState<string | null>(null);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');

  // Products in the collection currently being edited
  const [selectedProducts, setSelectedProducts] = useState<
    {
      id: string;
      name: string;
      designNumber: string;
      sku?: string;
      pricePerSet: number;
      piecesPerSet: number;
      availableSets: number;
      image: string | null;
    }[]
  >([]);

  // Product Picker Modal (Nested)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [tempCheckedProductIds, setTempCheckedProductIds] = useState<Set<string>>(new Set());

  // Image Uploading
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<CollectionListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isStaff = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATIONS_MANAGER';
  const isVendor = role === 'VENDOR';

  // 1. Load User Session
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.data) {
          setRole(json.data.role);
          if (json.data.vendorProfile) {
            setCurrentUserVendorId(json.data.vendorProfile.id);
            setCurrentUserVendorName(json.data.vendorProfile.businessName);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAuth(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Load Collections & Vendors
  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const data = await fetchManagedCollections();
      setCollections(data || []);
    } catch {
      addToast({
        type: 'error',
        title: 'Error loading collections',
        message: 'Could not load collections. Please refresh the page.',
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  const loadVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch('/api/admin/vendors?pageSize=100');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVendors(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (loadingAuth) return;
    loadCollections();
    if (isStaff) {
      loadVendors();
    }
  }, [loadingAuth, isStaff]);

  // Aggregate collection metrics per vendor for admin view
  const vendorMetrics = useMemo(() => {
    const map = new Map<string, { count: number; totalProducts: number }>();
    collections.forEach((col) => {
      if (col.vendorId) {
        const existing = map.get(col.vendorId) || { count: 0, totalProducts: 0 };
        map.set(col.vendorId, {
          count: existing.count + 1,
          totalProducts: existing.totalProducts + (col.productCount || 0),
        });
      }
    });
    return map;
  }, [collections]);

  const platformCollections = useMemo(() => {
    return collections.filter((c) => !c.vendorId);
  }, [collections]);

  // Vendors filtered by search
  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return vendors;
    const q = vendorSearch.toLowerCase();
    return vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.contactName.toLowerCase().includes(q) ||
        v.vendorCode.toLowerCase().includes(q) ||
        (v.city && v.city.toLowerCase().includes(q))
    );
  }, [vendors, vendorSearch]);

  // Collections filtered by search & active view
  const displayedCollections = useMemo(() => {
    let list = collections;

    if (isVendor) {
      list = collections.filter((c) => c.vendorId === currentUserVendorId);
    } else if (isStaff) {
      if (selectedVendor) {
        list = collections.filter((c) => c.vendorId === selectedVendor.id);
      } else if (activeTab === 'platform') {
        list = platformCollections;
      } else if (activeTab === 'all') {
        list = collections;
      }
    }

    if (collectionSearch.trim()) {
      const q = collectionSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          (c.vendor && c.vendor.businessName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    collections,
    isVendor,
    isStaff,
    selectedVendor,
    activeTab,
    platformCollections,
    currentUserVendorId,
    collectionSearch,
  ]);

  // 3. Open Create / Edit Modal
  const openCreateModal = (targetVendorId?: string | null) => {
    setEditingCollectionId(null);
    setFormName('');
    setFormDescription('');
    setFormTags([]);
    setTagInput('');
    setFormIsPublished(true);
    setFormSortOrder(0);
    setFormMediaAssetId(null);
    setFormCustomImageUrl(null);
    setFormStartAt('');
    setFormEndAt('');
    setSelectedProducts([]);

    if (isVendor) {
      setFormVendorId(currentUserVendorId);
    } else if (targetVendorId !== undefined) {
      setFormVendorId(targetVendorId);
    } else if (selectedVendor) {
      setFormVendorId(selectedVendor.id);
    } else {
      setFormVendorId(null);
    }

    setIsEditModalOpen(true);
  };

  const openEditModal = async (col: CollectionListItem) => {
    setEditingCollectionId(col.id);
    setModalLoading(true);
    setIsEditModalOpen(true);

    try {
      const detail = await fetchCollection(col.slug || col.id);
      setFormName(detail.name);
      setFormDescription(detail.description || '');
      setFormTags(detail.tags || []);
      setTagInput('');
      setFormIsPublished(detail.isPublished);
      setFormSortOrder(detail.sortOrder || 0);
      setFormMediaAssetId(detail.mediaAssetId || null);
      setFormCustomImageUrl(detail.mediaAsset?.publicUrl || null);
      setFormVendorId(detail.vendorId || null);
      setFormStartAt(detail.startAt ? detail.startAt.slice(0, 16) : '');
      setFormEndAt(detail.endAt ? detail.endAt.slice(0, 16) : '');

      setSelectedProducts(
        (detail.products || []).map((p) => ({
          id: p.id,
          name: p.name,
          designNumber: p.designNumber,
          sku: p.sku,
          pricePerSet: p.pricePerSet,
          piecesPerSet: p.piecesPerSet,
          availableSets: p.availableSets,
          image: p.image,
        }))
      );
    } catch {
      addToast({
        type: 'error',
        title: 'Error loading details',
        message: 'Could not fetch full collection details.',
      });
      setIsEditModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid file',
        message: 'Please select an image file (JPG, PNG, WebP).',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', 'HERO_DESKTOP');
      formData.append('isPrivate', 'false');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message || 'Upload failed');
      }

      setFormMediaAssetId(json.data.id);
      setFormCustomImageUrl(json.data.publicUrl);
      addToast({
        type: 'success',
        title: 'Image uploaded',
        message: 'Custom cover image has been uploaded successfully.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo.';
      addToast({
        type: 'error',
        title: 'Upload failed',
        message,
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCustomImage = () => {
    setFormMediaAssetId(null);
    setFormCustomImageUrl(null);
  };

  // Tags Management
  const handleAddTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (formTags.includes(clean)) return;
    if (formTags.length >= 8) {
      addToast({
        type: 'warning',
        title: 'Limit reached',
        message: 'You can add up to 8 tags per collection.',
      });
      return;
    }
    setFormTags([...formTags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag));
  };

  // Product Reordering inside Collection
  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= selectedProducts.length) return;
    const updated = [...selectedProducts];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setSelectedProducts(updated);
  };

  const removeProductFromCollection = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  // Product Picker Modal Functions
  const openProductPicker = async () => {
    setIsProductPickerOpen(true);
    setPickerLoading(true);
    setPickerSearch('');
    setTempCheckedProductIds(new Set(selectedProducts.map((p) => p.id)));

    try {
      const targetVendor = isVendor ? currentUserVendorId : formVendorId;
      const products = await fetchAvailableProductsForCollection({
        vendorId: targetVendor,
      });
      setAvailableProducts(products);
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to load products',
        message: 'Could not load products for selection.',
      });
    } finally {
      setPickerLoading(false);
    }
  };

  const searchPickerProducts = async (query: string) => {
    setPickerSearch(query);
    setPickerLoading(true);
    try {
      const targetVendor = isVendor ? currentUserVendorId : formVendorId;
      const products = await fetchAvailableProductsForCollection({
        vendorId: targetVendor,
        search: query,
      });
      setAvailableProducts(products);
    } catch {
      // ignore
    } finally {
      setPickerLoading(false);
    }
  };

  const toggleCheckProduct = (productId: string) => {
    const next = new Set(tempCheckedProductIds);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    setTempCheckedProductIds(next);
  };

  const applyProductSelection = () => {
    const existingIds = new Set(selectedProducts.map((p) => p.id));
    const kept = selectedProducts.filter((p) => tempCheckedProductIds.has(p.id));

    const toAdd: typeof selectedProducts = [];
    availableProducts.forEach((p) => {
      if (tempCheckedProductIds.has(p.id) && !existingIds.has(p.id)) {
        toAdd.push({
          id: p.id,
          name: p.name,
          designNumber: p.designNumber,
          sku: p.sku,
          pricePerSet: p.wholesalePricePerSet,
          piecesPerSet: p.piecesPerSet,
          availableSets: p.availableSets,
          image: p.image,
        });
      }
    });

    setSelectedProducts([...kept, ...toAdd]);
    setIsProductPickerOpen(false);
  };

  // Determine cover image preview in the form (Requirement 6)
  const activeCoverImageUrl = useMemo(() => {
    if (formCustomImageUrl) return formCustomImageUrl;
    if (selectedProducts.length > 0 && selectedProducts[0].image) {
      return selectedProducts[0].image;
    }
    return null;
  }, [formCustomImageUrl, selectedProducts]);

  // Save Collection (Create or Update)
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || formName.trim().length < 3) {
      addToast({
        type: 'error',
        title: 'Validation error',
        message: 'Collection name must be at least 3 characters long.',
      });
      return;
    }

    if (formIsPublished && selectedProducts.length === 0) {
      addToast({
        type: 'error',
        title: 'Validation error',
        message: 'A published collection must include at least one product.',
      });
      return;
    }

    setSavingCollection(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        tags: formTags,
        isPublished: formIsPublished,
        sortOrder: Number(formSortOrder) || 0,
        mediaAssetId: formMediaAssetId,
        vendorId: formVendorId,
        productIds: selectedProducts.map((p) => p.id),
        startAt: formStartAt ? new Date(formStartAt).toISOString() : null,
        endAt: formEndAt ? new Date(formEndAt).toISOString() : null,
      };

      if (editingCollectionId) {
        await updateCollection(editingCollectionId, payload);
        addToast({
          type: 'success',
          title: 'Collection updated',
          message: `"${formName}" has been successfully updated.`,
        });
      } else {
        await createCollection(payload);
        addToast({
          type: 'success',
          title: 'Collection created',
          message: `"${formName}" has been created successfully.`,
        });
      }

      setIsEditModalOpen(false);
      loadCollections();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not save collection. Please check details.';
      addToast({
        type: 'error',
        title: 'Save failed',
        message,
      });
    } finally {
      setSavingCollection(false);
    }
  };

  // Delete Collection
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCollection(deleteTarget.id);
      addToast({
        type: 'success',
        title: 'Collection deleted',
        message: `"${deleteTarget.name}" has been deleted.`,
      });
      setDeleteTarget(null);
      loadCollections();
    } catch {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: 'Could not delete collection.',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors ${
          isDark ? 'bg-stone-900 text-stone-200' : 'bg-stone-50 text-stone-700'
        }`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${
        isDark ? 'bg-[#0c0a09] text-stone-200' : 'bg-[#faf8f5] text-stone-800'
      }`}
    >
      {/* Sidebar */}
      <AdminSidebar activeTab="collections" />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-8 sm:px-8 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Banner / Header */}
          <div
            className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b transition-colors ${
              isDark ? 'border-stone-800' : 'border-stone-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 text-xs font-semibold tracking-wider text-rose-600 dark:text-rose-400 uppercase">
                <Layers className="w-4 h-4" />
                {isVendor ? 'Vendor Lookbooks' : 'Catalogue Management'}
              </div>
              <h1
                className={`text-2xl sm:text-3xl font-serif font-bold mt-1 transition-colors ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {isVendor
                  ? `${currentUserVendorName || 'My'} Collections`
                  : 'Lookbooks & Collections'}
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 transition-colors ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                {isVendor
                  ? 'Curate lookbooks featuring your wholesale products with custom or automatic cover photos.'
                  : 'Manage curated wholesale lookbooks across vendors and platform house collections.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dark & Light Mode Variant Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${
                  isDark
                    ? 'border-stone-700 bg-stone-800/90 text-amber-300 hover:bg-stone-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 shadow-sm'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-stone-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <Link
                href="/collections"
                target="_blank"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition shadow-sm ${
                  isDark
                    ? 'border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-stone-300'
                    : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Public View
              </Link>

              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-900/20 transition"
              >
                <Plus className="w-4 h-4" />
                Create Collection
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ADMIN VIEW: VENDOR CARDS & NAVIGATION                          */}
          {/* ============================================================== */}
          {isStaff && (
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div
                className={`flex flex-wrap items-center justify-between gap-4 border-b pb-3 transition-colors ${
                  isDark ? 'border-stone-800/80' : 'border-stone-200'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 p-1 rounded-xl border transition-colors ${
                    isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-stone-100 border-stone-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('vendors');
                      setSelectedVendor(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      activeTab === 'vendors' && !selectedVendor
                        ? isDark
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60 shadow-sm'
                          : 'bg-white text-rose-800 border border-stone-200/80 shadow-sm font-semibold'
                        : isDark
                        ? 'text-stone-400 hover:text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Vendor Lookbooks ({vendors.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('platform');
                      setSelectedVendor(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      activeTab === 'platform' && !selectedVendor
                        ? isDark
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60 shadow-sm'
                          : 'bg-white text-rose-800 border border-stone-200/80 shadow-sm font-semibold'
                        : isDark
                        ? 'text-stone-400 hover:text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Platform Collections ({platformCollections.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('all');
                      setSelectedVendor(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                      activeTab === 'all' && !selectedVendor
                        ? isDark
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60 shadow-sm'
                          : 'bg-white text-rose-800 border border-stone-200/80 shadow-sm font-semibold'
                        : isDark
                        ? 'text-stone-400 hover:text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    All Collections ({collections.length})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search
                    className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    }`}
                  />
                  <input
                    type="text"
                    value={activeTab === 'vendors' && !selectedVendor ? vendorSearch : collectionSearch}
                    onChange={(e) =>
                      activeTab === 'vendors' && !selectedVendor
                        ? setVendorSearch(e.target.value)
                        : setCollectionSearch(e.target.value)
                    }
                    placeholder={
                      activeTab === 'vendors' && !selectedVendor
                        ? 'Search vendors...'
                        : 'Search collections...'
                    }
                    className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition focus:outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:border-rose-500'
                        : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-600 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              {/* Requirement: "admin should have cards of vendors name when user will click on vendor name he will able to view/manage vendors collections." */}
              {activeTab === 'vendors' && !selectedVendor && (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between text-xs px-1 ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    <span>
                      Select a vendor to manage their collections and view catalogue isolation.
                    </span>
                    <span>
                      Showing {filteredVendors.length} of {vendors.length} vendors
                    </span>
                  </div>

                  {loadingVendors ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className={`h-36 rounded-2xl animate-pulse ${
                            isDark ? 'bg-stone-900/60 border border-stone-800' : 'bg-white border border-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  ) : filteredVendors.length === 0 ? (
                    <div
                      className={`text-center py-12 rounded-2xl border border-dashed ${
                        isDark ? 'border-stone-800 bg-stone-900/30' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <Store
                        className={`w-8 h-8 mx-auto mb-2 ${
                          isDark ? 'text-stone-600' : 'text-stone-400'
                        }`}
                      />
                      <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        No vendors found matching your search.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredVendors.map((vendor) => {
                        const metrics = vendorMetrics.get(vendor.id) || {
                          count: 0,
                          totalProducts: 0,
                        };
                        return (
                          <div
                            key={vendor.id}
                            onClick={() => setSelectedVendor(vendor)}
                            className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                              isDark
                                ? 'border-stone-800/90 bg-stone-900/70 hover:bg-stone-900 hover:border-rose-700/60 shadow-sm hover:shadow-md'
                                : 'border-stone-200 bg-white hover:border-rose-300 hover:shadow-md shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                      isDark
                                        ? 'bg-rose-950/60 border border-rose-900/40 text-rose-400'
                                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                                    }`}
                                  >
                                    {vendor.businessName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h3
                                      className={`font-serif font-bold text-sm transition line-clamp-1 ${
                                        isDark
                                          ? 'text-white group-hover:text-rose-300'
                                          : 'text-stone-900 group-hover:text-rose-700'
                                      }`}
                                    >
                                      {vendor.businessName}
                                    </h3>
                                  </div>
                                </div>

                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    vendor.isActive
                                      ? isDark
                                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isDark
                                      ? 'bg-stone-800 text-stone-400 border-stone-700'
                                      : 'bg-stone-100 text-stone-500 border-stone-200'
                                  }`}
                                >
                                  {vendor.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <div
                                className={`mt-4 pt-3 border-t text-xs space-y-1 ${
                                  isDark
                                    ? 'border-stone-800/60 text-stone-400'
                                    : 'border-stone-100 text-stone-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                                    Contact:
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      isDark ? 'text-stone-300' : 'text-stone-700'
                                    }`}
                                  >
                                    {vendor.contactName}
                                  </span>
                                </div>
                                {(vendor.city || vendor.state) && (
                                  <div className="flex items-center justify-between">
                                    <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                                      Location:
                                    </span>
                                    <span
                                      className={`truncate max-w-[150px] ${
                                        isDark ? 'text-stone-300' : 'text-stone-700'
                                      }`}
                                    >
                                      {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                                isDark ? 'border-stone-800/60' : 'border-stone-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    isDark
                                      ? 'bg-rose-950/50 text-rose-300 border-rose-900/50'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  {metrics.count} {metrics.count === 1 ? 'Collection' : 'Collections'}
                                </span>
                                <span
                                  className={`text-[11px] ${
                                    isDark ? 'text-stone-500' : 'text-stone-400'
                                  }`}
                                >
                                  {metrics.totalProducts} products
                                </span>
                              </div>

                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform">
                                Manage &rarr;
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Vendor Active Filter Header (when a vendor card is clicked) */}
              {selectedVendor && (
                <div
                  className={`p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isDark
                      ? 'bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-950 border-rose-900/40 text-stone-300'
                      : 'bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40 border-rose-200 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedVendor(null)}
                      className={`p-2 rounded-xl transition ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-sm'
                      }`}
                      title="Back to all vendors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div>
                      <h2
                        className={`text-lg font-serif font-bold mt-0.5 ${
                          isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {selectedVendor.businessName}
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Managing lookbooks for this vendor. Products in these collections will strictly
                        belong to this vendor.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => openCreateModal(selectedVendor.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Collection for Vendor
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedVendor(null)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-sm'
                      }`}
                    >
                      All Vendors
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* COLLECTIONS GRID (Rendered for Vendor or when viewing list)    */}
          {/* ============================================================== */}
          {(isVendor || !isStaff || activeTab !== 'vendors' || selectedVendor) && (
            <div className="space-y-4">
              <div
                className={`flex items-center justify-between text-xs px-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                <span>
                  Showing {displayedCollections.length} lookbook
                  {displayedCollections.length === 1 ? '' : 's'}
                </span>

                {isVendor && (
                  <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>
                    Wholesale buyer access protected. Auto-synced with store catalogue.
                  </span>
                )}
              </div>

              {loadingCollections ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-80 rounded-3xl animate-pulse ${
                        isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-stone-200'
                      }`}
                    />
                  ))}
                </div>
              ) : displayedCollections.length === 0 ? (
                <div
                  className={`text-center py-16 rounded-3xl border border-dashed space-y-3 ${
                    isDark ? 'border-stone-800 bg-stone-900/40' : 'border-stone-200 bg-white shadow-sm'
                  }`}
                >
                  <Layers
                    className={`w-10 h-10 mx-auto ${
                      isDark ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  />
                  <h3
                    className={`text-base font-serif font-bold ${
                      isDark ? 'text-stone-300' : 'text-stone-800'
                    }`}
                  >
                    No collections found
                  </h3>
                  <p
                    className={`text-xs max-w-sm mx-auto ${
                      isDark ? 'text-stone-500' : 'text-stone-500'
                    }`}
                  >
                    {collectionSearch
                      ? 'No collections matched your search term.'
                      : 'Get started by creating your first lookbook collection.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedVendor?.id || null)}
                    className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCollections.map((col) => {
                    const hasCustomImage = !!col.mediaAssetId;
                    return (
                      <div
                        key={col.id}
                        className={`group rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl ${
                          isDark
                            ? 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Cover Image Header */}
                        <div
                          className={`relative aspect-[16/10] w-full overflow-hidden ${
                            isDark ? 'bg-stone-950' : 'bg-stone-100'
                          }`}
                        >
                          {col.coverImage ? (
                            <img
                              src={col.coverImage}
                              alt={col.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center space-y-1 ${
                                isDark ? 'text-stone-600' : 'text-stone-400'
                              }`}
                            >
                              <ImageIcon className="w-8 h-8" />
                              <span className="text-[11px]">No image</span>
                            </div>
                          )}

                          {/* Image Source Badge */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border ${
                                hasCustomImage
                                  ? isDark
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                    : 'bg-amber-100/90 text-amber-800 border-amber-300'
                                  : isDark
                                  ? 'bg-stone-950/80 text-stone-300 border-stone-700/60'
                                  : 'bg-stone-900/80 text-stone-100 border-stone-700/60'
                              }`}
                            >
                              {hasCustomImage ? '★ Custom Cover' : 'Product #1 Cover'}
                            </span>

                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border ${
                                col.isPublished
                                  ? isDark
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                    : 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                                  : isDark
                                  ? 'bg-stone-900/90 text-stone-400 border-stone-700'
                                  : 'bg-stone-100 text-stone-600 border-stone-300'
                              }`}
                            >
                              {col.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          <div
                            className={`absolute top-3 right-3 backdrop-blur-md border text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow ${
                              isDark
                                ? 'bg-stone-950/85 border-stone-800 text-stone-300'
                                : 'bg-white/90 border-stone-200 text-stone-700'
                            }`}
                          >
                            {col.productCount} {col.productCount === 1 ? 'product' : 'products'}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {isStaff && col.vendor && (
                              <div
                                className={`flex items-center gap-1.5 text-[11px] font-medium ${
                                  isDark ? 'text-amber-400' : 'text-amber-700'
                                }`}
                              >
                                <Store className="w-3 h-3" />
                                <span>{col.vendor.businessName}</span>
                              </div>
                            )}

                            {isStaff && !col.vendor && (
                              <div
                                className={`flex items-center gap-1.5 text-[11px] font-medium ${
                                  isDark ? 'text-rose-400' : 'text-rose-700'
                                }`}
                              >
                                <Building2 className="w-3 h-3" />
                                <span>Platform (Iccha House)</span>
                              </div>
                            )}

                            <h3
                              className={`font-serif text-lg font-bold transition line-clamp-1 ${
                                isDark
                                  ? 'text-white group-hover:text-rose-300'
                                  : 'text-stone-900 group-hover:text-rose-700'
                              }`}
                            >
                              {col.name}
                            </h3>

                            {col.description && (
                              <p
                                className={`text-xs line-clamp-2 leading-relaxed ${
                                  isDark ? 'text-stone-400' : 'text-stone-600'
                                }`}
                              >
                                {col.description}
                              </p>
                            )}

                            {col.tags && col.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {col.tags.slice(0, 4).map((t) => (
                                  <span
                                    key={t}
                                    className={`text-[10px] px-2 py-0.5 rounded-md border ${
                                      isDark
                                        ? 'bg-stone-800/80 text-stone-300 border-stone-700/50'
                                        : 'bg-stone-100 text-stone-600 border-stone-200'
                                    }`}
                                  >
                                    {t}
                                  </span>
                                ))}
                                {col.tags.length > 4 && (
                                  <span
                                    className={`text-[10px] px-1 py-0.5 ${
                                      isDark ? 'text-stone-500' : 'text-stone-400'
                                    }`}
                                  >
                                    +{col.tags.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div
                            className={`pt-3 border-t flex items-center justify-between gap-2 ${
                              isDark ? 'border-stone-800/80' : 'border-stone-100'
                            }`}
                          >
                            <Link
                              href={`/collections/${col.slug}`}
                              target="_blank"
                              className={`text-xs flex items-center gap-1 transition ${
                                isDark
                                  ? 'text-stone-400 hover:text-white'
                                  : 'text-stone-600 hover:text-stone-900 font-medium'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Public View
                            </Link>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(col)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                                  isDark
                                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                }`}
                              >
                                <Edit3
                                  className={`w-3.5 h-3.5 ${
                                    isDark ? 'text-stone-400' : 'text-stone-500'
                                  }`}
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(col)}
                                className={`p-1.5 rounded-lg transition ${
                                  isDark
                                    ? 'bg-stone-800 hover:bg-rose-950/60 hover:text-rose-400 text-stone-400'
                                    : 'bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-500'
                                }`}
                                title="Delete collection"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* CREATE / EDIT COLLECTION MODAL                                      */}
      {/* ==================================================================== */}
      {isEditModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto ${
            isDark ? 'bg-black/80' : 'bg-black/60'
          }`}
        >
          <div
            className={`border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-stone-800 bg-stone-950/60' : 'border-stone-200 bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-rose-950/80 border border-rose-900/60 text-rose-400'
                      : 'bg-rose-100 border border-rose-200 text-rose-800'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className={`text-lg font-serif font-bold ${
                      isDark ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    {editingCollectionId ? 'Edit Collection' : 'Create New Collection'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {isVendor
                      ? 'Create lookbooks exclusively using your vendor catalogue.'
                      : formVendorId
                      ? `Vendor Scoped Collection`
                      : 'Platform House Collection (Iccha B2B)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  isDark
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            {modalLoading ? (
              <div className="p-12 flex items-center justify-center text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              </div>
            ) : (
              <form onSubmit={handleSaveCollection} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* 1. Basic Details */}
                <div className="space-y-4">
                  <h3
                    className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5 text-rose-500" />
                    General Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label
                        className={`block text-xs font-medium mb-1.5 ${
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        }`}
                      >
                        Collection Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Virasat Festive Kurti Sets 2026"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                          isDark
                            ? 'bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-rose-600 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className={`block text-xs font-medium mb-1.5 ${
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        }`}
                      >
                        Description / Editorial Note
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="A concise description highlighting fabrics, craftsmanship, or seasonal themes for wholesale boutique buyers..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                          isDark
                            ? 'bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-rose-600 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Cover Photo & Image Fallback Section (Requirement 6) */}
                <div
                  className={`space-y-3 pt-4 border-t ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                        Collection Cover Photo
                      </h3>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-stone-500' : 'text-stone-500'
                        }`}
                      >
                        Upload a bespoke campaign banner, or let it automatically inherit the 1st
                        product&rsquo;s image.
                      </p>
                    </div>

                    {formMediaAssetId && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomImage}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                      >
                        Reset to 1st Product Photo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Visual Preview Box */}
                    <div
                      className={`relative aspect-[16/10] rounded-2xl border overflow-hidden flex items-center justify-center ${
                        isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-100 border-stone-200'
                      }`}
                    >
                      {activeCoverImageUrl ? (
                        <>
                          <img
                            src={activeCoverImageUrl}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 backdrop-blur-md rounded-lg text-[10px] border ${
                              isDark
                                ? 'bg-stone-950/85 text-stone-300 border-stone-800'
                                : 'bg-white/90 text-stone-700 border-stone-200 shadow-sm'
                            }`}
                          >
                            <span>
                              {formMediaAssetId ? '★ Custom Image' : 'Auto 1st Product'}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Active Preview
                            </span>
                          </div>
                        </>
                      ) : (
                        <div
                          className={`text-center p-4 space-y-1 ${
                            isDark ? 'text-stone-600' : 'text-stone-400'
                          }`}
                        >
                          <ImageIcon className="w-8 h-8 mx-auto" />
                          <p className="text-[11px] font-medium">No cover photo yet</p>
                          <p className="text-[10px]">Add a product below or upload photo</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div
                      className={`md:col-span-2 p-4 rounded-2xl border space-y-3 ${
                        isDark
                          ? 'bg-stone-950/50 border-stone-800/80'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="collection-image-input"
                        />

                        <button
                          type="button"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm ${
                            isDark
                              ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                              : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200'
                          }`}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-rose-500" />
                              Upload Custom Image
                            </>
                          )}
                        </button>

                        <span
                          className={`text-[11px] ${
                            isDark ? 'text-stone-400' : 'text-stone-500'
                          }`}
                        >
                          Recommended ratio 16:10 (1200x750px or higher, max 15MB)
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          isDark
                            ? 'bg-rose-950/20 border-rose-900/30 text-rose-300/90'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <strong>Smart Fallback Active:</strong> If you don&rsquo;t upload a custom
                        image, the collection will automatically feature the primary photo of the{' '}
                        <strong>#1 Product</strong> in your collection sequence below.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Products in this Collection (Scoped & Ordered) */}
                <div
                  className={`space-y-3 pt-4 border-t ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5 text-rose-500" />
                        Products in this Collection ({selectedProducts.length})
                      </h3>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-stone-500' : 'text-stone-500'
                        }`}
                      >
                        Products are listed in display order. The first product (#1) automatically acts
                        as the lookbook cover.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openProductPicker}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isDark
                          ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/60'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add / Edit Products
                    </button>
                  </div>

                  {selectedProducts.length === 0 ? (
                    <div
                      className={`p-8 text-center rounded-2xl border border-dashed space-y-2 ${
                        isDark ? 'border-stone-800 bg-stone-950/40' : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      <Package
                        className={`w-8 h-8 mx-auto ${
                          isDark ? 'text-stone-600' : 'text-stone-400'
                        }`}
                      />
                      <p
                        className={`text-xs font-medium ${
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        }`}
                      >
                        No products added to this collection yet.
                      </p>
                      <button
                        type="button"
                        onClick={openProductPicker}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                          isDark
                            ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-sm'
                        }`}
                      >
                        Select from your catalogue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selectedProducts.map((p, index) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                            index === 0
                              ? isDark
                                ? 'bg-rose-950/20 border-rose-900/40'
                                : 'bg-rose-50/70 border-rose-200 shadow-sm'
                              : isDark
                              ? 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700'
                              : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Sequence Badge */}
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                index === 0
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : isDark
                                  ? 'bg-stone-800 text-stone-300'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {index + 1}
                            </span>

                            {/* Product Thumbnail */}
                            <div
                              className={`w-12 h-14 rounded-lg overflow-hidden shrink-0 border ${
                                isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'
                              }`}
                            >
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    isDark ? 'text-stone-600' : 'text-stone-400'
                                  }`}
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono text-[10px] font-bold ${
                                    isDark ? 'text-amber-400' : 'text-amber-700'
                                  }`}
                                >
                                  {p.designNumber}
                                </span>
                                {index === 0 && (
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                                      isDark
                                        ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                                        : 'bg-rose-100 text-rose-800 border-rose-300'
                                    }`}
                                  >
                                    ★ Cover Image Source
                                  </span>
                                )}
                              </div>
                              <h4
                                className={`text-xs font-medium truncate max-w-xs sm:max-w-md ${
                                  isDark ? 'text-white' : 'text-stone-900'
                                }`}
                              >
                                {p.name}
                              </h4>
                              <p
                                className={`text-[11px] ${
                                  isDark ? 'text-stone-400' : 'text-stone-500'
                                }`}
                              >
                                ₹{p.pricePerSet.toLocaleString('en-IN')} / set ({p.piecesPerSet} pcs)
                              </p>
                            </div>
                          </div>

                          {/* Reorder and Delete Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveProduct(index, 'up')}
                              className={`p-1.5 rounded-lg disabled:opacity-30 transition ${
                                isDark
                                  ? 'bg-stone-900 hover:bg-stone-800 text-stone-300'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              }`}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={index === selectedProducts.length - 1}
                              onClick={() => moveProduct(index, 'down')}
                              className={`p-1.5 rounded-lg disabled:opacity-30 transition ${
                                isDark
                                  ? 'bg-stone-900 hover:bg-stone-800 text-stone-300'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              }`}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeProductFromCollection(p.id)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? 'bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-400'
                                  : 'bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700'
                              }`}
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Tags and Badges */}
                <div
                  className={`space-y-3 pt-4 border-t ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <h3
                    className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    Tags & Discovery
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((pt) => {
                      const selected = formTags.includes(pt);
                      return (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => (selected ? handleRemoveTag(pt) : handleAddTag(pt))}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                            selected
                              ? isDark
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 font-medium'
                                : 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                              : isDark
                              ? 'bg-stone-950 text-stone-400 border-stone-800 hover:text-white'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {pt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom tag input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="Type custom tag and press Enter..."
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                        isDark
                          ? 'bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500'
                          : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-rose-600 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                      }`}
                    >
                      Add Tag
                    </button>
                  </div>

                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTags.map((t) => (
                        <span
                          key={t}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg ${
                            isDark
                              ? 'bg-stone-800 text-stone-200'
                              : 'bg-stone-100 text-stone-800 border border-stone-200'
                          }`}
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Visibility & Publishing Settings */}
                <div
                  className={`space-y-4 pt-4 border-t ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <h3
                    className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                    Publishing & Display Settings
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${
                        isDark
                          ? 'bg-stone-950 border-stone-800'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-xs font-semibold block ${
                            isDark ? 'text-white' : 'text-stone-900'
                          }`}
                        >
                          Published Status
                        </span>
                        <span
                          className={`text-[11px] ${
                            isDark ? 'text-stone-500' : 'text-stone-500'
                          }`}
                        >
                          Visible to authenticated retailers
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormIsPublished(!formIsPublished)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                          formIsPublished ? 'bg-emerald-600 justify-end' : 'bg-stone-400 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        }`}
                      >
                        Display Priority / Sort Order
                      </label>
                      <input
                        type="number"
                        value={formSortOrder}
                        onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                        placeholder="0"
                        className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition ${
                          isDark
                            ? 'bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-rose-600 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  className={`pt-6 border-t flex items-center justify-end gap-3 sticky bottom-0 pb-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isDark
                        ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingCollection}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-60"
                  >
                    {savingCollection ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingCollectionId ? 'Save Changes' : 'Create Collection'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRODUCT PICKER MODAL (STRICT VENDOR ISOLATION)                      */}
      {/* ==================================================================== */}
      {isProductPickerOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
            isDark ? 'bg-black/85' : 'bg-black/60'
          }`}
        >
          <div
            className={`border rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div>
                <h3
                  className={`text-sm font-serif font-bold ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  Select Products
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {isVendor
                    ? 'Showing only your approved active wholesale products.'
                    : formVendorId
                    ? 'Showing active products for selected vendor.'
                    : 'Showing platform products.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                  isDark
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div
              className={`p-3 border-b ${
                isDark
                  ? 'bg-stone-950/40 border-stone-800/80'
                  : 'bg-stone-50/70 border-stone-200'
              }`}
            >
              <div className="relative">
                <Search
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}
                />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => searchPickerProducts(e.target.value)}
                  placeholder="Search by Design #, title or SKU..."
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition focus:outline-none ${
                    isDark
                      ? 'bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:border-rose-500'
                      : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-600 shadow-sm'
                  }`}
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {pickerLoading ? (
                <div className="py-12 flex items-center justify-center text-stone-500">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                </div>
              ) : availableProducts.length === 0 ? (
                <div
                  className={`py-10 text-center text-xs ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  No active products found matching your search.
                </div>
              ) : (
                availableProducts.map((p) => {
                  const isChecked = tempCheckedProductIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleCheckProduct(p.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? isDark
                            ? 'bg-rose-950/30 border-rose-800/70'
                            : 'bg-rose-50 border-rose-300'
                          : isDark
                          ? 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                          : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-rose-600 border-rose-500 text-white'
                              : isDark
                              ? 'border-stone-700 bg-stone-900'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>

                        {/* Thumbnail */}
                        <div
                          className={`w-10 h-12 rounded-lg overflow-hidden shrink-0 border ${
                            isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-200 border-stone-200'
                          }`}
                        >
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center ${
                                isDark ? 'text-stone-600' : 'text-stone-400'
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                          <span
                            className={`font-mono text-[10px] font-bold block ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}
                          >
                            {p.designNumber}
                          </span>
                          <h4
                            className={`text-xs font-medium truncate max-w-sm ${
                              isDark ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {p.name}
                          </h4>
                          <span
                            className={`text-[11px] ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}
                          >
                            ₹{p.wholesalePricePerSet.toLocaleString('en-IN')} / set ({p.piecesPerSet} pcs)
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] shrink-0 font-medium ${
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        }`}
                      >
                        {p.availableSets} sets in stock
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between ${
                isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {tempCheckedProductIds.size} product{tempCheckedProductIds.size === 1 ? '' : 's'}{' '}
                selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isDark
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyProductSelection}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                >
                  Apply Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DELETE CONFIRMATION DIALOG                                          */}
      {/* ==================================================================== */}
      {deleteTarget && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isDark ? 'bg-black/80' : 'bg-black/60'
          }`}
        >
          <div
            className={`border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-rose-950/60 border border-rose-900/50'
                    : 'bg-rose-100 border border-rose-200'
                }`}
              >
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3
                className={`font-serif font-bold text-base ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                Delete Collection?
              </h3>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-stone-400' : 'text-stone-600'
              }`}
            >
              Are you sure you want to remove &ldquo;{deleteTarget.name}&rdquo;? The products in this
              collection will remain untouched in your catalogue.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  isDark
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Collection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
