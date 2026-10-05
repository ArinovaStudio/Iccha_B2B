'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import {

  fetchRetailerProfile,

  type RetailerProfileData,

} from '@/lib/retailer-profile-client';

import { useRouter } from 'next/navigation';

import {

  Building2,

  ShoppingBag,

  Receipt,

  CheckCircle2,

  Truck,

  ShieldCheck,

  MapPin,

  ArrowLeft,

  ArrowRight,

  Sparkles,

  FileCheck

} from 'lucide-react';

import RetailerHeader from '@/components/layout/RetailerHeader';

import Footer from '@/components/layout/Footer';

import { useApp } from '@/lib/context/AppContext';


const INDIAN_STATE_CODES: Record<string, string> = {
  "andhra pradesh": "37", "arunachal pradesh": "12", assam: "18",
  bihar: "10", chhattisgarh: "22", goa: "30", gujarat: "24",
  haryana: "06", "himachal pradesh": "02", jharkhand: "20",
  karnataka: "29", kerala: "32", "madhya pradesh": "23",
  maharashtra: "27", manipur: "14", meghalaya: "17", mizoram: "15",
  nagaland: "13", odisha: "21", orissa: "21", punjab: "03",
  rajasthan: "08", sikkim: "11", "tamil nadu": "33", telangana: "36",
  tripura: "16", "uttar pradesh": "09", uttarakhand: "05",
  "west bengal": "19", delhi: "07", "new delhi": "07",
  "jammu and kashmir": "01", ladakh: "38", chandigarh: "04",
  puducherry: "34", "andaman and nicobar islands": "35",
  "dadra and nagar haveli and daman and diu": "26", lakshadweep: "31",
};

function normalizeAddress(address: any) {
  const state = String(address?.state ?? "").trim();
  return {
    street: String(address?.street ?? "").trim(),
    area: address?.area ? String(address.area) : null,
    city: String(address?.city ?? "").trim(),
    state,
    stateCode: String(address?.stateCode ?? "").trim() || INDIAN_STATE_CODES[state.toLowerCase()] || "",
    pincode: String(address?.pincode ?? "").trim(),
    landmark: address?.landmark ? String(address.landmark) : null,
  };
}

