'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShoppingBag,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Video,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import MOQProgressBar from '@/components/cart/MOQProgressBar';
import GSTEntityBreakdown from '@/components/cart/GSTEntityBreakdown';
import { useApp } from '@/lib/context/AppContext';

export default function RetailerCartPage() {
  const router = useRouter();
  const {
    cart,
    isCartLoading,
    moqEvaluation,
    clearCart,
    openSellerModal,
    currentRetailer,
    addToast
  } = useApp();

  const [orderNotes, setOrderNotes] = useState(
    'Please pack in heavy cardboard bales for interstate road transport. Request fast dispatch.'
  );

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) {
      addToast({
        type: 'warning',
        title: 'Empty Cart',
        message: 'Please add wholesale sets to your cart first.'
      });
      return;
    }

    if (!moqEvaluation?.isMet) {
      addToast({
        type: 'warning',
        title: 'MOQ Not Met',
        message: 'Your cart does not meet the minimum order quantity. You can contact the seller for sample approval or add more sets.'
      });
      return;
    }

    router.push('/retailer/checkout');
  };

  const gstBreakdown = Object.values(
    cart.items.reduce<Record<string, { key: string; name: string; rate: number; amount: number }>>((acc, item) => {
      const rate = Number(item.product.gstRate ?? 0);
      const key = `${item.productId}-${rate}`;
      const amount = Math.round((item.lineSubtotal * rate) / 100);
      if (acc[key]) acc[key].amount += amount;
      else acc[key] = { key, name: item.product.name, rate, amount };
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Breadcrumbs & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="text-xs text-stone-500 mb-1 flex items-center gap-2">
                <Link href="/retailer" className="hover:text-stone-900">Retailer Portal</Link>
                <span>/</span>
                <span className="text-stone-900 font-semibold">Wholesale Cart</span>
              </nav>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Wholesale Order Enquiry Cart
              </h1>
            </div>

            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-rose-800 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* 1. MOQ Progress & Alert Bar */}
          {!isCartLoading && (
            <MOQProgressBar evaluation={moqEvaluation} onOpenSellerModal={openSellerModal} />
          )}

          {/* 2. Main Cart Layout: Multi-Entity Split + Master Summary */}
          {isCartLoading && cart.items.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse" aria-busy="true" aria-label="Loading your cart">
              <div className="lg:col-span-8 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-stone-200 p-5 flex gap-4">
                    <div className="w-16 h-20 rounded-lg bg-stone-200 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3 w-1/3 rounded bg-stone-200" />
                      <div className="h-4 w-2/3 rounded bg-stone-200" />
                      <div className="h-3 w-1/2 rounded bg-stone-200" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-4">
                <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
                  <div className="h-5 w-1/2 rounded bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-200" />
                  <div className="h-3 w-3/4 rounded bg-stone-200" />
                  <div className="h-11 w-full rounded-2xl bg-stone-200 mt-4" />
                </div>
              </div>
            </div>
          ) : cart.items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Automated Dual GST Entity Breakdown */}
              <div className="lg:col-span-8 space-y-6">
                <GSTEntityBreakdown summaries={cart.entitySummaries} isEditable={true} />

                {/* Dispatch & Transport Notes */}
                <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Transporter & Packaging Instructions
                  </h4>
                  <p className="text-xs text-stone-500">
                    Specify preferred transport agency (e.g. V-Trans, TCI, ARC, Navata, SafeXpress) or delivery terms.
                  </p>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Enter transport preferences, packaging requests..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-rose-900 font-medium"
                  />
                </div>
              </div>

              {/* Right Column: Master Order Commercial Summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-5 text-xs">

                  <div className="border-b border-stone-100 pb-3">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Master Commercial Estimate
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Wholesale Order Summary
                    </h3>
                  </div>

                  {/* Summary Metric Rows */}
                  <div className="space-y-3 text-stone-600">
                    <div className="flex justify-between">
                      <span>Total Designs Selected:</span>
                      <strong className="text-stone-900">{cart.totalDesigns} Unique Lots</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Total Sets:</span>
                      <strong className="text-stone-900">{cart.totalSets} Sets</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Total Garment Pieces:</span>
                      <strong className="text-stone-900">{cart.totalPieces} Pieces</strong>
                    </div>

                    <div className="border-t border-stone-100 pt-2 flex justify-between">
                      <span>Taxable Value (Subtotal):</span>
                      <span className="font-mono font-bold text-stone-900">
                        ₹{cart.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {gstBreakdown.map((gst) => (
                      <div
                        key={gst.key}
                        className="flex justify-between text-[11px]"
                      >
                        <span>
                          {gst.name} (GST {gst.rate}%)
                        </span>

                        <span className="font-mono">
                          ₹{gst.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}

                    <div className="flex justify-between">
                      <span>Est. Surface Freight:</span>
                      <span className="font-mono text-stone-800">
                        ₹{cart.shippingEstimate.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Master Grand Total */}
                    <div className="border-t-2 border-stone-900 pt-3 flex justify-between items-baseline text-stone-900">
                      <span className="font-bold text-sm">Grand Order estimate Total:</span>
                      <span className="text-xl font-bold font-mono text-[#831843]">
                        ₹{cart.estimatedTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Multi Entity Disclaimer Pill */}
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed space-y-1">
                    <div className="font-bold text-stone-800 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-rose-800" />
                      B2B Commercial Invoicing Notice:
                    </div>
                    <p>
                      This enquiry will generate separate proforma estimates for each applicable seller, using that seller's registered GST and official bank details. No online payment is debited on this site.
                    </p>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    disabled={!moqEvaluation?.isMet}
                    className={`w-full py-4 rounded-2xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 ${moqEvaluation?.isMet
                      ? 'bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] text-white cursor-pointer'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      }`}
                  >
                    <span>Proceed to Order Enquiry Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {!moqEvaluation?.isMet && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => openSellerModal()}
                        className="text-xs text-[#831843] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Below MOQ? Request Sample / Video Call</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-rose-50 text-[#831843] rounded-2xl flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Your Wholesale Cart is Empty
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                Explore our ready-to-dispatch 2-piece and 3-piece kurti catalogue to assemble wholesale sets.
              </p>
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#831843] to-[#9a3412] text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                <span>Browse Wholesale Catalogue</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}