'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Store,
  Loader2,
} from 'lucide-react';
interface RetailerProduct {
  id: string;
  sku: string;
  designNumber?: string;
  name: string;
  slug: string;
  sellerName: string;
  wholesalePricePerPiece: string | number;
  piecesPerSet: number;
  wholesalePricePerSet: string | number;
  availableSets: number;
  minOrderSets: number;
  sizeCombination: string;
  fabric: string;
  workType?: string;
  style?: string;
  clothingType: string;
  media?: { mediaAsset: { publicUrl: string } }[];
}
interface RetailerProductCardProps {
  product: RetailerProduct;
  cartItem?: { productId: string; sets: number };
  onCartChanged: () => void;
}
/**
 * One rounded container: photo on top, info panel overlapping the photo's
 * bottom edge with a gradient blend so the two read as a single card.
 */
export default function RetailerProductCard({ product, cartItem, onCartChanged }: RetailerProductCardProps) {
  const minOrderSets = Math.max(1, product.minOrderSets || 1);
  const [setsToAdd, setSetsToAdd] = useState(minOrderSets);
  const [justAdded, setJustAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingSetsInCart = cartItem?.sets || 0;
  const handleQuickAdd = async () => {
    if (adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/retailer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, sets: setsToAdd }),
      });
      const json = await res.json();
      if (json.success) {
        setJustAdded(true);
        onCartChanged();
        setTimeout(() => setJustAdded(false), 1800);
      } else {
        setError(json.error || 'Could not add to cart');
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError('Network error — try again');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAdding(false);
    }
  };
  const primaryImageUrl = product.media?.[0]?.mediaAsset?.publicUrl;
  const detailHref = `/retailer/catalogue/${product.slug}`;
  const setLabel = `${setsToAdd} Set${setsToAdd > 1 ? 's' : ''}`;
  const glassPill =
    'whitespace-nowrap rounded-full border border-white/15 bg-[#18140D]/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md';
  const details: { label: string; value?: string | number }[] = [
    { label: 'Design No', value: product.designNumber },
    { label: 'SKU', value: product.sku },
    { label: 'Fabric', value: product.fabric },
    { label: 'Work', value: product.workType },
    { label: 'Style', value: product.style },
    { label: 'Type', value: product.clothingType },
    { label: 'Sizes', value: product.sizeCombination },
    { label: 'Pcs / Set', value: product.piecesPerSet },
  ].filter(d => d.value !== undefined && d.value !== null && String(d.value).trim() !== '');
  return (
    <article className="group h-full rounded-[24px] border border-[#E7DEC9] bg-white p-2 shadow-[0_6px_22px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[#18140D]">
        {/* Photo */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#ECE3D0] sm:aspect-[1/1]">
          <Link href={detailHref} className="absolute inset-0 block" aria-label={`View ${product.name}`}>
            {primaryImageUrl && (
              <Image
                src={primaryImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>
          {/* Fade into the panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#18140D] via-[#18140D]/60 to-transparent"
          />
          {/* Seller */}
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-center justify-start gap-2">
            <span className={`inline-flex min-w-0 items-center gap-1.5 ${glassPill}`}>
              <Store className="h-3 w-3 shrink-0 text-[#D9AE68]" />
              <span className="truncate">{product.sellerName}</span>
            </span>
          </div>
        </div>
        {/* Info panel — pulled up so it merges with the photo */}
        <div className="relative -mt-10 flex flex-1 flex-col px-3.5 pb-3.5 text-white">
          <div className="flex items-center justify-between gap-2">
            <Link href={detailHref} className="min-w-0">
              <h3 className="truncate font-serif text-[17px] leading-snug" title={product.name}>
                {product.name}
              </h3>
            </Link>
            {existingSetsInCart > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                <Check className="h-3 w-3" />
                {existingSetsInCart} in cart
              </span>
            )}
          </div>
          {/* Labelled details — compact 3-column grid */}
          {details.length > 0 && (
            <dl className="mt-2.5 grid grid-cols-3 gap-x-2.5 gap-y-1.5">
              {details.map(d => (
                <div key={d.label} className="min-w-0">
                  <dt className="text-[8.5px] font-semibold uppercase tracking-wider text-white/40">
                    {d.label}
                  </dt>
                  <dd className="truncate text-[11.5px] text-white/85" title={String(d.value)}>
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {/* Rates */}
          <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-white/10 pt-2">
            <div className="min-w-0">
              <span className="block text-[8.5px] font-semibold uppercase tracking-wider text-white/40">
                Price / Piece
              </span>
              <span className="whitespace-nowrap text-[17px] font-semibold leading-tight">
                ₹{Number(product.wholesalePricePerPiece).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="min-w-0 text-right">
              <span className="block text-[8.5px] font-semibold uppercase tracking-wider text-white/40">
                Price / Set ({product.piecesPerSet} pcs)
              </span>
              <span className="whitespace-nowrap text-[14px] font-semibold leading-tight text-[#D9AE68]">
                ₹{Number(product.wholesalePricePerSet).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {error && (
            <p className="mt-2 rounded-xl bg-rose-900/70 px-3 py-1.5 text-[11px] font-medium text-rose-50">
              {error}
            </p>
          )}
          {/* Actions */}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2.5">
            <div className="flex h-9 shrink-0 items-center rounded-full border border-white/25 px-1">
              <button
                type="button"
                onClick={() => setSetsToAdd(Math.max(minOrderSets, setsToAdd - 1))}
                disabled={setsToAdd <= minOrderSets}
                className="grid h-6 w-6 place-items-center rounded-full text-white/80 transition hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Decrease sets"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[20px] text-center text-[12px] font-semibold tabular-nums">
                {setsToAdd}
              </span>
              <button
                type="button"
                onClick={() => setSetsToAdd(setsToAdd + 1)}
                className="grid h-6 w-6 place-items-center rounded-full text-white/80 transition hover:bg-white/15"
                aria-label="Increase sets"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={adding}
              className="flex h-9 min-w-[104px] flex-1 items-center justify-between rounded-full bg-white pl-3.5 pr-1 text-[12px] font-semibold text-[#18140D] transition-colors hover:bg-[#F5F0E6] disabled:opacity-70"
            >
              <span className="truncate whitespace-nowrap">
                {justAdded ? `Added ${setLabel}` : `Add ${setLabel}`}
              </span>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white transition-colors ${
                  justAdded ? 'bg-emerald-700' : 'bg-[#18140D]'
                }`}
              >
                {adding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : justAdded ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ShoppingBag className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
