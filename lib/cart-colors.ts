import { parseColors } from "@/lib/product-colors";

/** Sentinel stored on CartItem.selectedColor for products that have no colours. */
export const NO_COLOR = "__NO_COLOR__";

export interface ColorLine {
  color: string;
  sets: number;
}

/**
 * Resolve a requested colour against the product's configured colours.
 * Returns the canonical colour name, NO_COLOR for colourless products, or null if invalid.
 */
export function resolveColor(productColor: string | null | undefined, requested?: string | null): string | null {
  const options = parseColors(productColor);
  if (options.length === 0) return NO_COLOR;
  const wanted = requested?.trim().toLowerCase();
  if (!wanted) return options.length === 1 ? options[0].name : null;
  return options.find((c) => c.name.toLowerCase() === wanted)?.name ?? null;
}

/** Key for the quantity pool the per-design minimum applies to: one product in one size, across all colours. */
export const designKey = (productId: string, selectedSize: string) => `${productId}|${selectedSize}`;