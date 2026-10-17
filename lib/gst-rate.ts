/**
 * Single source of truth for the GST % applied to a product.
 *
 * Priority:
 *   1. GST set on the product's category (admin/vendor sets it at category creation)
 *   2. The seller's default GST rate (vendor profile, or platform entity for admin products)
 *   3. 5% as a last-resort fallback
 *
 * `0` is a valid rate and is NOT treated as "empty".
 */
export const FALLBACK_GST_RATE = 5;

/** Turns "5", "5%", " 0.25 ", 5 or a Prisma Decimal into a number, or null if empty/invalid. */
export function parseGstRate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(/%$/, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export function resolveGstRate(
  categoryGst: unknown,
  sellerDefaultRate?: unknown
): number {
  const fromCategory = parseGstRate(categoryGst);
  if (fromCategory !== null) return fromCategory;

  const fromSeller = parseGstRate(sellerDefaultRate);
  if (fromSeller !== null) return fromSeller;

  if (sellerDefaultRate !== undefined) {
    console.warn(
      `[gst] No usable category or seller GST rate (seller default: ${String(sellerDefaultRate)}); using ${FALLBACK_GST_RATE}%`
    );
  }
  return FALLBACK_GST_RATE;
}
