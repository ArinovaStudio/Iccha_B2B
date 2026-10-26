'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Instagram, Lock, MapPin, ShieldCheck, X } from 'lucide-react';

export interface RailVendor {
  id: string;
  name: string;
  location: string;
  productCount: number;
  image: string;
  products?: [];
  description: string | null;
  instagramUrl?: string | null;
}

interface VendorRailProps {
  vendors: readonly RailVendor[];
  isLoggedIn?: boolean;
}

// Same glass pill used on PublicProductCard
const glassPill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[#18140D]/45 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md';

export default function VendorRail({
  vendors,
  isLoggedIn = false,
}: VendorRailProps) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [lockedVendor, setLockedVendor] = useState<RailVendor | null>(null);
  const total = String(vendors.length).padStart(2, '0');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close popup on Escape and lock page scroll while it is open
  useEffect(() => {
    if (!lockedVendor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLockedVendor(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lockedVendor]);

  function handleVendorClick(vendor: RailVendor) {
    if (isLoggedIn) {
      router.push(`/catalogue?vendor=${encodeURIComponent(vendor.id)}`);
    } else {
      setLockedVendor(vendor);
    }
  }

  const lockedInstagramUrl = lockedVendor?.instagramUrl?.trim();

  return (
    <>
      <ul className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-4 lg:flex lg:h-[560px] lg:flex-row lg:gap-3">
        {vendors.map((vendor, i) => {
          const isActive = i === active;
          const instagramUrl = vendor.instagramUrl?.trim();

          return (
            <li
              key={vendor.id}
              // flex-grow only applies on lg (accordion); on mobile each card is full width
              className="w-full min-w-0 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-auto lg:flex lg:basis-0 lg:[flex-grow:var(--grow)]"
              style={{ ['--grow' as string]: isActive ? 6 : 1 }}
              onMouseEnter={() => setActive(i)}
            >
              <div
                role="link"
                tabIndex={0}
                onFocus={() => setActive(i)}
                onClick={() => handleVendorClick(vendor)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleVendorClick(vendor);
                  }
                }}
                aria-label={
                  isLoggedIn
                    ? `View ${vendor.name} products`
                    : `${vendor.name} - apply for access to view products`
                }
                className="group relative block aspect-[3/4] w-full min-w-0 cursor-pointer overflow-hidden rounded-[24px] bg-[#ECE3D0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B3823C] lg:aspect-auto lg:flex-1"
              >
                <Image
                  src={vendor.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />

                {/* Legibility gradient */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#18140D]/70 via-[#18140D]/10 to-transparent"
                />

                {/* Dim closed cards */}
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-[#18140D] opacity-0 transition-opacity duration-500 ${
                    isActive ? 'lg:opacity-0' : 'lg:opacity-30'
                  }`}
                />

                {/* Closed strip: vertical name on large screens */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute bottom-6 left-1/2 hidden max-h-[75%] -translate-x-1/2 rotate-180 overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[20px] text-white transition-opacity duration-300 [writing-mode:vertical-rl] lg:block ${
                    isActive ? 'opacity-0' : 'opacity-100 delay-200'
                  }`}
                >
                  {vendor.name}
                </span>

                {/* Top row: verified badge and index */}
                <div
                  className={`absolute inset-x-3 top-3 flex items-center justify-between gap-2 transition-opacity duration-300 lg:inset-x-4 lg:top-4 ${
                    isActive
                      ? 'lg:opacity-100 lg:delay-200'
                      : 'lg:opacity-0'
                  }`}
                >
                  <span className={glassPill}>
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D9AE68]" />
                    Verified
                  </span>

                  <span className={`tabular-nums ${glassPill}`}>
                    {String(i + 1).padStart(2, '0')} / {total}
                  </span>
                </div>

                {/* Floating glass information panel */}
                <div
                  className={`absolute inset-x-3 bottom-3 overflow-hidden rounded-[18px] border border-white/15 bg-[#18140D]/60 text-white backdrop-blur-xl backdrop-saturate-150 transition-[opacity,transform] duration-500 ease-out ${
                    isActive
                      ? 'lg:translate-y-0 lg:opacity-100 lg:delay-200'
                      : 'lg:translate-y-3 lg:opacity-0'
                  }`}
                >
                  <div className="p-3.5 sm:p-4 lg:min-w-[300px] lg:p-5">
                    <span className="hidden text-[11px] font-medium text-[#D9AE68] sm:block">
                      Manufacturing partner
                    </span>

                    <h3 className="line-clamp-2 font-serif text-[18px] leading-snug text-white sm:mt-1 sm:text-[19px] lg:text-[28px] lg:leading-tight">
                      {vendor.name}
                    </h3>

                    {/* Location and description */}
                    <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-[12px] text-white/75 lg:mt-4 lg:pt-4 lg:text-[13px]">
                      {vendor.location && (
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D9AE68]" />
                          <span className="truncate">{vendor.location}</span>
                        </span>
                      )}

                      {vendor.description?.trim() && (
                        <span className="ml-auto min-w-0 max-w-[65%] text-right text-[11px] leading-relaxed text-white/85 line-clamp-2 sm:text-xs lg:text-sm">
                          {vendor.description}
                        </span>
                      )}
                    </div>

                    {/* Instagram link: icon with text beside it */}
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${vendor.name} on Instagram`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D9AE68]"
                      >
                        <Instagram className="h-4 w-4 shrink-0" />
                        See our designs on instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Access popup for visitors who are not logged in */}
      {mounted &&
        lockedVendor &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setLockedVendor(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-access-title"
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setLockedVendor(null)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Lock className="h-5 w-5 text-black" />
              </span>

              <h3
                id="vendor-access-title"
                className="font-serif text-2xl leading-tight tracking-tight text-black sm:text-3xl"
              >
                Products from {lockedVendor.name}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                Wholesale products, rates and live stock are available to
                verified businesses. Apply for access to view the full
                catalogue, or browse their designs on Instagram.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setLockedVendor(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
                >
                  <Lock className="h-4 w-4" />
                  Apply for Access
                </Link>

                {lockedInstagramUrl && (
                  <a
                    href={lockedInstagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
                  >
                    <Instagram className="h-4 w-4" />
                    Visit Instagram to view designs
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}