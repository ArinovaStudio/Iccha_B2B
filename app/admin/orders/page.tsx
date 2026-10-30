"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  Package,
  Search,
  Store,
  CheckCircle2,
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useApp } from "@/lib/context/AppContext";

type Vendor = {
  id: string;
  businessName: string;
  contactName?: string;
};

type Item = {
  id: string;
  productId?: string | null;
  designNumber: string;
  color?: string | null;
  sets: number;
};

// Each colour of a product is stored as its own order line;
// group them so one product counts once.
function groupItemsByProduct(items: Item[]) {
  const map = new Map<
    string,
    {
      key: string;
      designNumber: string;
      sets: number;
      colors: string[];
    }
  >();

  for (const i of items) {
    const key = i.productId ?? i.designNumber;

    const g = map.get(key) ?? {
      key,
      designNumber: i.designNumber,
      sets: 0,
      colors: [],
    };

    g.sets += i.sets;

    if (i.color && !g.colors.includes(i.color)) {
      g.colors.push(i.color);
    }

    map.set(key, g);
  }

  return Array.from(map.values());
}

type Order = {
  id: string;
  orderNumber: string;
  retailerBusinessName: string;
  retailerApplicantName: string;
  status: string;
  totalDesigns: number;
  totalSets: number;
  totalPieces: number;
  subtotal: number;
  totalGst: number;
  shipping?: number;
  masterTotal: number;
  createdAt: string;
  items: Item[];
};

