'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, ShieldCheck } from 'lucide-react';

export interface RailVendor {
  id: string;
  name: string;
  location: string;
  productCount: number;
  image: string;
  products?: [];
  description: string | null;
 }

interface VendorRailProps {
  vendors: readonly RailVendor[];
}

// Same glass pill used on PublicProductCard
const glassPill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[#18140D]/45 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md';

export default function VendorRail({ vendors }: VendorRailProps) {
  const [active, setActive] = useState(0);
  const total = String(vendors.length).padStart(2, '0');

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:h-[560px] lg:gap-3">
      {vendors.map((vendor, i) => {
        const isActive = i === active;

        return (
          <li key={vendor.id} className="min-w-0 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:basis-0"
            style={{ flexGrow: isActive ? 6 : 1 }} onMouseEnter={() => setActive(i)}>
            <div tabIndex={0} onFocus={() => setActive(i)} aria-label={vendor.name}
              className="group relative block aspect-[3/4] w-full min-w-0 overflow-hidden rounded-[24px] bg-[#ECE3D0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B3823C] lg:aspect-auto lg:flex-1">
              <Image src={vendor.image} alt="" fill sizes="(max-width: 1024px) 50vw, 45vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                referrerPolicy="no-referrer"
              />

              {/* Legibility gradient (a bit lighter now, the glass panel does the heavy lifting) */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#18140D]/70 via-[#18140D]/10 to-transparent" />

              {/* Dim the closed strips so the open one reads as the focus */}
              <div aria-hidden className={`absolute inset-0 bg-[#18140D] opacity-0 transition-opacity duration-500 ${isActive ? 'lg:opacity-0' : 'lg:opacity-30'}`} />

              {/* Closed strip: vertical name (lg only) */}
              <span aria-hidden className={`pointer-events-none absolute bottom-6 left-1/2 hidden max-h-[75%] -translate-x-1/2 rotate-180 overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[20px] text-white transition-opacity duration-300 [writing-mode:vertical-rl] lg:block ${isActive ? 'opacity-0' : 'opacity-100 delay-200'}`}>
                {vendor.name}
              </span>

              {/* Top row: verified + index */}
              <div className={`absolute inset-x-3 top-3 flex items-center justify-between gap-2 transition-opacity duration-300 lg:inset-x-4 lg:top-4 ${isActive ? 'lg:opacity-100 lg:delay-200' : 'lg:opacity-0'}`}>
                <span className={glassPill}>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#D9AE68]" />
                  Verified
                </span>
                <span className={`hidden tabular-nums sm:inline-flex ${glassPill}`}>
                  {String(i + 1).padStart(2, '0')} / {total}
                </span>
              </div>

              {/* Floating glass info panel (open tile on lg, always visible below lg) */}
              <div className={`absolute inset-x-2 bottom-2 overflow-hidden rounded-[18px] border border-white/15 bg-[#18140D]/60 text-white backdrop-blur-xl backdrop-saturate-150 transition-[opacity,transform] duration-500 ease-out sm:inset-x-3 sm:bottom-3 ${isActive ? 'lg:translate-y-0 lg:opacity-100 lg:delay-200' : 'lg:translate-y-3 lg:opacity-0'}`}>
                {/* min-w keeps the text from reflowing while the tile is still sliding open */}
                <div className="p-3.5 sm:p-4 lg:min-w-[300px] lg:p-5">
                  <span className="hidden text-[11px] font-medium text-[#D9AE68] sm:block">
                    Manufacturing partner
                  </span>

                  <h3 className="line-clamp-2 font-serif text-[16px] leading-snug text-white sm:mt-1 sm:text-[19px] lg:text-[28px] lg:leading-tight">
                    {vendor.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-[12px] text-white/75 lg:mt-4 lg:pt-4 lg:text-[13px]">
                    {vendor.location && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D9AE68]" />
                        <span className="truncate">{vendor.location}</span>
                      </span>
                    )}
                    {vendor.description?.trim() && (
  <span className="ml-auto min-w-0 max-w-[65%] text-right text-[11px] leading-relaxed text-white/85 sm:text-xs lg:text-sm line-clamp-2">
    {vendor.description}
  </span>
)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}