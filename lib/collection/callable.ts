import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/collection/collection-auth";

export const MAX_PRODUCTS = 100;
export const MAX_TAGS = 8;

/* ------------------------------- selects -------------------------------- */

// A product's image = its primary (else first) non-video, public media.
const imageArgs = {
  where: { mediaType: { not: "VIDEO" }, mediaAsset: { visibility: "PUBLIC" } },
  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  take: 1,
  select: { mediaAsset: { select: { publicUrl: true } } },
} satisfies Prisma.ProductMediaFindManyArgs;

const activeProduct = { product: { isActive: true } } satisfies Prisma.CollectionProductWhereInput;

export const listSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  tags: true,
  sortOrder: true,
  isPublished: true,
  startAt: true,
  endAt: true,
  createdAt: true,
  updatedAt: true,
  vendorId: true,
  vendor: {
    select: {
      id: true,
      businessName: true,
      vendorCode: true,
    },
  },
  mediaAssetId: true,
  mediaAsset: {
    select: {
      id: true,
      publicUrl: true,
    },
  },
  _count: { select: { products: { where: activeProduct } } },
  products: {
    where: activeProduct,
    orderBy: { position: "asc" },
    take: 1, // first product → fallback cover image
    select: {
      product: {
        select: {
          id: true,
          name: true,
          designNumber: true,
          media: imageArgs,
        },
      },
    },
  },
} satisfies Prisma.CollectionSelect;

export const detailSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  tags: true,
  sortOrder: true,
  isPublished: true,
  startAt: true,
  endAt: true,
  createdAt: true,
  updatedAt: true,
  vendorId: true,
  vendor: {
    select: {
      id: true,
      businessName: true,
      vendorCode: true,
      contactName: true,
      mobile: true,
    },
  },
  mediaAssetId: true,
  mediaAsset: {
    select: {
      id: true,
      publicUrl: true,
    },
  },
  _count: { select: { products: { where: activeProduct } } },
  products: {
    where: activeProduct,
    orderBy: { position: "asc" },
    select: {
      position: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          sku: true,
          designNumber: true,
          wholesalePricePerSet: true,
          piecesPerSet: true,
          minOrderSets: true,
          availableSets: true,
          vendorId: true,
          media: imageArgs,
        },
      },
    },
  },
} satisfies Prisma.CollectionSelect;

type ListRow = Prisma.CollectionGetPayload<{ select: typeof listSelect }>;
type DetailRow = Prisma.CollectionGetPayload<{ select: typeof detailSelect }>;

const img = (m: { mediaAsset: { publicUrl: string } }[]) => m[0]?.mediaAsset.publicUrl ?? null;

export function toListItem(c: ListRow) {
  const { _count, products, mediaAsset, ...rest } = c;
  const firstProduct = products[0]?.product;
  const fallbackImage = firstProduct ? img(firstProduct.media) : null;
  const coverImage = mediaAsset?.publicUrl || fallbackImage;

  return {
    ...rest,
    productCount: _count.products,
    mediaAssetId: c.mediaAssetId ?? null,
    mediaAsset: mediaAsset ?? null,
    coverImage, // Option to add image in each collection, else 1st product's image
    fallbackImage,
    firstProduct: firstProduct
      ? {
          id: firstProduct.id,
          name: firstProduct.name,
          designNumber: firstProduct.designNumber,
          image: fallbackImage,
        }
      : null,
  };
}

export function toDetail(c: DetailRow) {
  const { _count, products, mediaAsset, ...rest } = c;
  const items = products.map(({ position, product: p }) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    designNumber: p.designNumber,
    image: img(p.media),
    pricePerSet: Number(p.wholesalePricePerSet),
    piecesPerSet: p.piecesPerSet,
    minOrderSets: p.minOrderSets,
    availableSets: p.availableSets,
    vendorId: p.vendorId,
    position,
  }));

  const fallbackImage = items[0]?.image ?? null;
  const coverImage = mediaAsset?.publicUrl || fallbackImage;

  return {
    ...rest,
    productCount: _count.products,
    mediaAssetId: c.mediaAssetId ?? null,
    mediaAsset: mediaAsset ?? null,
    coverImage,
    fallbackImage,
    products: items,
  };
}

