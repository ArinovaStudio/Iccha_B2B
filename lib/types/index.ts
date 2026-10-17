export type UserRole = 'public' | 'retailer' | 'admin';

export type RetailerStatus =
  | 'pending_kyc'
  | 'under_review'
  | 'info_required'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type KYCStatus = RetailerStatus;

export type RetailerClassification =
  | 'Tier 1 - Platinum'
  | 'Tier 2 - Gold'
  | 'Standard Wholesale'
  | 'New Partner';

export interface KYCDocument {
  id: string;
  name: string;
  type:
  | 'gst_certificate'
  | 'pan_card'
  | 'shop_proof'
  | 'visiting_card'
  | 'trade_license';
  url: string;
  size: string;
  uploadedAt: string;
  status: 'verified' | 'pending' | 'rejected';
  rejectionReason?: string;
}

export interface Address {
  street: string;
  area?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  landmark?: string;
}

export interface KYCApplication {
  id: string;
  retailerId: string;
  businessName: string;
  applicantName: string;
  businessType:
  | 'Wholesale Retailer'
  | 'Boutique Owner'
  | 'Chain Store'
  | 'Reseller / Distributor'
  | 'Export House';
  mobile: string;
  whatsapp: string;
  email: string;
  gstin: string;
  pan: string;
  annualTurnover?: string;
  yearsInBusiness: string;
  address: Address;
  documents: KYCDocument[];
  status: RetailerStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  remarks?: string;
  infoRequestNotes?: string;
}

export interface Retailer {
  id: string;
  email: string;
  businessName: string;
  applicantName: string;
  mobile: string;
  whatsapp: string;
  gstin: string;
  pan: string;
  businessType: string;
  address: Address;
  deliveryAddresses?: Address[];
  status: RetailerStatus;
  classification: RetailerClassification;
  kycApplicationId?: string;
  moqOverride?: boolean;
  customMoqSets?: number;
  createdAt: string;
  totalOrdersCount: number;
  totalOrderValue: number;
}

export interface BillingEntity {
  id: string;
  code: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  registeredAddress: string;
  state: string;
  stateCode: string;
  contactEmail: string;
  contactPhone: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    ifsc: string;
    branch: string;
    upiId?: string;
  };
  estimatePrefix: string;
  invoicePrefix: string;
  assignedCategoryIds: string[];
  taxConfig: {
    cgstRate: number; // e.g., 2.5%
    sgstRate: number; // e.g., 2.5%
    igstRate: number; // e.g., 5.0%
    defaultGstRate: number; // 5% for apparel < ₹1000/pc or 12%
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  billingEntityId?: string;
  subcategories: string[];
  itemCount: number;
  representativeTagline: string;
  featured: boolean;
  type: '2_piece' | '3_piece' | 'mixed' | 'kurti_only';
  popularFabrics: string[];
  products?: any
}

export interface ProductMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt: string;
  isPrimary?: boolean;
  caption?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  designNumber: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  description: string;
  fabric: string;
  workType: string; // e.g., 'Hand Embroidery', 'Zari Foil Print', 'Mirror Work', 'Digital Print'
  lining?: string | null; // e.g., 'Premium Crepe Attached'
  margin?: string | null; // e.g., '2-inch Boutique Alteration Margin'
  style: string; // e.g., 'Straight Cut', 'Anarkali Set', 'A-Line Kurti Pant', 'Alia Cut', 'Nayra Cut'
  clothingType: '2_piece' | '3_piece' | 'kurti_only';
  piecesPerSet: number; // e.g., 4 or 5 or 6 (e.g., M, L, XL, XXL, 3XL)
  wholesalePricePerPiece: number;
  wholesalePricePerSet: number;
  availableSets: number;
  totalAvailablePieces: number;
  minOrderSets: number;
  sizeCombination: string; // e.g., 'M-38, L-40, XL-42, XXL-44'
  sizes: string[];
  colors: string[];
  collectionName: string;
  billingEntityId?: string;
  billingEntityCode?: string | null;

  vendor?: {
    id: string;
    businessName: string;
  } | null;

  warehouse?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    isActive: boolean;
  } | null;
  hsn: string; // e.g., '621142'
  gstRate: number; // e.g., 5
  status:
  | 'available'
  | 'low_stock'
  | 'out_of_stock'
  | 'reserved'
  | 'archived';
  isNewArrival: boolean;
  isFeatured: boolean;
  media: ProductMedia[];
  representativeDetails?: {
    kurtiLength: string;
    bottomLength: string;
    dupattaLength?: string;
    dupattaFabric?: string;
    liningIncluded: boolean;
    pocketIncluded: boolean;
    neckPattern: string;
    sleeveLength: string;
    careInstruction: string;
  };
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedSets: number;
  piecesPerSet: number;
  totalPieces: number;
  unitPrice: number;
  setPrice: number;
  lineSubtotal: number;
  billingEntityId?: string;
}

