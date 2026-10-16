
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  FileText,
  ArrowRight,
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';

type KycStatus =
  | 'APPLICATION_RECEIVED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

interface ApplicationData {
  id: string;
  status: KycStatus;
  businessName: string;
  applicantName: string;
  mobile: string;
  gstin: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  infoRequestNotes: string | null;
  documents: {
    id: string;
    name: string;
    type: string;
    size: string;
  }[];
}

const statusConfig: Record<
  KycStatus,
  {
    title: string;
    color: string;
    bg: string;
    border: string;
    icon: any;
    desc: string;
  }
> = {
  APPLICATION_RECEIVED: {
    title: 'Application Received (Pending Queue)',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: Clock,
    desc: 'Your application has been received into our verification queue. Verification typically takes 4 to 24 business hours.',
  },
  UNDER_REVIEW: {
    title: 'Under Active Officer Verification',
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    icon: Clock,
    desc: 'Our compliance officer is currently cross-verifying your documentation.',
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    title: 'Action Required: Additional Information Requested',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: AlertTriangle,
    desc: 'The reviewing officer has requested an updated document or clarification.',
  },
  APPROVED: {
    title: 'KYC Verified & Approved!',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    icon: CheckCircle2,
    desc: 'Your B2B wholesale account is approved. You can now log in.',
  },
  REJECTED: {
    title: 'Application Not Approved',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    icon: XCircle,
    desc: 'Your application could not be verified. See the note below for details.',
  },
  SUSPENDED: {
    title: 'Account Suspended',
    color: 'text-stone-800',
    bg: 'bg-stone-100',
    border: 'border-stone-400',
    icon: ShieldAlert,
    desc: 'Your account is currently on hold. Please contact our support desk.',
  },
};

function ApplicationStatusContent() {
  const searchParams = useSearchParams();

  // Support the new identifier parameter and older email links.
  const initialIdentifier =
    searchParams.get('identifier') ||
    searchParams.get('email') ||
    '';

  const [identifierInput, setIdentifierInput] = useState(initialIdentifier);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchStatus = async (identifier: string) => {
    const value = identifier.trim();

    if (!value) return;

    setLoading(true);
    setNotFound(false);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/kyc/status?identifier=${encodeURIComponent(value)}`
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setApplication(result.data);
      } else {
        setApplication(null);
        setNotFound(true);
      }
    } catch {
      setApplication(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIdentifier) {
      void fetchStatus(initialIdentifier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void fetchStatus(identifierInput);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#831843]">
              Retailer Onboarding
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Track KYC Verification Status
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Check the live progress of your retailer registration using your
              registered email or mobile number.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex gap-2 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />

              <input
                id="identifier"
                type="text"
                required
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="Enter your email or mobile number"
                aria-label="Email or mobile number"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-rose-900 font-medium shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-[#831843] hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-60"
            >
              {loading ? 'Checking...' : 'Track'}
            </button>
          </form>

          {loading && (
            <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
              Loading application details...
            </div>
          )}

          {!loading && application && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl font-bold text-stone-900">
                      {application.businessName}
                    </h2>

                    <span className="text-[11px] bg-stone-100 font-mono text-stone-700 px-2 py-0.5 rounded font-bold">
                      #{application.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 mt-1">
                    Applicant: <strong>{application.applicantName}</strong>
                    {' • '}
                    Contact: {application.mobile}

                    {application.gstin && (
                      <>
                        {' • '}
                        GSTIN:{' '}
                        <span className="font-mono font-bold text-stone-800">
                          {application.gstin}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-stone-500">
                  <div>
                    Submitted:{' '}
                    <strong>
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </strong>
                  </div>

                  <div>
                    Reviewed:{' '}
                    <strong>
                      {application.reviewedAt
                        ? new Date(application.reviewedAt).toLocaleDateString()
                        : 'In Queue'}
                    </strong>
                  </div>
                </div>
              </div>

              {(() => {
                const config = statusConfig[application.status];
                const StatusIcon = config.icon;
                const note =
                  application.rejectionReason ||
                  application.infoRequestNotes;

                return (
                  <div
                    className={`p-5 rounded-2xl border ${config.bg} ${config.border} space-y-2`}
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />

                      <h3
                        className={`font-serif text-lg font-bold ${config.color}`}
                      >
                        {config.title}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {config.desc}
                    </p>

                    {note && (
                      <div className="mt-3 p-3 bg-white/90 rounded-xl border border-stone-200 text-xs">
                        <strong className="text-stone-900 block mb-0.5">
                          Reviewer Note:
                        </strong>

                        <span className="text-stone-700">{note}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {application.status === 'APPROVED' && (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-serif text-base font-bold text-emerald-950">
                      You're approved — log in to continue
                    </h4>

                    <p className="text-xs text-stone-700">
                      You now have full access to wholesale rates, live
                      inventory, and order enquiries.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="px-6 py-3 bg-[#831843] hover:bg-rose-900 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </Link>
                </div>
              )}

              {application.documents.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-stone-200 text-xs">
                  <h4 className="font-semibold text-stone-800">
                    Documents Attached ({application.documents.length}):
                  </h4>

                  <div className="space-y-2">
                    {application.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5"
                      >
                        <FileText className="w-4 h-4 text-stone-500" />

                        <div>
                          <strong className="text-stone-900 block">
                            {doc.name}
                          </strong>

                          <span className="text-[10px] text-stone-500 font-mono">
                            {doc.type.replace('_', ' ').toUpperCase()}
                            {' • '}
                            {doc.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && notFound && searched && (
            <div
              role="alert"
              className="p-12 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-600"
            >
              No application found for that email or mobile number. Please
              check the details you registered with.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-stone-500">
          Loading Application Status...
        </div>
      }
    >
      <ApplicationStatusContent />
    </Suspense>
  );
}
