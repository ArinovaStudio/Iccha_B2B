"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Loader2,
  LogOut,
} from "lucide-react";

export default function DeactivatedRetailerPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestReactivation = async () => {
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/retailer/reactivation-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      console.log(
        "[reactivation-request]",
        response.status,
        result
      );

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "Unable to submit your reactivation request."
        );
        return;
      }

      setSubmitted(true);

      setMessage(
        result.message ||
          "Your reactivation request has been submitted successfully."
      );
    } catch (error) {
      console.error(
        "Reactivation request error:",
        error
      );

      setError(
        "Unable to submit your reactivation request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center">

          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-700" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Account Deactivated
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            Your whole seller account has been automatically deactivated
            because there was no meaningful activity on your account
            for the allowed inactivity period.
          </p>

          <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0" />

              <div>
                <p className="font-semibold text-sm text-stone-800">
                  What happened?
                </p>

                <p className="mt-1 text-xs leading-5 text-stone-600">
                  Your account was deactivated after the inactivity
                  period expired. Your account data has not been deleted.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestReactivation}
            disabled={submitting || submitted}
            className="mt-6 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : submitted ? (
              "Request Submitted"
            ) : (
              "Request Reactivation"
            )}
          </button>

          {submitted && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="text-emerald-600 text-lg">
                  ✓
                </div>

                <div>
                  <p className="font-bold text-emerald-900 text-sm">
                    Request submitted
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left">
              <p className="font-bold text-rose-900 text-sm">
                Request could not be submitted
              </p>

              <p className="mt-1 text-xs leading-5 text-rose-800">
                {error}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>

        </div>
      </div>
    </main>
  );
}