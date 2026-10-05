'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Save,
  Building2,
  ChevronLeft,
  Loader2,
  QrCode
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';

interface Vendor {
  id: string;
  businessName: string;
  contactName: string;
  mobile: string;
  gstin: string;
  isActive: boolean;
  _count: { products: number };
}

interface BillingEntity {
  id: string;
  code: string;
  legalName: string;
  tradeName: string | null;
  gstin: string;
  state: string;
  stateCode: string;
}

interface Category {
  id: string;
  name: string;
  requiresSize: boolean;
}

interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
}


interface Product {
  id: string;
  sku: string;
  designNumber: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: { name: string };
  vendor?: { id: string; businessName: string } | null;
  warehouse?: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    isActive: boolean;
  } | null;
  gstConfig?: {
    id: string;
    hsnCode: string;
    cgstRate: string | number;
    sgstRate: string | number;
    igstRate: string | number;
    billingEntity: {
      id: string;
      code: string;
      legalName: string;
      tradeName: string | null;
      state: string;
      stateCode: string;
      gstin: string;
    };
  } | null;
  wholesalePricePerPiece: string | number;
  piecesPerSet: number;
  wholesalePricePerSet: string | number;
  availableSets: number;
  sizeCombination: string;
  color: string;
  fabric: string;
  workType: string;
  style: string;
  clothingType: string;
  hsnCode: string;
  minOrderSets: number;
  media?: { mediaAsset: { publicUrl: string } }[]
  sizes?: { id: string; size: string; availableSets: number; sortOrder: number }[]
}

type SortKey = 'newest' | 'oldest' | 'price_high' | 'price_low';

