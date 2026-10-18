'use client';

import React, { useEffect, useState } from 'react';
import { PhoneCall, CheckCircle2, XCircle, Clock, Package, User, RefreshCw } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';

type RequestStatus = 'pending' | 'approved' | 'rejected';

type SampleCallRequest = {
  id: string;
  totalSets: number;
  totalPieces: number;
  preferredDate: string | null;
  preferredTime: string | null;
  remarks: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  product: { name: string; sku: string | null; designNumber: string | null } | null;
  retailerProfile: {
    businessName: string;
    applicantName: string;
    mobile: string;
    whatsapp: string | null;
    user?: { email: string } | null;
  };
};

const TABS: { key: RequestStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const BADGES = {
  pending: { label: 'Pending', Icon: Clock, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  approved: { label: 'Approved', Icon: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  rejected: { label: 'Rejected', Icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-700' },
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const { label, Icon, cls } = BADGES[status as RequestStatus] ?? BADGES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, color, children }: { icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      {children}
    </div>
  );
}

const Line = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <p className="text-[11px] text-stone-500">
      {label}: {value}
    </p>
  ) : null;

export default function SampleCallRequestsPage() {
  const [requests, setRequests] = useState<SampleCallRequest[]>([]);
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Vendors only see/act on their own requests; staff only on admin-owned ones.
  const isVendor = role === 'VENDOR';
  const base = isVendor ? '/api/vendor/sample-call-requests' : '/api/admin/sample-call-requests';

  const loadRole = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await response.json();
      if (json.success) setRole(json.data.role);
    } catch (err) {
      console.error('Could not load user role:', err);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${base}?status=${status}`, {
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
    loadRole();
  }, []);

  useEffect(() => {
    if (role) loadRequests();
  }, [role, status]);

  /* Shared PATCH for approve / reject */
  const updateRequest = async (id: string, body: object, failMessage: string) => {
    try {
      setActionLoading(id);
      setError(null);

      const response = await fetch(`${base}/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();

      if (!response.ok || !json.success) throw new Error(json.error || failMessage);

      setRejectingId(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err) {
      console.error(failMessage, err);
      setError(err instanceof Error ? err.message : failMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const approveRequest = (id: string) =>
    updateRequest(id, { status: 'approved' }, 'Could not approve request.');

  const rejectRequest = (id: string) => {
    const reason = rejectionReason.trim();
    if (!reason) return setError('Please provide a reason for rejection.');
    return updateRequest(id, { status: 'rejected', rejectionReason: reason }, 'Could not reject request.');
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="sample-call-requests" />

      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#831843]">
                {isVendor ? 'Vendor Portal' : 'Admin Console'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold">
                Sample Calls
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Sample Call Requests</h1>
            <p className="text-xs text-stone-500 mt-1">Review retailer requests for product sample and video calls.</p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${status === key
                ? 'bg-[#831843] text-white border-[#831843]'
                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 bg-white rounded-2xl border border-stone-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-xl font-bold text-stone-900">No {status} requests</h2>
            <p className="text-xs text-stone-500 mt-2">There are currently no sample call requests in this queue.</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-5">
            {requests.map((item) => {
              const busy = actionLoading === item.id;
              const retailer = item.retailerProfile;

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Request</span>
                        <span className="font-mono text-xs font-bold text-stone-800">#{item.id}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">Submitted {formatDate(item.createdAt)}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Card content */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <SectionTitle icon={Package} color="text-[#831843]">Product</SectionTitle>
                      {item.product ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-stone-900">{item.product.name}</p>
                          <Line label="SKU" value={item.product.sku} />
                          <Line label="Design" value={item.product.designNumber} />
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">Product information unavailable.</p>
                      )}
                    </div>

                    <div>
                      <SectionTitle icon={User} color="text-amber-700">Whole Seller</SectionTitle>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-900">{retailer.businessName}</p>
                        <Line label="Contact" value={retailer.applicantName} />
                        <Line label="Mobile" value={retailer.mobile} />
                        <Line label="WhatsApp" value={retailer.whatsapp} />
                        <Line label="Email" value={retailer.user?.email} />
                      </div>
                    </div>

                    <div>
                      <SectionTitle icon={PhoneCall} color="text-emerald-700">Call Details</SectionTitle>
                      <div className="space-y-1 text-[11px] text-stone-600">
                        <p><strong>Date:</strong> {item.preferredDate || 'Not specified'}</p>
                        <p><strong>Time:</strong> {item.preferredTime || 'Not specified'}</p>
                        <p><strong>Sets:</strong> {item.totalSets}</p>
                        <p><strong>Pieces:</strong> {item.totalPieces}</p>
                      </div>
                    </div>
                  </div>

                  {item.remarks && (
                    <div className="mx-5 mb-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">Whole Seller Remarks</p>
                      <p className="text-xs text-stone-700 leading-relaxed">{item.remarks}</p>
                    </div>
                  )}

                  {item.status === 'rejected' && item.rejectionReason && (
                    <div className="mx-5 mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                        <XCircle className="w-4 h-4" />
                        Rejection Reason
                      </div>
                      <p className="text-xs text-red-700 mt-2">{item.rejectionReason}</p>
                    </div>
                  )}

                  {/* Pending actions */}
                  {item.status === 'pending' && (
                    <div className="p-5 border-t border-stone-100 bg-stone-50">
                      {rejectingId === item.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                              Reason for Rejection *
                            </label>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                              placeholder="Enter the reason that will be shown to the retailer..."
                              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                              disabled={busy}
                              className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-600 hover:bg-stone-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectRequest(item.id)}
                              disabled={busy || !rejectionReason.trim()}
                              className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                              {busy ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>This request is awaiting your review.</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRejectingId(item.id)}
                              disabled={busy}
                              className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => approveRequest(item.id)}
                              disabled={busy}
                              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {busy ? 'Approving...' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}