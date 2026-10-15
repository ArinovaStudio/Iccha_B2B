'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, Clock, CheckCircle2, XCircle, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';

type SampleCallRequest = {
  id: string;
  mobile: string;
  whatsapp: string | null;
  totalSets: number;
  totalPieces: number;
  preferredDate: string | null;
  preferredTime: string | null;
  remarks: string | null;
  status: string; // pending | approved | rejected
  rejectionReason: string | null;
  createdAt: string;
  product: {
    name: string;
    sku: string | null;
    designNumber: string | null;
    vendor: { businessName: string } | null;
  } | null;
};

const STATUS = {
  pending: {
    label: 'Pending',
    Icon: Clock,
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    banner: 'bg-amber-50 border-amber-200 text-amber-800',
    title: 'Awaiting Review',
    message: 'Your request has been sent to the responsible vendor/admin and is waiting for review.',
  },
  approved: {
    label: 'Approved',
    Icon: CheckCircle2,
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    banner: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    title: 'Request Approved',
    message: 'They can now contact you using the details provided.',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircle,
    badge: 'bg-red-50 border-red-200 text-red-700',
    banner: 'bg-red-50 border-red-200 text-red-800',
    title: 'Reason for Rejection',
    message: '',
  },
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SectionTitle({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-3">
      {Icon && <Icon className="w-4 h-4 text-[#831843]" />}
      {children}
    </div>
  );
}

export default function SampleCallRequestsPage() {
  const [requests, setRequests] = useState<SampleCallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/retailer/sample-call-requests', {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Could not load sample call requests.');
      }
      setRequests(json.data || []);
    } catch (err) {
      console.error('Sample call request loading error:', err);
      setError(err instanceof Error ? err.message : 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5]">
      <RetailerHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/retailer"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#831843] mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#831843] flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Sample Call Requests</h1>
                <p className="text-xs text-stone-500 mt-1">Track your video call and sample consultation requests.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-2xl bg-white border border-stone-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-xl font-bold text-stone-900">No Sample Call Requests</h2>
            <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
              You have not submitted any sample call requests yet.
            </p>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-[#831843] text-white text-xs font-bold hover:bg-rose-900"
            >
              Browse Catalogue
            </Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-5">
            {requests.map((item) => {
              const s = STATUS[item.status as keyof typeof STATUS] ?? STATUS.pending;
              const rejected = item.status === 'rejected';

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Request ID</span>
                        <span className="font-mono text-xs font-bold text-stone-800">#{item.id}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">Submitted {formatDate(item.createdAt)}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${s.badge}`}
                    >
                      <s.Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <SectionTitle icon={Package}>Product</SectionTitle>
                      {item.product ? (
                        <div className="space-y-1 text-[11px] text-stone-500">
                          <p className="text-sm font-bold text-stone-900">{item.product.name}</p>
                          {item.product.sku && <p>SKU: {item.product.sku}</p>}
                          {item.product.designNumber && <p>Design: {item.product.designNumber}</p>}
                          <p>
                            {item.product.vendor
                              ? `Vendor: ${item.product.vendor.businessName}`
                              : 'Handled by IcchaStore Admin'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">Product information unavailable.</p>
                      )}
                    </div>

                    <div>
                      <SectionTitle icon={PhoneCall}>Call Preference</SectionTitle>
                      <div className="space-y-2 text-xs text-stone-600">
                        {item.preferredDate && <div><strong>Date:</strong> {item.preferredDate}</div>}
                        {item.preferredTime && <div><strong>Time:</strong> {item.preferredTime}</div>}
                        <div><strong>WhatsApp:</strong> {item.whatsapp || 'Not provided'}</div>
                        <div><strong>Mobile:</strong> {item.mobile}</div>
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Request Details</SectionTitle>
                      <div className="space-y-2 text-xs text-stone-600">
                        <div><strong>Sets:</strong> {item.totalSets}</div>
                        <div><strong>Pieces:</strong> {item.totalPieces}</div>
                        {item.remarks && <div><strong>Remarks:</strong> {item.remarks}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Status banner (rejected only shows when a reason exists) */}
                  {(!rejected || item.rejectionReason) && (
                    <div className={`mx-5 mb-5 p-4 rounded-xl border ${s.banner}`}>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <s.Icon className="w-4 h-4" />
                        {s.title}
                      </div>
                      <p className="text-xs mt-1.5 leading-relaxed">
                        {rejected ? item.rejectionReason : s.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}