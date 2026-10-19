'use client';

import { useCatalogueViewer } from '@/lib/context/CatalogueViewerContext';

import React, { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import Link from 'next/link';

import { useParams } from 'next/navigation';

import {

  Building2,

  ShoppingBag,
  CheckCircle2,
  Check,
  Video,

  ArrowLeft,

  Plus,

  Minus,

  ZoomIn,

  ZoomOut,

  RotateCcw,

  X,

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

  colorOptions?: { name: string; hex: string | null }[];

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

  const { canOrder } = useCatalogueViewer();

  const [product, setProduct] = useState<ProductDetail | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 50, y: 50 });
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const [setsToAdd, setSetsToAdd] = useState(1);

  // Sets per colour, keyed by colour name (multi-colour ordering)

  const [colorQty, setColorQty] = useState<Record<string, number>>({});

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

          setSelectedSizes([]);

          setSetsToAdd(1);

          setColorQty({});

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

  const firstColor = product.colorOptions?.[0]?.name;
  if (firstColor) {
    setColorQty((cur) =>
      Object.keys(cur).length ? cur : { [firstColor]: minOrderSets }
    );
  }
}, [product]);

  const availableSizes: string[] = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.size) && product.size.length > 0) {
      return product.size;
    }
    if (Array.isArray(product.sizeStocks) && product.sizeStocks.length > 0) {
      return product.sizeStocks.map((s) => s.size);
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes;
    }
    if (product.sizeCombination && product.sizeCombination.trim()) {
      const split = product.sizeCombination.split(',').map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
    return ['Standard / Free Size'];
  }, [product]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSizes((prev) => {
        const valid = prev.filter((s) => availableSizes.includes(s));
        return valid.length > 0 ? valid : [availableSizes[0]];
      });
    } else {
      setSelectedSizes([]);
    }
  }, [availableSizes]);

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

              href="/catalogue"

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

  const selectedSizeStr = selectedSizes.join(', ');

  const existingSets = cart.items
    .filter((item) => {
      if (item.productId !== product.id) return false;
      const s = item.selectedSize || '';
      if (!s || s === '__NO_SIZE__') return selectedSizes.length === 0;
      return s === selectedSizeStr || selectedSizes.some((sz) => s.includes(sz));
    })
    .reduce((sum, item) => sum + item.selectedSets, 0);

  const colorOptions = product.colorOptions ?? [];
  const hasColors = colorOptions.length > 0;

  const colorLines = colorOptions
    .map((c) => ({ color: c.name, sets: colorQty[c.name] || 0 }))
    .filter((l) => l.sets > 0);

  const colorTotalSets = colorLines.reduce((sum, l) => sum + l.sets, 0);

  // The per-design minimum counts sets already in the cart for this design (this size) plus what's being added now.
  const colorShortfall = Math.max(0, product.minOrderSets - existingSets - colorTotalSets);

  const setColorSets = (name: string, next: number) =>
    setColorQty((cur) => ({ ...cur, [name]: Math.max(0, Math.floor(next) || 0) }));

  const currentImage =
    media[selectedImageIdx]?.url ||
    media[0]?.url ||
    '/placeholder-product.jpg';

  const handleAddToColorCart = async () => {
    if (selectedSizes.length === 0) return;
    if (colorLines.length === 0 || colorShortfall > 0) return;
    await addToCart(product.id, colorTotalSets, product.name, selectedSizeStr, colorLines);
    setColorQty({});
  };

  const handleAddToCart = () => {
    if (selectedSizes.length === 0) return;
    addToCart(product.id, setsToAdd, product.name, selectedSizeStr);
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

              Whole seller Portal

            </Link>

            <span>/</span>

            <Link

              href="/catalogue"

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

            \\========================================================= */}

            <div className="lg:col-span-6 space-y-4">

              {/* Main Image */}

              <div
                className="relative"
                onMouseEnter={() => setIsMagnifying(true)}
                onMouseLeave={() => setIsMagnifying(false)}
              >
                <div
                  className="relative h-[420px] sm:h-[480px] w-full rounded-3xl overflow-hidden"
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 100;
                    const y = ((event.clientY - rect.top) / rect.height) * 100;
                    setMagnifierPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                  }}
                >
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-contain object-top"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    referrerPolicy="no-referrer"
                  />

                  {/* On desktop, hover to inspect image details. On touch devices, tap to open the magnifier. */}
                  <button
                    type="button"
                    onClick={() => { setZoomLevel(2); setIsZoomOpen(true); }}
                    aria-label={`Magnify ${product.name}`}
                    className="absolute inset-0 z-10 cursor-zoom-in"
                  />

                  {/* GST Entity */}

                </div>
                {isMagnifying && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden h-80 w-80 -translate-y-1/2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl lg:block"
                    style={{
                      backgroundImage: `url("${currentImage.replace(/"/g, '\\"')}")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'auto 250%',
                      backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                    }}
                  />
                )}
              </div>

              {/* Image Thumbnails */}

              {media.length > 1 && (

                <div className="flex gap-3 overflow-x-auto pb-2">

                  {media.map((img, idx) => (

                    <button

                      key={idx}

                      type="button"

                      onClick={() => setSelectedImageIdx(idx)}

                      className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 transition ${selectedImageIdx === idx

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

            \\========================================================= */}

            <div className="lg:col-span-6 space-y-5">

              {/* Product Header */}

              <div className="space-y-2">

                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">

                  <span className="font-mono text-rose-900 font-bold">

                    {product.sku}

                  </span>

                  <span>•</span>

                  <span>Design #{product.designNumber}</span>

                  <span>•</span>

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
              ======================================================= */}
              <div className="bg-white border border-amber-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xs">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {/* Vendor */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        Vendor
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {product.vendor?.businessName ||
                          product.sellerName ||
                          'IcchaStore'}
                      </p>
                    </div>
                  </div>

                  {/* Warehouse */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-stone-200 pl-2 sm:pl-4">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        Warehouse
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {product.warehouse?.name ||
                          'Assigned'}
                      </p>
                      {product.warehouse?.city &&
                        product.warehouse?.state && (
                          <p className="text-[9px] sm:text-[10px] text-stone-500 truncate hidden xs:block">
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
              ======================================================= */}
              <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200 shadow-2xs space-y-3 sm:space-y-5">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-baseline sm:justify-between border-b border-stone-100 pb-3 sm:pb-4">
                  {/* Piece Rate */}
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Wholesale Piece Rate
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-3xl font-bold text-stone-900">
                        ₹
                        {Number(
                          product.wholesalePricePerPiece
                        ).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
                        / pc (+ GST {product.gstRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Set Rate */}
                  <div className="text-right">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Set Lot ({product.piecesPerSet} pcs)
                    </span>
                    <div className="text-base sm:text-xl font-bold text-rose-900">
                      ₹
                      {Number(
                        product.wholesalePricePerSet
                      ).toLocaleString('en-IN')}
                      <span className="text-[10px] sm:text-xs text-stone-500 font-normal ml-1">
                        / set
                      </span>
                    </div>
                  </div>
                </div>

                {/* =====================================================

                    SIZE SELECTION — MANDATORY FOR ALL PRODUCTS

                \===================================================== */}

                <div className="space-y-3 text-xs">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">

                    <strong className="text-stone-800 flex items-center gap-1.5">

                      <span>Select Size Chart(s) *</span>

                      <span className="text-[11px] font-normal text-rose-700">

                        (Multiple selection allowed · Min 1 required)

                      </span>

                    </strong>

                    {availableSizes.length > 1 && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedSizes([...availableSizes])}
                          className="text-[#831843] font-semibold hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSizes([])}
                          className="text-stone-500 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                  </div>

                  {availableSizes.length > 0 ? (

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 text-center">

                      {availableSizes.map((sz) => {

                        const isSelected = selectedSizes.includes(sz);

                        return (

                          <button

                            key={sz}

                            type="button"

                            onClick={() => {

                              setSelectedSizes((prev) =>
                                prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
                              );

                            }}

                            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all flex flex-row items-center justify-between gap-1.5 sm:gap-2 cursor-pointer text-left ${isSelected

                                ? 'border-[#831843] bg-rose-50/90 text-[#831843] shadow-2xs ring-1 ring-[#831843]/20'

                                : 'border-stone-200 bg-stone-50 hover:border-stone-300 text-stone-800'

                              }`}

                          >

                            <div className="flex items-center gap-1.5 min-w-0">

                              <div
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center border text-[9px] sm:text-[10px] shrink-0 transition-colors ${isSelected
                                    ? 'bg-[#831843] border-[#831843] text-white'
                                    : 'border-stone-300 bg-white text-transparent'
                                  }`}
                              >
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                              </div>

                              <span className="font-bold text-xs sm:text-sm truncate">{sz}</span>

                            </div>

                            <span className="text-[10px] shrink-0 font-medium">

                              {isSelected ? (
                                <span className="text-[#831843] font-semibold">Selected</span>
                              ) : (
                                <span className="text-stone-400">Select</span>
                              )}

                            </span>

                          </button>

                        );

                      })}

                    </div>

                  ) : (

                    <div className="p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-lg sm:rounded-xl text-stone-500 text-xs">

                      No sizes available for this design.

                    </div>

                  )}

                  {selectedSizes.length > 0 ? (

                    <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">

                      <div className="flex flex-wrap items-center gap-1.5">

                        <span className="text-[11px] text-stone-600 font-medium">Selected ({selectedSizes.length}):</span>

                        {selectedSizes.map((sz) => (

                          <span
                            key={sz}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-950 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs"
                          >
                            {sz}
                            <button
                              type="button"
                              onClick={() => setSelectedSizes((prev) => prev.filter((s) => s !== sz))}
                              className="text-stone-400 hover:text-rose-900 ml-0.5 font-normal"
                              title="Remove size"
                            >
                              ×
                            </button>
                          </span>

                        ))}

                      </div>

                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready for order
                      </span>

                    </div>

                  ) : (

                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">

                      <span>⚠️ Please select at least 1 size chart option above before adding to cart.</span>

                    </div>

                  )}

                </div>

                {canOrder && (<>

                  {/* =====================================================

                    CART CONTROLS

                \\===================================================== */}

                  {hasColors ? (

                    <div className="pt-2 space-y-3">

                      <div className="flex items-center justify-between text-xs">

                        <strong className="text-stone-800">Select Colours & Sets:</strong>

                        <span className="text-[10px] text-stone-500">It is compulsory to take all the sizes in each colour.</span>

                      </div>

                      <div className="space-y-2">

                        {colorOptions.map((c) => {

                          const qty = colorQty[c.name] ?? 0;

                          return (

                            <div

                              key={c.name}

                              className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 transition ${qty > 0 ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-stone-50'

                                }`}

                            >

                              <div className="flex items-center gap-2.5 min-w-0">

                                <span

                                  className="w-6 h-6 rounded-full border border-stone-300 shrink-0"

                                  style={{ backgroundColor: c.hex || 'transparent' }}

                                />

                                <span className="text-xs font-semibold text-stone-900 truncate">{c.name}</span>

                              </div>

                              <div className="flex items-center gap-2 shrink-0">

                                <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">

                                  <button

                                    type="button"

                                    onClick={() => setColorSets(c.name, qty - 1)}

                                    disabled={qty <= 0}

                                    className="p-2 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700"

                                    aria-label={`Decrease ${c.name} sets`}

                                  >

                                    <Minus className="w-3.5 h-3.5" />

                                  </button>

                                  <input

                                    type="number"

                                    min={0}

                                    value={qty}

                                    onChange={(e) => setColorSets(c.name, Number(e.target.value))}

                                    className="w-14 text-center text-xs font-bold text-stone-900 outline-none py-1.5"

                                    aria-label={`${c.name} sets`}

                                  />

                                  <button

                                    type="button"

                                    onClick={() => setColorSets(c.name, qty + 1)}

                                    className="p-2 hover:bg-stone-100 text-stone-700"

                                    aria-label={`Increase ${c.name} sets`}

                                  >

                                    <Plus className="w-3.5 h-3.5" />

                                  </button>

                                </div>

                                <span className="text-[10px] text-stone-400 w-12 text-right">

                                  {qty > 0 ? `${qty * product.piecesPerSet} pcs` : ''}

                                </span>

                              </div>

                            </div>

                          );

                        })}

                      </div>



                      <div

                        className={`text-[11px] rounded-xl px-3 py-2 border ${colorTotalSets > 0 && colorShortfall === 0

                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'

                            : 'bg-stone-50 border-stone-200 text-stone-600'

                          }`}

                      >

                        Total: <strong>{colorTotalSets} set{colorTotalSets === 1 ? '' : 's'}</strong> ({colorTotalSets * product.piecesPerSet} pcs)

                        {minOrderSets > 1 && (

                          <>

                            {' '}• Minimum for this design: <strong>{minOrderSets} sets</strong> across all colours

                            {existingSets > 0 && <> (you already have {existingSets} in your cart)</>}

                            {colorShortfall > 0 && <> — add <strong>{colorShortfall}</strong> more</>}

                          </>

                        )}

                      </div>



                      <button
                        type="button"
                        onClick={handleAddToColorCart}
                        disabled={colorLines.length === 0 || colorShortfall > 0 || selectedSizes.length === 0}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-300" />
                        <span>
                          {selectedSizes.length === 0
                            ? 'Select at least 1 size to continue'
                            : colorLines.length === 0
                              ? 'Enter sets for at least one colour'
                              : colorShortfall > 0
                                ? `Add ${colorShortfall} more set${colorShortfall > 1 ? 's' : ''} to reach the minimum`
                                : `Add ${colorTotalSets} Set${colorTotalSets > 1 ? 's' : ''} (${selectedSizeStr}) in ${colorLines.length} colour${colorLines.length > 1 ? 's' : ''} • ₹${(colorTotalSets * Number(product.wholesalePricePerSet)).toLocaleString('en-IN')}`}
                        </span>
                      </button>

                      {existingSets > 0 && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <strong>{existingSets} Set{existingSets > 1 ? 's' : ''}</strong>{selectedSizeStr ? ` in (${selectedSizeStr})` : ''} currently in your wholesale cart.
                          </span>
                          <Link href="/retailer/cart" className="font-bold underline whitespace-nowrap">View Cart</Link>
                        </div>
                      )}

                    </div>

                  ) : (<div className="pt-2 space-y-3">

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
                        disabled={!hasInitializedSets || selectedSizes.length === 0}
                        className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-300" />
                        <span>
                          {selectedSizes.length === 0
                            ? 'Select at least 1 size to continue'
                            : `Add ${setsToAdd} Set${setsToAdd > 1 ? 's' : ''} (${selectedSizeStr} • ${setsToAdd * product.piecesPerSet} pcs) • ₹${(setsToAdd * Number(product.wholesalePricePerSet)).toLocaleString('en-IN')}`}
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

                          </strong>{selectedSizeStr ? ` in (${selectedSizeStr})` : ''}{' '}

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

                  </div>)}

                </>)}

                {/* Live Sample */}

                {canOrder && (

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

                )}

              </div>

              {/* =======================================================
                  TECHNICAL SPECIFICATIONS
              ======================================================= */}
              <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200 shadow-2xs space-y-2.5 sm:space-y-4 text-xs">
                <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  Garment & Fabric Specifications
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      Fabric
                    </span>
                    <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                      {product.fabric}
                    </strong>
                  </div>

                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      Work / Craft
                    </span>
                    <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                      {product.workType}
                    </strong>
                  </div>

                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      Style / Silhouette
                    </span>
                    <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                      {product.style}
                    </strong>
                  </div>

                  {Array.isArray(product.size) && product.size.length > 0 && (
                    <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                      <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                        Size Charts
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {product.size.map((s) => (
                          <span
                            key={s}
                            className="inline-block bg-rose-50 text-rose-900 border border-rose-200 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      Clothing Type
                    </span>
                    <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                      {product.clothingType === '3_piece'
                        ? '3-Piece (Kurti + Pant + Dupatta)'
                        : '2-Piece (Kurti + Pant)'}
                    </strong>
                  </div>

                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      HSN Code
                    </span>
                    <strong className="font-mono text-stone-800 text-xs sm:text-sm truncate block">
                      {product.hsn}
                    </strong>
                  </div>

                  <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                    <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                      GST Rate
                    </span>
                    <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                      {product.gstRate}% Applicable
                    </strong>
                  </div>

                  {product.lining && (
                    <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                      <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                        Lining
                      </span>
                      <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                        {product.lining}
                      </strong>
                    </div>
                  )}

                  {product.margin && (
                    <div className="bg-stone-50/80 rounded-lg p-2 sm:p-2.5 border border-stone-200/60">
                      <span className="text-stone-400 text-[9px] sm:text-[10px] uppercase font-bold block mb-0.5">
                        Margins
                      </span>
                      <strong className="text-stone-800 text-xs sm:text-sm truncate block">
                        {product.margin}
                      </strong>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      <Footer />

      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`Magnified image of ${product.name}`}
          onTouchStart={(event) => {
            if (event.touches.length === 2) {
              const dx = event.touches[0].clientX - event.touches[1].clientX;
              const dy = event.touches[0].clientY - event.touches[1].clientY;
              pinchStartDistance.current = Math.hypot(dx, dy);
              pinchStartZoom.current = zoomLevel;
            }
          }}
          onTouchMove={(event) => {
            if (event.touches.length === 2 && pinchStartDistance.current) {
              const dx = event.touches[0].clientX - event.touches[1].clientX;
              const dy = event.touches[0].clientY - event.touches[1].clientY;
              const distance = Math.hypot(dx, dy);
              setZoomLevel(Math.max(1, Math.min(4, pinchStartZoom.current * distance / pinchStartDistance.current)));
            }
          }}
          onTouchEnd={() => { pinchStartDistance.current = null; }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setZoomLevel(level => Math.max(1, level - 0.5))} disabled={zoomLevel <= 1} aria-label="Zoom out" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 disabled:opacity-40">
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="min-w-12 text-center text-xs">{Math.round(zoomLevel * 100)}%</span>
              <button type="button" onClick={() => setZoomLevel(level => Math.min(4, level + 0.5))} disabled={zoomLevel >= 4} aria-label="Zoom in" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20 disabled:opacity-40">
                <ZoomIn className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setZoomLevel(1)} aria-label="Reset zoom" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20">
                <RotateCcw className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setIsZoomOpen(false)} aria-label="Close image viewer" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            className="relative min-h-0 flex-1 overflow-hidden touch-none"
            onDoubleClick={() => setZoomLevel(level => level === 1 ? 2 : 1)}
            onClick={(event) => {
              if (zoomLevel > 1) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              setMagnifierPosition({ x, y });
              setZoomLevel(2);
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${currentImage.replace(/"/g, '\\"')}")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                backgroundSize: zoomLevel === 1 ? 'contain' : `auto ${zoomLevel * 100}%`,
              }}
            />
          </div>
          <p className="px-4 pb-4 text-center text-xs text-white/70">
            Move over the image to magnify on desktop. On mobile, tap to zoom and pinch with two fingers.
          </p>
        </div>
      )}

    </div>

  );

}