/* ------------------------------ visibility ------------------------------ */

/** Published, inside its start/end window, and holding at least one active product. */
export function publicWhere(now = new Date()): Prisma.CollectionWhereInput {
  return {
    isPublished: true,
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      { products: { some: activeProduct } },
    ],
  };
}

export const canManage = (actor: Actor, ownerVendorId: string | null) =>
  actor.isAdmin || (!!actor.vendorId && !!ownerVendorId && ownerVendorId === actor.vendorId);

/**
 * Admins may add any active product (or enforce vendorId if target is set);
 * Vendors strictly only their own.
 */
export async function productsAllowed(actor: Actor, ids: string[], targetVendorId?: string | null) {
  if (!ids.length) return true;

  const where: Prisma.ProductWhereInput = {
    id: { in: ids },
    isActive: true,
  };

  if (!actor.isAdmin) {
    // Vendor is strictly locked to their own vendor ID
    where.vendorId = actor.vendorId;
  } else if (targetVendorId) {
    // Admin editing a vendor collection must restrict to that vendor's catalog
    where.vendorId = targetVendorId;
  }

  const n = await prisma.product.count({ where });
  return n === ids.length;
}

/* ------------------------------ write helpers ---------------------------- */

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "collection"
  );
}

export async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || (excludeId && existing.id === excludeId)) {
      break;
    }
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export type CollectionInput = {
  name?: string;
  description?: string | null;
  tags?: string[];
  productIds?: string[];
  isPublished?: boolean;
  sortOrder?: number;
  startAt?: Date | null;
  endAt?: Date | null;
  mediaAssetId?: string | null;
  vendorId?: string | null;
};

export function parseInput(raw: Record<string, unknown>, partial: boolean) {
  const data: CollectionInput = {};
  const errors: string[] = [];
  const has = (k: string) => raw[k] !== undefined;

  if (!partial || has("name")) {
    const v = text(raw.name, 120);
    if (v.length < 3) errors.push("name must be at least 3 characters");
    else data.name = v;
  }

  if (has("description")) data.description = text(raw.description, 1000) || null;

  if (has("tags")) {
    if (!Array.isArray(raw.tags)) errors.push("tags must be an array");
    else {
      const seen = new Set<string>();
      const tags: string[] = [];
      for (const t of raw.tags) {
        const v = text(t, 30);
        if (v && !seen.has(v.toLowerCase())) {
          seen.add(v.toLowerCase());
          tags.push(v);
        }
      }
      if (tags.length > MAX_TAGS) errors.push(`Use at most ${MAX_TAGS} tags`);
      else data.tags = tags;
    }
  }

  if (has("productIds")) {
    if (!Array.isArray(raw.productIds)) errors.push("productIds must be an array");
    else {
      const ids = [...new Set(raw.productIds.map((i) => text(i, 60)).filter(Boolean))];
      if (ids.length > MAX_PRODUCTS) errors.push(`A collection can hold at most ${MAX_PRODUCTS} products`);
      else data.productIds = ids;
    }
  }

  if (typeof raw.isPublished === "boolean") data.isPublished = raw.isPublished;
  if (Number.isInteger(raw.sortOrder)) data.sortOrder = raw.sortOrder as number;

  if (has("mediaAssetId")) {
    const v = raw.mediaAssetId;
    data.mediaAssetId = typeof v === "string" && v.trim() ? v.trim() : null;
  }

  if (has("vendorId")) {
    const v = raw.vendorId;
    data.vendorId = typeof v === "string" && v.trim() ? v.trim() : null;
  }

  for (const k of ["startAt", "endAt"] as const) {
    if (!has(k)) continue;
    const v = raw[k];
    if (v === null || v === "") data[k] = null;
    else {
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) errors.push(`${k} is not a valid date`);
      else data[k] = d;
    }
  }
  if (data.startAt && data.endAt && data.endAt <= data.startAt) errors.push("endAt must be after startAt");

  return { data, errors };
}

export const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

export const invalid = (errors: string[]) =>
  NextResponse.json({ success: false, errors }, { status: 422 });
