"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Package, Store, Warehouse } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useApp } from "@/lib/context/AppContext";
import SellerOrderStatusControl from "@/components/order/SellerOrderStatusControl";

type Item = {
  id: string; productId?: string | null; productName: string; sku: string; designNumber: string;
  categoryName: string; sets: number; totalPieces: number;
  piecesPerSet?: number; pieceRate?: number; setRate?: number;
  gstRate?: number; hsn?: string | null; color?: string | null;
  sizeCombination?: string | null;
  lineSubtotal: number; gstAmount: number; totalWithGst: number;
  imageUrl?: string | null;
  product?: {
    vendorId: string | null;
    vendor?: { id: string; businessName: string; contactName?: string | null } | null;
    warehouse?: { id: string; name: string; city: string | null; state: string | null } | null;
  };
};

type History = {
  id: string; status: string; actorName: string;
  notes: string | null; createdAt: string;
};

type SellerOrder = {
  id: string;
  vendorId: string | null;
  sellerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Address = {
  street?: string; area?: string; city?: string; state?: string;
  stateCode?: string; pincode?: string; landmark?: string;
};

type Order = {
  id: string; orderNumber: string; retailerBusinessName: string;
  retailerApplicantName: string; retailerContact: string; retailerEmail: string;
  retailerGstin?: string | null;
  billingAddressJson?: string | null; shippingAddressJson?: string | null;
  customerRemarks?: string | null;
  status: string; totalDesigns: number; totalSets: number; totalPieces: number;
  subtotal: number; totalGst: number; shipping: number; masterTotal: number;
  createdAt: string; items: Item[]; history: History[];
  scope: "admin" | "vendor"; vendorId?: string | null;
};

function money(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function parseAddress(raw?: string | null): Address | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Address;
  } catch {
    return null;
  }
}

function AddressLines({ address }: { address: Address | null }) {
  if (!address) return <p className="text-xs text-stone-400 mt-2">Not provided</p>;
  return (
    <div className="text-xs text-stone-600 mt-2 leading-relaxed">
      <p>{[address.street, address.area].filter(Boolean).join(", ")}</p>
      <p>{[address.city, address.state].filter(Boolean).join(", ")}{address.pincode ? ` - ${address.pincode}` : ""}</p>
      {address.landmark && <p className="text-stone-500">Landmark: {address.landmark}</p>}
    </div>
  );
}

// Each colour of a product is stored as its own order line; group them so a product shows once,
// with its colours listed inside.
function groupItems(items: Item[]) {
  const map = new Map<string, { key: string; first: Item; lines: Item[]; sets: number; pieces: number; gst: number; total: number }>();
  for (const it of items) {
    const key = `${it.productId ?? it.designNumber}|${it.sizeCombination ?? ""}`;
    const g = map.get(key) ?? { key, first: it, lines: [], sets: 0, pieces: 0, gst: 0, total: 0 };
    g.lines.push(it);
    g.sets += it.sets;
    g.pieces += it.totalPieces;
    g.gst += it.gstAmount;
    g.total += it.totalWithGst;
    map.set(key, g);
  }
  return Array.from(map.values());
}

