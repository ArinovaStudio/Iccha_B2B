'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  ShoppingBag,
  Receipt,
  CheckCircle2,
  Clock,
  Sliders,
  Boxes
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';

interface DashboardData {
  retailer: { businessName: string; applicantName: string; gstin: string | null };
  cart: { totalSets: number; totalPieces: number; totalDesigns: number; subtotal: number };
  moq: { isMet: boolean; currentSets: number; requiredSets: number; overrideApplied: boolean };
  estimatesCount: number;
  hubs: { id: string; name: string; state: string }[];
  activeEnquiries: number;
  dispatchedOrders: number;
  pendingSampleCalls: number;
  categories: { id: string; name: string; slug: string; imageUrl: string | null }[];
}

const skeleton = 'animate-pulse rounded bg-stone-200/70 text-transparent select-none';

export default function RetailerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/retailer/dashboard', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Could not load your dashboard.');
        }
        setData(json.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const retailer = data?.retailer;
  const cart = data?.cart;
  const moq = data?.moq;
  const hubs = data?.hubs ?? [];
  const categories = data?.categories ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-10 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
              {error}
            </div>
          )}

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified KYC Retailer
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {loading ? (
                    <span className={skeleton}>Welcome, Business Name</span>
                  ) : (
                    <>Welcome, {retailer?.businessName ?? 'Retailer'}</>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                  Authorized Buyer: <strong className="text-white">{loading ? '…' : retailer?.applicantName ?? '—'}</strong>
                  {retailer?.gstin && (
                    <> &bull; GSTIN: <span className="font-mono text-amber-300">{retailer.gstin}</span></>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/catalogue"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Wholesale Catalogue</span>
                </Link>

                <Link
                  href="/retailer/cart"
                  className="px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition flex items-center gap-1.5"
                >
                  <span>Wholesale Cart ({cart?.totalSets ?? 0} Sets)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs uppercase font-bold tracking-wider">Wholesale Cart</span>
                <ShoppingBag className="w-4 h-4 text-[#831843]" />
              </div>
              <div className={`text-2xl font-bold text-stone-900 font-mono ${loading ? skeleton : ''}`}>
                {cart?.totalSets ?? 0} Sets <span className="text-xs text-stone-500 font-normal font-sans">({cart?.totalPieces ?? 0} pcs)</span>
              </div>
              <div className="text-xs text-stone-500 pt-1">
                Value: <strong className="text-stone-800">₹{Number(cart?.subtotal ?? 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs uppercase font-bold tracking-wider">MOQ Requirement</span>
                <Sliders className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900">
                {loading ? (
                  <span className={`text-lg ${skeleton}`}>Loading</span>
                ) : moq?.isMet ? (
                  <span className="text-emerald-700 text-lg flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Met ({moq.currentSets}/{moq.requiredSets})
                  </span>
                ) : (
                  <span className="text-amber-700 text-lg flex items-center gap-1">
                    <Clock className="w-5 h-5" /> Incomplete ({moq?.currentSets ?? 0}/{moq?.requiredSets ?? 0})
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 pt-1">
                {moq?.overrideApplied ? 'Admin Override Active' : `Standard ${moq?.requiredSets ?? '—'} Sets MOQ`}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs uppercase font-bold tracking-wider">Active Proformas</span>
                <Receipt className="w-4 h-4 text-sky-600" />
              </div>
              <div className={`text-2xl font-bold text-stone-900 font-mono ${loading ? skeleton : ''}`}>
                {data?.estimatesCount ?? 0} Estimate{data?.estimatesCount === 1 ? '' : 's'}
              </div>
              <div className="text-xs text-stone-500 pt-1">
                {hubs.length > 0 ? (
                  hubs.map((h) => h.name).join(' & ')
                ) : (
                  <Link href="/retailer/estimates" className="hover:underline">View estimates &rarr;</Link>
                )}
              </div>
            </div>

          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/catalogue"
              className="p-6 bg-white rounded-3xl border border-stone-200 hover:border-rose-300 hover:shadow-lg transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#831843] flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-rose-900">
                Live Wholesale Catalogue &rarr;
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Filter through ready-to-dispatch 2-piece and 3-piece lots with factory piece rates and live lot availability.
              </p>
            </Link>

            <Link
              href="/retailer/orders"
              className="p-6 bg-white rounded-3xl border border-stone-200 hover:border-rose-300 hover:shadow-lg transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800">
                Order Enquiries & Estimates &rarr;
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Review master order enquiry status, download dual GST proforma invoices, and track consignment dispatch.
              </p>
            </Link>

            <Link
              href="/retailer/cart"
              className="p-6 bg-white rounded-3xl border border-stone-200 hover:border-rose-300 hover:shadow-lg transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800">
                Wholesale Cart & MOQ &rarr;
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Check your automated billing entity breakdown, adjust set quantities, or request a video call.
                {(data?.pendingSampleCalls ?? 0) > 0 && (
                  <span className="block mt-1 font-semibold text-emerald-800">
                    {data?.pendingSampleCalls} sample call request{data?.pendingSampleCalls === 1 ? '' : 's'} pending
                  </span>
                )}
              </p>
            </Link>
          </div>

          {/* Quick Categories Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Wholesale Product Categories
              </h3>
              <Link href="/catalogue" className="text-xs font-bold text-[#831843] hover:underline">
                View All Categories &rarr;
              </Link>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-stone-500">
                {loading ? 'Loading categories...' : 'No categories available yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogue?category=${cat.id}`}
                    className="p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200/80 hover:border-rose-300 text-center transition group"
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-1.5 bg-stone-200">
                      {cat.imageUrl && (
                        <Image
                          src={cat.imageUrl}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 12vw"
                          className="object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800 group-hover:text-rose-900 line-clamp-1">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}