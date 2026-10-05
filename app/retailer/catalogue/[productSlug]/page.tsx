'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ShoppingBag,
  CheckCircle2,
  Video,
  ArrowLeft,
  Plus,
  Minus,
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
type ProductDetail = Product & {
  billingEntityCode?: string | null;
  categoryRequiresSize?: boolean;
  sizes?: string[];
  sizeStocks?: { size: string; availableSets: number }[];
  sellerName?: string | null;
  vendor?: {
    id: string;
    businessName: string;
  } | null;
  warehouse?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    isActive: boolean;
  } | null;
};
export default function RetailerProductDetailPage() {
  const params = useParams();
  const productSlug = params?.productSlug as string;
  const { addToCart, cart, openSellerModal } = useApp();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [setsToAdd, setSetsToAdd] = useState(1);
  const [hasInitializedSets, setHasInitializedSets] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      if (!productSlug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/retailer/products/${productSlug}`);
        const json = await res.json();
        if (json.success) {
          setProduct(json.data);
          setSelectedImageIdx(0);
          setSelectedSize(null);
          setSetsToAdd(1);
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productSlug]);
  // Initialize the starting quantity when a product is loaded.
  // This hook is intentionally above the conditional returns so hook order
  // remains identical on every render.
  useEffect(() => {
    if (!product) return;
    const minOrderSets = Math.max(1, product.minOrderSets || 1);
    setSetsToAdd(minOrderSets);
    setHasInitializedSets(true);
  }, [product]);
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <RetailerHeader />
        <main className="flex-1 py-16 bg-[#faf8f5] text-center">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs text-stone-500">
              Loading product specifications...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <RetailerHeader />
        <main className="flex-1 py-16 bg-[#faf8f5] text-center">
          <div className="max-w-7xl mx-auto px-4 space-y-4">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Design Not Found
            </h2>
            <p className="text-xs text-stone-500">
              The requested kurti design is no longer in active production.
            </p>
            <Link
              href="/retailer/catalogue"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#831843] text-white text-xs font-semibold rounded-xl hover:bg-rose-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Catalogue
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  const media = product.media ?? [];
  const cartItem = cart.items.find((item) => item.productId === product.id && (item.selectedSize || null) === (selectedSize || null));
  const existingSets = cartItem?.selectedSets || 0;
  const currentImage =
    media[selectedImageIdx]?.url ||
    media[0]?.url ||
    '/placeholder-product.jpg';
  const handleAddToCart = () => {
    if (product.categoryRequiresSize && !selectedSize) return;
    addToCart(product.id, setsToAdd, product.name, product.categoryRequiresSize ? selectedSize : null);
  };
// Per-product minimum, set by the vendor (or admin for house products) — separate from,
  // and in addition to, the cart-wide MOQ. A fresh cart line for this product can't go
  // below it, so the stepper starts here instead of at 1.
  const minOrderSets = Math.max(1, product.minOrderSets || 1);
  const increaseSets = () => {
    setSetsToAdd((current) => current + 1);
  };
  const decreaseSets = () => {
    setSetsToAdd((current) => Math.max(minOrderSets, current - 1));
  };
  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5]">
      <RetailerHeader />
      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumbs */}
          <nav className="text-xs text-stone-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link
              href="/retailer"
              className="hover:text-stone-900 transition"
            >
              Retailer Portal
            </Link>
            <span>/</span>
            <Link
              href="/retailer/catalogue"
              className="hover:text-stone-900 transition"
            >
              Catalogue
            </Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold truncate">
              {product.name}
            </span>
          </nav>
          {/* Product Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* =========================================================
                LEFT — PRODUCT IMAGE GALLERY
            \========================================================= */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Image */}
              <div className="relative h-[420px] sm:h-[480px] w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                />
                {/* GST Entity */}
                <div className="absolute top-4 left-4">
                  <span
                    className="text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md flex items-center gap-1.5 uppercase tracking-wider bg-[#831843]"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {product.sellerName ? `Seller: ${product.sellerName}` : 'IcchaStore'}
                  </span>
                </div>
              </div>
              {/* Image Thumbnails */}
              {media.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {media.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        selectedImageIdx === idx
                          ? 'border-rose-800 ring-2 ring-rose-200'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || product.name}
                        fill
                        className="object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* =========================================================
                RIGHT — PRODUCT INFORMATION
            \========================================================= */}
            <div className="lg:col-span-6 space-y-5">
              {/* Product Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="font-mono text-rose-900 font-bold">
                    {product.sku}
                  </span>
                  <span>&bull;</span>
                  <span>Design #{product.designNumber}</span>
                  <span>&bull;</span>
                  <span className="text-stone-700 font-medium">
                    {product.categoryName}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
              {/* =======================================================
                  VENDOR + WAREHOUSE
              \======================================================= */}
              <div className="bg-white border-2 border-orange-300 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vendor */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        Vendor
                      </p>
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {product.vendor?.businessName ||
                          product.sellerName ||
                          'IcchaStore'}
                      </p>
                    </div>
                  </div>
                  {/* Warehouse */}
                  <div className="flex items-center gap-3 min-w-0 sm:border-l sm:border-stone-200 sm:pl-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        From Warehouse
                      </p>
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {product.warehouse?.name ||
                          'Warehouse not assigned'}
                      </p>
                      {product.warehouse?.city &&
                        product.warehouse?.state && (
                          <p className="text-[10px] text-stone-500 truncate">
                            {product.warehouse.city},{' '}
                            {product.warehouse.state}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              {/* =======================================================
                  WHOLESALE PRICING
              \======================================================= */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-stone-100 pb-4">
                  {/* Piece Rate */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Wholesale estimated Piece Rate
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-stone-900">
                        ₹
                        {Number(
                          product.wholesalePricePerPiece
                        ).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        / piece (+ GST {product.gstRate}%)
                      </span>
                    </div>
                  </div>
                  {/* Set Rate */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Set Lot Price ({product.piecesPerSet} pcs)
                    </span>
                    <div className="text-xl font-bold text-rose-900">
                      ₹
                      {Number(
                        product.wholesalePricePerSet
                      ).toLocaleString('en-IN')}
                      <span className="text-xs text-stone-500 font-normal ml-1">
                        / set
                      </span>
                    </div>
                  </div>
                </div>
                {/* =====================================================
                    SIZE SELECTION — ONLY FOR SIZE-REQUIRED CATEGORIES
                \===================================================== */}
                {product.categoryRequiresSize ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <strong className="text-stone-800">Select Size:</strong>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      {(product.sizeStocks || []).map((row) => {
                        const isSelected = selectedSize === row.size;
                        return (
                          <button
                            key={row.size}
                            type="button"
                            onClick={() => {
                              setSelectedSize(row.size);
                              setSetsToAdd(minOrderSets);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 shadow-sm'
                               : 'border-stone-200 bg-stone-50 hover:border-stone-400'
                            }`}
                          >
                            <div className="font-bold text-stone-900">{row.size}</div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedSize && (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-[11px] text-stone-600">Selected Size</span>
                        <span className="text-xs font-bold text-amber-900">{selectedSize}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-[11px] text-stone-500">
                    Size selection is not required for this category.
                  </div>
                )}
                {/* =====================================================
                    CART CONTROLS
                \===================================================== */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={decreaseSets}
                        disabled={setsToAdd <= minOrderSets}
                        className="p-3 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition"
                        aria-label="Decrease sets"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="px-4 text-sm font-bold text-stone-900 text-center min-w-[70px]">
                        <div>
                          {setsToAdd} Set{setsToAdd > 1 ? 's' : ''}
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {setsToAdd * product.piecesPerSet} pcs
                        </div>
                      </div>
                      <button
                        type="button"

                        onClick={increaseSets}

                        

                        className="p-3 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition"

                        aria-label="Increase sets"

                      >

                        <Plus className="w-4 h-4" />

                      </button>

                    </div>

                    {/* Add to Cart */}

                    <button

                      type="button"

                      onClick={handleAddToCart}

                      disabled={!hasInitializedSets || (product.categoryRequiresSize && !selectedSize)}

                      className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"

                    >

                      <ShoppingBag className="w-4 h-4 text-amber-300" />

                      <span>

                        {product.categoryRequiresSize && !selectedSize

                          ? 'Select a size to continue'

                          : `Add ${setsToAdd} Set${setsToAdd > 1 ? 's' : ''} (${setsToAdd * product.piecesPerSet} pcs) • ₹${(setsToAdd * Number(product.wholesalePricePerSet)).toLocaleString('en-IN')}`}

                      </span>

                    </button>

                  </div>

                  {/* Minimum order notice */}

                  {minOrderSets > 1 && (

                    <p className="text-[11px] text-stone-500">

                      Minimum order for this design: <strong className="text-stone-800">{minOrderSets} sets</strong>.

                    </p>

                  )}

                  {/* Existing Cart */}

                  {existingSets > 0 && (

                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">

                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <strong>
                          {existingSets} Set
                          {existingSets > 1 ? 's' : ''}
                        </strong>{product.categoryRequiresSize && selectedSize ? ` in ${selectedSize}` : ''}{' '}
                        currently in your wholesale cart.
                      </span>
                      <Link
                        href="/retailer/cart"
                        className="font-bold underline whitespace-nowrap"
                      >
                        View Cart
                      </Link>
                    </div>
                  )}
                </div>
                {/* Live Sample */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                  <span>
                    Want to see embroidery quality on video?
                  </span>
                  <button
                    type="button"
                    onClick={() => openSellerModal(product.id)}
                    className="text-[#831843] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Request Live Sample Call
                  </button>
                </div>
              </div>
              {/* =======================================================
                  TECHNICAL SPECIFICATIONS
              \======================================================= */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  Garment & Fabric Specifications
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Fabric
                    </span>
                    <strong className="text-stone-800">
                      {product.fabric}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Work / Craft
                    </span>
                    <strong className="text-stone-800">
                      {product.workType}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Style / Silhouette
                    </span>
                    <strong className="text-stone-800">
                      {product.style}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Clothing Type
                    </span>
                    <strong className="text-stone-800">
                      {product.clothingType === '3_piece'
                        ? '3-Piece (Kurti + Pant + Dupatta)'
                        : '2-Piece (Kurti + Pant)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      HSN Code
                    </span>
                    <strong className="font-mono text-stone-800">
                      {product.hsn}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      GST Rate
                    </span>
                    <strong className="text-stone-800">
                      {product.gstRate}% Applicable
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Lining
                    </span>
                    <strong className="text-stone-800">
                      Premium Crepe Attached
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">
                      Margins
                    </span>
                    <strong className="text-stone-800">
                      2-inch Boutique Alteration Margin
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}