export default function RetailerCheckoutPage() {

  const router = useRouter();

  const {

    cart,

    clearCart,

    addToast

  } = useApp();

  const [retailerProfile, setRetailerProfile] =

    useState<RetailerProfileData | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [transportAgency, setTransportAgency] = useState('V-Trans Express Logistics');

  const [preferredStation, setPreferredStation] = useState('City Transporter Godown / Local Delivery');

  const [remarks, setRemarks] = useState('Please ensure moisture-proof poly wrapping inside cardboard boxes.');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address State

  const [shippingAddress, setShippingAddress] = useState({

    street: '',

    area: null as string | null,

    city: '',

    state: '',

    stateCode: '',

    pincode: '',

    landmark: null as string | null,

  });

  const [billingAddress, setBillingAddress] = useState({

    street: '',

    area: null as string | null,

    city: '',

    state: '',

    stateCode: '',

    pincode: '',

    landmark: null as string | null,

  });

  // Load retailer profile + addresses

  useEffect(() => {

    let cancelled = false;

    const loadRetailerProfile = async () => {

      try {

        setIsProfileLoading(true);

        const data = await fetchRetailerProfile();

        if (cancelled) return;

        setRetailerProfile(data);

        if (data.shippingAddress) {

          setShippingAddress(normalizeAddress(data.shippingAddress));

        }

        if (data.billingAddress) {

          setBillingAddress(normalizeAddress(data.billingAddress));

        } else if (data.shippingAddress) {

          setBillingAddress(normalizeAddress(data.shippingAddress));

        }

      } catch (error) {

        console.error('Failed to load retailer profile:', error);

        if (!cancelled) {

          addToast({

            type: 'error',

            title: 'Profile Loading Failed',

            message:

              'Could not load your retailer profile. Please refresh the page.',

          });

        }

      } finally {

        if (!cancelled) {

          setIsProfileLoading(false);

        }

      }

    };

    loadRetailerProfile();

    return () => {

      cancelled = true;

    };

  }, [addToast]);

  const handleSubmitOrderEnquiry = async (e: React.FormEvent) => {

    e.preventDefault();

    if (cart.items.length === 0) {

      router.push('/retailer/catalogue');

      return;

    }

    const normalizedShippingAddress = normalizeAddress(shippingAddress);
    // This checkout is for a delivery destination chosen by the retailer. Use that address for this order instead of blocking on the saved profile billing address.
    const normalizedBillingAddress = normalizedShippingAddress;
    const isAddressComplete = (address: ReturnType<typeof normalizeAddress>) =>
      Boolean(address.street && address.city && address.state && address.stateCode && address.pincode.length >= 4);

    if (!isAddressComplete(normalizedShippingAddress)) {
      addToast({
        type: 'error',
        title: 'Incomplete Delivery Address',
        message: 'Please check the delivery address, city, state, and pincode. Use a recognized Indian state name.',
      });
      return;
    }



    setIsSubmitting(true);

    try {

      const response = await fetch('/api/retailer/order-enquiries', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          billingAddress: normalizedBillingAddress,

          shippingAddress: normalizedShippingAddress,

          transportAgency,

          preferredStation,

          remarks,

        }),

      });

      const json = await response.json();

      if (!response.ok || !json.success) {

        throw new Error(json.error || 'Could not create order enquiry.');

      }

      // The API has already cleared the database cart. This only refreshes the

      // local AppContext state after a successful transaction.

      await clearCart();

      addToast({

        type: 'success',

        title: 'Master Order Enquiry Created!',

        message: `Order #${json.data.orderNumber} created with ${json.data.estimates.length} proforma estimate(s). Payment: Cash on Delivery.`,

      });

      router.push(`/retailer/orders/${json.data.id}`);

    } catch (err) {

      console.error('Order submission failed:', err);

      addToast({

        type: 'error',

        title: 'Submission Failed',

        message: err instanceof Error ? err.message : 'Could not create order enquiry. Please try again.',

      });

    } finally {

      setIsSubmitting(false);

    }

  };

  if (cart.items.length === 0) {

    return (

      <div className="flex flex-col min-h-screen">

        <RetailerHeader />

        <main className="flex-1 py-16 text-center space-y-4 bg-[#faf8f5]">

          <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto" />

          <h2 className="font-serif text-xl font-bold text-stone-900">Your Cart is Empty</h2>

          <p className="text-xs text-stone-500">Please select wholesale sets before proceeding to checkout.</p>

          <Link href="/retailer/catalogue" className="px-5 py-2.5 bg-[#831843] text-white text-xs font-bold rounded-xl inline-block">

            Explore Catalogue

          </Link>

        </main>

        <Footer />

      </div>

    );

  }

  // Profile-loading guard

  if (isProfileLoading || !retailerProfile) {

    return (

      <div className="flex min-h-screen items-center justify-center">

        <p>Loading your retailer profile...</p>

      </div>

    );

  }

  const gstBreakdown = cart.items.map((item) => ({

    name: item.product.name,

    rate: Number(item.product.gstRate ?? 0),

    amount: Math.round(

      (item.lineSubtotal * Number(item.product.gstRate ?? 0)) / 100

    ),

  }));

  return (

    <div className="flex flex-col min-h-screen">

      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Breadcrumbs */}

          <nav className="text-xs text-stone-500 flex items-center gap-2">

            <Link href="/retailer" className="hover:text-stone-900">Retailer Portal</Link>

            <span>/</span>

            <Link href="/retailer/cart" className="hover:text-stone-900">Cart</Link>

            <span>/</span>

            <span className="text-stone-900 font-semibold">B2B Order Enquiry Checkout</span>

          </nav>

          <div className="border-b border-stone-200 pb-4">

            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#831843]">

              B2B Semi-Ecommerce Dispatch

            </span>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">

              Finalize Master Order Estimate

            </h1>

            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">

              Review seller-wise allocations, transport details, and generate formal Proforma Estimates.

            </p>

          </div>

          <form onSubmit={handleSubmitOrderEnquiry} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Addresses & Logistics */}

            <div className="lg:col-span-7 space-y-6 text-xs">

              {/* Retailer Identity Box */}

              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">

                <div className="flex items-center justify-between">

                  <h3 className="font-serif text-base font-bold text-stone-900">

                    1\. Verified Retailer Credentials

                  </h3>

                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded flex items-center gap-1">

                    <CheckCircle2 className="w-3 h-3" /> Approved KYC

                  </span>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">

                  <div>

                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Boutique Name</span>

                    <strong className="text-stone-900">

                      {retailerProfile?.profile.businessName || 'Loading...'}

                    </strong>

                  </div>

                  <div>

                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Authorized Contact</span>

                    <strong className="text-stone-900">

                      {retailerProfile

                        ? `${retailerProfile.profile.applicantName} (${retailerProfile.profile.mobile})`

                        : 'Loading...'}

                    </strong>

                  </div>

                  <div>

                    <span className="text-stone-400 text-[10px] uppercase font-bold block">B2B GSTIN</span>

                    <strong className="font-mono text-stone-900">

                      {retailerProfile?.profile.gstin || 'Not available'}

                    </strong>

                  </div>

                  <div>

                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Income Tax PAN</span>

                    <strong className="font-mono text-stone-900">

                      {retailerProfile?.profile.pan || 'Not available'}

                    </strong>

                  </div>

                </div>

              </div>

              {/* Shipping / Consignee Address */}

              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">

                <h3 className="font-serif text-base font-bold text-stone-900">

                  2\. Consignee & Shipping Destination

                </h3>

                <div className="space-y-3">

                  <div>

                    <label className="block font-semibold text-stone-800 mb-1">

                      Delivery Address (Store / Godown) *

                    </label>

                    <input

                      type="text"

                      required

                      value={shippingAddress.street}

                      onChange={e => setShippingAddress({ ...shippingAddress, street: e.target.value })}

                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                    />

                  </div>

                  <div className="grid grid-cols-3 gap-3">

                    <div>

                      <label className="block font-semibold text-stone-800 mb-1">City *</label>

                      <input

                        type="text"

                        required

                        value={shippingAddress.city}

                        onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}

                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                      />

                    </div>

                    <div>

                      <label className="block font-semibold text-stone-800 mb-1">State (Place of Supply) *</label>

                      <input

                        type="text"

                        required

                        value={shippingAddress.state}

                        onChange={e => {
                        const state = e.target.value;
                        setShippingAddress({
                          ...shippingAddress,
                          state,
                          stateCode: INDIAN_STATE_CODES[state.trim().toLowerCase()] || '',
                        });
                      }}

                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                      />

                    </div>

                    <div>

                      <label className="block font-semibold text-stone-800 mb-1">Pincode *</label>

                      <input

                        type="text"

                        required

                        value={shippingAddress.pincode}

                        onChange={e => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}

                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium font-mono focus:outline-none focus:border-rose-900"

                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* Transporter Preferences */}

              {/* <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">

                <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">

                  <Truck className="w-4 h-4 text-[#831843]" />

                  3\. Transporter & Road Freight Details

                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>

                    <label className="block font-semibold text-stone-800 mb-1">

                      Preferred Transporter Agency *

                    </label>

                    <input

                      type="text"

                      required

                      value={transportAgency}

                      onChange={e => setTransportAgency(e.target.value)}

                      placeholder="e.g. V-Trans, TCI Freight, ARC, Private Courier"

                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                    />

                  </div>

                  <div>

                    <label className="block font-semibold text-stone-800 mb-1">

                      Preferred Booking Station / Destination Godown

                    </label>

                    <input

                      type="text"

                      value={preferredStation}

                      onChange={e => setPreferredStation(e.target.value)}

                      placeholder="e.g. Jaipur Ring Road Godown"

                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                    />

                  </div>

                </div>

                <div>

                  <label className="block font-semibold text-stone-800 mb-1">

                    Special Packaging & Dispatch Instructions

                  </label>

                  <textarea

                    rows={2}

                    value={remarks}

                    onChange={e => setRemarks(e.target.value)}

                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:outline-none focus:border-rose-900"

                  />

                </div>

              </div> */}

            </div>

            {/* Right Column: Seller-wise Order Breakdown & Submission */}

            <div className="lg:col-span-5 space-y-6 text-xs">

              {/* Seller-wise Proforma Preview Card */}

              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-5">

                <div className="border-b border-stone-100 pb-3">

                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">

                    Automated Seller Split

                  </span>

                  <h3 className="font-serif text-lg font-bold text-stone-900">

                    Proforma Estimates Preview

                  </h3>

                </div>

                {/* Seller Breakdown */}

                <div className="space-y-3">

                  {cart.entitySummaries.map((summary) => {

                    const isPlatform = summary.entity?.code === 'platform';

                    return (

                      <div

                        key={summary.entityId}

                        className="p-4 rounded-2xl border space-y-2 bg-stone-50 border-stone-200"

                      >

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-2">

                            <Building2 className="w-4 h-4 text-[#831843]" />

                            <strong className="text-stone-900">

                              {isPlatform ? 'IcchaStore' : 'Vendor'}

                            </strong>

                          </div>

                          <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono font-bold text-stone-700">

                            {summary.totalSets} Sets ({summary.totalPieces} Pcs)

                          </span>

                        </div>

                        <div className="text-[11px] text-stone-600 space-y-0.5">

                          <div>

                            Legal Entity: <strong>{summary.entity?.legalName ?? "N/A"}</strong>

                          </div>

                          <div>

                            GSTIN: <span className="font-mono">{summary.entity?.gstin ?? "N/A"}</span>

                          </div>

                        </div>

                        <div className="pt-2 border-t border-stone-200/80 flex justify-between items-baseline font-medium">

                          <span>Seller Subtotal + Taxes:</span>

                          <span className="font-mono font-bold text-stone-900">

                            ₹{summary.total.toLocaleString('en-IN')}

                          </span>

                        </div>

                      </div>

                    );

                  })}

                </div>

                {/* Master Total Bar */}

                <div className="pt-3 border-t-2 border-stone-900 space-y-2">

                  <div className="flex justify-between text-stone-600">

                    <span>Master Taxable Subtotal:</span>

                    <span className="font-mono font-semibold">₹{cart.subtotal.toLocaleString('en-IN')}</span>

                  </div>

                  {gstBreakdown.map((gst) => (

                      <div

                        key={`${gst.name}-${gst.rate}`}

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

                  <div className="flex justify-between text-stone-600">

                    <span>Estimated Freight:</span>

                    <span className="font-mono font-semibold">₹{cart.shippingEstimate.toLocaleString('en-IN')}</span>

                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-stone-900">

                    <span className="font-bold text-sm">Grand Master Total:</span>

                    <span className="font-serif text-2xl font-bold font-mono text-[#831843]">

                      ₹{cart.estimatedTotal.toLocaleString('en-IN')}

                    </span>

                  </div>

                </div>

                {/* Cash on Delivery */}

                {/* <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl space-y-2 text-[11px] leading-relaxed">

                  <div className="text-emerald-300 font-bold flex items-center gap-1.5">

                    <ShieldCheck className="w-4 h-4" /> Cash on Delivery (COD)

                  </div>

                </div> */}

                {/* Submit Master Order Button */}

                <button

                  type="submit"

                  disabled={isSubmitting}

                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] text-white font-bold text-xs shadow-xl transition flex items-center justify-center gap-2"

                >

                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />

                  <span>{isSubmitting ? 'Submitting Order...' : 'Confirm & Submit Master Order Enquiry'}</span>

                </button>

                <div className="text-center">

                  <Link

                    href="/retailer/cart"

                    className="text-xs text-stone-500 hover:text-stone-900 font-semibold flex items-center justify-center gap-1"

                  >

                    <ArrowLeft className="w-3.5 h-3.5" />

                    Back to Edit Cart

                  </Link>

                </div>

              </div>

            </div>

          </form>

        </div>

      </main>

      <Footer />

    </div>

  );

}