export default function AdminProductsPage() {
  const { addToast } = useApp();

  // view: 'vendors' = selection screen, 'products' = a vendor's (or house's) product list
  const [view, setView] = useState<'vendors' | 'products'>('vendors');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [billingEntities, setBillingEntities] = useState<BillingEntity[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [ownGstin, setOwnGstin] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/billing-entities')
      .then(res => res.json())
      .then(json => {
        if (json.success) setBillingEntities(json.data);
      })
      .catch(() => { }); // silent — the form still works, it just won't show a preview
  }, []);

  useEffect(() => {
    if (currentUserRole !== 'VENDOR') return;
    fetch('/api/vendor/profile')
      .then(res => res.json())
      .then(json => {
        if (json.success) setOwnGstin(json.data.gstin);
      })
      .catch(() => { });
  }, [currentUserRole]);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorSearch, setVendorSearch] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [qrMediaAssets, setQrMediaAssets] = useState<{ id: string; url: string }[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentUserChecked, setCurrentUserChecked] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [sizeStocks, setSizeStocks] = useState<{ size: string; availableSets: number }[]>([]);
  const [stockAddition, setStockAddition] = useState(0);
  const [sizeStockAdditions, setSizeStockAdditions] = useState<{ size: string; availableSets: number }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    designNumber: '',
    categoryId: '',
    warehouseId: '',
    wholesalePricePerPiece: 500,
    piecesPerSet: 1,
    sizeCombination: 'M, L, XL, XXL',
    availableSets: 0,
    fabric: '',
    workType: '',
    style: '',
    clothingType: 'kurti_set',
    hsnCode: '621142',
    minOrderSets: 1,
    color: '',
    description: ''
  });

  // --- Load vendor list ---
  const loadVendors = useCallback(async (search: string) => {
    setVendorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/vendors?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setVendors(json.data);
      } else {
        addToast({ type: 'error', title: 'Failed to load vendors', message: json.error });
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not load vendors.' });
    } finally {
      setVendorsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // Wait until the role is known; the vendor list is staff-only (vendors would get a 403).
    if (view === 'vendors' && currentUserRole && currentUserRole !== 'VENDOR') {
      loadVendors(vendorSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentUserRole]);

  const handleVendorSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors(vendorSearch);
  };

  // --- Load categories (once) ---
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCategories(json.data);
      })
      .catch(() => {
        // Category dropdown will just be empty; product creation will fail validation until this exists.
      });
  }, []);

  // --- Load warehouses ---
  // Vendors see only their own warehouses.
  // Admin/staff can select from all active warehouses.
  useEffect(() => {
    if (!currentUserRole) return;

    const loadWarehouses = async () => {
      try {
        setWarehousesLoading(true);

        const res = await fetch('/api/vendor/warehouses');
        const json = await res.json();

        if (json.success) {
          setWarehouses(json.data);
        } else {
          addToast({
            type: 'error',
            title: 'Failed to load warehouses',
            message: json.error || 'Could not load warehouses.',
          });
        }
      } catch {
        addToast({
          type: 'error',
          title: 'Network error',
          message: 'Could not load warehouses.',
        });
      } finally {
        setWarehousesLoading(false);
      }
    };

    loadWarehouses();
  }, [currentUserRole, addToast]);
  // --- Load products for a selected vendor (or house products if vendor is null) ---
  const loadProducts = useCallback(async (
    vendorId: string | null,
    search: string,
    cursor?: string,
    sort: SortKey = 'newest'
  ) => {
    if (cursor) setLoadingMore(true); else setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (vendorId) params.set('vendorId', vendorId);
      if (search) params.set('search', search);
      if (cursor) params.set('cursor', cursor);
      params.set('sortBy', sort);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(prev => (cursor ? [...prev, ...json.data] : json.data));
        setNextCursor(json.nextCursor);
      } else {
        addToast({ type: 'error', title: 'Failed to load products', message: json.error });
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not load products.' });
    } finally {
      setProductsLoading(false);
      setLoadingMore(false);
    }
  }, [addToast]);

  // Determine who's logged in — a vendor skips the vendor-picker entirely and only ever
  // sees their own products (the backend already enforces this; this just matches the UI to it).
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCurrentUserRole(json.data.role);
          if (json.data.role === 'VENDOR') {
            setView('products');
            loadProducts(null, '', undefined, 'newest');
          }
        }
      })
      .finally(() => setCurrentUserChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVendorProducts = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setProductSearch('');
    setSortBy('newest'); // reset sort when switching vendors, for predictable behavior
    setView('products');
    loadProducts(vendor.id, '', undefined, 'newest');
  };

  const openHouseProducts = () => {
    setSelectedVendor(null);
    setProductSearch('');
    setSortBy('newest');
    setView('products');
    loadProducts(null, '', undefined, 'newest');
  };

  const handleProductSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(selectedVendor?.id ?? null, productSearch, undefined, sortBy);
  };

  const handleSortChange = (newSort: SortKey) => {
    setSortBy(newSort);
    loadProducts(selectedVendor?.id ?? null, productSearch, undefined, newSort); // cursor omitted — fresh page
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      loadProducts(selectedVendor?.id ?? null, productSearch, nextCursor, sortBy);
    }
  };

  // --- Create product ---
  const openAddModal = () => {
    setEditingProduct(null);

    setFormData({
      name: '',
      sku: '',
      designNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: categories[0]?.id || '',
      warehouseId: '',
      wholesalePricePerPiece: 500,
      piecesPerSet: 1,
      sizeCombination: '',
      availableSets: 0,
      fabric: '',
      workType: '',
      style: '',
      clothingType: 'kurti_set',
      hsnCode: '621142',
      minOrderSets: 1,
      color: '',
      description: ''
    });
    setSizeStocks([]);
    setStockAddition(0);
    setSizeStockAdditions([]);
    setImageFiles([]);
    setQrMediaAssets([]);
    setIsModalOpen(true);
  };

  // --- QR "scan to upload" flow ---
  const openQrUpload = async () => {
    try {
      const body = selectedVendor ? { vendorId: selectedVendor.id } : {};
      const res = await fetch('/api/admin/products/upload-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setQrToken(json.data.token);
        setQrModalOpen(true);
      } else {
        addToast({ type: 'error', title: 'Could not start QR upload', message: json.error });
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not start QR upload.' });
    }
  };

  // Poll every 3s while the QR modal is open — the moment the phone finishes
  // uploading, pull the photo + the vendor's default warehouse straight in.
  useEffect(() => {
    if (!qrModalOpen || !qrToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/products/upload-session?token=${qrToken}`);
        const json = await res.json();
        if (!json.success) return;

        if (json.data.status === 'uploaded' && json.data.mediaAssets?.length) {
          setQrMediaAssets(prev => [...prev, ...json.data.mediaAssets.map((a: { id: string; publicUrl: string }) => ({ id: a.id, url: a.publicUrl })), ]);
          setFormData(prev => ({
            ...prev,
            sku: prev.sku || `IC-${(json.data.vendor?.vendorCode || 'GEN')}-${Math.floor(1000 + Math.random() * 9000)}`,
            warehouseId: prev.warehouseId || json.data.warehouse?.id || prev.warehouseId,
          }));
          addToast({ type: 'success', title: 'Photo received', message: 'Uploaded from phone — form updated automatically.' });
          setQrModalOpen(false);
          setQrToken(null);
        } else if (json.data.status === 'expired') {
          addToast({ type: 'error', title: 'QR code expired', message: 'Please generate a new one.' });
          setQrModalOpen(false);
          setQrToken(null);
        }
      } catch {
        // network hiccup — silently retry on the next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [qrModalOpen, qrToken, addToast]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const requiresSize = Boolean(selectedCategory?.requiresSize);
    const isVendorEdit = Boolean(editingProduct && currentUserRole === 'VENDOR');

    // Stock is optional now. The only stock-related check left is duplicate sizes.
    const hasDuplicates = (rows: { size: string }[]) => {
      const sizes = rows.map(r => r.size.trim().toUpperCase()).filter(Boolean);
      return new Set(sizes).size !== sizes.length;
    };

    if (requiresSize && hasDuplicates(isVendorEdit ? sizeStockAdditions : sizeStocks)) {
      addToast({
        type: 'error',
        title: 'Duplicate size',
        message: 'Each size can be entered only once.',
      });
      return;
    }

    if (!editingProduct && imageFiles.length + qrMediaAssets.length < 2) {
      addToast({
        type: 'error',
        title: 'More photos needed',
        message: 'Please add at least 2 product images.'
      });
      return;
    }

    const mediaAssetIds: string[] = [...qrMediaAssets.map(m => m.id)];

    if (imageFiles.length > 0) {
      setUploading(true);
    }

    try {
      for (const file of imageFiles) {
        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('mediaType', 'PRODUCT_IMAGE');
        const uploadRes = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) {
          mediaAssetIds.push(uploadJson.data.id);
        } else {
          addToast({ type: 'error', title: 'Image upload failed', message: uploadJson.error?.message || 'Try again.' });
          setUploading(false);
          return;
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not upload images.' });
      setUploading(false);
      return;
    }
    setUploading(false);

    // Drop blank size rows so they don't fail the API's "Size is required" rule.
    const cleanSizeStocks = sizeStocks
      .filter(s => s.size.trim())
      .map(s => ({ size: s.size.trim(), availableSets: Number(s.availableSets) || 0 }));

    const payload: Record<string, unknown> = {
      sku: formData.sku,
      name: formData.name,
      designNumber: formData.designNumber,
      slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categoryId: formData.categoryId,
      warehouseId: formData.warehouseId,
      wholesalePricePerPiece: Number(formData.wholesalePricePerPiece),
      piecesPerSet: Number(formData.piecesPerSet),
      wholesalePricePerSet: Number(formData.wholesalePricePerPiece) * Number(formData.piecesPerSet),
      availableSets: requiresSize
        ? cleanSizeStocks.reduce((sum, s) => sum + s.availableSets, 0)
        : Number(formData.availableSets) || 0,
      sizeCombination: requiresSize ? cleanSizeStocks.map(s => s.size).join(', ') : '',
      sizeStocks: requiresSize ? cleanSizeStocks : [],
      color: formData.color,
      fabric: formData.fabric,
      workType: formData.workType,
      style: formData.style,
      clothingType: formData.clothingType,
      hsnCode: formData.hsnCode,
      minOrderSets: Number(formData.minOrderSets),
      description: formData.description
    };

    // Vendor edits are stock additions, not stock replacements.
    // Admin/staff edits continue to use the existing absolute-stock behavior.
    if (editingProduct && currentUserRole === 'VENDOR') {
      payload.stockAdjustment = requiresSize ? 0 : Math.max(0, Number(stockAddition) || 0);
      payload.sizeStockAdjustments = requiresSize
        ? sizeStockAdditions
          .filter(row => row.size.trim() && Number(row.availableSets) > 0)
          .map(row => ({
            size: row.size.trim(),
            availableSets: Number(row.availableSets),
          }))
        : [];
    }

    if (mediaAssetIds.length > 0) {
      payload.mediaAssetIds = mediaAssetIds;
    }

    if (selectedVendor) {
      payload.vendorId = selectedVendor.id;
    }

    try {
      const isEditing = Boolean(editingProduct);

      if (isEditing && editingProduct) {
        payload.productId = editingProduct.id;
      }

      const res = await fetch('/api/admin/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success) {
        addToast({
          type: 'success',
          title: isEditing ? 'Product Updated' : 'Product Added',
          message: isEditing
            ? `${formData.name} updated successfully.`
            : `${formData.name} created.`
        });

        setIsModalOpen(false);
        setEditingProduct(null);
        loadProducts(selectedVendor?.id ?? null, productSearch, undefined, sortBy);
      } else {
        addToast({
          type: 'error',
          title: isEditing ? 'Failed to update product' : 'Failed to create product',
          message: json.error
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Network error',
        message: editingProduct
          ? 'Could not update product.'
          : 'Could not create product.'
      });
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      designNumber: product.designNumber || '',
      categoryId: product.categoryId || '',
      warehouseId: product.warehouse?.id || '',
      wholesalePricePerPiece: Number(product.wholesalePricePerPiece) || 0,
      piecesPerSet: Math.max(1, Number(product.piecesPerSet) || 1),
      sizeCombination: product.sizeCombination || '',
      availableSets: Number(product.availableSets) || 0,
      fabric: product.fabric || '',
      workType: product.workType || '',
      style: product.style || '',
      clothingType: product.clothingType || 'kurti_set',
      hsnCode: product.hsnCode || '621142',
      minOrderSets: Math.max(1, Number(product.minOrderSets) || 1),
      color: product.color || '',
      description: product.description || ''
    });

    setSizeStocks(
      (product.sizes || []).map(s => ({ size: s.size, availableSets: s.availableSets }))
    );
    setStockAddition(0);
    setSizeStockAdditions(
      (product.sizes || []).map(s => ({ size: s.size, availableSets: 0 }))
    );
    setImageFiles([]);
    setQrMediaAssets([]);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (json.success) {
        addToast({
          type: 'success',
          title: 'Product Deleted',
          message: `${product.name} has been deleted.`,
        });

        loadProducts(
          selectedVendor?.id ?? null,
          productSearch,
          undefined,
          sortBy
        );
      } else {
        addToast({
          type: 'error',
          title: 'Could not delete product',
          message: json.error || 'Please try again.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Network error',
        message: 'Could not delete product.',
      });
    }
  };

  // ============================================================
  // VENDOR SELECTION SCREEN
  // ============================================================
  if (!currentUserChecked) {
    return (
      <div className="flex min-h-screen bg-[#faf8f5]">
        <AdminSidebar activeTab="products" />
        <main className="flex-1 p-6 lg:p-10 flex items-center justify-center">
          <div className="text-xs text-stone-500">Loading...</div>
        </main>
      </div>
    );
  }
  if (view === 'vendors') {
    return (
      <div className="flex min-h-screen bg-[#faf8f5]">
        <AdminSidebar activeTab="products" />
        <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
          <div className="border-b border-stone-200 pb-6">
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              Product Catalogue
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Select a Vendor
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose a vendor to view and manage only their products, or manage IcchaStore&apos;s own listings.
            </p>
          </div>

          <form onSubmit={handleVendorSearchSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                placeholder="Search vendors by name, contact, or GSTIN..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-stone-800 text-white rounded-xl font-bold">
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={openHouseProducts}
            className="w-full text-left bg-white rounded-2xl p-4 border-2 border-dashed border-stone-300 hover:border-rose-900 transition flex items-center gap-3"
          >
            <Building2 className="w-5 h-5 text-stone-500" />
            <div>
              <div className="font-bold text-stone-900 text-sm">IcchaStore Own Products</div>
              <div className="text-xs text-stone-500">Products not assigned to any vendor</div>
            </div>
          </button>

          {vendorsLoading ? (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
              Loading vendors...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => openVendorProducts(v)}
                  className="text-left bg-white rounded-2xl p-4 border border-stone-200 hover:border-rose-900 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <strong className="font-serif text-base text-stone-900">{v.businessName}</strong>
                    {v.isActive && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{v.contactName} &bull; {v.mobile}</div>
                  <div className="text-[10px] font-mono text-stone-400 mt-1">{v.gstin}</div>
                  <div className="mt-2 text-xs font-bold text-rose-900">
                    {v._count.products} product{v._count.products === 1 ? '' : 's'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }
  // Real data once the product has been saved; a same-shape preview before that, so this
  // card can appear in both the create and edit forms.
  const gstin = selectedVendor?.gstin ?? ownGstin;
  const previewEntity =
    editingProduct?.gstConfig?.billingEntity ??
    (gstin
      ? billingEntities.find(e => e.gstin === gstin) ?? null
      : billingEntities.find(e => !e.code.startsWith('vendor:')) ?? null);

  // GSTConfiguration.create always uses these defaults (see prisma/schema.prisma), so a
  // brand-new product's rates are known even before the row exists.
  const previewRates = editingProduct?.gstConfig
    ? {
      cgst: editingProduct.gstConfig.cgstRate,
      sgst: editingProduct.gstConfig.sgstRate,
      igst: editingProduct.gstConfig.igstRate,
    }
    : { cgst: 2.5, sgst: 2.5, igst: 5.0 };
  // ============================================================
  // PRODUCT LIST SCREEN (for selected vendor, or house products)
  // ============================================================
  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="products" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            {currentUserRole !== 'VENDOR' && (
              <button
                type="button"
                onClick={() => setView('vendors')}
                className="text-xs text-stone-500 hover:text-rose-900 flex items-center gap-1 mb-2 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Vendors
              </button>
            )}
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              {currentUserRole === 'VENDOR' ? 'My Products' : 'Product Catalogue'}
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              {currentUserRole === 'VENDOR'
                ? 'My Product Catalogue'
                : selectedVendor
                  ? selectedVendor.businessName
                  : 'IcchaStore Own Products'}
            </h1>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleProductSearchSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3 text-xs flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder={`Search within ${selectedVendor ? selectedVendor.businessName : 'these'} products only...`}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-stone-800 text-white rounded-xl font-bold">
              Search
            </button>
          </form>

          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value as SortKey)}
            className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 shadow-sm focus:outline-none focus:border-rose-900 self-start sm:self-auto"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_high">Price: High to Low</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>

        {productsLoading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            Loading products...
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4">Product / Design</th>
                      <th className="p-4">SKU / Design #</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Warehouse</th>
                      <th className="p-4">Piece / Set Rate</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400">
                          No products found.
                        </td>
                      </tr>
                    )}
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/80 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                              {p.media?.[0]?.mediaAsset?.publicUrl && (
                                <Image
                                  src={p.media[0].mediaAsset.publicUrl}
                                  alt={p.name}
                                  fill
                                  className="object-cover object-top"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                            <div>
                              <strong className="text-stone-900 block font-serif text-sm">{p.name}</strong>
                              <span className="text-[11px] text-stone-500">{p.fabric}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold text-stone-900">{p.sku}</span>
                          <span className="text-[10px] text-stone-400 block">#{p.designNumber}</span>
                        </td>
                        <td className="p-4">
                          {p.category?.name || '—'}
                        </td>

                        <td className="p-4">
                          {p.warehouse ? (
                            <>
                              <span className="font-bold text-stone-900 block">
                                {p.warehouse.name}
                              </span>

                              {p.warehouse.city && (
                                <span className="text-[10px] text-stone-500">
                                  {p.warehouse.city}
                                  {p.warehouse.state
                                    ? `, ${p.warehouse.state}`
                                    : ''}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-stone-900">
                            ₹{p.wholesalePricePerPiece} <span className="text-[10px] text-stone-400 font-normal">/pc</span>
                          </div>
                          <span className="font-mono text-rose-900 text-[11px]">
                            ₹{Number(p.wholesalePricePerSet).toLocaleString('en-IN')} /set ({p.piecesPerSet} pcs)
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => openEditModal(p)} className="p-2 hover:bg-stone-100 text-stone-700 rounded-lg transition">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteProduct(p)} className="p-2 hover:bg-rose-50 text-rose-700 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {nextCursor && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs hover:border-rose-900 transition inline-flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          {/*
            Rounded corners live on this OUTER wrapper (rounded-3xl + overflow-hidden),
            while scrolling happens on the INNER wrapper below — keeps the scrollbar
            track from clipping into the rounded corner / overlapping the content.
          */}
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 sm:p-8 pr-4 sm:pr-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  {editingProduct
                    ? `Edit Product${currentUserRole === 'VENDOR' ? '' : selectedVendor ? ` for ${selectedVendor.businessName}` : ''}`
                    : `Add New Product ${currentUserRole === 'VENDOR' ? '' : selectedVendor ? `for ${selectedVendor.businessName}` : '(IcchaStore Own)'}`}
                </h2>
                <button type="button" onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null);
                  setQrModalOpen(false);
                  setQrToken(null)
                }} className="text-stone-400 font-bold text-sm">
                  &times; Close
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Design Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Minimum Order Quantity (Sets) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.minOrderSets}
                    onChange={e => setFormData({ ...formData, minOrderSets: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:border-rose-900"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    The smallest number of sets a retailer can order for this design in one go — separate from the site-wide minimum order quantity. Set to 1 if there's no per-design minimum.
                  </p>
                </div>
                {previewEntity && (
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-stone-800 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" />
                      {editingProduct ? 'Billed Under (auto-assigned, read-only)' : 'Will Be Billed Under'}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Entity</span>
                        <span className="font-semibold text-stone-800">
                          {previewEntity.tradeName || previewEntity.legalName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">GSTIN</span>
                        <span className="font-mono font-semibold text-stone-800">
                          {previewEntity.gstin}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">State</span>
                        <span className="font-semibold text-stone-800">
                          {previewEntity.state} ({previewEntity.stateCode})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Tax Rates (CGST/SGST/IGST)</span>
                        <span className="font-semibold text-stone-800">
                          {previewRates.cgst}% / {previewRates.sgst}% / {previewRates.igst}%
                        </span>
                      </div>
                    </div>
                    {!editingProduct && (
                      <p className="text-[10px] text-stone-400 pt-1">
                        Resolved automatically from the product owner when you save — this cannot be changed manually.
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block font-bold text-stone-800">Product Photos {editingProduct ? '(optional while editing)' : '* (minimum 2)'}</label>
                    <button type="button" onClick={openQrUpload}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg px-2.5 py-1.5 transition">
                      <QrCode className="w-3.5 h-3.5" />
                      Scan to upload from phone
                    </button>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={e => {
                      const newFiles = Array.from(e.target.files || []);
                      setImageFiles(prev => [...prev, ...newFiles]);
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-[11px]"
                  />
                  <p className={`text-[10px] mt-1 ${!editingProduct && imageFiles.length + qrMediaAssets.length < 2
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                    }`}>
                    {imageFiles.length + qrMediaAssets.length} photo{imageFiles.length + qrMediaAssets.length === 1 ? '' : 's'} selected
                    {!editingProduct && imageFiles.length + qrMediaAssets.length < 2 && ' — at least 2 required'}
                    {editingProduct && ' — existing photos will be preserved'}
                  </p>
                  {(imageFiles.length > 0 || qrMediaAssets.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {qrMediaAssets.map((asset, idx) => (
                        <div key={asset.id} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                          <Image src={asset.url} alt="Uploaded from phone" width={20} height={20} className="w-5 h-5 rounded object-cover" />
                          <span className="text-[10px] text-rose-900 font-medium">From phone</span>
                          <button
                            type="button"
                            onClick={() => setQrMediaAssets(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-700 font-bold text-xs leading-none"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-stone-100 border border-stone-300 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-stone-700 truncate max-w-[100px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-rose-700 font-bold text-xs leading-none"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Warehouse{currentUserRole === 'VENDOR' ? ' *' : ''}
                  </label>

                  <select
                    required={currentUserRole === 'VENDOR'}
                    value={formData.warehouseId}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        warehouseId: e.target.value,
                      })
                    }
                    disabled={warehousesLoading}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 disabled:opacity-60"
                  >
                    <option value="">
                      {warehousesLoading
                        ? 'Loading warehouses...'
                        : currentUserRole === 'VENDOR'
                          ? 'Select a warehouse...'
                          : 'No warehouse / Select warehouse...'}
                    </option>

                    {warehouses
                      .filter(warehouse => warehouse.isActive)
                      .map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                          {warehouse.city ? ` — ${warehouse.city}` : ''}
                        </option>
                      ))}
                  </select>

                  {!warehousesLoading &&
                    warehouses.filter(warehouse => warehouse.isActive).length === 0 && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        {currentUserRole === 'VENDOR'
                          ? 'You have not added a warehouse yet. Please add a warehouse before creating a product.'
                          : 'No active warehouses are available. You can leave this product unassigned or add a warehouse first.'}
                      </p>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. ICK-0001"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:border-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Design Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.designNumber}
                      onChange={e => setFormData({ ...formData, designNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-rose-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => {
                      const categoryId = e.target.value;
                      const category = categories.find(c => c.id === categoryId);
                      setFormData({ ...formData, categoryId, sizeCombination: category?.requiresSize ? formData.sizeCombination : '' });
                      setSizeStocks([]);
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                  >
                    <option value="">Select a category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      No categories loaded — the categories API may not exist yet.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Piece Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.wholesalePricePerPiece}
                      onChange={e => setFormData({ ...formData, wholesalePricePerPiece: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:border-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Pieces per Set *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.piecesPerSet}
                      onChange={e => setFormData({ ...formData, piecesPerSet: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-rose-900"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 -mt-2">
                  e.g. 1 = just a shirt, 2 = shirt + pant, 3 = kurti + pant + dupatta.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Fabric *</label>
                    <input
                      type="text"
                      required
                      value={formData.fabric}
                      onChange={e => setFormData({ ...formData, fabric: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Work / Embroidery *</label>
                    <input
                      type="text"
                      required
                      value={formData.workType}
                      onChange={e => setFormData({ ...formData, workType: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Style *</label>
                    <input
                      type="text"
                      required
                      value={formData.style}
                      onChange={e => setFormData({ ...formData, style: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Color *</label>
                    <input
                      type="text"
                      required
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                    />
                  </div>
                </div>

                {categories.find(c => c.id === formData.categoryId)?.requiresSize ? (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Available Sizes & Stock (optional)</label>
                      <p className="text-[10px] text-stone-500">Enter each size and the number of wholesale sets available in that size. You can leave this empty and add stock later.</p>
                    </div>
                    {currentUserRole === 'VENDOR' && editingProduct ? (
                      <>
                        <p className="text-[10px] text-stone-500">Current stock is shown below. Enter only the additional sets being added in this update.</p>
                        {sizeStockAdditions.map((row, index) => {
                          const current = sizeStocks.find(s => s.size.toLowerCase() === row.size.toLowerCase());
                          return (
                            <div key={`${index}-${row.size}`} className="grid grid-cols-[1fr_100px_120px_auto] gap-2 items-end">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-600 mb-1">Size</label>
                                <input
                                  value={row.size}
                                  onChange={e => setSizeStockAdditions(prev => prev.map((item, i) => i === index ? { ...item, size: e.target.value } : item))}
                                  placeholder="M"
                                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-600 mb-1">Current</label>
                                <div className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-mono text-stone-600">
                                  {current?.availableSets ?? 0}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-600 mb-1">Add Sets</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={row.availableSets}
                                  onChange={e => setSizeStockAdditions(prev => prev.map((item, i) => i === index ? { ...item, availableSets: Number(e.target.value) } : item))}
                                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono"
                                />
                              </div>
                              <button type="button" onClick={() => setSizeStockAdditions(prev => prev.filter((_, i) => i !== index))} className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl border border-stone-200">Remove</button>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => setSizeStockAdditions(prev => [...prev, { size: '', availableSets: 0 }])} className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800">+ Add Size Stock</button>
                      </>
                    ) : (
                      <>
                        {sizeStocks.map((row, index) => (
                          <div key={`${index}-${row.size}`} className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-600 mb-1">Size</label>
                              <input value={row.size} onChange={e => setSizeStocks(prev => prev.map((item, i) => i === index ? { ...item, size: e.target.value } : item))} placeholder="M" className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-600 mb-1">Sets</label>
                              <input type="number" min={0} value={row.availableSets} onChange={e => setSizeStocks(prev => prev.map((item, i) => i === index ? { ...item, availableSets: Number(e.target.value) } : item))} className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono" />
                            </div>
                            <button type="button" onClick={() => setSizeStocks(prev => prev.filter((_, i) => i !== index))} className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl border border-stone-200">Remove</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setSizeStocks(prev => [...prev, { size: '', availableSets: 0 }])} className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800">+ Add Size</button>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      {currentUserRole === 'VENDOR' && editingProduct ? 'Add Stock (Sets, optional)' : 'Available Sets (optional)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={currentUserRole === 'VENDOR' && editingProduct ? stockAddition : formData.availableSets}
                      onChange={e =>
                        currentUserRole === 'VENDOR' && editingProduct
                          ? setStockAddition(Number(e.target.value))
                          : setFormData({ ...formData, availableSets: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-rose-900"
                    />
                    {currentUserRole === 'VENDOR' && editingProduct && (
                      <p className="text-[10px] text-stone-400 mt-1">
                        Current stock: {Number(editingProduct.availableSets) || 0} sets. Enter only the additional sets being added.
                      </p>
                    )}
                    <p className="text-[10px] text-stone-400 mt-1">
                      This category does not require size selection. No size inventory will be shown to retailers.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {uploading
                        ? 'Uploading image...'
                        : editingProduct
                          ? currentUserRole === 'VENDOR'
                            ? 'Save Product Changes & Add Stock'
                            : 'Save Product Changes'
                          : 'Save & Publish to Catalogue'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* QR "Scan to upload from phone" modal */}
      {qrModalOpen && qrToken && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Scan with your phone</h3>
            <p className="text-xs text-stone-500 mb-4">
              Open your camera app and scan this code to take or upload a product photo directly
              from your phone.
            </p>

            <div className="mx-auto w-48 h-48 border border-stone-200 rounded-xl overflow-hidden bg-stone-50 flex items-center justify-center">
              {typeof window !== 'undefined' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `${window.location.origin}/upload/${qrToken}`
                  )}`}
                  alt="Scan to upload a product photo from your phone"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mt-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Waiting for your photo&hellip;
            </div>

            <button
              type="button"
              onClick={() => { setQrModalOpen(false); setQrToken(null); }}
              className="mt-5 w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}