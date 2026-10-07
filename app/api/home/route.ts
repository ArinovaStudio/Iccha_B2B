import { prisma } from "@/lib/db";
import { Product } from "@/lib/types";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const productInclude = {
  category: { select: { name: true } },
  subcategory: { select: { name: true } },
  collection: { select: { name: true } },
  media: {
    include: { mediaAsset: { select: { publicUrl: true } } },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.ProductInclude;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80";

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProduct(p: DbProduct): Product {
  const availableSets = p.availableSets;
  const status: Product["status"] =
    availableSets === 0 ? "out_of_stock" : availableSets <= 5 ? "low_stock" : "available";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    designNumber: p.designNumber,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    subcategory: p.subcategory?.name || "",
    description: p.description || "",
    minOrderSets: p.minOrderSets ?? 1,
    fabric: p.fabric,
    workType: p.workType,
    style: p.style,
    clothingType: p.clothingType as Product["clothingType"],
    piecesPerSet: p.piecesPerSet,
    wholesalePricePerPiece: Number(p.wholesalePricePerPiece),
    wholesalePricePerSet: Number(p.wholesalePricePerSet),
    availableSets: p.availableSets,
    totalAvailablePieces: p.totalAvailablePieces,
    sizeCombination: p.sizeCombination,
    sizes: [],
    colors: [p.color],
    collectionName: p.collection?.name || "General Wholesale",
    billingEntityId: undefined,
    hsn: p.hsnCode,
    gstRate: 5,
    status,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    media: p.media.map((m) => ({
      id: m.id,
      type: m.mediaType === "VIDEO" ? "video" : "image",
      url: m.mediaAsset.publicUrl,
      alt: p.name,
      isPrimary: m.isPrimary,
    })),
    createdAt: p.createdAt.toISOString(),
  };
}

const vendorSelect = {
  id: true,
  businessName: true,
  description: true,
  city: true,
  state: true,
  bannerAsset: { select: { publicUrl: true } },
  _count: { select: { products: { where: { isActive: true } } } },
  products: {
    where: { isActive: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: productInclude,
  },
} satisfies Prisma.VendorProfileSelect;

type DbVendor = Prisma.VendorProfileGetPayload<{ select: typeof vendorSelect }>;

function toVendor(v: DbVendor) {
  const products = v.products.map(toProduct);
  const images = products
    .map((product) => product.media[0]?.url)
    .filter((url): url is string => Boolean(url));

  return {
    id: v.id,
    name: v.businessName,
    description: v.description,
    location: [v.city, v.state].filter(Boolean).join(", "),
    productCount: v._count.products,
    images,
    products,
    image: v.bannerAsset?.publicUrl ?? images[0] ?? FALLBACK_IMAGE,
  };
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const getCatSlug = params.get("catSlug");
    const adminProducts = params.get("adminProducts");

    if (getCatSlug) {
      const data = await prisma.category.findMany({ include: { products: true } });
      return NextResponse.json({ data }, { status: 200 });
    }

    if (adminProducts) {
      const [products, storeSettings] = await Promise.all([
        prisma.product.findMany({
          where: { vendorId: null, isActive: true },
          include: productInclude,
          take: 4,
          orderBy: { createdAt: "asc" },
        }),
        prisma.storeSettings.findUnique({
          where: { id: "main" },
          select: { description: true },
        }),
      ]);

      return NextResponse.json(
        {
          products: products.map(toProduct),
          description: storeSettings?.description ?? null,
        },
        { status: 200 },
      );
    }

    const rawLimit = Number(params.get("limit") || 6);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 10) : 6;
    const cursor = params.get("cursor");

    const vendors = await prisma.vendorProfile.findMany({
      where: {
        isActive: true,
        user: {
          OR: [{ role: "VENDOR" }, { role: "ADMIN" }, { role: "SUPER_ADMIN" }],
        },
      },
      orderBy: [{ businessName: "asc" }, { id: "asc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
      select: vendorSelect,
    });

    const hasMore = vendors.length > limit;
    const pageVendors = hasMore ? vendors.slice(0, limit) : vendors;
    const nextCursor = hasMore ? pageVendors[pageVendors.length - 1]?.id ?? null : null;

    return NextResponse.json(
      { vendors: pageVendors.map(toVendor), nextCursor },
      { status: 200 },
    );
  } catch (error) {
    console.error("Home API error:", error);
    return NextResponse.json({ error: "Failed to fetch homepage data" }, { status: 500 });
  }
}