function label(v: string) {
  return v.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ vendorId?: string }>;
}) {
  const { addToast } = useApp();
  const [id, setId] = useState("");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(true);

  useEffect(() => {
    params.then(p => setId(p.orderId));
    searchParams?.then(p => setVendorId(p.vendorId || null));

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || "Could not determine user role.");
        }
        setCurrentRole(String(json.data?.role || "").toUpperCase());
      })
      .catch((error) => {
        setSellerOrdersLoading(false);
        addToast({
          type: "error",
          title: "Authentication error",
          message:
            error instanceof Error
              ? error.message
              : "Could not determine the current user.",
        });
      });
  }, [params, searchParams, addToast]);

  useEffect(() => {
    if (!id) return;

    const query = vendorId
      ? `?vendorId=${encodeURIComponent(vendorId)}`
      : "";

    fetch(`/api/admin/order-enquiries/${encodeURIComponent(id)}${query}`)
      .then(async r => {
        const j = await r.json();
        if (!r.ok || !j.success) {
          throw new Error(j.error || "Could not load order.");
        }
        setOrder(j.data);
        setLoadError(null);
      })
      .catch(e => {
        const message = e instanceof Error ? e.message : "Order could not be loaded.";
        setLoadError(message);
        addToast({ type: "error", title: "Could not load order", message });
      })
      .finally(() => setLoading(false));
  }, [id, vendorId, addToast]);

  useEffect(() => {
    if (!id || !order || !currentRole) return;

    let cancelled = false;

    async function loadSellerOrders() {
      setSellerOrdersLoading(true);

      try {
        const isVendorUser = currentRole === "VENDOR";

        const response = isVendorUser
          ? await fetch(
            `/api/vendor/order-enquiries?orderId=${encodeURIComponent(order!.id)}`,
            { cache: "no-store" }
          )
          : await fetch(
            `/api/admin/order-enquiries/${encodeURIComponent(order!.id)}/seller-orders${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""
            }`,
            { cache: "no-store" }
          );

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(
            json.error || "Could not load seller order status."
          );
        }

        if (cancelled) return;

        const matches = (json.data || []).map(
          (sellerOrder: SellerOrder) => ({
            id: sellerOrder.id,
            vendorId: sellerOrder.vendorId,
            sellerName: sellerOrder.sellerName,
            status: String(sellerOrder.status).toUpperCase(),
            createdAt: sellerOrder.createdAt,
            updatedAt: sellerOrder.updatedAt,
          })
        );

        setSellerOrders(matches);
      } catch (error) {
        if (cancelled) return;

        addToast({
          type: "error",
          title: "Could not load seller status",
          message:
            error instanceof Error
              ? error.message
              : "Could not load seller status.",
        });
      } finally {
        if (!cancelled) {
          setSellerOrdersLoading(false);
        }
      }
    }

    loadSellerOrders();

    return () => {
      cancelled = true;
    };
  }, [id, order?.id, vendorId, currentRole, addToast]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#faf8f5]">
        <AdminSidebar activeTab="orders" />
        <main className="flex-1 flex items-center justify-center text-xs text-stone-500">
          Loading order...
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen bg-[#faf8f5]">
        <AdminSidebar activeTab="orders" />
        <main className="flex-1 p-6 lg:p-10">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Order Enquiries
          </Link>
          <div className="mt-8 bg-white rounded-3xl border p-10 text-center">
            <Package className="w-8 h-8 mx-auto text-stone-300" />
            <h1 className="font-serif text-2xl font-bold mt-3">
              {loadError ? "Could not load this order" : "Order not found"}
            </h1>
            {loadError && <p className="text-xs text-stone-500 mt-2">{loadError}</p>}
          </div>
        </main>
      </div>
    );
  }

  const isStaffView = currentRole !== null && currentRole !== "VENDOR";
  const shippingAddress = parseAddress(order.shippingAddressJson);
  const billingAddress = parseAddress(order.billingAddressJson);

  const vendors = Array.from(
    new Map(
      order.items
        .filter(item => item.product?.vendor)
        .map(item => [item.product!.vendor!.id, item.product!.vendor!])
    ).values()
  );

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="orders" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#831843]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order Enquiries
        </Link>

        <div className="border-b border-stone-200 pb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
            {order.scope === "vendor" ? "Vendor Order View" : "Order Enquiry"}
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {order.scope === "vendor"
              ? "Only products belonging to the selected vendor are shown."
              : "Complete master order."}
          </p>
        </div>

        {order.scope === "vendor" && vendors.length > 0 && (
          <section className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#831843]">
              Selected Vendor
            </p>
            {vendors.map(vendor => (
              <div key={vendor.id} className="flex flex-wrap items-center gap-2 mt-2">
                <Store className="w-4 h-4 text-[#831843]" />
                <span className="font-bold text-stone-900">{vendor.businessName}</span>
                {vendor.contactName && (
                  <span className="text-xs text-stone-500">· {vendor.contactName}</span>
                )}
              </div>
            ))}
          </section>
        )}

        {sellerOrdersLoading && (
          <section className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500">Loading order status...</p>
          </section>
        )}

        {!sellerOrdersLoading && sellerOrders.map((sellerOrder) => (
          <SellerOrderStatusControl
            key={sellerOrder.id}
            sellerOrderId={sellerOrder.id}
            initialStatus={sellerOrder.status}
            sellerName={sellerOrder.sellerName}
            mode={currentRole === "VENDOR" ? "vendor" : "admin"}
            readOnly={currentRole !== "VENDOR" && !!vendorId}
            onUpdated={(nextStatus) => {
              const normalizedStatus = String(nextStatus).toUpperCase();

              setSellerOrders(current =>
                current.map(item =>
                  item.id === sellerOrder.id
                    ? {
                      ...item,
                      status: normalizedStatus,
                      updatedAt: new Date().toISOString(),
                    }
                    : item
                )
              );
            }}
          />
        ))}

        {order.scope === "vendor" &&
          !sellerOrdersLoading &&
          sellerOrders.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              No seller order was found for this master order.
            </div>
          )}

        {order.scope === "admin" &&
          vendorId &&
          !sellerOrdersLoading &&
          sellerOrders.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
              Vendor status is read-only here. The selected vendor controls its own order status.
            </div>
          )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Whole Seller</p>
            <p className="font-bold mt-2">{order.retailerBusinessName}</p>
            <p className="text-xs text-stone-500 mt-1">{order.retailerApplicantName}</p>
            <p className="text-xs text-stone-500 mt-1">{order.retailerContact}</p>
            {order.retailerEmail && <p className="text-xs text-stone-500 mt-1">{order.retailerEmail}</p>}
            {isStaffView && order.retailerGstin && (
              <p className="text-xs font-mono text-stone-500 mt-1">GSTIN {order.retailerGstin}</p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Summary</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><p className="text-[10px] text-stone-400">Designs</p><p className="font-bold">{order.totalDesigns}</p></div>
              <div><p className="text-[10px] text-stone-400">Sets</p><p className="font-bold">{order.totalSets}</p></div>
              <div><p className="text-[10px] text-stone-400">Pieces</p><p className="font-bold">{order.totalPieces}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Visible Value</p>
            <p className="font-serif text-2xl font-bold text-[#831843] mt-2">
              {money(order.masterTotal)}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Subtotal {money(order.subtotal)} + GST {money(order.totalGst)}
            </p>
          </div>
        </section>

        <section className={`grid grid-cols-1 gap-4 ${isStaffView ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <div className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Order Details</p>
            <p className="text-xs text-stone-600 mt-2">Status: <strong className="text-stone-900">{label(order.status)}</strong></p>
            <p className="text-xs text-stone-600 mt-1">Placed: <strong className="text-stone-900">{new Date(order.createdAt).toLocaleString("en-IN")}</strong></p>
            <p className="text-xs text-stone-600 mt-3">Retailer remarks / transport</p>
            <p className="text-xs text-stone-900 mt-1 whitespace-pre-line">{order.customerRemarks || "None"}</p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400">Shipping Address</p>
            <AddressLines address={shippingAddress} />
          </div>

          {isStaffView && (
            <div className="bg-white rounded-3xl border border-stone-200 p-5">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Billing Address</p>
              <AddressLines address={billingAddress} />
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="font-serif text-xl font-bold">Ordered Products</h2>
          </div>

          <div className="divide-y divide-stone-100">
            {groupItems(order.items).map(g => {
              const item = g.first;
              return (
                <div key={g.key} className="p-5 flex flex-col lg:flex-row gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-stone-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-bold">{item.productName}</h3>
                        <p className="text-xs text-stone-500 mt-1">
                          SKU {item.sku} · Design {item.designNumber}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">{item.categoryName}</p>
                      </div>
                      <p className="font-bold text-[#831843]">{money(g.total)}</p>
                    </div>

                    {(item.sizeCombination || item.hsn) && (
                      <p className="text-xs text-stone-500 mt-1">
                        {[
                          item.sizeCombination ? `Size: ${item.sizeCombination}` : null,
                          item.hsn ? `HSN ${item.hsn}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                      {item.pieceRate !== undefined && (
                        <div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] text-stone-400">Rate / pc</p><p className="font-bold">{money(item.pieceRate)}</p></div>
                      )}
                      {item.setRate !== undefined && (
                        <div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] text-stone-400">Rate / set{item.piecesPerSet ? ` (${item.piecesPerSet} pcs)` : ""}</p><p className="font-bold">{money(item.setRate)}</p></div>
                      )}
                      <div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] text-stone-400">Sets</p><p className="font-bold">{g.sets}</p></div>
                      <div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] text-stone-400">Pieces</p><p className="font-bold">{g.pieces}</p></div>
                      <div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] text-stone-400">GST{item.gstRate !== undefined ? ` (${item.gstRate}%)` : ""}</p><p className="font-bold">{money(g.gst)}</p></div>
                    </div>

                    {/* Colour-wise breakdown */}
                    {g.lines.some(l => l.color) && (
                      <div className="mt-4 rounded-xl border border-stone-200 overflow-hidden">
                        <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                          <span>Colour</span><span>Sets</span><span>Pieces</span><span className="text-right">Amount</span>
                        </div>
                        <div className="divide-y divide-stone-100">
                          {g.lines.map(l => (
                            <div key={l.id} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                              <span className="font-semibold text-stone-800">{l.color || "—"}</span>
                              <span>{l.sets}</span>
                              <span>{l.totalPieces}</span>
                              <span className="text-right font-semibold">{money(l.totalWithGst)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-4">
                      {item.product?.vendor && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-[11px] font-bold text-[#831843]">
                          <Store className="w-3.5 h-3.5" />
                          {item.product.vendor.businessName}
                        </div>
                      )}

                      {item.product?.warehouse && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600">
                          <Warehouse className="w-3.5 h-3.5" />
                          {item.product.warehouse.name}
                          {item.product.warehouse.city ? ` · ${item.product.warehouse.city}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-stone-200 p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-[#831843]" />
            <h2 className="font-serif text-xl font-bold">Order Timeline</h2>
          </div>

          <div className="mt-6 space-y-5">
            {order.history.map((h, i) => (
              <div key={h.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === order.history.length - 1 ? "bg-[#831843]" : "bg-stone-300"}`} />
                  {i < order.history.length - 1 && <div className="w-px flex-1 bg-stone-200 mt-1" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{label(h.status)}</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {new Date(h.createdAt).toLocaleString("en-IN")} · {h.actorName}
                  </p>
                  {h.notes && <p className="text-xs text-stone-500 mt-2">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}