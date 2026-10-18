'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import {
  fetchRetailerProfile,
  type RetailerAddressView,
  type RetailerProfileData,
} from '@/lib/retailer-profile-client';

const skeleton = 'animate-pulse rounded bg-stone-200/70 text-transparent select-none';

function AddressBlock({ address }: { address: RetailerAddressView | null }) {
  if (!address) {
    return <div className="text-stone-500">No address on file.</div>;
  }
  return (
    <div className="text-stone-700 leading-relaxed">
      <div>{[address.street, address.area].filter(Boolean).join(', ')}</div>
      <div>{address.city}, {address.state} - {address.pincode}</div>
      {address.landmark && <div className="text-stone-500">Landmark: {address.landmark}</div>}
      <div className="text-stone-500 mt-1">State Code: {address.stateCode}</div>
    </div>
  );
}

export default function RetailerProfilePage() {
  const [data, setData] = useState<RetailerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRetailerProfile()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const p = data?.profile;
  const sameAddress =
    data?.billingAddress && data?.shippingAddress &&
    JSON.stringify(data.billingAddress) === JSON.stringify(data.shippingAddress);

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          <nav className="text-xs text-stone-500 mb-1 flex items-center gap-2">
            <Link href="/retailer" className="hover:text-stone-900">Whole Seller Portal</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Boutique Profile</span>
          </nav>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#831843] flex items-center justify-center font-serif text-2xl font-bold">
                  {p?.businessName?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div>
                  <h1 className={`font-serif text-2xl font-bold text-stone-900 ${loading ? skeleton : ''}`}>
                    {p?.businessName ?? 'Business name'}
                  </h1>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Wholesale Reseller
                  </span>
                </div>
              </div>

              <Link
                href="/retailer/kyc"
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <ShieldCheck className="w-4 h-4 text-[#831843]" />
                <span>View KYC Records</span>
              </Link>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">

              <div className="space-y-4">
                <h3 className="font-serif text-sm font-bold text-stone-900 border-b border-stone-100 pb-1.5">
                  Authorized Contact
                </h3>
                <div className="space-y-2 text-stone-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Proprietor / Buyer</span>
                    <strong className="text-stone-900 text-sm">{loading ? '…' : p?.applicantName ?? '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Mobile Phone</span>
                    <strong className="text-stone-900">{loading ? '…' : p?.mobile ?? '—'}</strong>
                  </div>
                  {p?.whatsapp && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">WhatsApp</span>
                      <strong className="text-stone-900">{p.whatsapp}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Email Address</span>
                    <strong className="text-stone-900">{loading ? '…' : p?.email ?? '—'}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-sm font-bold text-stone-900 border-b border-stone-100 pb-1.5">
                  Tax & Regulatory Identifiers
                </h3>
                <div className="space-y-2 text-stone-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">GSTIN Number</span>
                    <strong className="font-mono text-stone-900 text-sm">{loading ? '…' : p?.gstin ?? 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">PAN Number</span>
                    <strong className="font-mono text-stone-900">{loading ? '…' : p?.pan ?? 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">MOQ Requirement</span>
                    <strong className="text-stone-900">
                      {data
                        ? data.moq.overrideApplied
                          ? `Custom Override (${data.moq.requiredSets} Sets)`
                          : `Standard ${data.moq.requiredSets} Sets MOQ`
                        : '…'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-stone-900 border-b border-stone-100 pb-1.5">
                  Registered Billing Address
                </h3>
                {loading ? <div className="text-stone-500">Loading…</div> : <AddressBlock address={data?.billingAddress ?? null} />}
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-stone-900 border-b border-stone-100 pb-1.5">
                  Default Consignee Shipping Address
                </h3>
                {loading ? (
                  <div className="text-stone-500">Loading…</div>
                ) : sameAddress ? (
                  <div className="text-stone-500">Same as billing address.</div>
                ) : (
                  <AddressBlock address={data?.shippingAddress ?? null} />
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}