'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import { fetchRetailerProfile, type RetailerProfileData } from '@/lib/retailer-profile-client';

const DOC_LABELS: Record<string, string> = {
  gst_certificate: 'GST Registration Certificate',
  pan_card: 'PAN Card',
  business_proof: 'Business Proof',
  shop_photo: 'Shop Photograph',
  business_card: 'Business Card / Social Proof',
};

const ACTION_LABELS: Record<string, string> = {
  SUBMITTED: 'Application submitted',
  UNDER_REVIEW: 'Under review',
  INFO_REQUESTED: 'Additional information requested',
  APPROVED: 'Application approved',
  REJECTED: 'Application rejected',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Active', className: 'bg-emerald-100 text-emerald-900' },
  APPLICATION_RECEIVED: { label: 'Received', className: 'bg-amber-100 text-amber-900' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-100 text-amber-900' },
  ADDITIONAL_INFORMATION_REQUIRED: { label: 'Info Required', className: 'bg-amber-100 text-amber-900' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-100 text-rose-900' },
  SUSPENDED: { label: 'Suspended', className: 'bg-rose-100 text-rose-900' },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function RetailerKYCRecordsPage() {
  const [data, setData] = useState<RetailerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRetailerProfile()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load KYC records.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const p = data?.profile;
  const kyc = data?.kyc;
  const status = STATUS_LABELS[p?.status ?? ''] ?? { label: p?.status ?? '—', className: 'bg-stone-100 text-stone-700' };
  const isActive = p?.status === 'APPROVED';

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          <nav className="text-xs text-stone-500 mb-1 flex items-center gap-2">
            <Link href="/retailer" className="hover:text-stone-900">Retailer Portal</Link>
            <span>/</span>
            <Link href="/retailer/profile" className="hover:text-stone-900">Profile</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">KYC Verification</span>
          </nav>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6 text-xs">

            <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900">
                  KYC & Trade Compliance Status
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  B2B wholesale access records for {loading ? '…' : p?.businessName ?? 'your business'}.
                </p>
              </div>

              <span className={`px-3 py-1 font-bold rounded-full flex items-center gap-1 shrink-0 ${status.className}`}>
                {isActive ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
                {loading ? '…' : status.label}
              </span>
            </div>

            {/* Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">GSTIN</span>
                <strong className="font-mono text-stone-900 text-sm">{kyc?.gstin ?? p?.gstin ?? 'Not provided'}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">PAN</span>
                <strong className="font-mono text-stone-900 text-sm">{kyc?.pan ?? p?.pan ?? 'Not provided'}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Submitted / Reviewed</span>
                <strong className="text-stone-900 text-sm">
                  {formatDate(kyc?.submittedAt)} / {formatDate(kyc?.reviewedAt)}
                </strong>
              </div>
            </div>

            {kyc?.infoRequestNotes && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <strong className="block mb-1">Additional information requested</strong>
                {kyc.infoRequestNotes}
              </div>
            )}
            {kyc?.rejectionReason && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                <strong className="block mb-1">Rejection reason</strong>
                {kyc.rejectionReason}
              </div>
            )}

            {/* Documents */}
            <div className="space-y-3">
              <h3 className="font-serif text-sm font-bold text-stone-900">Submitted Compliance Documents</h3>

              {loading ? (
                <p className="text-stone-500">Loading documents…</p>
              ) : !kyc || kyc.documents.length === 0 ? (
                <p className="text-stone-500">No KYC documents on file.</p>
              ) : (
                <div className="space-y-2">
                  {kyc.documents.map((doc) => (
                    <div key={doc.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <strong className="text-stone-900 text-sm block">{DOC_LABELS[doc.type] ?? doc.type}</strong>
                          <span className="text-stone-500 text-[11px] block truncate">
                            {doc.name} &bull; {doc.sizeMb} MB &bull; Uploaded {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded shrink-0">
                        {doc.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review history */}
            {kyc && kyc.activities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#831843]" /> Review History
                </h3>
                <ol className="space-y-2 border-l border-stone-200 pl-4">
                  {kyc.activities.map((a) => (
                    <li key={a.id}>
                      <span className="font-semibold text-stone-900">{ACTION_LABELS[a.action] ?? a.action}</span>
                      <span className="text-stone-500"> &bull; {formatDate(a.createdAt)}</span>
                      {a.notes && <p className="text-stone-600">{a.notes}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="pt-4 flex justify-between items-center">
              <Link href="/retailer/profile" className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}