const statusClass: Record<string, string> = {
  ENQUIRY_RECEIVED: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  SELLER_CONTACTED: "bg-violet-50 text-violet-700 border-violet-200",
  ESTIMATE_GENERATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AWAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200",
  PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
  READY_FOR_DISPATCH: "bg-teal-50 text-teal-700 border-teal-200",
  DISPATCHED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-stone-100 text-stone-700 border-stone-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

function money(v: number) {
  return `₹${Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function label(v: string) {
  return v
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOrdersPage() {
  const { addToast } = useApp();

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [view, setView] = useState<"mine" | "vendor">("mine");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");

  const loadOrders = useCallback(
    async (
      mode: "mine" | "vendor",
      vendorId?: string,
      searchTerm = ""
    ) => {
      setLoading(true);

      try {
        const p = new URLSearchParams();

        p.set("view", mode);

        if (mode === "vendor" && vendorId) {
          p.set("vendorId", vendorId);
        }

        if (searchTerm.trim()) {
          p.set("search", searchTerm.trim());
        }

        const res = await fetch(
          `/api/admin/order-enquiries?${p.toString()}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.error || "Could not load orders."
          );
        }

        setOrders(json.data || []);
      } catch (e) {
        addToast({
          type: "error",
          title: "Failed to load orders",
          message:
            e instanceof Error
              ? e.message
              : "Could not load orders.",
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          throw new Error(
            json.error || "Could not determine the current user."
          );
        }

        const currentUserRole = json.data.role;

        setRole(currentUserRole);
        loadOrders("mine", undefined, "");
      })
      .catch((error) =>
        addToast({
          type: "error",
          title: "Authentication error",
          message:
            error instanceof Error
              ? error.message
              : "Could not determine the current user.",
        })
      )
      .finally(() => setLoadingRole(false));
  }, [addToast, loadOrders]);

  async function loadVendors() {
    setVendorLoading(true);

    try {
      const res = await fetch("/api/admin/vendors", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "Could not load vendors."
        );
      }

      setVendors(json.data || []);
    } catch (e) {
      addToast({
        type: "error",
        title: "Failed to load vendors",
        message:
          e instanceof Error
            ? e.message
            : "Could not load vendors.",
      });
    } finally {
      setVendorLoading(false);
    }
  }

  const filteredVendors = vendors.filter((v) => {
    const q = vendorSearch.trim().toLowerCase();

    if (!q) return true;

    return (
      v.businessName.toLowerCase().includes(q) ||
      (v.contactName || "").toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q)
    );
  });

  function selectVendor(vendor: Vendor) {
    setSelectedVendor(vendor);
    setView("vendor");
    loadOrders("vendor", vendor.id, search.trim());
  }

  function openMine() {
    setSelectedVendor(null);
    setView("mine");
    loadOrders("mine", undefined, search.trim());
  }

  if (loadingRole) {
    return (
      <div className="flex min-h-screen bg-[#faf8f5]">
        <AdminSidebar activeTab="orders" />

        <main className="flex-1 min-w-0 flex items-center justify-center p-6 text-xs text-stone-500">
          Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="orders" />

      <main className="flex-1 min-w-0 p-4 pt-16 sm:p-6 sm:pt-6 lg:p-10 space-y-5 sm:space-y-6 overflow-y-auto">
        <div className="border-b border-stone-200 pb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
            Order Management
          </span>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            {role === "VENDOR"
              ? "My Order Enquiries"
              : view === "vendor" && selectedVendor
                ? `${selectedVendor.businessName} Orders`
                : "My Orders"}
          </h1>

          <p className="text-xs text-stone-500 mt-1">
            {role === "VENDOR"
              ? "Only enquiries containing your products are visible."
              : "Use the two sections below to separate IcchaStore orders from vendor orders."}
          </p>
        </div>

        {/* Order Sections */}
        {role !== "VENDOR" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={openMine}
              className={`w-full text-left rounded-3xl border p-4 sm:p-5 min-h-[150px] ${
                view === "mine"
                  ? "bg-[#831843] text-white border-[#831843]"
                  : "bg-white border-stone-200"
              }`}
            >
              <Store className="w-5 h-5 mb-3" />

              <div className="text-xs uppercase tracking-widest font-bold opacity-70">
                Section 01
              </div>

              <h2 className="font-serif text-xl font-bold mt-1">
                My Orders
              </h2>

              <p className="text-xs opacity-70 mt-1">
                IcchaStore-owned product orders
              </p>
            </button>

            <button
              onClick={() => {
                setView("vendor");
                setSelectedVendor(null);
                setOrders([]);
                loadVendors();
              }}
              className={`w-full text-left rounded-3xl border p-4 sm:p-5 min-h-[150px] ${
                view === "vendor"
                  ? "bg-[#831843] text-white border-[#831843]"
                  : "bg-white border-stone-200"
              }`}
            >
              <Building2 className="w-5 h-5 mb-3" />

              <div className="text-xs uppercase tracking-widest font-bold opacity-70">
                Section 02
              </div>

              <h2 className="font-serif text-xl font-bold mt-1">
                Vendor Orders
              </h2>

              <p className="text-xs opacity-70 mt-1">
                Select one vendor at a time
              </p>
            </button>
          </div>
        )}

        {/* Vendor Selection */}
        {role !== "VENDOR" && view === "vendor" && (
          <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                    Select Vendor
                  </h2>

                  <p className="text-xs text-stone-500 mt-0.5">
                    Choose one vendor. Only that vendor&apos;s order items will be loaded.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                    {vendorLoading
                      ? "Loading vendors"
                      : `${vendors.length} vendor${vendors.length === 1 ? "" : "s"}`}
                  </span>

                  {vendorLoading && (
                    <span className="text-[11px] text-stone-500">
                      Loading...
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

                <input
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendor by business name or contact..."
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#831843] focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="max-h-[420px] overflow-y-auto overscroll-contain pr-1">
                {vendorLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 rounded-xl border border-stone-200 bg-stone-50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="w-8 h-8 mx-auto text-stone-300" />

                    <h3 className="font-serif text-base font-bold text-stone-800 mt-3">
                      No vendors found
                    </h3>

                    <p className="text-xs text-stone-500 mt-1">
                      Try a different vendor name, contact, or ID.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVendors.map((v) => {
                      const isSelected = selectedVendor?.id === v.id;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => selectVendor(v)}
                          className={`w-full min-w-0 text-left p-3 sm:p-4 rounded-xl border transition ${
                            isSelected
                              ? "border-[#831843] bg-rose-50 shadow-sm"
                              : "border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-[#831843] text-white"
                                    : "bg-stone-100 text-stone-500"
                                }`}
                              >
                                <Building2 className="w-4 h-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="font-bold text-sm text-stone-900 truncate">
                                  {v.businessName}
                                </p>

                                <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                                  {v.contactName || "Vendor"} · {v.id}
                                </p>
                              </div>
                            </div>

                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-[#831843] shrink-0" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadOrders(
              view,
              selectedVendor?.id,
              search.trim()
            );
          }}
          className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
        >
          <div className="flex items-center gap-3 w-full sm:flex-1">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number or retailer..."
              className="flex-1 min-w-0 bg-transparent text-xs outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold"
          >
            Search
          </button>
        </form>

        {/* Orders */}
        {view === "vendor" &&
        role !== "VENDOR" &&
        !selectedVendor ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center">
            <Building2 className="w-8 h-8 mx-auto text-stone-300" />

            <h3 className="font-serif text-xl font-bold mt-3">
              Select a vendor
            </h3>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center text-xs text-stone-500">
            Loading order enquiries...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center">
            <Package className="w-8 h-8 mx-auto text-stone-300" />

            <h3 className="font-serif text-xl font-bold mt-3">
              No order enquiries
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              // Shipping is excluded from the displayed order value.
              const visibleTotal =
                Number(order.subtotal || 0) +
                Number(order.totalGst || 0);

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}${
                    view === "vendor" && selectedVendor
                      ? `?vendorId=${encodeURIComponent(selectedVendor.id)}`
                      : ""
                  }`}
                  className="block bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900">
                            {order.orderNumber}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                              statusClass[order.status] ||
                              "bg-stone-50 text-stone-600 border-stone-200"
                            }`}
                          >
                            {label(order.status)}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-stone-800 mt-2">
                          {order.retailerBusinessName}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1">
                          <Clock3 className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-7 w-full lg:w-auto">
                        <div>
                          <p className="text-[10px] text-stone-400 uppercase">
                            Sets
                          </p>
                          <p className="font-bold">
                            {order.totalSets}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-stone-400 uppercase">
                            Products
                          </p>
                          <p className="font-bold">
                            {groupItemsByProduct(order.items).length}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-stone-400 uppercase">
                            Value
                          </p>

                          <p className="font-bold text-[#831843]">
                            {money(visibleTotal)}
                          </p>

                          <p className="text-[10px] text-amber-700 mt-1">
                            Shipping charged separately
                          </p>
                        </div>

                        <ArrowRight className="w-5 h-5 text-stone-300 shrink-0 hidden sm:block" />
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-2">
                      {groupItemsByProduct(order.items)
                        .slice(0, 5)
                        .map((g) => (
                          <span
                            key={g.key}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-100 text-[10px] text-stone-600"
                          >
                            {g.designNumber} · {g.sets} sets
                            {g.colors.length > 1
                              ? ` · ${g.colors.length} colours`
                              : g.colors.length === 1
                                ? ` · ${g.colors[0]}`
                                : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
