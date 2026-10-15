'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Product } from '@/lib/types';

interface PublicProductCardProps {
  product: Product;
}

interface AuthMeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  retailerStatus?: string;
  vendorBusinessName?: string;
  retailerBusinessName?: string;
  retailerGstin?: string;
}

// Every card on a listing page mounts at roughly the same time, so without
// this the grid would fire one /api/auth/me request per card. Cache the
// in-flight promise at module scope so all instances share one request.
let authMeCache: Promise<AuthMeUser | null> | null = null;

function fetchAuthMe(): Promise<AuthMeUser | null> {
  if (!authMeCache) {
    authMeCache = fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : { success: false }))
      .then(json => (json.success ? (json.data as AuthMeUser) : null))
      .catch(() => null);
  }
  return authMeCache;
}

// Roles that should see full wholesale pricing instead of "Unlock rates".
// VENDOR is deliberately excluded - vendors sell on the platform, they
// aren't wholesale buyers of this catalogue. Move it into this list if
// that assumption is wrong for your case.
const PRIVILEGED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_MANAGER', 'RETAILER'];

type AuthStatus = 'checking' | 'privileged' | 'guest';


export default function PublicProductCard({ product }: PublicProductCardProps) {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    fetchAuthMe().then(user => {
      if (cancelled) return;
      setStatus(user?.role && PRIVILEGED_ROLES.includes(user.role) ? 'privileged' : 'guest');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryMedia = product.media[0] || {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
    alt: product.name,
  };

  const typeLabel =
    product.clothingType === '3_piece'
      ? '3-Pc Set'
      : product.clothingType === '2_piece'
        ? '2-Pc Set'
        : 'Kurti';

  const glassPill =
    'whitespace-nowrap rounded-full border border-white/15 bg-[#18140D]/45 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md';

  return (
    <article className="group h-full rounded-[28px] border border-[#E7DEC9] bg-white p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
      <div className="relative aspect-[5/8] w-full overflow-hidden rounded-[20px] bg-[#ECE3D0]">
        <Image
          src={primaryMedia.url || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80"}
          alt={primaryMedia.alt || product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          referrerPolicy="no-referrer"
        />

        {/* Soft shade so the panel edge doesn't float on a hard photo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent"
        />

        {/* Top row */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className={`shrink-0 ${glassPill}`}>{typeLabel}</span>
          <span className={`min-w-0 truncate tabular-nums ${glassPill}`}>#{product.designNumber}</span>
        </div>

        {/* Floating info panel */}
        <div className="absolute inset-x-2 bottom-2 rounded-[18px] border border-white/15 bg-[#18140D]/60 p-3.5 text-white backdrop-blur-xl backdrop-saturate-150">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="min-w-0 truncate font-medium text-[#D9AE68]">{product.categoryName}</span>
          </div>

          {/* min-h keeps every panel the same height whether the name runs 1 or 2 lines */}
          <h3 className="mt-1 line-clamp-2 min-h-[2.75em] font-serif text-[17px] leading-snug">
            {product.name}
          </h3>

          <p
            className="mt-1 truncate text-[12px] text-white/65"
            title={`${product.fabric} · ${product.style}`}
          >
            {product.fabric} · {product.style}
          </p>

          {status === 'checking' && (
            <>
              <div className="mt-2.5 h-4 w-2/3 animate-pulse rounded bg-white/15" />
              <div className="mt-3 h-10 w-full animate-pulse rounded-full bg-white/15" />
            </>
          )}

          {status === 'privileged' && (
            <>
              {/* Wholesale details, shown only once we know the retailer is logged in */}
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-white/80">
                <span className="truncate">
                  {product.piecesPerSet ?? '-'} pcs/set · {product.availableSets ?? 0} sets left
                </span>
                <span className="shrink-0 font-mono font-semibold text-[#D9AE68]">
                  ₹{Number(product.wholesalePricePerPiece ?? 0).toLocaleString('en-IN')}/pc
                </span>
              </div>


              <Link
                href={`/catalogue/${product.slug ?? ''}`}
                className="group/cta mt-3 flex h-10 items-center justify-between rounded-full bg-white pl-4 pr-1 text-[13px] font-semibold text-[#18140D] transition-colors hover:bg-[#F5F0E6]"
              >
                <span className="whitespace-nowrap">
                  ₹{Number(product.wholesalePricePerSet ?? 0).toLocaleString('en-IN')}/set
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18140D] text-white">
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                </span>
              </Link>
            </>
          )}

          {status === 'guest' && (
            <Link
              href="/register"
              className="group/cta mt-3 flex h-10 items-center justify-between rounded-full bg-white pl-4 pr-1 text-[13px] font-semibold text-[#18140D] transition-colors hover:bg-[#F5F0E6]"
            >
              <span className="whitespace-nowrap">Unlock rates</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18140D] text-white">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}