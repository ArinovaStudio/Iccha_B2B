'use client';

import React, { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ShoppingBag,
  X,
  RotateCcw,
  Boxes,
  Loader2,
  Store,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import RetailerProductCard from '@/components/product/RetailerProductCard';
import { useCatalogueViewer } from '@/lib/context/CatalogueViewerContext';

interface Category {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
  imageUrl?: string | null;
  specialty?: string;
  productCount?: number;
}

interface RetailerProduct {
  id: string;
  sku: string;
  designNumber: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: { name: string };
  sellerName: string;
  wholesalePricePerPiece: string | number;
  piecesPerSet: number;
  wholesalePricePerSet: string | number;
  availableSets: number;
  minOrderSets: number;
  sizeCombination: string;
  fabric: string;
  workType: string;
  style: string;
  clothingType: string;
  media?: { mediaAsset: { publicUrl: string } }[];
}

interface CartSummary {
  totalSets: number;
  totalDesigns: number;
  subtotal: string;
  items: { productId: string; sets: number }[];
}

interface Filters {
  categoryId: string;
  vendorId: string;
  search: string;
}

const ALL_SELLERS = 'all';

function RetailerCatalogueContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const { role: viewerRole, canOrder } = useCatalogueViewer();
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');

  // Mobile viewport detection for mobile-specific vendor flow
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMobileVendorModalOpen, setIsMobileVendorModalOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Vendor selection is 100% URL-driven with query parameter ?vendor=<vendorId>
  const vendorParam = searchParams.get('vendor') || '';
  // Default (no ?vendor=): ALL sellers - the admin's own products plus every vendor's.
  // Picking a seller narrows the catalogue to just that seller ('icchastore' = the admin/house products).
  const selectedVendor = vendorParam || ALL_SELLERS;
  const allProductCount = vendors.reduce((sum, v) => sum + (v.productCount || 0), 0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const vendorRailRef = useRef<HTMLDivElement | null>(null);

  const scrollVendorRail = useCallback((direction: 'left' | 'right') => {
    if (!vendorRailRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    vendorRailRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  const filters = useMemo<Filters>(
    () => ({ categoryId: selectedCategory, vendorId: selectedVendor, search: appliedSearch }),
    [selectedCategory, selectedVendor, appliedSearch]
  );

  // Only categories that actually have products (built from loaded products)
  const categories = useMemo<Category[]>(
    () =>
      Object.entries(categoryMap)
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categoryMap]
  );

  const cartItemsById = useMemo(
    () => new Map((cartSummary?.items ?? []).map(i => [i.productId, i] as const)),
    [cartSummary]
  );

  const refreshCart = useCallback(() => {
    if (!canOrder) return; // admins/vendors have no cart
    fetch('/api/retailer/cart')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCartSummary(json.data);
      })
      .catch(() => {
        // Cart pill stays stale until next successful refresh.
      });
  }, [canOrder]);

  const loadVendors = useCallback(() => {
    fetch('/api/retailer/vendors', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success) setVendors(json.data);
      })
      .catch(() => {
        // Vendor filter list will just be empty.
      });
  }, []);

  // One-time data: vendors + cart
  useEffect(() => {
    loadVendors();
    refreshCart();

    return () => abortRef.current?.abort();
  }, [loadVendors, refreshCart]);

  // Re-sync when the retailer comes back to this tab, so products an admin/vendor
  // re-activated in the meantime show up without a manual reload.
  const filtersRef = useRef<Filters | null>(null);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      loadVendors();
      if (filtersRef.current?.vendorId) {
        setNextCursor(null);
        loadProductsRef.current?.(filtersRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadVendors]);

  // If the URL points at a seller that no longer has active products, fall back to "All sellers".
  useEffect(() => {
    if (vendors.length === 0) return;
    const currentVendor = searchParams.get('vendor');
    if (currentVendor && !vendors.some(v => v.id === currentVendor)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('vendor');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [vendors, searchParams, router, pathname]);

  const loadProducts = useCallback(async (f: Filters, cursor?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    isFetchingRef.current = true;

    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (f.categoryId !== 'all') params.set('categoryId', f.categoryId);
      if (f.vendorId && f.vendorId !== 'all') params.set('vendorId', f.vendorId);
      if (f.search) params.set('search', f.search);
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/retailer/products?${params.toString()}`, {
        signal: controller.signal
      });
      const json = await res.json();

      if (controller.signal.aborted) return;

      if (json.success) {
        const incoming: RetailerProduct[] = json.data;

        setProducts(prev => {
          if (!cursor) return incoming;
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...incoming.filter(p => !seen.has(p.id))];
        });

        // Categories are sent by the server with the first page (all active products of this seller).
        if (!cursor && Array.isArray(json.categories)) {
          setCategoryMap(
            Object.fromEntries((json.categories as { id: string; name: string }[]).map((c) => [c.id, c.name]))
          );
        } else {
          // Fallback (also covers an older API that doesn't send `categories`):
          // accumulate the categories of every product loaded so far.
          setCategoryMap(prev => {
            const next = { ...prev };
            for (const p of incoming) {
              if (p.categoryId && p.category?.name && !next[p.categoryId]) {
                next[p.categoryId] = p.category.name;
              }
            }
            return next;
          });
        }

        setNextCursor(json.nextCursor ?? null);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      // Otherwise leave existing products in place.
    } finally {
      if (abortRef.current === controller) {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  const loadProductsRef = useRef(loadProducts);
  useEffect(() => {
    loadProductsRef.current = loadProducts;
    filtersRef.current = filters;
  }, [loadProducts, filters]);

  // Reload from page 1 whenever any filter changes
  useEffect(() => {
    if (!filters.vendorId) return;
    setNextCursor(null);
    loadProducts(filters);
  }, [filters, loadProducts]);

  // Infinite scroll: load next page when sentinel enters viewport
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nextCursor) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          loadProducts(filters, nextCursor);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, filters, loading, loadProducts]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setAppliedSearch(search.trim());
    },
    [search]
  );

  const clearSearch = useCallback(() => {
    setSearch('');
    setAppliedSearch('');
  }, []);

  const handleVendorChange = useCallback((vendorId: string) => {
    setSelectedCategory('all'); // category may not exist for the new vendor
    setCategoryMap({});         // rebuild categories from this vendor's products
    const params = new URLSearchParams(searchParams.toString());
    if (vendorId === ALL_SELLERS) params.delete('vendor');
    else params.set('vendor', vendorId);
    params.delete('category');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setIsMobileVendorModalOpen(false);
  }, [router, pathname, searchParams]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setAppliedSearch('');
    setSelectedCategory('all');
    setCategoryMap({});
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('search');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    appliedSearch.length > 0
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-3 sm:py-8 bg-[#faf8f5]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <nav className="text-[11px] sm:text-xs text-stone-500 mb-0.5 sm:mb-1 flex items-center gap-1.5">
                <Link href={canOrder ? '/retailer' : '/admin'} className="hover:text-stone-900">
                  {canOrder ? 'Whole Seller Portal' : viewerRole === 'VENDOR' ? 'Vendor Panel' : 'Admin Panel'}
                </Link>
                <span>/</span>
                <span className="text-stone-900 font-semibold">Wholesale Catalogue</span>
              </nav>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900">
                Live Wholesale Products Catalogue
              </h1>
            </div>

            {canOrder && (
              <Link
                href="/retailer/cart"
                className="self-start sm:self-center inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-stone-300 hover:border-rose-400 shadow-2xs text-[11px] sm:text-xs font-semibold text-stone-800 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#831843]" />
                <span>Cart: <strong>{cartSummary?.totalSets ?? 0} Sets</strong></span>
                <span className="font-mono text-rose-900 font-bold">
                  ₹{Number(cartSummary?.subtotal ?? 0).toLocaleString('en-IN')}
                </span>
              </Link>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 sm:top-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Design No, SKU, Fabric..."
                className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-stone-50 border border-stone-200 rounded-lg sm:rounded-xl text-xs focus:outline-none focus:border-rose-900 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button type="submit" className="flex-1 sm:flex-initial px-3.5 py-2 sm:py-2.5 bg-stone-900 text-white rounded-lg sm:rounded-xl font-bold text-xs">
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden px-3 py-2 bg-stone-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-xs"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>
            </div>
          </form>

          {/* =====================================================
              VENDOR SHOWCASE / 1-TAP SWITCHER
              On mobile: sleek horizontal rectangle boxes for space efficiency.
              On desktop: responsive cards with quick scroll.
          ===================================================== */}
          <section className="bg-white md:hidden block rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-stone-200/90 shadow-2xs space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#831843] shadow-2xs">
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-xs sm:text-base font-bold text-stone-900 leading-tight">
                    Wholesale Vendors
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 hidden sm:block">
                    Showing every seller by default - tap one to see only their designs
                  </p>
                </div>
              </div>

              {/* Desktop Scroll Chevrons */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollVendorRail('left')}
                  className="w-7 h-7 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition shadow-2xs"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollVendorRail('right')}
                  className="w-7 h-7 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition shadow-2xs"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vendor Cards Rail: Horizontal rectangle boxes on mobile, responsive tiles on desktop */}
            <div
              ref={vendorRailRef}
              className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Vendor Cards List */}
              {vendors.map((v) => {
                const isSelected = selectedVendor === v.id;
                const initials = v.name
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVendorChange(v.id)}
                    className={`snap-start shrink-0 transition-all flex cursor-pointer group text-left sm:text-center items-center sm:items-center min-w-[170px] max-w-none sm:min-w-[160px] sm:max-w-[240px] p-2 sm:p-3 rounded-lg sm:rounded-xl border flex-row sm:flex-col gap-2 sm:gap-2 justify-start sm:justify-between ${isSelected
                      ? 'border-[#831843] bg-rose-50/90 shadow-2xs ring-1 sm:ring-2 ring-[#831843]/20'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                      }`}
                  >
                    {/* Circular Vendor Photo */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full overflow-hidden border transition-transform ${isSelected
                        ? 'border-[#831843] ring-1 sm:ring-2 ring-rose-400/40 scale-105 shadow-xs'
                        : 'border-stone-200 group-hover:scale-105 group-hover:border-stone-400 shadow-2xs'
                        }`}>
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#831843] to-[#9a3412] text-white flex items-center justify-center font-bold text-xs sm:text-sm tracking-wider">
                            {initials || <Store className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#831843] text-white border border-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* What they sell + Name in rectangle layout */}
                    <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1 sm:w-full">
                      <div className="font-serif font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#831843] transition-colors truncate">
                        {v.name}
                      </div>

                      {/* Selling specialty badge — fully visible with no ellipsis */}
                      <span className="inline-block text-[10px] font-semibold text-rose-900 bg-rose-100/70 border border-rose-200/80 px-2 py-0.5 rounded-md sm:rounded-full whitespace-normal leading-snug">
                        {v.specialty || 'Ethnic Wear · Kurtis'}
                      </span>

                      <span className="block text-[9px] sm:text-[10px] text-stone-400 font-medium">
                        {v.productCount ? `${v.productCount} design${v.productCount > 1 ? 's' : ''}` : 'Active'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Vendor Banner */}
            {selectedVendor ? (
              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-stone-100 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5 text-stone-700 truncate">
                  <span className="text-stone-500 shrink-0">Browsing:</span>
                  <strong className="text-stone-900 truncate">
                    {selectedVendor === ALL_SELLERS ? 'All Sellers' : vendors.find((v) => v.id === selectedVendor)?.name || 'Selected Vendor'}
                  </strong>
                  {vendors.find((v) => v.id === selectedVendor)?.specialty && (
                    <span className="text-stone-500 hidden sm:inline whitespace-normal">
                      • {vendors.find((v) => v.id === selectedVendor)?.specialty}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium">
                    {(selectedVendor === ALL_SELLERS
                      ? allProductCount
                      : vendors.find((v) => v.id === selectedVendor)?.productCount)
                      ? `${selectedVendor === ALL_SELLERS ? allProductCount : vendors.find((v) => v.id === selectedVendor)?.productCount} designs`
                      : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMobileVendorModalOpen(true)}
                    className="md:hidden text-[10px] text-[#831843] font-bold underline hover:text-[#701a75]"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-stone-100 text-[11px] sm:text-xs">
                <span className="text-amber-800 font-medium flex items-center gap-1">
                  ⚠️ No manufacturer selected yet
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileVendorModalOpen(true)}
                  className="px-2.5 py-1 bg-[#831843] text-white text-[10px] font-bold rounded-lg shadow-2xs hover:bg-[#701a75]"
                >
                  Select Manufacturer
                </button>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">

            {/* Desktop Sticky Sidebar Filter */}
            <div className="hidden md:block md:col-span-3 space-y-4 md:sticky md:top-24">
              {/* Vendor Filters */}
              <aside className="bg-white rounded-xl px-4 py-5 border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-[#831843]" /> Filter Catalogue
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-[11px] text-rose-900 font-semibold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-3">
                  <label className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                    Vendor ({vendors.length})
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1 pr-1">
                    <button
                      type="button"
                      onClick={() => handleVendorChange(ALL_SELLERS)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md transition text-xs flex items-center justify-between ${selectedVendor === ALL_SELLERS
                        ? 'bg-[#831843] text-white font-semibold'
                        : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                      <span className="block truncate">All Sellers</span>
                      {allProductCount ? (
                        <span className={`text-[10px] ${selectedVendor === ALL_SELLERS ? 'text-rose-200' : 'text-stone-400'}`}>
                          {allProductCount}
                        </span>
                      ) : null}
                    </button>
                    {vendors.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleVendorChange(v.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md transition text-xs flex items-center justify-between ${selectedVendor === v.id
                          ? 'bg-[#831843] text-white font-semibold'
                          : 'text-stone-600 hover:bg-stone-100'
                          }`}
                      >
                        <span className="block truncate">{v.name}</span>
                        {v.productCount ? (
                          <span className={`text-[10px] ${selectedVendor === v.id ? 'text-rose-200' : 'text-stone-400'}`}>
                            {v.productCount}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Category Filters (only categories that have products) */}
              {categories.length > 0 && (
                <aside className="bg-white rounded-xl px-4 py-5 border border-stone-200 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                      Category ({categories.length})
                    </label>
                    <div className="max-h-96 overflow-y-auto space-y-0.5 -mx-1 pr-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full text-left px-2.5 py-1 rounded-md transition text-xs ${selectedCategory === 'all'
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'text-stone-600 hover:bg-stone-100'
                          }`}
                      >
                        All Categories
                      </button>
                      {categories.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCategory(c.id)}
                          className={`w-full text-left px-2.5 py-1 rounded-md transition text-xs ${selectedCategory === c.id
                            ? 'bg-[#831843] text-white font-semibold'
                            : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                          <span className="block truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>

            {/* Mobile Filter Bottom-Sheet Drawer */}
            {isMobileFilterOpen && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs md:hidden"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <div
                  className="bg-white w-full max-h-[82vh] rounded-t-2xl p-4 overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <span className="font-serif text-base font-bold text-stone-900 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-[#831843]" /> Filter Catalogue
                    </span>
                    <div className="flex items-center gap-3">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-rose-900 font-semibold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                      <button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vendor list in mobile modal */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                      Vendor ({vendors.length})
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleVendorChange(ALL_SELLERS);
                          setIsMobileFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center justify-between ${selectedVendor === ALL_SELLERS
                          ? 'bg-[#831843] text-white font-semibold'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                          }`}
                      >
                        <span className="truncate">All Sellers</span>
                        {allProductCount ? (
                          <span className={`text-[10px] ${selectedVendor === ALL_SELLERS ? 'text-rose-200' : 'text-stone-400'}`}>
                            {allProductCount} designs
                          </span>
                        ) : null}
                      </button>
                      {vendors.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            handleVendorChange(v.id);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex items-center justify-between ${selectedVendor === v.id
                            ? 'bg-[#831843] text-white font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                            }`}
                        >
                          <span className="truncate">{v.name}</span>
                          {v.productCount ? (
                            <span className={`text-[10px] ${selectedVendor === v.id ? 'text-rose-200' : 'text-stone-400'}`}>
                              {v.productCount} designs
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category list in mobile modal */}
                  {categories.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <label className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                        Category ({categories.length})
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setIsMobileFilterOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition text-xs ${selectedCategory === 'all'
                            ? 'bg-stone-900 text-white font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                            }`}
                        >
                          All Categories
                        </button>
                        {categories.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c.id);
                              setIsMobileFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition text-xs ${selectedCategory === c.id
                              ? 'bg-[#831843] text-white font-semibold'
                              : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                              }`}
                          >
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-2.5 bg-[#831843] text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Apply & View Designs
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                MOBILE FLOATING VENDOR SELECTOR MODAL
                Applies to mobile view only. Displays first when no vendor is selected.
            ========================================================= */}
            {isMobile && isMobileVendorModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 md:hidden animate-in fade-in duration-200"
                onClick={() => setIsMobileVendorModalOpen(false)}
              >
                <div
                  className="bg-white w-full max-h-[85vh] rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in slide-in-from-bottom duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#831843] shadow-2xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 leading-tight">
                          Select Manufacturer
                        </h3>
                        <p className="text-[10px] text-stone-500">
                          Tap a vendor to browse their live catalogue
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMobileVendorModalOpen(false)}
                      className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center transition"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vendor List */}
                  <div className="overflow-y-auto py-2.5 space-y-2 flex-1 pr-0.5">
                    <button
                      type="button"
                      onClick={() => handleVendorChange(ALL_SELLERS)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${selectedVendor === ALL_SELLERS
                        ? 'border-[#831843] bg-rose-50/90'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                    >
                      <span className="font-serif font-bold text-xs sm:text-sm text-stone-900">
                        All Sellers
                        <span className="ml-2 text-[10px] text-stone-400 font-medium">
                          {allProductCount ? `${allProductCount} designs` : ''}
                        </span>
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${selectedVendor === ALL_SELLERS ? 'bg-[#831843] text-white' : 'bg-stone-100 text-stone-700'}`}>
                        {selectedVendor === ALL_SELLERS ? 'Selected' : 'Select'}
                      </span>
                    </button>
                    {vendors.map((v) => {
                      const isSelected = selectedVendor === v.id;
                      const initials = v.name
                        .split(' ')
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleVendorChange(v.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${isSelected
                              ? 'border-[#831843] bg-rose-50/90 shadow-2xs ring-1 ring-[#831843]/20'
                              : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/70'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className={`w-11 h-11 rounded-full overflow-hidden border transition-transform ${isSelected
                                  ? 'border-[#831843] ring-1 ring-rose-400/40'
                                  : 'border-stone-200'
                                }`}>
                                {v.imageUrl ? (
                                  <img
                                    src={v.imageUrl}
                                    alt={v.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#831843] to-[#9a3412] text-white flex items-center justify-center font-bold text-xs tracking-wider">
                                    {initials || <Store className="w-4 h-4" />}
                                  </div>
                                )}
                              </div>

                              {isSelected && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#831843] text-white border border-white flex items-center justify-center shadow-xs">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            {/* Text info */}
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#831843] transition-colors truncate">
                                {v.name}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-block text-[10px] font-semibold text-rose-900 bg-rose-100/70 border border-rose-200/80 px-2 py-0.5 rounded-md whitespace-normal leading-snug">
                                  {v.specialty || ''}
                                </span>
                                <span className="text-[9px] text-stone-400 font-medium">
                                  {v.productCount ? `${v.productCount} design${v.productCount > 1 ? 's' : ''}` : 'Active'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${isSelected
                                ? 'bg-[#831843] text-white'
                                : 'bg-stone-100 text-stone-700 group-hover:bg-[#831843] group-hover:text-white transition-colors'
                              }`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-9 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-500 gap-4">
                <span>
                  {selectedVendor
                    ? <>Showing <strong>{products.length}</strong> wholesale designs</>
                    : <>Select a manufacturer to view designs</>}
                </span>
              </div>

              {!selectedVendor ? (
                <div className="p-8 sm:p-14 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#831843] flex items-center justify-center mx-auto shadow-2xs">
                    <Store className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-stone-800">
                    Select a Wholesale Manufacturer
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Please choose a manufacturer from the floating window to browse their exclusive wholesale collection.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMobileVendorModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#831843] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#701a75] transition"
                  >
                    <Store className="w-4 h-4" />
                    <span>Choose Manufacturer</span>
                  </button>
                </div>
              ) : loading ? (
                <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
                  Loading live wholesale inventory...
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                      <RetailerProductCard
                        key={product.id}
                        product={product}
                        cartItem={cartItemsById.get(product.id)}
                        onCartChanged={refreshCart}
                      />
                    ))}
                  </div>

                  {nextCursor ? (
                    <div ref={sentinelRef} className="flex justify-center items-center py-6 h-16">
                      {loadingMore && (
                        <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading more designs...
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-[11px] text-stone-400 py-6">
                      You&apos;ve reached the end of the catalogue
                    </p>
                  )}
                </>
              ) : (
                <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
                  <Boxes className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="font-serif text-lg font-bold text-stone-800">No designs match your filters</h4>
                  <p className="text-xs text-stone-500">Try clearing one or more filters or searching by a different term.</p>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-[#831843] text-white text-xs font-semibold rounded-xl shadow"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RetailerCataloguePage() {
  return (
    <Suspense fallback={null}>
      <RetailerCatalogueContent />
    </Suspense>
  );
}