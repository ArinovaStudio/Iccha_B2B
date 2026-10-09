"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import PublicProductCard from "@/components/product/PublicProductCard";
import VendorRail, { RailVendor } from "@/components/vendor/VendorRail";
//import Craft from "./Craft";
import { Product } from "@/lib/types";

const BATCH_SIZE = 6;

type HomeVendor = Omit<RailVendor, "products"> & {
  products: Product[];
  description?: string | null;
};

export default function HomeElements() {
  const [featuredVendors, setFeaturedVendors] = useState<RailVendor[]>([]);
  const [vendors, setVendors] = useState<HomeVendor[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminDescription, setAdminDescription] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const [vendorsResult, adminResult, authResult] = await Promise.allSettled([
        axios.get("/api/home", { params: { limit: BATCH_SIZE } }),
        axios.get("/api/home", { params: { adminProducts: "true" } }),
        axios.get("/api/auth/me"),
      ]);

      if (cancelled) return;

      if (vendorsResult.status === "fulfilled") {
        const initial = (vendorsResult.value.data.vendors || []) as HomeVendor[];
        setVendors(initial);
        setFeaturedVendors(initial);
        setNextCursor(vendorsResult.value.data.nextCursor || null);
      } else {
        console.error("Failed to load homepage vendors:", vendorsResult.reason);
      }

      if (adminResult.status === "fulfilled") {
        setAdminProducts((adminResult.value.data.products || []) as Product[]);
        setAdminDescription(adminResult.value.data.description || null);
      } else {
        console.error("Failed to load Iccha Main Store products:", adminResult.reason);
      }

      if (authResult.status === "fulfilled") {
        const data = authResult.value.data;
        setIsLoggedIn(Boolean(data?.success && data?.data));
      }

      setInitialLoading(false);
    }

    loadInitialData().catch((error) => {
      console.error("Failed to load homepage:", error);
      if (!cancelled) setInitialLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const loadMoreVendors = useCallback(async () => {
    if (!nextCursor || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoadingMore(true);
    setLoadError(false);

    try {
      const response = await axios.get("/api/home", {
        params: { limit: BATCH_SIZE, cursor: nextCursor },
      });
      const incoming = (response.data.vendors || []) as HomeVendor[];

      setVendors((current) => {
        const ids = new Set(current.map((vendor) => vendor.id));
        return [...current, ...incoming.filter((vendor) => !ids.has(vendor.id))];
      });
      setNextCursor(response.data.nextCursor || null);
    } catch (error) {
      console.error("Failed to load more vendors:", error);
      setLoadError(true);
    } finally {
      requestInFlight.current = false;
      setLoadingMore(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !nextCursor || initialLoading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMoreVendors();
      }
    }, { rootMargin: "500px 0px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [nextCursor, initialLoading, loadMoreVendors]);

  const destination = isLoggedIn ? "/retailer/catalogue" : "/register";
  const ctaLabel = isLoggedIn ? "View All" : "Apply for Access";

  function renderProductRow(
    title: string,
    products: Product[],
    key: string,
    description?: string | null,
  ) {
    if (!products?.length) return null;

    return (
      <section key={key} className="mb-14 last:mb-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-serif text-2xl font-normal tracking-tight text-black sm:text-3xl">
              {title}
            </h3>
            {description?.trim() && (
              <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-neutral-500">
                {description.trim()}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-neutral-400">
            {Math.min(products.length, 4)} products
          </span>
        </div>

        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-5 sm:gap-5">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[calc(25%-15px)]">
              <PublicProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mb-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-xl font-serif text-4xl font-normal leading-[1.05] tracking-tight text-black sm:text-5xl lg:text-6xl">
              Our trusted vendors
            </h2>
          </div>
          <p className="reveal mb-16 max-w-xl text-[15px] leading-relaxed text-neutral-500">
            Explore verified manufacturing partners supplying wholesale ethnic wear across our platform.
          </p>
          {featuredVendors.length > 0 && (
            <div className="reveal"><VendorRail vendors={featuredVendors} /></div>
          )}
        </div>
      </section>

      {/*<Craft >*/}

   {  <section className="border-t border-neutral-200 bg-neutral-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h2 className="mb-4 font-serif text-4xl font-normal leading-[1.05] tracking-tight text-black sm:text-5xl lg:text-6xl">
                A sample of what we make
              </h2>
              <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-500">
                Explore fabric cuts, embellishments, and stitching finishes from Iccha Main Store and our manufacturing partners. Wholesale rates, live stock, and size ratios unlock once your business is verified.
              </p>
            </div>
            <Link href={destination} className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800">
              {!isLoggedIn && <Lock className="h-4 w-4" />}
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {initialLoading ? (
            <div className="py-16 text-center text-sm text-neutral-500">Loading collections...</div>
          ) : (
            <>
              {renderProductRow(
                "Iccha Main Store",
                adminProducts,
                "admin-store",
                adminDescription,
              )}
              {vendors.map((vendor) =>
                renderProductRow(
                  vendor.name,
                  vendor.products || [],
                  `vendor-${vendor.id}`,
                  vendor.description,
                ),
              )}

              {vendors.length === 0 && adminProducts.length === 0 && (
                <div className="py-16 text-center text-sm text-neutral-500">No products are available to display right now.</div>
              )}

              {loadError && (
                <div className="py-6 text-center">
                  <p className="mb-3 text-sm text-neutral-500">More vendors could not be loaded.</p>
                  <button type="button" onClick={() => void loadMoreVendors()} className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-white">
                    Try again
                  </button>
                </div>
              )}
              {loadingMore && <p className="py-6 text-center text-sm text-neutral-500">Loading more vendors...</p>}
              <div ref={sentinelRef} aria-hidden="true" className="h-1" />
              {!nextCursor && vendors.length > 0 && (
                <p className="pt-8 text-center text-xs text-neutral-400">You&apos;ve reached the end of our vendor collections.</p>
              )}
            </>
          )}
        </div>
      </section>}
    </>
  );
}