export interface EntityCartSummary {
  entityId: string;
  entity: BillingEntity;
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

export interface Cart {
  items: CartItem[];
  totalDesigns: number;
  totalSets: number;
  totalPieces: number;
  subtotal: number;
  estimatedGst: number;
  shippingEstimate: number;
  estimatedTotal: number;
  entitySummaries: EntityCartSummary[];
}

export interface MOQRule {
  id: string;
  name: string;
  scope: 'global' | 'category' | 'product';
  scopeId?: string;
  minSets: number;
  minDesigns: number;
  minPieces: number;
  minOrderValue: number;
  description: string;
  isActive: boolean;
}

export interface MOQRuleConfig {
  minimumSetsPerOrder: number;
  allowSampleOrders: boolean;
  sampleOrderMaxSets: number;
  entitySpecificMOQ: boolean;
  entityRules?: {
    entity_a?: {
      entityId: 'entity_a';
      minimumSets: number;
    };
    entity_b?: {
      entityId: 'entity_b';
      minimumSets: number;
    };
  };
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

export type OrderStatus =
  | 'enquiry_received'
  | 'under_review'
  | 'seller_contacted'
  | 'estimate_generated'
  | 'confirmed'
  | 'awaiting_payment'
  | 'processing'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  designNumber: string;
  categoryName: string;
  billingEntityId: string;
  sets: number;
  piecesPerSet: number;
  totalPieces: number;
  pieceRate: number;
  setRate: number;
  lineSubtotal: number;
  hsn: string;
  gstRate: number;
  gstAmount: number;
  totalWithGst: number;
  imageUrl: string;
  sizeCombination: string;
  color: string;
}

export interface EstimateDocument {
  id: string;
  estimateNumber: string;
  orderId: string;
  orderNumber: string;
  date: string;
  validUntil: string;
  billingEntity: BillingEntity;
  retailer: {
    id: string;
    businessName: string;
    applicantName: string;
    gstin: string;
    pan: string;
    mobile: string;
    email: string;
    billingAddress: Address;
    shippingAddress: Address;
  };
  items: OrderItem[];
  totalSets: number;
  totalPieces: number;
  taxableSubtotal: number;
  isInterState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  shippingCharge: number;
  grandTotal: number;
  paymentTerms: string[];
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface OrderEnquiry {
  id: string;
  orderNumber: string;
  retailerId: string;
  retailerBusinessName: string;
  retailerApplicantName: string;
  retailerGstin: string;
  retailerContact: string;
  retailerEmail: string;
  billingAddress: Address;
  shippingAddress: Address;
  items: OrderItem[];
  totalDesigns: number;
  totalSets: number;
  totalPieces: number;
  subtotal: number;
  totalGst: number;
  shipping: number;
  masterTotal: number;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  entityIds: string[];
  estimates: EstimateDocument[];
  customerRemarks?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerContactRequest {
  id: string;
  retailerId: string;
  customerName: string;
  businessName: string;
  mobile: string;
  whatsapp: string;
  cartSummary: {
    totalDesigns: number;
    totalSets: number;
    totalPieces: number;
    subtotal: number;
    items: {
      name: string;
      sku: string;
      designNumber: string;
      sets: number;
      pieces: number;
      rate: number;
    }[];
  };
  preferredDate: string;
  preferredTime: string;
  remarks: string;
  status:
  | 'requested'
  | 'contact_pending'
  | 'scheduled'
  | 'completed'
  | 'moq_exception_approved'
  | 'declined';
  adminNotes?: string;
  scheduledAt?: string;
  createdAt: string;
}

export * from './hero';