export interface RetailerAddressView {
  street: string;
  area: string | null;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  landmark: string | null;
}

export interface RetailerProfileData {
  profile: {
    businessName: string;
    applicantName: string;
    mobile: string;
    whatsapp: string | null;
    email: string;
    gstin: string | null;
    pan: string | null;
    businessType: string | null;
    yearsInBusiness: number;
    status: string;
  };
  moq: { requiredSets: number; overrideApplied: boolean };
  billingAddress: RetailerAddressView | null;
  shippingAddress: RetailerAddressView | null;
  kyc: {
    status: string;
    gstin: string | null;
    pan: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
    infoRequestNotes: string | null;
    documents: { id: string; type: string; name: string; sizeMb: number; uploadedAt: string }[];
    activities: { id: string; action: string; notes: string | null; createdAt: string }[];
  } | null;
}

export async function fetchRetailerProfile(): Promise<RetailerProfileData> {
  const res = await fetch('/api/retailer/profile', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Could not load your profile.');
  }
  return json.data as RetailerProfileData;
}