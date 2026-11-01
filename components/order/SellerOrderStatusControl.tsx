"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

export const SELLER_ORDER_STATUSES = [
  "ENQUIRY_RECEIVED",
  "ORDER_ACCEPTED",
] as const;

type Props = {
  sellerOrderId: string;
  initialStatus: string;
  sellerName: string;
  mode: "vendor" | "admin";
  onUpdated?: (status: string) => void;
  readOnly?: boolean;
};

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function SellerOrderStatusControl({
  sellerOrderId,
  initialStatus,
  sellerName,
  mode,
  onUpdated,
  readOnly = false,
}: Props) {
  const { addToast } = useApp();

  const normalizedInitialStatus = initialStatus.toUpperCase();

  // Draft status selected in the dropdown
  const [status, setStatus] = useState(normalizedInitialStatus);

  // Last status actually saved to the database
  const [savedStatus, setSavedStatus] = useState(
    normalizedInitialStatus
  );

  const [saving, setSaving] = useState(false);

  async function updateStatus() {
    if (!status || status === savedStatus) return;

    setSaving(true);

    try {
      const endpoint =
        mode === "vendor"
          ? `/api/vendor/order-enquiries/${encodeURIComponent(
              sellerOrderId
            )}/status`
          : `/api/admin/order-enquiries/seller-orders/${encodeURIComponent(
              sellerOrderId
            )}/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.error || "Could not update order status."
        );
      }

      const nextStatus = String(
        json.data?.status || status
      ).toUpperCase();

      // Both states now represent the persisted status
      setStatus(nextStatus);
      setSavedStatus(nextStatus);

      onUpdated?.(nextStatus);

      addToast({
        type: "success",
        title: "Status updated",
        message: `${sellerName} order status is now ${label(nextStatus)}.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Status update failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not update order status.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
            {mode === "vendor"
              ? "Your Seller Order"
              : "IcchaStore Order"}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="w-4 h-4 text-[#831843]" />

            <h2 className="font-serif text-xl font-bold text-stone-900">
              {sellerName}
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1">
            {mode === "vendor"
              ? "You can update the status of your products only."
              : "Admin controls the status of IcchaStore-owned products only."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {readOnly ? (
            <span className="px-3 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700">
              {label(savedStatus)}
            </span>
          ) : (
            <>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={saving}
                className="min-w-[210px] px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-[#831843]"
              >
                {!SELLER_ORDER_STATUSES.includes(status as typeof SELLER_ORDER_STATUSES[number]) && (
                  <option value={status}>{label(status)}</option>
                )}
                {SELLER_ORDER_STATUSES.map(value => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={updateStatus}
                disabled={saving || status === savedStatus}
                className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}

                {saving ? "Saving..." : "Update Status"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
