'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  FolderTree,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  requiresSize: boolean;
  vendorId?: string | null;
  mediaAsset?: { publicUrl: string } | null;
  gst?: string | null;
  _count?: { products: number };
}

interface Vendor {
  id: string;
  businessName: string;
  contactName: string;
  mobile: string;
  gstin: string | null;
  isActive: boolean;
}

const GST_PRESETS = ['0', '0.25', '1.5', '3', '5', '18', '40'];

export default function AdminCategoriesPage() {
  const { addToast } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    requiresSize: false,
    gst: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedOwner, setSelectedOwner] = useState("admin");
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  const [gstMode, setGstMode] = useState<'preset' | 'custom'>('preset');

  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorCursor, setVendorCursor] = useState<string | null>(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingMoreVendors, setLoadingMoreVendors] = useState(false);

  const vendorLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadCategories = async (owner = selectedOwner) => {
    setLoading(true);

    try {
      let url = "/api/admin/categories";

      if (isStaff && owner === "admin") {
        url += "?owner=admin";
      } else if (isStaff && owner !== "admin") {
        url += `?vendorId=${encodeURIComponent(owner)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setCategories(json.data);
      } else {
        addToast({
          type: "error",
          title: "Failed to load categories",
          message: json.error,
        });
      }
    } catch {
      addToast({
        type: "error",
        title: "Network error",
        message: "Could not load categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async (
    cursor: string | null = null,
    search = vendorSearch
  ) => {
    if (cursor) {
      setLoadingMoreVendors(true);
    } else {
      setLoadingVendors(true);
    }

    try {
      const params = new URLSearchParams();

      if (cursor) params.set("cursor", cursor);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/vendors?${params.toString()}`);
      const json = await res.json();

      if (res.status === 403) {
        setIsStaff(false);
        return;
      }

      if (!res.ok || !json.success) {
        addToast({
          type: "error",
          title: "Failed to load vendors",
          message: json.error || "Could not load vendors.",
        });
        return;
      }

      setIsStaff(true);

      setVendors((prev) =>
        cursor ? [...prev, ...json.data] : json.data
      );

      setVendorCursor(json.nextCursor || null);
    } catch {
      addToast({
        type: "error",
        title: "Network error",
        message: "Could not load vendors.",
      });
    } finally {
      setLoadingVendors(false);
      setLoadingMoreVendors(false);
    }
  };

  useEffect(() => {
    // ?vendorId=<id> (set by the product form's "Create" link) preselects that vendor.
    const presetVendorId = new URLSearchParams(window.location.search).get("vendorId");
    if (presetVendorId) setSelectedOwner(presetVendorId);

    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStaff === null) return;

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, selectedOwner]);

  useEffect(() => {
    if (!isStaff || !vendorCursor || loadingMoreVendors) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadVendors(vendorCursor);
        }
      },
      { rootMargin: "200px" }
    );

    if (vendorLoadMoreRef.current) {
      observer.observe(vendorLoadMoreRef.current);
    }

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorCursor, loadingMoreVendors, isStaff]);

  useEffect(() => {
    if (!isStaff) return;

    const timer = setTimeout(() => {
      setVendors([]);
      setVendorCursor(null);
      loadVendors(null, vendorSearch);
    }, 300);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSearch]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', requiresSize: false, gst: '' });
    setGstMode('preset');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setFormData({ name: c.name, slug: c.slug, description: c.description || '', requiresSize: c.requiresSize, gst: c.gst || '' });
    setGstMode(c.gst && !GST_PRESETS.includes(c.gst) ? 'custom' : 'preset');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gstMode === 'custom') {
      const parsed = Number(formData.gst);
      if (formData.gst.trim() === '' || Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        addToast({ type: 'error', title: 'Invalid GST rate', message: 'Enter a GST percentage between 0 and 100.' });
        return;
      }
    }
    const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let mediaAssetId: string | undefined;

    if (imageFile) {
      setUploading(true);
      try {
        const uploadForm = new FormData();
        uploadForm.append('file', imageFile);
        uploadForm.append('mediaType', 'CATEGORY_BANNER');
        const uploadRes = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) {
          mediaAssetId = uploadJson.data.id;
        } else {
          addToast({ type: 'error', title: 'Image upload failed', message: uploadJson.error?.message || 'Try again.' });
          setUploading(false);
          return;
        }
      } catch {
        addToast({ type: 'error', title: 'Network error', message: 'Could not upload image.' });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload = {
      name: formData.name,
      slug,
      description: formData.description,
      requiresSize: formData.requiresSize,
      gst: formData.gst || undefined,
      ...(mediaAssetId ? { mediaAssetId } : {}),
      ...(isStaff
        ? { vendorId: selectedOwner === "admin" ? null : selectedOwner }
        : {}),
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          addToast({ type: 'success', title: 'Category Updated', message: `${formData.name} modified successfully.` });
        } else {
          addToast({ type: 'error', title: 'Update failed', message: json.error });
          return;
        }
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          addToast({ type: 'success', title: 'Category Created', message: `${formData.name} added.` });
        } else {
          addToast({ type: 'error', title: 'Creation failed', message: json.error });
          return;
        }
      }

      setImageFile(null);
      setIsModalOpen(false);
      loadCategories();
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not save category.' });
    }
  };

  const openDeleteConfirm = (c: Category) => setDeleteTarget(c);

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}?force=true`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        addToast({
          type: 'info',
          title: 'Category Deleted',
          message: `"${deleteTarget.name}" and its products were removed.`,
        });
        setDeleteTarget(null);
        loadCategories();
      } else {
        addToast({ type: 'error', title: 'Cannot delete', message: json.error });
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not delete category.' });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="categories" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              Taxonomy & Categorization
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Wholesale Kurti Categories ({categories.length})
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage product classifications and catalogue filters.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Category</span>
          </button>
        </div>

        {isStaff && (
          <div className="mt-8 space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Select a Category Owner
              </h2>

              <p className="text-sm text-stone-500 mt-1">
                Choose a vendor to view and manage only their categories,
                or manage IcchaStore&apos;s own categories.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />

                <input
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendors by name, contact, or GSTIN..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>

            {/* Admin-owned categories */}
            <button
              type="button"
              onClick={() => {
                setSelectedOwner("admin");
                setEditingCategory(null);
                setIsModalOpen(false);
              }}
              className={`w-full text-left rounded-2xl border p-5 transition ${selectedOwner === "admin"
                ? "border-rose-600 bg-rose-50"
                : "border-stone-200 bg-white hover:border-stone-300"
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-stone-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-stone-900">
                    IcchaStore Own Categories
                  </h3>

                  <p className="text-sm text-stone-500">
                    Categories created and managed by IcchaStore
                  </p>
                </div>

                {selectedOwner === "admin" && (
                  <CheckCircle2 className="w-5 h-5 text-rose-600" />
                )}
              </div>
            </button>

            {/* Vendors */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => {
                    setSelectedOwner(vendor.id);
                    setEditingCategory(null);
                    setIsModalOpen(false);
                  }}
                  className={`text-left rounded-2xl border p-5 transition ${selectedOwner === vendor.id
                    ? "border-rose-600 bg-rose-50"
                    : "border-stone-200 bg-white hover:border-rose-300 hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        {vendor.businessName}
                      </h3>

                      <p className="text-sm text-stone-500 mt-1">
                        {vendor.contactName} • {vendor.mobile}
                      </p>

                      {vendor.gstin && (
                        <p className="text-xs text-stone-400 mt-2">
                          {vendor.gstin}
                        </p>
                      )}
                    </div>

                    {selectedOwner === vendor.id && (
                      <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>

                  <div className="mt-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${vendor.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-stone-100 text-stone-500"
                        }`}
                    >
                      {vendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {loadingVendors && vendors.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
              </div>
            )}

            {/* Progressive-scroll sentinel */}
            <div ref={vendorLoadMoreRef} className="h-10 flex justify-center">
              {loadingMoreVendors && (
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              )}
            </div>

            {!loadingVendors && vendors.length === 0 && (
              <p className="text-center py-8 text-sm text-stone-500">
                No vendors found.
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search through categories..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            Loading categories...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {filtered.length === 0 && (
              <div className="col-span-full p-8 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                No categories found.
              </div>
            )}
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full bg-stone-100">
                    {cat.mediaAsset?.publicUrl ? (
                      <Image
                        src={cat.mediaAsset.publicUrl}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderTree className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-stone-900/80 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      {cat._count?.products ?? 0} Products
                    </div>
                    <div className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-bold ${cat.requiresSize ? 'bg-amber-500 text-stone-900' : 'bg-stone-700/80 text-white'}`}>
                      {cat.requiresSize ? 'SIZE REQUIRED' : 'NO SIZE'}
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1">{cat.name}</h3>
                    <p className="text-stone-500 line-clamp-2 text-[11px]">{cat.description || 'No description'}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-stone-400">/{cat.slug}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 hover:bg-stone-100 text-stone-700 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(cat)}
                      className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-stone-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <h2 className="font-serif text-lg font-bold text-stone-900">Delete Category?</h2>
            </div>

            <p className="text-stone-600">
              You&apos;re about to permanently delete{' '}
              <span className="font-bold text-stone-900">&ldquo;{deleteTarget.name}&rdquo;</span>.
            </p>

            {(deleteTarget._count?.products ?? 0) > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <p className="font-bold">
                  ⚠ This will also permanently delete {deleteTarget._count?.products}{' '}
                  product{deleteTarget._count?.products === 1 ? '' : 's'} in this category
                </p>
                <p className="mt-1 text-rose-700">
                  Including their images, stock and cart entries. This cannot be undone.
                </p>
              </div>
            ) : (
              <p className="text-stone-500">This category has no products. This action cannot be undone.</p>
            )}

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteCategory}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold disabled:opacity-60"
              >
                {deleting
                  ? 'Deleting...'
                  : `Yes, Delete${(deleteTarget._count?.products ?? 0) > 0 ? ' Everything' : ''}`}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 font-bold text-sm">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bandhani Print Kurtis"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Slug URL Identifier</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-rose-900"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  GST Rate
                </label>

                <select
                  value={gstMode === 'custom' ? 'custom' : formData.gst}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setGstMode('custom');
                      setFormData(prev => ({ ...prev, gst: GST_PRESETS.includes(prev.gst) ? '' : prev.gst }));
                    } else {
                      setGstMode('preset');
                      setFormData(prev => ({ ...prev, gst: value }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"
                >
                  <option value="">Select GST rate</option>
                  <option value="0">0%</option>
                  <option value="0.25">0.25%</option>
                  <option value="1.5">1.5%</option>
                  <option value="3">3%</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                  <option value="40">40%</option>
                  <option value="custom">Custom %</option>
                </select>

                {gstMode === 'custom' && (
                  <input type="number" min={0} max={100} step="0.01" value={formData.gst}
                    onChange={e => setFormData({ ...formData, gst: e.target.value })}
                    placeholder="Enter GST % (0–100)" className="w-full mt-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"/>
                )}
              </div>
              <div>
                <label className="block font-bold text-stone-800 mb-1">Cover Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div>
                  <p className="font-bold text-stone-800">Size Required for Products</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Vendors must enter available sizes and stock quantities for products in this category.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requiresSize}
                  onChange={e => setFormData({ ...formData, requiresSize: e.target.checked })}
                  className="w-4 h-4 accent-rose-900"
                />
              </div>

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
                  className="flex-1 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {uploading ? 'Uploading image...' : 'Save Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}