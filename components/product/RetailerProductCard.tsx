'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Store, ArrowRight } from 'lucide-react';

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
  // Kept optional so app/catalogue/page.tsx can still pass it without errors
  onCartChanged?: () => void;
}

const formatClothingType = (v?: string) =>
  v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : v;

/**
 * One rounded container: photo on top, info panel overlapping the photo's
 * bottom edge with a gradient blend so the two read as a single card.
 */
export default function RetailerProductCard({ product, cartItem }: RetailerProductCardProps) {
  const existingSetsInCart = cartItem?.sets || 0;

  const primaryImageUrl = product.media?.[0]?.mediaAsset?.publicUrl;
  const detailHref = `/catalogue/${product.slug}`;

  const glassPill =
    'whitespace-nowrap rounded-full border border-white/15 bg-[#18140D]/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md';

  const details: { label: string; value?: string | number }[] = [
    { label: 'Design No', value: product.designNumber },
    { label: 'SKU', value: product.sku },
    { label: 'Fabric', value: product.fabric },
    { label: 'Work', value: product.workType },
    { label: 'Style', value: product.style },
    { label: 'Type', value: formatClothingType(product.clothingType) },
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

          {/* Action */}
          <div className="mt-auto pt-2.5">
            <Link
              href={detailHref}
              className="flex h-9 w-full items-center justify-between rounded-full bg-white pl-4 pr-1 text-[12px] font-semibold text-[#18140D] transition-colors hover:bg-[#F5F0E6]"
            >
              <span className="whitespace-nowrap">View details</span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#18140D] text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}