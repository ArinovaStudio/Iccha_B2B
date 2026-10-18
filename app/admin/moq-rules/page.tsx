'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Search } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useApp } from '@/lib/context/AppContext';

type Policy = {
  minSets: number;
  minPieces: number;
  minDesigns: number;
  minOrderValue: number;
  allowSampleOrders: boolean;
};

type RetailerRow = {
  id: string;
  businessName: string;
  city: string | null;
  moqOverride: boolean;
  customMoqSets: number | null;
};

const PRESET_OVERRIDES = [
  { value: 1, label: '1 Set (Sample Trial)' },
  { value: 2, label: '2 Sets (Boutique Tier)' },
  { value: 3, label: '3 Sets' },
];

export default function AdminMOQRulesPage() {
  const { addToast } = useApp();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [minSets, setMinSets] = useState(4);
  const [minPieces, setMinPieces] = useState(4);
  const [minDesigns, setMinDesigns] = useState(1);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [allowSampleOrders, setAllowSampleOrders] = useState(true);

  // Whole Seller overrides
  const [retailers, setRetailers] = useState<RetailerRow[]>([]);
  const [retailerSearch, setRetailerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [retailersLoading, setRetailersLoading] = useState(true);
  const [busyRetailer, setBusyRetailer] = useState<string | null>(null);

  const applyPolicyToForm = (p: Policy) => {
    setMinSets(p.minSets);
    setMinPieces(p.minPieces);
    setMinDesigns(p.minDesigns);
    setMinOrderValue(p.minOrderValue);
    setAllowSampleOrders(p.allowSampleOrders);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/moq-rules');
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load MOQ policy');
        if (!active) return;
        setPolicy(json.data);
        applyPolicyToForm(json.data);
      } catch (e) {
        addToast({ type: 'error', title: 'Could not load MOQ policy', message: e instanceof Error ? e.message : 'Try again' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(retailerSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [retailerSearch]);

  const loadRetailers = useCallback(
    async (cursor?: string | null) => {
      const qs = new URLSearchParams({ approved: 'true' });
      if (debouncedSearch) qs.set('search', debouncedSearch);
      if (cursor) qs.set('cursor', cursor);
      const res = await fetch(`/api/admin/retailers?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load retailers');
      return json as { data: RetailerRow[]; nextCursor: string | null };
    },
    [debouncedSearch]
  );

  useEffect(() => {
    let active = true;
    setRetailersLoading(true);
    loadRetailers()
      .then(j => {
        if (!active) return;
        setRetailers(j.data);
        setNextCursor(j.nextCursor);
      })
      .catch(e => addToast({ type: 'error', title: 'Could not load retailers', message: e.message }))
      .finally(() => active && setRetailersLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRetailers]);

  const loadMoreRetailers = async () => {
    if (!nextCursor) return;
    try {
      const j = await loadRetailers(nextCursor);
      setRetailers(prev => [...prev, ...j.data]);
      setNextCursor(j.nextCursor);
    } catch (e) {
      addToast({ type: 'error', title: 'Could not load more', message: e instanceof Error ? e.message : 'Try again' });
    }
  };

  const handleSaveGlobalMOQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/moq-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minSets: Number(minSets),
          minPieces: Number(minPieces),
          minDesigns: Number(minDesigns),
          minOrderValue: Number(minOrderValue) || 0,
          allowSampleOrders,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast({ type: 'error', title: 'MOQ policy not saved', message: json.error || 'Something went wrong' });
        return;
      }
      setPolicy(json.data);
      applyPolicyToForm(json.data);
      addToast({
        type: 'success',
        title: 'MOQ Policy Saved',
        message: `Wholesale minimum is now ${json.data.minSets} sets per order.`,
      });
    } catch {
      addToast({ type: 'error', title: 'MOQ policy not saved', message: 'Network error — try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRetailerOverride = async (retailerId: string, permittedMinSets: number | null) => {
    setBusyRetailer(retailerId);
    try {
      const res = await fetch(`/api/admin/retailers/${retailerId}/moq`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permittedMinSets }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast({ type: 'error', title: 'Override not changed', message: json.error || 'Something went wrong' });
        return;
      }
      setRetailers(prev =>
        prev.map(r =>
          r.id === retailerId ? { ...r, moqOverride: json.data.moqOverride, customMoqSets: json.data.customMoqSets } : r
        )
      );
      addToast({ type: 'info', title: 'Override Modified', message: 'Retailer custom MOQ updated.' });
    } catch {
      addToast({ type: 'error', title: 'Override not changed', message: 'Network error — try again.' });
    } finally {
      setBusyRetailer(null);
    }
  };

  const defaultSets = policy?.minSets ?? minSets;

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="moq" />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              Commercial Order Rules
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Minimum Order Quantity (MOQ) Policy
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Enforce wholesale order minimums, sample-request privileges, and retailer-specific overrides.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Global Policy Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                1. System-Wide Default MOQ Rules
              </h2>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Applied at cart and checkout to every retailer without a custom override.
              </p>
            </div>

            {loading ? (
              <p className="text-stone-500 py-8 text-center">Loading MOQ policy...</p>
            ) : (
              <form onSubmit={handleSaveGlobalMOQ} className="space-y-5">

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Global Minimum Garment Sets per Order *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={minSets}
                      onChange={e => setMinSets(Number(e.target.value))}
                      className="w-32 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-base font-bold text-stone-900 focus:outline-none focus:border-rose-900"
                    />
                    <span className="text-stone-500">Sets per checkout</span>
                  </div>
                </div>

                {/* Other limits checkout also enforces */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <p className="font-bold text-stone-900">Other minimums checked at checkout</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Min pieces</label>
                      <input
                        type="number"
                        min={1}
                        value={minPieces}
                        onChange={e => setMinPieces(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Min different designs</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={minDesigns}
                        onChange={e => setMinDesigns(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Min order value (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={minOrderValue}
                        onChange={e => setMinOrderValue(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    An order must meet <strong>all</strong> of these. Use 0 for order value to turn that check off.
                  </p>
                </div>

                {/* Sample Orders Option */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <label className="flex items-center gap-2.5 font-bold text-stone-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowSampleOrders}
                      onChange={e => setAllowSampleOrders(e.target.checked)}
                      className="rounded text-[#831843]"
                    />
                    <span>Enable &quot;Request Sample / Video Call&quot; for retailers</span>
                  </label>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    When off, retailers can no longer submit sample or video-call requests.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#831843] hover:bg-rose-900 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Global MOQ Rules'}</span>
                </button>

              </form>
            )}
          </div>

          {/* Right: Retailer Specific Overrides Matrix */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                2. Whole Seller Custom Overrides
              </h2>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Grant a lower minimum to premium boutique clients or new trial accounts (approved retailers only).
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={retailerSearch}
                onChange={e => setRetailerSearch(e.target.value)}
                placeholder="Search retailer, GSTIN or mobile..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
              />
            </div>

            <div className="space-y-3">
              {retailersLoading ? (
                <p className="text-stone-500 py-6 text-center">Loading retailers...</p>
              ) : retailers.length === 0 ? (
                <p className="text-stone-500 py-6 text-center">No approved retailers found.</p>
              ) : (
                retailers.map(ret => {
                  const custom = ret.moqOverride ? ret.customMoqSets ?? 1 : null;
                  const isPreset = custom !== null && PRESET_OVERRIDES.some(o => o.value === custom);
                  return (
                    <div
                      key={ret.id}
                      className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-stone-900 text-sm">{ret.businessName}</strong>
                        <span className="font-mono text-[10px] text-stone-500">{ret.city || 'India'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-stone-600">Active MOQ:</span>
                        <select
                          value={custom === null ? 'default' : custom}
                          disabled={busyRetailer === ret.id}
                          onChange={e => {
                            const v = e.target.value;
                            handleRetailerOverride(ret.id, v === 'default' ? null : Number(v));
                          }}
                          className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg font-bold text-stone-800 disabled:opacity-50"
                        >
                          <option value="default">Default ({defaultSets} Sets)</option>
                          {PRESET_OVERRIDES.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                          {custom !== null && !isPreset && <option value={custom}>{custom} Sets (custom)</option>}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}

              {nextCursor && !retailersLoading && (
                <button
                  type="button"
                  onClick={loadMoreRetailers}
                  className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700"
                >
                  Load more
                </button>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}