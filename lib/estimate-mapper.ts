import type { Address, BillingEntity, EstimateDocument, OrderItem } from '@/lib/types';

const EMPTY_ADDRESS: Address = {
  street: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
};
export function buildEstimateDocument(order: any, estimate: any): EstimateDocument {
  const rawBilling = estimate?.billingEntity ?? {};
  const taxable = Number(estimate?.taxableSubtotal || 0);
  const gst = Number(estimate?.totalGst || 0);
  const effectiveRate = taxable > 0 && gst > 0 ? gst / taxable : 0;

  const billingEntity: BillingEntity = {
    id: rawBilling.id || '',
    code: rawBilling.code || '',
    legalName: rawBilling.legalName || '',
    tradeName: rawBilling.tradeName || rawBilling.legalName || '',
    gstin: rawBilling.gstin || '',
    pan: rawBilling.pan || '',
    registeredAddress: rawBilling.registeredAddress || '',
    state: rawBilling.state || '',
    stateCode: rawBilling.stateCode || '',
    contactEmail: rawBilling.contactEmail || '',
    contactPhone: rawBilling.contactPhone || '',
    bankDetails: {
      bankName: rawBilling.bankName || '',
      accountNumber: rawBilling.accountNumber || '',
      accountHolder: rawBilling.accountHolder || '',
      ifsc: rawBilling.ifsc || '',
      branch: rawBilling.branch || '',
      upiId: rawBilling.upiId || undefined,
    },
    estimatePrefix: rawBilling.estimatePrefix || '',
    invoicePrefix: rawBilling.invoicePrefix || '',
    assignedCategoryIds: [],
    taxConfig: {
      cgstRate: estimate?.isInterState ? 0 : (effectiveRate * 100) / 2,
      sgstRate: estimate?.isInterState ? 0 : (effectiveRate * 100) / 2,
      igstRate: estimate?.isInterState ? effectiveRate * 100 : 0,
      defaultGstRate: Number(rawBilling.defaultGstRate || 0),
    },
  };

  // The detail API doesn't send estimate.billingEntityId at the top level,
  // only the nested billingEntity object, so fall back to its id.
  const estimateEntityId = estimate?.billingEntityId || rawBilling.id;

  const items: OrderItem[] = (order?.items || [])
    .filter((item: any) => item.billingEntityId === estimateEntityId)
    .map((item: any) => ({
      ...item,
      productId: item.productId || item.id,
      designNumber: item.designNumber || '',
      hsn: item.hsn || '',
      imageUrl: item.imageUrl || '',
      color: item.color || 'Assorted',
      sizeCombination: item.sizeCombination || 'Assorted',
      pieceRate: Number(item.pieceRate || 0),
      setRate: Number(item.setRate || 0),
      lineSubtotal: Number(item.lineSubtotal || 0),
      gstRate: Number(item.gstRate || 0),
      gstAmount: Number(item.gstAmount || 0),
      totalWithGst: Number(item.totalWithGst || 0),
    }));

  return {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    orderId: estimate.orderId || order?.id || '',
    orderNumber: estimate.orderNumber || order?.orderNumber || '',
    date: estimate.date,
    validUntil: estimate.validUntil,
    billingEntity,
    retailer: {
      id: order?.retailerId || '',
      businessName: order?.retailerBusinessName || '',
      applicantName: order?.retailerApplicantName || '',
      gstin: order?.retailerGstin || '',
      pan: '',
      mobile: order?.retailerContact || '',
      email: order?.retailerEmail || '',
      billingAddress: order?.billingAddress || EMPTY_ADDRESS,
      shippingAddress: order?.shippingAddress || EMPTY_ADDRESS,
    },
    items,
    totalSets: Number(estimate.totalSets || 0),
    totalPieces: Number(estimate.totalPieces || 0),
    taxableSubtotal: taxable,
    isInterState: Boolean(estimate.isInterState),
    cgstAmount: Number(estimate.cgstAmount || 0),
    sgstAmount: Number(estimate.sgstAmount || 0),
    igstAmount: Number(estimate.igstAmount || 0),
    totalGst: gst,
    shippingCharge: Number(estimate.shippingCharge || 0),
    grandTotal: Number((taxable + gst).toFixed(2)),
    paymentTerms: Array.isArray(estimate.paymentTerms) ? estimate.paymentTerms : [],
  };
}