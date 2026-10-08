"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, ArrowDownCircle, Trash2, Loader2, Eye, ImagePlus } from "lucide-react";
import Image from "next/image";
import AdminSidebar from "@/components/layout/AdminSidebar";
import CreateVendorButton from "@/components/admin/vendors/CreateVendorButton";
import { useApp } from "@/lib/context/AppContext";

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  mobile: string;
  gstin: string;
  pan: string | null;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  vendorCode: string;
  invoicePrefix: string;
  defaultGstRate: string;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  upiId: string | null;
  isActive: boolean;
  createdAt: string;
  user: { email: string; lastLoginAt: string | null };
  _count: { products: number; warehouses: number; sellerOrders: number };
  bannerAsset: { publicUrl: string } | null,
}

const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BANNER_MAX_BYTES = 8 * 1024 * 1024;

export default function VendorManagement() {
  const { addToast } = useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [bannerBusy, setBannerBusy] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchVendors = async (cursor?: string | null, query = search) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (query.trim()) params.set("search", query.trim());

      const res = await fetch(`/api/admin/vendors?${params.toString()}`, { cache: "no-store" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: "error", title: "Failed to load vendors", message: result.error || "Please try again." });
        return;
      }

      setVendors((current) => (cursor ? [...current, ...result.data] : result.data));
      setNextCursor(result.nextCursor);
    } catch {
      addToast({ type: "error", title: "Failed to load vendors", message: "Something went wrong." });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => fetchVendors(null, search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loadingMore) fetchVendors(nextCursor);
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore]);

  const handleDemote = async (vendor: Vendor) => {
    if (!window.confirm(`Demote ${vendor.businessName} to retailer?`)) return;
    setActionId(vendor.id);

    try {
      const res = await fetch(`/api/admin/users/${vendor.userId}/demote-vendor`, { method: "PATCH" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: "error", title: "Demotion failed", message: result.error || "Please try again." });
        return;
      }

      setVendors((current) => current.filter((item) => item.id !== vendor.id));
      setSelectedVendor((current) => (current?.id === vendor.id ? null : current));
      addToast({ type: "success", title: "Vendor demoted", message: `${vendor.businessName} is now a retailer.` });
    } catch {
      addToast({ type: "error", title: "Demotion failed", message: "Something went wrong." });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!window.confirm(`Permanently delete ${vendor.businessName}? This also deletes ALL of their products, categories, warehouses and orders (including pending ones). This cannot be undone.`)) return;
    setActionId(vendor.id);

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: "error", title: "Delete failed", message: result.error || "Please try again." });
        return;
      }

      setVendors((current) => current.filter((item) => item.id !== vendor.id));
      setSelectedVendor((current) => (current?.id === vendor.id ? null : current));
      addToast({ type: "success", title: "Vendor deleted", message: `${vendor.businessName} was deleted.` });
    } catch {
      addToast({ type: "error", title: "Delete failed", message: "Something went wrong." });
    } finally {
      setActionId(null);
    }
  };

  // Keep both the table row and the open modal in sync without refetching the list.
  const applyBanner = (vendorId: string, publicUrl: string | null) => {
    const bannerAsset = publicUrl ? { publicUrl } : null;
    setVendors((current) => current.map((v) => (v.id === vendorId ? { ...v, bannerAsset } : v)));
    setSelectedVendor((current) => (current?.id === vendorId ? { ...current, bannerAsset } : current));
  };

  const handleBannerSelect = async (event: React.ChangeEvent<HTMLInputElement>, vendor: Vendor) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again later
    if (!file) return;

    if (!BANNER_TYPES.includes(file.type)) {
      addToast({ type: "error", title: "Unsupported file", message: "Please choose a JPG, PNG or WebP image." });
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      addToast({ type: "error", title: "Image too large", message: "Banner must be 8 MB or smaller." });
      return;
    }

    setBannerBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/admin/vendors/${vendor.id}/banner`, { method: "POST", body });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: "error", title: "Upload failed", message: result.error || "Please try again." });
        return;
      }

      applyBanner(vendor.id, result.data.bannerUrl);
      addToast({ type: "success", title: "Banner updated", message: `${vendor.businessName}'s homepage banner was changed.` });
    } catch {
      addToast({ type: "error", title: "Upload failed", message: "Something went wrong." });
    } finally {
      setBannerBusy(false);
    }
  };

  const handleBannerRemove = async (vendor: Vendor) => {
    if (!window.confirm(`Remove the banner for ${vendor.businessName}? Their latest product photo will be shown instead.`)) return;
    setBannerBusy(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/banner`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: "error", title: "Remove failed", message: result.error || "Please try again." });
        return;
      }

      applyBanner(vendor.id, null);
      addToast({ type: "success", title: "Banner removed", message: "The latest product photo is used instead." });
    } catch {
      addToast({ type: "error", title: "Remove failed", message: "Something went wrong." });
    } finally {
      setBannerBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="vendors" />
      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        <div className="flex justify-end">
          <CreateVendorButton onCreated={() => fetchVendors(null, search)} />
        </div>

        <div className="border-b border-stone-200 pb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">Vendor Management</span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">Vendors</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage all vendor accounts registered on the platform.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by business name, contact, GSTIN..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">Loading vendors...</div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="text-left p-4">Business</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">GSTIN</th>
                  <th className="text-left p-4">Products</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-t border-stone-100">
                    <td className="p-4">
                      <div className="font-semibold text-stone-900">{vendor.businessName}</div>
                      <div className="text-stone-500 mt-0.5">{vendor.mobile}</div>
                    </td>
                    <td className="p-4 text-stone-600">{vendor.contactName}</td>
                    <td className="p-4 text-stone-600">{vendor.gstin}</td>
                    <td className="p-4 text-stone-600">{vendor._count.products}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${vendor.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVendor(vendor)}
                          className="px-3 py-1.5 bg-white border border-stone-300 hover:border-rose-900 hover:text-rose-900 text-stone-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          disabled={actionId === vendor.id}
                          onClick={() => handleDemote(vendor)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Demote
                        </button>
                        <button
                          type="button"
                          disabled={actionId === vendor.id}
                          onClick={() => handleDelete(vendor)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {actionId === vendor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vendors.length === 0 && <div className="p-12 text-center text-stone-500">No vendors found.</div>}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
            </div>
          </div>
        )}
      </main>

      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-200 shadow-2xl space-y-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">Vendor Profile</span>
                <h2 className="font-serif text-xl font-bold text-stone-900 mt-0.5">{selectedVendor.businessName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
              >
                &times; Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Contact Person</span>
                <strong className="text-stone-900">{selectedVendor.contactName}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Mobile</span>
                <strong className="text-stone-900">{selectedVendor.mobile}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Email</span>
                <strong className="text-stone-900 break-all">{selectedVendor.user.email}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Vendor Code</span>
                <strong className="font-mono text-stone-900">{selectedVendor.vendorCode}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">GSTIN</span>
                <strong className="font-mono text-[#831843]">{selectedVendor.gstin}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">PAN</span>
                <strong className="font-mono text-stone-900">{selectedVendor.pan || '—'}</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Default GST Rate</span>
                <strong className="text-stone-900">{selectedVendor.defaultGstRate}%</strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Invoice Prefix</span>
                <strong className="font-mono text-stone-900">{selectedVendor.invoicePrefix}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Address</span>
                <strong className="text-stone-900">
                  {selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} ({selectedVendor.stateCode})
                </strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Joined</span>
                <strong className="text-stone-900">
                  {new Date(selectedVendor.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </strong>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Last Login</span>
                <strong className="text-stone-900">
                  {selectedVendor.user.lastLoginAt
                    ? new Date(selectedVendor.user.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Never'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                <span className="block text-lg font-bold text-stone-900">{selectedVendor._count.products}</span>
                <span className="text-stone-500 text-[10px] uppercase font-bold">Products</span>
              </div>
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                <span className="block text-lg font-bold text-stone-900">{selectedVendor._count.warehouses}</span>
                <span className="text-stone-500 text-[10px] uppercase font-bold">Warehouses</span>
              </div>
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3">
                <span className="block text-lg font-bold text-stone-900">{selectedVendor._count.sellerOrders}</span>
                <span className="text-stone-500 text-[10px] uppercase font-bold">Seller Orders</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Homepage Banner</h4>
              <div className="flex gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="relative w-24 shrink-0 aspect-[3/4] overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  {selectedVendor.bannerAsset?.publicUrl ? (
                    <Image
                      src={selectedVendor.bannerAsset.publicUrl}
                      alt={`${selectedVendor.businessName} banner`}
                      fill
                      sizes="96px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-stone-400">
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-[10px] leading-snug">No banner</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <p className="text-stone-500 leading-relaxed">
                    Shown as this vendor&apos;s tile in the homepage vendor section. Without one, their latest
                    product photo is used. JPG, PNG or WebP, up to 8 MB; portrait or square works best.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => handleBannerSelect(event, selectedVendor)}
                    />
                    <button
                      type="button"
                      disabled={bannerBusy}
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-2 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-[11px] shadow transition inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {bannerBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                      <span>{selectedVendor.bannerAsset ? "Replace Banner" : "Upload Banner"}</span>
                    </button>
                    {selectedVendor.bannerAsset && (
                      <button
                        type="button"
                        disabled={bannerBusy}
                        onClick={() => handleBannerRemove(selectedVendor)}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Bank / Payout Details</h4>
              {selectedVendor.bankName || selectedVendor.accountNumber || selectedVendor.upiId ? (
                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Bank</span>
                    <strong className="text-stone-900">{selectedVendor.bankName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Account Holder</span>
                    <strong className="text-stone-900">{selectedVendor.accountHolder || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Account Number</span>
                    <strong className="font-mono text-stone-900">
                      {selectedVendor.accountNumber ? `•••• ${selectedVendor.accountNumber.slice(-4)}` : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">IFSC</span>
                    <strong className="font-mono text-stone-900">{selectedVendor.ifsc || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Branch</span>
                    <strong className="text-stone-900">{selectedVendor.branch || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">UPI ID</span>
                    <strong className="font-mono text-stone-900">{selectedVendor.upiId || '—'}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-stone-500 italic">No payout details on file.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                disabled={actionId === selectedVendor.id}
                onClick={() => handleDemote(selectedVendor)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Demote to Retailer</span>
              </button>
              <button
                type="button"
                disabled={actionId === selectedVendor.id}
                onClick={() => handleDelete(selectedVendor)}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold shadow flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}