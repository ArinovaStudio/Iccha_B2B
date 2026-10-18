'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

import AdminSidebar from '@/components/layout/AdminSidebar';

type DashboardMetrics = {
  pendingKyc: number;
  totalKycApplications: number;
  activeOrderEnquiries: number;
  grossEnquiryPipeline: number;
  totalSetsInPipeline: number;
  activeProducts: number;
  lowStockProducts: number;
  approvedRetailers: number;
  activeVendors: number;
};

type PendingKyc = {
  id: string;
  businessName: string;
  applicantName: string;
  mobile: string;
  email: string;
  gstin: string;
  status: string;
  submittedAt: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  retailerBusinessName: string;
  retailerApplicantName: string;
  totalDesigns: number;
  totalSets: number;
  totalPieces: number;
  masterTotal: number;
  status: string;
  createdAt: string;
};

type LowStockProduct = {
  id: string;
  sku: string;
  designNumber: string;
  name: string;
  availableSets: number;
  totalAvailablePieces: number;
};

type DashboardData = {
  metrics: DashboardMetrics;
  pendingKyc: PendingKyc[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
};

type DashboardResponse = {
  success: boolean;
  data: DashboardData | null;
  error: {
    code?: string;
    message?: string;
  } | null;
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const response =
        await fetch('/api/admin/dashboard', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

      const result: DashboardResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ||
          'Failed to load dashboard'
        );
      }

      if (!result.data) {
        throw new Error(
          'Dashboard returned no data'
        );
      }

      setDashboard(result.data);
    } catch (err) {
      console.error(
        'Dashboard loading error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = dashboard?.metrics;

  return (
    <div className="flex max-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="dashboard" />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
        {/* -------------------------------------------------- */}
        {/* Header */}
        {/* -------------------------------------------------- */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
                IcchaStore Operations Desk
              </span>

              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                Admin Console
              </span>
            </div>

            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Wholesale Merchandising Overview
            </h1>

            <p className="text-xs text-stone-500 mt-2">
              Live data from the IcchaStore database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <Link
              href="/admin/products"
              className="px-4 py-2 bg-[#831843] hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5" />

              <span>
                Manage Catalogue
              </span>
            </Link>
          </div>
        </div>

        {/* -------------------------------------------------- */}
        {/* Loading */}
        {/* -------------------------------------------------- */}

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm animate-pulse"
                >
                  <div className="h-3 w-32 bg-stone-200 rounded" />

                  <div className="h-8 w-24 bg-stone-200 rounded mt-4" />

                  <div className="h-3 w-40 bg-stone-200 rounded mt-3" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm animate-pulse"
                >
                  <div className="h-5 w-56 bg-stone-200 rounded mb-6" />

                  <div className="space-y-3">
                    {[1, 2, 3].map((row) => (
                      <div
                        key={row}
                        className="h-20 bg-stone-100 rounded-2xl"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* Error */}
        {/* -------------------------------------------------- */}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />

              <div>
                <h3 className="font-bold text-red-900">
                  Dashboard failed to load
                </h3>

                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>

                <button
                  onClick={loadDashboard}
                  className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* Dashboard */}
        {/* -------------------------------------------------- */}

        {!loading && !error && dashboard && (
          <>
            {/* ------------------------------------------------ */}
            {/* Metric Tiles */}
            {/* ------------------------------------------------ */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Pending KYC */}

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Pending KYC Queue
                  </span>

                  <FileCheck className="w-4 h-4 text-amber-600" />
                </div>

                <div className="text-3xl font-bold text-stone-900 font-mono">
                  {metrics?.pendingKyc ?? 0}

                  <span className="text-xs font-sans text-amber-700 font-semibold ml-2">
                    Verification Queue
                  </span>
                </div>

                <div className="text-xs text-stone-500 pt-1">
                  {metrics?.totalKycApplications ?? 0}{' '}
                  total applications on file
                </div>
              </div>

              {/* Active Enquiries */}

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Active Order Enquiries
                  </span>

                  <Receipt className="w-4 h-4 text-rose-800" />
                </div>

                <div className="text-3xl font-bold text-stone-900 font-mono">
                  {metrics?.activeOrderEnquiries ?? 0}

                  <span className="text-xs font-sans text-rose-800 font-semibold ml-2">
                    Enquiries
                  </span>
                </div>

                <div className="text-xs text-stone-500 pt-1">
                  {metrics?.totalSetsInPipeline ?? 0}{' '}
                  garment sets in pipeline
                </div>
              </div>

              {/* Pipeline */}

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Gross Enquiry Pipeline
                  </span>

                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="text-3xl font-bold font-mono text-stone-900">
                  {formatCurrency(
                    metrics?.grossEnquiryPipeline ?? 0
                  )}
                </div>

                <div className="text-xs text-stone-500 pt-1">
                  Across active wholesale enquiries
                </div>
              </div>

              {/* Catalogue */}

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Live Kurti Catalogue
                  </span>

                  <Boxes className="w-4 h-4 text-sky-600" />
                </div>

                <div className="text-3xl font-bold text-stone-900 font-mono">
                  {metrics?.activeProducts ?? 0}

                  <span className="text-xs font-sans text-sky-800 font-semibold ml-2">
                    Designs
                  </span>
                </div>

                <div className="text-xs text-stone-500 pt-1">
                  {metrics?.lowStockProducts ?? 0}{' '}
                  designs in low stock
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ */}
            {/* KYC + Orders */}
            {/* ------------------------------------------------ */}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* KYC */}

              <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#831843]" />

                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Pending KYC Applications
                    </h3>
                  </div>

                  <Link
                    href="/admin/kyc"
                    className="text-xs font-bold text-[#831843] hover:underline"
                  >
                    View All (
                    {metrics?.totalKycApplications ?? 0}
                    ) →
                  </Link>
                </div>

                <div className="space-y-3">
                  {dashboard.pendingKyc.length > 0 ? (
                    dashboard.pendingKyc.map((application) => (
                      <div
                        key={application.id}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <strong className="text-stone-900 text-sm block truncate">
                            {application.businessName}
                          </strong>

                          <span className="text-stone-500 font-mono block truncate">
                            GSTIN: {application.gstin}
                            {' • '}
                            {application.applicantName}
                            {' • '}
                            {application.mobile}
                          </span>

                          <div className="text-[10px] text-stone-400 mt-1">
                            Applied:{' '}
                            {formatDate(
                              application.submittedAt
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/admin/kyc?reviewId=${application.id}`}
                          className="px-3 py-1.5 bg-[#831843] hover:bg-rose-900 text-white rounded-lg font-bold text-[11px] shadow transition whitespace-nowrap"
                        >
                          Audit & Approve
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />

                      All KYC applications have been reviewed!
                    </div>
                  )}
                </div>
              </div>

              {/* Orders */}

              <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-800" />

                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Recent Wholesale Enquiries
                    </h3>
                  </div>

                  <Link
                    href="/admin/orders"
                    className="text-xs font-bold text-[#831843] hover:underline"
                  >
                    View All Enquiries →
                  </Link>
                </div>

                <div className="space-y-3">
                  {dashboard.recentOrders.length > 0 ? (
                    dashboard.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-stone-900 text-sm">
                              Order #{order.orderNumber}
                            </strong>

                            <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded font-bold uppercase">
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </div>

                          <div className="text-stone-600 mt-1">
                            Whole Seller:{' '}
                            <strong>
                              {order.retailerBusinessName}
                            </strong>
                          </div>

                          <div className="text-[10px] text-stone-400 mt-1">
                            {order.totalSets} Sets
                            {' • '}
                            {order.totalPieces} Pieces
                            {' • '}
                            {order.totalDesigns} Designs
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-bold text-rose-900 block">
                            {formatCurrency(
                              order.masterTotal
                            )}
                          </span>

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-[11px] font-bold text-stone-700 hover:text-stone-900 underline mt-1 inline-block"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-500">
                      No active wholesale enquiries found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ */}
            {/* Operational Summary */}
            {/* ------------------------------------------------ */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Approved Retailers */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-bold text-stone-400">
                    Approved Retailers
                  </p>
                </div>

                <p className="text-3xl font-bold font-mono text-stone-900 mt-3">
                  {metrics?.approvedRetailers ?? 0}
                </p>

                <p className="text-xs text-stone-500 mt-1">
                  Retailers currently approved
                </p>
              </div>

              {/* Active Vendors */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-bold text-stone-400">
                    Active Vendors
                  </p>
                </div>

                <p className="text-3xl font-bold font-mono text-stone-900 mt-3">
                  {metrics?.activeVendors ?? 0}
                </p>

                <p className="text-xs text-stone-500 mt-1">
                  Vendors currently supplying
                </p>
              </div>

              {/* Sets in Pipeline */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-bold text-stone-400">
                    Sets in Pipeline
                  </p>
                </div>

                <p className="text-3xl font-bold font-mono text-stone-900 mt-3">
                  {metrics?.totalSetsInPipeline ?? 0}
                </p>

                <p className="text-xs text-stone-500 mt-1">
                  Sets across active enquiries
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}