import axios from "axios";

/* Browser-side API calls for collections. */

const API = "/api/collections";

export type CollectionListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendorId: string | null;
  vendor?: {
    id: string;
    businessName: string;
    vendorCode: string;
  } | null;
  mediaAssetId: string | null;
  mediaAsset?: {
    id: string;
    publicUrl: string;
  } | null;
  productCount: number;
  coverImage: string | null; // custom mediaAsset or fallback 1st product image
  fallbackImage: string | null;
  firstProduct?: {
    id: string;
    name: string;
    designNumber: string;
    image: string | null;
  } | null;
};

export type CollectionProductItem = {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  designNumber: string;
  image: string | null;
  pricePerSet: number;
  piecesPerSet: number;
  minOrderSets: number;
  availableSets: number;
  vendorId?: string | null;
  position?: number;
};

export type CollectionDetail = CollectionListItem & {
  products: CollectionProductItem[];
};

export type CollectionPayload = {
  name?: string;
  description?: string | null;
  tags?: string[];
  productIds?: string[]; // ordered — first product becomes fallback cover
  isPublished?: boolean;
  sortOrder?: number;
  startAt?: string | null;
  endAt?: string | null;
  mediaAssetId?: string | null;
  vendorId?: string | null;
};

export type AvailableProduct = {
  id: string;
  name: string;
  sku: string;
  designNumber: string;
  wholesalePricePerSet: number;
  piecesPerSet: number;
  availableSets: number;
  vendorId: string | null;
  vendorName?: string | null;
  image: string | null;
};

/** Public list (no prices). */
export async function fetchCollections(params?: { tag?: string; vendorId?: string }): Promise<CollectionListItem[]> {
  const { data } = await axios.get(API, { params });
  return data.data;
}

/** One collection with products + rates. Throws a 401 error when logged out. */
export async function fetchCollection(slugOrId: string): Promise<CollectionDetail> {
  const { data } = await axios.get(`${API}/${encodeURIComponent(slugOrId)}`);
  return data.data;
}

/** Admin: all collections (or filtered by vendorId) · Vendor: their own collections. */
export async function fetchManagedCollections(params?: { vendorId?: string }): Promise<CollectionListItem[]> {
  const { data } = await axios.get(API, {
    params: {
      scope: "manage",
      ...(params?.vendorId ? { vendorId: params.vendorId } : {}),
    },
  });
  return data.data;
}

export async function createCollection(payload: CollectionPayload): Promise<CollectionDetail> {
  const { data } = await axios.post(API, payload);
  return data.data;
}

export async function updateCollection(slugOrId: string, payload: CollectionPayload): Promise<CollectionDetail> {
  const { data } = await axios.patch(`${API}/${encodeURIComponent(slugOrId)}`, payload);
  return data.data;
}

export async function deleteCollection(slugOrId: string): Promise<void> {
  await axios.delete(`${API}/${encodeURIComponent(slugOrId)}`);
}

/** Fetch products available to add to collection (respecting vendor restrictions). */
export async function fetchAvailableProductsForCollection(params?: {
  vendorId?: string | null;
  search?: string;
}): Promise<AvailableProduct[]> {
  const { data } = await axios.get(`${API}/products`, {
    params: {
      ...(params?.vendorId ? { vendorId: params.vendorId } : {}),
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return data.data;
}

export const httpStatus = (e: unknown) => (axios.isAxiosError(e) ? e.response?.status : undefined);
export const isUnauthorized = (e: unknown) => httpStatus(e) === 401;
export const isNotFound = (e: unknown) => httpStatus(e) === 404;
