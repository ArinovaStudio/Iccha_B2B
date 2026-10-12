// Real, DB-backed cart shapes returned by /api/retailer/cart*.
// Field names intentionally mirror the legacy mock Cart/CartItem/EntityCartSummary
// shapes in lib/types/index.ts so existing cart UI keeps working.

export interface CartItemProductSummary {
  name: string;
  slug: string;
  sku: string;
  designNumber: string;
  fabric: string;
  sizeCombination: string;
  requiresSize: boolean;
  sizeStocks: { size: string; availableSets: number }[];
  availableSets: number;
  minOrderSets: number;
  isActive: boolean;
  vendorName: string;
  gstRate: number;
  hsn: string;
  media: { url: string | null }[];
}

export interface CartItem {
  productId: string;
  selectedSets: number;
  selectedSize: string | null;
  /** null for products without colours */
  selectedColor: string | null;
  /** Swatch colour for the selected colour, when the admin picked one with the colour picker */
  selectedColorHex: string | null;
  /** Total sets of this design (this size) across ALL colours - what the per-design minimum is checked against. */
  designSets: number;
  piecesPerSet: number;
  totalPieces: number;
  unitPrice: number;
  setPrice: number;
  lineSubtotal: number;
  billingEntityId: string;
  product: CartItemProductSummary;
}

export interface BillingEntitySummary {
  id: string;
  code: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  state: string;
  stateCode: string;
  registeredAddress: string;
}

export interface EntityCartSummary {
  entityId: string;
  entity: BillingEntitySummary | null;
  items: CartItem[];
  totalSets: number;
  totalPieces: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  shipping: number;
  total: number;
}

export interface MOQEvaluation {
  isMet: boolean;
  currentSets: number;
  requiredSets: number;
  currentPieces: number;
  requiredPieces: number;
  currentDesigns: number;
  requiredDesigns: number;
  currentOrderValue: number;
  requiredOrderValue: number;
  deficitSets: number;
  deficitPieces: number;
  message: string;
  overrideApplied: boolean;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  totalDesigns: number;
  totalSets: number;
  totalPieces: number;
  subtotal: number;
  estimatedGst: number;
  shippingEstimate: number;
  estimatedTotal: number;
  entitySummaries: EntityCartSummary[];
  moq: MOQEvaluation;
}

export const EMPTY_CART: Cart = {
  items: [],
  totalDesigns: 0,
  totalSets: 0,
  totalPieces: 0,
  subtotal: 0,
  estimatedGst: 0,
  shippingEstimate: 0,
  estimatedTotal: 0,
  entitySummaries: [],
  moq: {
    isMet: false,
    currentSets: 0,
    requiredSets: 4,
    currentPieces: 0,
    requiredPieces: 16,
    currentDesigns: 0,
    requiredDesigns: 1,
    currentOrderValue: 0,
    requiredOrderValue: 0,
    deficitSets: 4,
    deficitPieces: 16,
    message: 'Add sets to your cart to meet the minimum wholesale order quantity.',
    overrideApplied: false,
  },
};