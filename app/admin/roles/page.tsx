'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserCog, Search, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  businessName: string | null;
  retailerStatus: string | null;
  businessType: string | null;
  gstin: string | null;
  vendorActive: boolean | null;
  address: {
    street: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
  } | null;
}

interface PromoteForm {
  contactName: string;
  mobile: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
}

const EMPTY_FORM: PromoteForm = {
  contactName: '',
  mobile: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  stateCode: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  branch: '',
  upiId: '',
};

const INPUT_CLASS =
  'w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 disabled:opacity-60';

function Field({
  label,
  value,
  onChange,
  required,
  mono,
  maxLength,
  disabled,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  mono?: boolean;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block font-semibold text-stone-700 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type="text"
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${INPUT_CLASS} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

export default function AdminRolesPage() {
  const { addToast } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [promoting, setPromoting] = useState<UserRow | null>(null);
  const [demoting, setDemoting] = useState<UserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [returningVendor, setReturningVendor] = useState(false);
  const promoteRequestRef = useRef(0);

  const [form, setForm] = useState<PromoteForm>(EMPTY_FORM);

  const fetchUsers = async (cursor?: string | null, query = search) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (query.trim()) params.set('search', query.trim());

    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const result = await res.json();

    if (res.ok && result.success) {
      setUsers(prev => cursor ? [...prev, ...result.data] : result.data);
      setNextCursor(result.nextCursor);
    } else {
      addToast({ type: 'error', title: 'Failed to load users', message: result.error || '' });
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(null, search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          fetchUsers(nextCursor);
        }
      },
      { rootMargin: '200px' }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore]);

  const closePromote = () => {
    promoteRequestRef.current += 1; // invalidate any in-flight prefill request
    setPromoting(null);
    setLoadingDetails(false);
    setReturningVendor(false);
  };

  const openPromote = async (u: UserRow) => {
    const requestId = ++promoteRequestRef.current;

    setPromoting(u);
    setReturningVendor(false);
    // Instant fallback from the table row while the full details load
    setForm({
      ...EMPTY_FORM,
      contactName: u.name,
      gstin: u.gstin || '',
      address: u.address?.street || '',
      city: u.address?.city || '',
      state: u.address?.state || '',
      stateCode: u.address?.stateCode || '',
    });
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/admin/users/${u.id}/promote-vendor`, { cache: 'no-store' });
      const result = await res.json();

      // Modal was closed or another user was opened in the meantime
      if (requestId !== promoteRequestRef.current) return;

      if (res.ok && result.success) {
        setForm({ ...EMPTY_FORM, ...result.data.form });
        setReturningVendor(Boolean(result.data.returningVendor));
      } else {
        addToast({
          type: 'error',
          title: 'Could not load all details',
          message: result.error || 'Please fill in the missing fields manually.',
        });
      }
    } catch (err) {
      console.error(err);
      if (requestId === promoteRequestRef.current) {
        addToast({
          type: 'error',
          title: 'Could not load all details',
          message: 'Please fill in the missing fields manually.',
        });
      }
    } finally {
      if (requestId === promoteRequestRef.current) setLoadingDetails(false);
    }
  };

  const setField = (key: keyof PromoteForm) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${promoting.id}/promote-vendor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: 'error', title: 'Promotion failed', message: result.error || 'Please check the details.' });
        setSubmitting(false);
        return;
      }

      addToast({ type: 'success', title: 'Promoted to Vendor', message: result.message || `${promoting.businessName} can now log in as a vendor.` });
      closePromote();
      await fetchUsers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Promotion failed', message: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemote = async () => {
    if (!demoting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${demoting.id}/demote-vendor`, {
        method: 'PATCH',
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({ type: 'error', title: 'Demotion failed', message: result.error || 'Please try again.' });
        setSubmitting(false);
        return;
      }

      addToast({ type: 'success', title: 'Demoted to Whole Seller', message: result.message || `${demoting.businessName} is now a retailer account.` });
      setDemoting(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Demotion failed', message: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="roles" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">

        <div className="border-b border-stone-200 pb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
            Access Control
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Role Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Promote an approved retailer account to a Vendor so they can list and manage their own products.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by business name, email..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            Loading accounts...
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="text-left p-4">Business</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Current Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-stone-100">
                    <td className="p-4 font-semibold text-stone-900">{u.businessName || '—'}</td>
                    <td className="p-4 text-stone-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'VENDOR' ? 'bg-purple-100 text-purple-900' : 'bg-stone-100 text-stone-700'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600">
                      {u.role === 'VENDOR' ? (u.vendorActive ? 'Active' : 'Inactive') : u.retailerStatus}
                    </td>
                    <td className="p-4 text-right">
                      {u.role === 'RETAILER' && u.retailerStatus === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => openPromote(u)}
                          className="px-3 py-1.5 bg-[#831843] hover:bg-rose-900 text-white rounded-lg font-bold text-[11px] shadow transition inline-flex items-center gap-1.5"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          <span>Promote to Vendor</span>
                        </button>
                      )}
                      {u.role === 'VENDOR' && (
                        <button
                          type="button"
                          onClick={() => setDemoting(u)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-[11px] shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          <span>Demote to Whole Seller</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-stone-500">No accounts found.</div>
            )}
            <div ref={loadMoreRef} className="h-1" />
            {loadingMore && (
              <div className="p-4 text-center text-stone-500">Loading more accounts...</div>
            )}
          </div>
        )}

      </main>

      {promoting && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handlePromote}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#831843]" />
                Promote {promoting.businessName} to Vendor
              </h3>
              <button type="button" onClick={closePromote} className="text-stone-400 font-bold text-sm">
                &times;
              </button>
            </div>

            {loadingDetails ? (
              <p className="text-stone-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Fetching account details...
              </p>
            ) : (
              <p className="text-stone-500">
                {returningVendor
                  ? 'This account was a vendor before. Their previous vendor details (including bank details) have been restored, and their existing products and order history will be reattached. Review and adjust if needed.'
                  : "The retailer's details from their KYC application and registered address have been filled in automatically. Review and adjust if needed."}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Name" value={form.contactName} onChange={setField('contactName')} disabled={loadingDetails} className="col-span-2" />
              <Field label="Mobile" value={form.mobile} onChange={setField('mobile')} disabled={loadingDetails} />
              <Field label="PAN" value={form.pan} onChange={v => setField('pan')(v.toUpperCase())} mono maxLength={10} disabled={loadingDetails} />
              <Field label="GSTIN" value={form.gstin} onChange={v => setField('gstin')(v.toUpperCase())} required mono disabled={loadingDetails} className="col-span-2" />
              <Field label="Address" value={form.address} onChange={setField('address')} required disabled={loadingDetails} className="col-span-2" />
              <Field label="City" value={form.city} onChange={setField('city')} required disabled={loadingDetails} />
              <Field label="State" value={form.state} onChange={setField('state')} required disabled={loadingDetails} />
              <Field label="State Code (e.g. 08)" value={form.stateCode} onChange={setField('stateCode')} required mono maxLength={2} disabled={loadingDetails} className="col-span-2" />
            </div>

            <div className="pt-2 border-t border-stone-100">
              <h4 className="font-bold text-stone-800 mb-2">Bank Details (optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank Name" value={form.bankName} onChange={setField('bankName')} disabled={loadingDetails} />
                <Field label="Account Holder" value={form.accountHolder} onChange={setField('accountHolder')} disabled={loadingDetails} />
                <Field label="Account Number" value={form.accountNumber} onChange={setField('accountNumber')} mono disabled={loadingDetails} />
                <Field label="IFSC" value={form.ifsc} onChange={v => setField('ifsc')(v.toUpperCase())} mono disabled={loadingDetails} />
                <Field label="Branch" value={form.branch} onChange={setField('branch')} disabled={loadingDetails} />
                <Field label="UPI ID" value={form.upiId} onChange={setField('upiId')} disabled={loadingDetails} />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={closePromote}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingDetails}
                className="flex-1 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition disabled:opacity-60"
              >
                {submitting ? 'Promoting...' : 'Confirm Promotion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {demoting && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#831843]" />
                Demote {demoting.businessName} to Whole Seller
              </h3>
              <button type="button" onClick={() => setDemoting(null)} className="text-stone-400 font-bold text-sm">
                &times;
              </button>
            </div>

            <p className="text-stone-600">
              This revokes vendor login access. Their vendor profile is deactivated (not deleted), so
              existing products and past orders tied to it are preserved. They'll fall back to their
              existing retailer account.
            </p>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDemoting(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDemote}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl font-bold shadow transition disabled:opacity-60"
              >
                {submitting ? 'Demoting...' : 'Confirm Demotion'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}