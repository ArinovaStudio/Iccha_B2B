"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useApp } from "@/lib/context/AppContext";

interface ReactivationRequest {
  id: string;
  businessName: string;
  applicantName: string;
  mobile: string;
  email: string;
  gstin: string | null;
  businessType: string | null;
  city: string | null;
  state: string | null;
  status: string;
  deactivatedAt: string | null;
  lastActivityAt: string | null;
  requestedAt: string;
  requestReason: string | null;
  requestAuditId: string;
}

export default function RetailerReactivationRequestsPage() {
  const { addToast } = useApp();

  const [requests, setRequests] = useState<ReactivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectingRequest, setRejectingRequest] =
    useState<ReactivationRequest | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const formatDate = (value: string | null) => {
    if (!value) return "Not available";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const loadRequests = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/retailer-reactivation-requests",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        addToast({
          type: "error",
          title: "Failed to load requests",
          message:
            result.error || "Unable to load reactivation requests.",
        });

        return;
      }

      setRequests(result.data || []);
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Failed to load requests",
        message: "Something went wrong while loading the requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveRequest = async (request: ReactivationRequest) => {
    const confirmed = window.confirm(
      `Reactivate ${request.businessName}?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);

    try {
      const response = await fetch(
        `/api/admin/retailer-reactivation-requests/${request.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "APPROVE",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        addToast({
          type: "error",
          title: "Reactivation failed",
          message:
            result.error || "Unable to reactivate this retailer.",
        });

        return;
      }

      setRequests((previous) =>
        previous.filter((item) => item.id !== request.id)
      );

      addToast({
        type: "success",
        title: "Retailer reactivated",
        message:
          result.message ||
          `${request.businessName} can now access the retailer portal.`,
      });
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Reactivation failed",
        message: "Something went wrong.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request: ReactivationRequest) => {
    setRejectionReason("");
    setRejectingRequest(request);
  };

  const rejectRequest = async () => {
    if (!rejectingRequest) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      addToast({
        type: "error",
        title: "Reason required",
        message: "Please enter a reason for rejecting the request.",
      });

      return;
    }

    setProcessingId(rejectingRequest.id);

    try {
      const response = await fetch(
        `/api/admin/retailer-reactivation-requests/${rejectingRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "REJECT",
            reason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        addToast({
          type: "error",
          title: "Rejection failed",
          message:
            result.error ||
            "Unable to reject this reactivation request.",
        });

        return;
      }

      setRequests((previous) =>
        previous.filter(
          (item) => item.id !== rejectingRequest.id
        )
      );

      addToast({
        type: "success",
        title: "Request rejected",
        message:
          result.message ||
          `${rejectingRequest.businessName}'s request was rejected.`,
      });

      setRejectingRequest(null);
      setRejectionReason("");
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Rejection failed",
        message: "Something went wrong.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="retailer-reactivation-requests" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              Retailer Accounts
            </span>

            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Reactivation Requests
            </h1>

            <p className="text-xs text-stone-500 mt-1">
              Review retailers whose accounts were deactivated due to
              inactivity and process their reactivation requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>

            <div>
              <p className="font-bold text-stone-900 text-sm">
                Pending requests
              </p>

              <p className="text-xs text-stone-500">
                {requests.length} retailer
                {requests.length === 1 ? "" : "s"} waiting for review
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#831843]" />
            <p className="mt-3 text-xs text-stone-500">
              Loading reactivation requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-16 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />

            <h2 className="mt-4 font-serif text-xl font-bold text-stone-900">
              No pending requests
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              There are currently no retailer reactivation requests
              waiting for review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {requests.map((request) => {
              const isProcessing = processingId === request.id;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-serif text-lg font-bold">
                        {request.businessName.charAt(0)}
                      </div>

                      <div>
                        <h2 className="font-bold text-stone-900 text-sm">
                          {request.businessName}
                        </h2>

                        <p className="text-[11px] text-stone-500">
                          {request.applicantName}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      REACTIVATION REQUEST
                    </span>
                  </div>

                  <div className="rounded-2xl bg-stone-50 border border-stone-100 p-4 space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Email
                      </span>
                      <span className="font-medium text-stone-800 break-all">
                        {request.email}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Mobile
                      </span>
                      <span className="font-medium text-stone-800">
                        {request.mobile}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        GSTIN
                      </span>
                      <span className="font-mono font-medium text-stone-800">
                        {request.gstin || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Location
                      </span>
                      <span className="font-medium text-stone-800">
                        {request.city
                          ? `${request.city}, ${request.state}`
                          : "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Deactivated
                      </span>
                      <span className="font-medium text-stone-800">
                        {formatDate(request.deactivatedAt)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Requested
                      </span>
                      <span className="font-medium text-stone-800">
                        {formatDate(request.requestedAt)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-stone-500">
                        Last activity
                      </span>
                      <span className="font-medium text-stone-800">
                        {formatDate(request.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  {request.requestReason && (
                    <div className="rounded-2xl border border-stone-200 p-4">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        Request note
                      </p>

                      <p className="mt-1 text-xs text-stone-600 leading-5">
                        {request.requestReason}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => openRejectModal(request)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => approveRequest(request)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve Reactivation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>

              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Reject Reactivation
                </h2>

                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {rejectingRequest.businessName}'s account will remain
                  deactivated.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Rejection reason *
              </label>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(event.target.value)
                }
                rows={4}
                maxLength={500}
                placeholder="Enter the reason for rejecting this request..."
                className="w-full resize-none rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-rose-900"
              />

              <p className="mt-1 text-[10px] text-stone-400 text-right">
                {rejectionReason.length}/500
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={processingId === rejectingRequest.id}
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  processingId === rejectingRequest.id ||
                  !rejectionReason.trim()
                }
                onClick={rejectRequest}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
              >
                {processingId === rejectingRequest.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}