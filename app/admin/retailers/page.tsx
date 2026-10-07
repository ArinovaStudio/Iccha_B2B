'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Sliders,
  Trash2,
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';

interface Retailer {
  id: string;
  businessName: string;
  applicantName: string;
  mobile: string;
  gstin: string | null;
  status: string;
  businessType: string;
  city: string | null;
  state: string | null;
  moqOverride: boolean;
  customMoqSets: number | null;
  isActive: boolean;
}

export default function AdminRetailersPage() {
  const { addToast } = useApp();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingRetailer, setCreatingRetailer] = useState(false);

  const fetchRetailers = async (cursor?: string | null, query = search) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (query.trim()) params.set('search', query.trim());
      const res = await fetch(`/api/admin/retailers?${params.toString()}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setRetailers(prev => cursor ? [...prev, ...result.data] : result.data);
        setNextCursor(result.nextCursor);
      } else {
        addToast({ type: 'error', title: 'Failed to load retailers', message: result.error || '' });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    businessName: "",
    applicantName: "",
    mobile: "",
    whatsapp: "",
    gstin: "",
    pan: "",
    bankAccountNumber: "",
    ifscCode: "",
    businessType: "boutique",
    street: "",
    city: "",
    state: "",
    stateCode: "",
    pincode: "",
  });

  const [createDocuments, setCreateDocuments] = useState<
    Record<string, File | null>
  >({
    gst_certificate: null,
    business_proof: null,
    shop_photo: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => fetchRetailers(null, search), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          fetchRetailers(nextCursor);
        }
      },
      { rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    fetchRetailers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (retailer: Retailer) => {
    if (!window.confirm(`Delete ${retailer.businessName}? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/retailers/${retailer.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok || !result.success) {
        addToast({ type: 'error', title: 'Delete failed', message: result.error || 'Please try again.' });
        return;
      }
      setRetailers(prev => prev.filter(r => r.id !== retailer.id));
      addToast({ type: 'success', title: 'Retailer deleted', message: `${retailer.businessName} was deleted.` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Delete failed', message: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetMOQ = async (retailer: Retailer, permittedMinSets: number | null) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/retailers/${retailer.id}/moq`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permittedMinSets }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        addToast({ type: 'error', title: 'Update failed', message: result.error || 'Please try again.' });
        setSubmitting(false);
        return;
      }
      addToast({
        type: 'success',
        title: 'MOQ Override Updated',
        message: `${retailer.businessName} minimum set rule changed to ${permittedMinSets ? permittedMinSets + ' Sets' : 'Default (4 Sets)'}.`
      });
      setSelectedRetailer(null);
      await fetchRetailers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Update failed', message: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRetailer = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const gstin = createForm.gstin.trim().toUpperCase();
    const pan = createForm.pan.trim().toUpperCase();
    const ifscCode = createForm.ifscCode.trim().toUpperCase();
    const bankAccountNumber = createForm.bankAccountNumber.trim();

    if (!/^[0-9A-Z]{15}$/.test(gstin)) {
      addToast({ type: "error", title: "Invalid GSTIN", message: "GSTIN must be exactly 15 uppercase letters and numbers." });
      return;
    }
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      addToast({ type: "error", title: "Invalid PAN", message: "PAN must be in the format ABCDE1234F (10 characters)." });
      return;
    }
    if (bankAccountNumber && !/^[0-9]{6,20}$/.test(bankAccountNumber)) {
      addToast({ type: "error", title: "Invalid bank account number", message: "Enter a bank account number containing 6–20 digits." });
      return;
    }
    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      addToast({ type: "error", title: "Invalid IFSC code", message: "IFSC must be 11 characters, for example HDFC0001234." });
      return;
    }
    if (Boolean(bankAccountNumber) !== Boolean(ifscCode)) {
      addToast({ type: "error", title: "Bank details incomplete", message: "Enter both the bank account number and IFSC code, or leave both blank." });
      return;
    }

    const selectedDocuments = Object.entries(createDocuments).filter(
      ([, file]) => file !== null
    );
    if (selectedDocuments.length === 0) {
      addToast({
        type: "error",
        title: "KYC document required",
        message: "Upload at least one KYC document.",
      });
      return;
    }
    setCreatingRetailer(true);
    try {
      const formData = new FormData();
      const normalizedForm = {
        ...createForm,
        gstin,
        pan,
        ifscCode,
        bankAccountNumber,
      };
      Object.entries(normalizedForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      selectedDocuments.forEach(([documentType, file]) => {
        if (file) {
          formData.append("files", file);
          formData.append("documentTypes", documentType);
        }
      });
      const response = await fetch("/api/admin/retailers/create", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        addToast({
          type: "error",
          title: "Retailer creation failed",
          message: result.error || "Please check the details and try again.",
        });
        return;
      }
      addToast({
        type: "success",
        title: "Retailer created",
        message: "The account is approved and ready for login.",
      });
      setCreateForm({
        email: "",
        password: "",
        businessName: "",
        applicantName: "",
        mobile: "",
        whatsapp: "",
        gstin: "",
        pan: "",
        bankAccountNumber: "",
        ifscCode: "",
        businessType: "boutique",
        street: "",
        city: "",
        state: "",
        stateCode: "",
        pincode: "",
      });
      setCreateDocuments({
        gst_certificate: null,
        business_proof: null,
        shop_photo: null,
      });
      setShowCreateForm(false);
      await fetchRetailers(null, search);
    } catch (error) {
      console.error("Create retailer error:", error);
      addToast({
        type: "error",
        title: "Retailer creation failed",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setCreatingRetailer(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="retailers" />
      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              B2B Accounts & Wholesalers
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Registered Retailers Directory
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage retailer account statuses, verified GSTIN records, and configure tailored MOQ policies.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="shrink-0 px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition"
        >
          + Create Retailer
        </button>
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Boutique Name, GSTIN, Mobile..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            Loading retailer accounts...
          </div>
        ) : retailers.length > 0 ? (
          <>
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="text-left p-4">Business</th>
                      <th className="text-left p-4">GSTIN</th>
                      <th className="text-left p-4">Location</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">MOQ Policy</th>
                      <th className="text-right p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retailers.map((ret) => (
                      <tr key={ret.id} className="border-t border-stone-100 align-top">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-50 text-[#831843] flex items-center justify-center font-bold font-serif text-sm">
                              {ret.businessName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <strong className="text-stone-900 block truncate">{ret.businessName}</strong>
                              <span className="text-[10px] text-stone-500 block truncate">
                                {ret.applicantName} ({ret.mobile})
                              </span>
                              {ret.businessType === 'drop_shipper' && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                                  DROP SHIPPER
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-800 whitespace-nowrap">
                          {ret.gstin || 'Not Required'}
                        </td>
                        <td className="p-4 text-stone-600 whitespace-nowrap">
                          {ret.city ? `${ret.city}, ${ret.state}` : 'Not provided'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${ret.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900' :
                            ret.status === 'APPLICATION_RECEIVED' ? 'bg-amber-100 text-amber-900' :
                              ret.status === 'UNDER_REVIEW' ? 'bg-sky-100 text-sky-900' :
                                ret.status === 'ADDITIONAL_INFORMATION_REQUIRED' ? 'bg-orange-100 text-orange-900' :
                                  'bg-rose-100 text-rose-900'}`}>
                            {ret.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <strong className={ret.moqOverride ? 'text-amber-800 font-bold' : 'text-stone-700'}>
                            {ret.moqOverride ? `Custom (${ret.customMoqSets} Sets)` : 'Default (4 Sets)'}
                          </strong>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-3 whitespace-nowrap">
                            <Link
                              href={`/admin/kyc?search=${encodeURIComponent(ret.businessName)}`}
                              className="font-semibold text-stone-600 hover:text-stone-900"
                            >
                              KYC
                            </Link>
                            <button
                              type="button"
                              onClick={() => setSelectedRetailer(ret)}
                              className="px-3 py-1.5 bg-[#831843] hover:bg-rose-900 text-white rounded-lg font-bold text-[11px] shadow transition inline-flex items-center gap-1"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-300" />
                              <span>MOQ</span>
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleDelete(ret)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              title="Delete retailer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div ref={loadMoreRef} className="h-8 flex items-center justify-center text-[10px] text-stone-400">
              {loadingMore ? 'Loading more retailers...' : ''}
            </div>
          </>
        ) : (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            No retailer accounts found.
          </div>
        )}
      </main>

      {selectedRetailer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Tailor MOQ for {selectedRetailer.businessName}
              </h3>
              <button onClick={() => setSelectedRetailer(null)} className="text-stone-400 font-bold text-sm">
                &times;
              </button>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Default system MOQ is <strong>4 garment sets</strong> per order. Granting an override allows boutique sample testing.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSetMOQ(selectedRetailer, null)}
                className={`w-full p-3 rounded-xl border text-left font-medium transition disabled:opacity-60 ${!selectedRetailer.moqOverride ? 'bg-rose-50 border-rose-300 text-[#831843] font-bold' : 'bg-stone-50 border-stone-200'
                  }`}
              >
                <div>Standard Policy: 4 Sets MOQ</div>
                <span className="text-[10px] text-stone-500">Standard wholesale lot policy.</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSetMOQ(selectedRetailer, 2)}
                className={`w-full p-3 rounded-xl border text-left font-medium transition disabled:opacity-60 ${selectedRetailer.moqOverride && selectedRetailer.customMoqSets === 2 ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-stone-50 border-stone-200'
                  }`}
              >
                <div>Boutique Tier: 2 Sets MOQ</div>
                <span className="text-[10px] text-stone-500">Enables high-end boutique sample purchasing.</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSetMOQ(selectedRetailer, 1)}
                className={`w-full p-3 rounded-xl border text-left font-medium transition disabled:opacity-60 ${selectedRetailer.moqOverride && selectedRetailer.customMoqSets === 1 ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-stone-50 border-stone-200'
                  }`}
              >
                <div>Sample Order Trial: 1 Set MOQ</div>
                <span className="text-[10px] text-stone-500">Single trial set purchase for initial quality verification.</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRetailer(null)}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col">
            <form
              onSubmit={handleCreateRetailer}
              className="overflow-y-auto p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Create Retailer Account
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    The account will be approved immediately after successful creation.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={creatingRetailer}
                  onClick={() => setShowCreateForm(false)}
                  className="text-stone-400 hover:text-stone-800 text-2xl"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <section className="space-y-3">
                <h3 className="font-bold text-stone-800">Account details</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    ["businessName", "Business name"],
                    ["applicantName", "Applicant name"],
                    ["email", "Email address"],
                    ["mobile", "Mobile number"],
                    ["whatsapp", "WhatsApp number"],
                    ["gstin", "GSTIN"],
                    ["pan", "PAN"],
                    ["businessType", "Business type"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block space-y-1">
                      <span className="text-xs font-semibold text-stone-600">
                        {label}
                        {["businessName", "applicantName", "email", "mobile", "gstin"].includes(key)
                          ? " *"
                          : ""}
                      </span>
                      <input
                        required={["businessName", "applicantName", "email", "mobile", "gstin"].includes(key)}
                        type={key === "email" ? "email" : "text"}
                        maxLength={key === "gstin" ? 15 : key === "pan" ? 10 : undefined}
                        minLength={key === "gstin" ? 15 : key === "pan" ? 10 : undefined}
                        pattern={key === "gstin" ? "[A-Za-z0-9]{15}" : key === "pan" ? "[A-Za-z]{5}[0-9]{4}[A-Za-z]" : undefined}
                        autoCapitalize={key === "gstin" || key === "pan" ? "characters" : undefined}
                        value={createForm[key]}
                        onChange={(event) =>
                          setCreateForm((previous) => ({
                            ...previous,
                            [key]: key === "gstin" || key === "pan"
                              ? event.target.value.toUpperCase()
                              : event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                      />
                    </label>
                  ))}
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-stone-600">
                      Login password *
                    </span>
                    <input
                      required
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((previous) => ({
                          ...previous,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                    />
                    <span className="text-[11px] text-stone-500">
                      Minimum 8 characters. Share the password securely with the retailer.
                    </span>
                  </label>
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="font-bold text-stone-800">Business address</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    ["street", "Street / full address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["stateCode", "State code"],
                    ["pincode", "Pincode"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block space-y-1">
                      <span className="text-xs font-semibold text-stone-600">
                        {label} *
                      </span>
                      <input
                        required
                        value={createForm[key]}
                        onChange={(event) =>
                          setCreateForm((previous) => ({
                            ...previous,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                      />
                    </label>
                  ))}
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="font-bold text-stone-800">Bank details (optional)</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-stone-600">Bank account number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={20}
                      value={createForm.bankAccountNumber}
                      onChange={(event) => setCreateForm((previous) => ({
                        ...previous,
                        bankAccountNumber: event.target.value.replace(/[^0-9]/g, ""),
                      }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                    />
                    <span className="text-[11px] text-stone-500">Digits only; leading zeros are preserved.</span>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-stone-600">IFSC code</span>
                    <input
                      type="text"
                      maxLength={11}
                      minLength={11}
                      pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}"
                      autoCapitalize="characters"
                      value={createForm.ifscCode}
                      onChange={(event) => setCreateForm((previous) => ({
                        ...previous,
                        ifscCode: event.target.value.toUpperCase().slice(0, 11),
                      }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-rose-900"
                    />
                    <span className="text-[11px] text-stone-500">Exactly 11 characters, e.g. HDFC0001234.</span>
                  </label>
                </div>
              </section>
              <section className="space-y-3">
                <div>
                  <h3 className="font-bold text-stone-800">KYC documents *</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Upload at least one document. PAN is entered above; do not upload a PAN card here. PDF, JPEG, PNG or WebP; maximum 5 MB per file.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    ["gst_certificate", "GST certificate"],
                    ["business_proof", "Business proof"],
                    ["shop_photo", "Shop photo"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block space-y-2">
                      <span className="text-xs font-semibold text-stone-600">
                        {label}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          setCreateDocuments((previous) => ({
                            ...previous,
                            [key]: event.target.files?.[0] || null,
                          }))
                        }
                        className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-semibold file:text-[#831843]"
                      />
                      {createDocuments[key] && (
                        <span className="block text-[11px] text-emerald-700 break-all">
                          {createDocuments[key]?.name}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </section>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  disabled={creatingRetailer}
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRetailer}
                  className="px-5 py-3 rounded-xl bg-[#831843] hover:bg-rose-900 text-white font-bold text-sm disabled:opacity-50"
                >
                  {creatingRetailer ? "Creating account..." : "Create & Approve Retailer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}