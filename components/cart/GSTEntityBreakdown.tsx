'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Receipt,
  Info,
  MapPin,
  Trash2,
  Plus,
  Minus,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { EntityCartSummary, CartItem } from '@/lib/types/cart';
import { useApp } from '@/lib/context/AppContext';

interface GSTEntityBreakdownProps {
  summaries: EntityCartSummary[];
  isEditable?: boolean;
}

// Group items by product and size; each colour remains a separate line.
function groupItemsByProduct(items: CartItem[]) {
  const map = new Map<string, CartItem[]>();

  for (const item of items) {
    const key = `${item.productId}|${item.selectedSize ?? ''}`;
    const list = map.get(key);

    if (list) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return Array.from(map, ([key, lines]) => ({
    key,
    lines,
    first: lines[0],
    totalSets: lines.reduce((sum, line) => sum + line.selectedSets, 0),
    totalPieces: lines.reduce((sum, line) => sum + line.totalPieces, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineSubtotal, 0),
  }));
}

export default function GSTEntityBreakdown({
  summaries,
  isEditable = true,
}: GSTEntityBreakdownProps) {
  const { updateCartItemSets, removeFromCart } = useApp();

  if (summaries.length === 0) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center">
        <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-2" />

        <h4 className="font-semibold text-stone-700">
          Your Wholesale Cart is Empty
        </h4>

        <p className="text-xs text-stone-500 mt-1">
          Browse our wholesale kurti catalogue to add sets.
        </p>

        <Link
          href="/catalogue"
          className="inline-block mt-4 px-4 py-2 bg-[#831843] text-white text-xs font-semibold rounded-lg shadow"
        >
          Explore Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice for carts containing products from multiple sellers */}
      {summaries.length > 1 && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5 text-xs text-sky-900">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />

          <div className="leading-relaxed">
            <strong>Multiple Seller Order:</strong> Your wholesale cart
            contains products from multiple sellers. Each seller&apos;s
            current GST and legal details are shown separately, and separate
            proforma estimates can be prepared for each seller under this
            single Master Order Enquiry.
          </div>
        </div>
      )}

      {/* Render each seller billing group */}
      {summaries.map((group) => {
        // Handle items without a valid seller billing entity.
        if (!group.entity) {
          return (
            <div
              key={group.entityId}
              className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5"
            >
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

              <div>
                <strong>Seller billing information missing:</strong>{' '}
                {group.totalSets} set(s) in your cart are linked to
                product(s) without seller GST configuration. These items
                can&apos;t be included in checkout yet — please remove them
                or contact support.
              </div>
            </div>
          );
        }

        const entity = group.entity;
        const isPlatform = entity.code === 'platform';

        return (
          <div
            key={group.entityId}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm transition hover:border-stone-300"
          >
            {/* Seller billing entity header */}
            <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 border-stone-200">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl text-white font-serif font-bold text-base shadow bg-[#831843] shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {isPlatform
                        ? 'IcchaStore Billing Details'
                        : 'Vendor Billing Details'}
                    </span>

                    <span className="text-[10px] bg-stone-100 font-mono text-stone-700 px-2 py-0.5 rounded border border-stone-200 break-all">
                      GSTIN: {entity.gstin}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-stone-900 leading-tight mt-0.5 break-words">
                    {entity.legalName}
                  </h4>

                  <div className="text-[11px] text-stone-500 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />

                    <span className="break-words">
                      {entity.registeredAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller order statistics */}
              <div className="text-left sm:text-right self-start sm:self-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-stone-200/80 shrink-0">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Seller Lots
                </span>

                <span className="text-xs font-bold text-stone-800">
                  {group.totalSets} Sets ({group.totalPieces} Pcs)
                </span>
              </div>
            </div>

            {/* Products belonging to this seller */}
            <div className="divide-y divide-stone-100">
              {groupItemsByProduct(group.items).map((g) => {
                const item = g.first;

                return (
                  <div key={g.key} className="p-3 sm:p-5 space-y-3">
                    {/* Product header */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                        <div className="relative w-14 h-[72px] sm:w-16 sm:h-20 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          <Image
                            src={
                              item.product.media[0]?.url ||
                              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400'
                            }
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 640px) 56px, 64px"
                            className="object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] sm:text-[11px] text-stone-500 mb-1">
                            <span className="font-mono text-rose-900 font-semibold">
                              {item.product.sku}
                            </span>

                            <span aria-hidden="true">•</span>

                            <span>
                              Design {item.product.designNumber}
                            </span>

                            <span aria-hidden="true">•</span>

                            <span className="font-mono text-stone-600">
                              HSN {item.product.hsn}
                            </span>
                          </div>

                          <h5 className="font-semibold text-stone-900 text-sm leading-snug break-words">
                            {item.product.name}
                          </h5>

                          <p className="text-xs text-stone-600 mt-1 break-words">
                            {item.product.fabric} •{' '}
                            {item.product.requiresSize && item.selectedSize
                              ? `Size: ${item.selectedSize}`
                              : 'Size: Not Required'}
                          </p>

                          <div className="text-[11px] text-stone-700 font-medium mt-1.5 leading-relaxed">
                            Rate:{' '}
                            <strong className="text-stone-900">
                              ₹{item.unitPrice}/pc
                            </strong>

                            <span className="hidden sm:inline"> • </span>
                            <span className="sm:hidden block" />

                            Set Rate:{' '}
                            <strong className="text-stone-900">
                              ₹{item.setPrice.toLocaleString('en-IN')}
                            </strong>{' '}
                            ({item.piecesPerSet} pcs/set)
                          </div>
                        </div>
                      </div>

                      {/* Product subtotal across all colours */}
                      <div className="text-right shrink-0 max-w-[92px] sm:max-w-none">
                        <span className="text-[10px] uppercase font-semibold text-stone-500 block">
                          Subtotal
                        </span>

                        <span className="text-sm font-bold text-stone-900 whitespace-nowrap">
                          ₹{g.subtotal.toLocaleString('en-IN')}
                        </span>

                        <span className="text-[10px] text-stone-500 block">
                          + GST {item.product.gstRate}%
                        </span>

                        <span className="text-[10px] text-stone-600 block mt-0.5 whitespace-nowrap">
                          {g.totalSets} Sets • {g.totalPieces} pcs
                        </span>
                      </div>
                    </div>

                    {/* Colour rows: responsive layout for mobile and desktop */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/60 divide-y divide-stone-200">
                      {g.lines.map((line) => (
                        <div
                          key={`${line.productId}-${line.selectedSize || 'no-size'}-${line.selectedColor || 'no-color'}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-3"
                        >
                          {/* Colour name and colour swatch */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {line.selectedColor ? (
                              <>
                                <span
                                  className="w-5 h-5 mt-0.5 rounded-full border border-stone-300 shrink-0"
                                  style={{
                                    backgroundColor:
                                      line.selectedColorHex || 'transparent',
                                  }}
                                  aria-hidden="true"
                                />

                                <span className="min-w-0 text-sm font-semibold text-stone-900 whitespace-normal break-words leading-5">
                                  {line.selectedColor}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-stone-800">
                                Quantity
                              </span>
                            )}
                          </div>

                          {/* Quantity, subtotal and remove button */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                            {isEditable ? (
                              <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-sm shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartItemSets(
                                      line.productId,
                                      line.selectedSets - 1,
                                      line.selectedSize,
                                      line.selectedColor
                                    )
                                  }
                                  disabled={
                                    line.selectedSets <= 1 ||
                                    line.designSets - 1 <
                                      line.product.minOrderSets
                                  }
                                  className="p-2 hover:bg-stone-100 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
                                  aria-label={`Decrease ${line.selectedColor || ''} sets`}
                                  title={
                                    line.designSets - 1 <
                                    line.product.minOrderSets
                                      ? `Minimum order for this design is ${line.product.minOrderSets} sets across all colours — remove it instead if you need fewer`
                                      : undefined
                                  }
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <div className="px-2 sm:px-3 text-xs font-bold text-stone-800 text-center min-w-[55px]">
                                  <div>{line.selectedSets} Sets</div>

                                  <div className="text-[9px] text-stone-500 font-normal">
                                    {line.totalPieces} pcs
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartItemSets(
                                      line.productId,
                                      line.selectedSets + 1,
                                      line.selectedSize,
                                      line.selectedColor
                                    )
                                  }
                                  className="p-2 hover:bg-stone-100 text-stone-600 transition"
                                  aria-label={`Increase ${line.selectedColor || ''} sets`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-stone-800 shrink-0">
                                {line.selectedSets} Sets ({line.totalPieces} pcs)
                              </div>
                            )}

                            <div className="text-right min-w-[65px] text-xs font-bold text-stone-900 shrink-0">
                              ₹{line.lineSubtotal.toLocaleString('en-IN')}
                            </div>

                            {isEditable && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    line.productId,
                                    line.selectedSize,
                                    line.selectedColor
                                  )
                                }
                                className="p-2 text-stone-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                                title={
                                  line.selectedColor
                                    ? `Remove ${line.selectedColor}`
                                    : 'Remove product'
                                }
                                aria-label={`Remove ${line.selectedColor || 'product'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* MOQ information */}
                    {item.product.minOrderSets > 1 && (
                      <p
                        className={`text-[11px] leading-relaxed ${
                          g.totalSets >= item.product.minOrderSets
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        Design total: <strong>{g.totalSets}</strong> /{' '}
                        {item.product.minOrderSets} sets minimum (all colours
                        combined)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Seller-wise GST and total */}
            <div className="bg-stone-50/80 p-4 border-t border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3 text-stone-600">
                <span>Taxable value ({group.totalSets} sets)</span>

                <span className="font-mono text-stone-800 shrink-0">
                  ₹{group.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {group.cgst > 0 || group.sgst > 0 ? (
                <>
                  <div className="flex justify-between gap-3 text-stone-600">
                    <span>GST</span>

                    <span className="font-mono text-stone-800 shrink-0">
                      ₹{group.cgst.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-stone-600">
                    <span>GST</span>

                    <span className="font-mono text-stone-800 shrink-0">
                      ₹{group.sgst.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-3 text-stone-600">
                  <span>GST</span>

                  <span className="font-mono text-stone-800 shrink-0">
                    ₹{group.igst.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3 border-t border-stone-300 pt-2">
                <span className="font-bold text-stone-900 min-w-0 break-words">
                  Total for {entity.tradeName || entity.legalName}
                </span>

                <span className="font-mono text-base font-bold text-[#831843] shrink-0">
                  ₹{group.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}