/**
 * Product colours are stored in the existing `Product.color` String column as a
 * comma-separated list, so no Prisma migration is needed and old single-colour
 * products keep working.
 *
 *   "Maroon (#800000), Navy Blue (#000080), Black"
 *
 * Each entry is either "Name (#rrggbb)" (picked with the colour picker) or a plain name.
 */

export interface ProductColor {
  name: string;
  hex: string | null;
}

const HEX_RE = /^(.*?)\s*\((#[0-9a-fA-F]{6})\)\s*$/;

export function parseColorEntry(entry: string): ProductColor {
  const trimmed = entry.trim();
  const match = trimmed.match(HEX_RE);
  if (match) return { name: match[1].trim() || match[2].toUpperCase(), hex: match[2].toLowerCase() };
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return { name: trimmed.toUpperCase(), hex: trimmed.toLowerCase() };
  return { name: trimmed, hex: null };
}

export function formatColorEntry({ name, hex }: ProductColor): string {
  const cleanName = name.replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (hex) return `${cleanName || hex.toUpperCase()} (${hex.toLowerCase()})`;
  return cleanName;
}

/** Parse the stored DB string into structured colours. */
export function parseColors(value: string | null | undefined): ProductColor[] {
  if (!value) return [];
  return value.split(',').map(parseColorEntry).filter(c => c.name);
}

/** Serialize colours back into the DB string. */
export function serializeColors(colors: ProductColor[]): string {
  return colors.map(formatColorEntry).filter(Boolean).join(', ');
}

/** Plain colour names only (no hex) - use wherever colours are shown as text. */
export function colorNames(value: string | null | undefined): string[] {
  return parseColors(value).map(c => c.name);
}

/**
 * Common wholesale ethnic-wear colours. Used to (a) suggest a name when a shade is
 * picked with the colour picker and (b) power the one-tap preset swatches.
 */
export const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Off White', hex: '#f5f0e6' },
  { name: 'Cream', hex: '#fffdd0' },
  { name: 'Beige', hex: '#d9c3a0' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Red', hex: '#e11d2e' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Wine', hex: '#722f37' },
  { name: 'Rust', hex: '#b7410e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Peach', hex: '#ffb38a' },
  { name: 'Coral', hex: '#ff6f61' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Baby Pink', hex: '#f8c8dc' },
  { name: 'Rani Pink', hex: '#e0115f' },
  { name: 'Magenta', hex: '#c2185b' },
  { name: 'Onion Pink', hex: '#d98e9f' },
  { name: 'Purple', hex: '#7e22ce' },
  { name: 'Lavender', hex: '#c4b5fd' },
  { name: 'Mauve', hex: '#a1699a' },
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Mustard', hex: '#d4a017' },
  { name: 'Gold', hex: '#c9a227' },
  { name: 'Lemon', hex: '#f4f08a' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Bottle Green', hex: '#0b5d3b' },
  { name: 'Olive', hex: '#6b7a2a' },
  { name: 'Mehendi Green', hex: '#8a9a3b' },
  { name: 'Parrot Green', hex: '#6cc24a' },
  { name: 'Mint', hex: '#a7e8c9' },
  { name: 'Sea Green', hex: '#2e8b78' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Turquoise', hex: '#2ec4b6' },
  { name: 'Sky Blue', hex: '#7dd3fc' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Royal Blue', hex: '#1d3fbb' },
  { name: 'Navy Blue', hex: '#0b1f4b' },
  { name: 'Brown', hex: '#7b4a2d' },
  { name: 'Chocolate', hex: '#4a2c1a' },
  { name: 'Tan', hex: '#c19a6b' },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Perceptually weighted RGB distance ("redmean") - closer to how people see colour than plain RGB. */
function colorDistance(a: [number, number, number], b: [number, number, number]) {
  const rMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
}

/** Closest friendly colour name for any hex value, e.g. "#7f0a0a" -> "Maroon". */
export function nearestColorName(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '';
  const target = hexToRgb(hex);
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const d = colorDistance(target, hexToRgb(c.hex));
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best.name;
}