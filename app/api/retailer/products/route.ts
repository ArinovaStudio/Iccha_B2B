import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCatalogueViewer } from "@/lib/auth/guard";

const PAGE_SIZE = 9;

export async function GET(request: NextRequest) {
  try {
    const guard = await requireCatalogueViewer(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const vendorId = searchParams.get("vendorId");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(vendorId === "icchastore"
          ? { vendorId: null }
          : vendorId
            ? { vendorId }
            : {}),
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { designNumber: { contains: search, mode: "insensitive" } },
            ],
          }
          : {}),
      },
      // id as a tie-breaker keeps cursor pagination stable when createdAt values match
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        category: { select: { name: true } },
        vendor: { select: { id: true, businessName: true } },
        media: {
          where: { isPrimary: true },
          take: 1,
          include: { mediaAsset: { select: { publicUrl: true } } },
        },
      },
    });

    const hasMore = products.length > PAGE_SIZE;
    const items = hasMore ? products.slice(0, PAGE_SIZE) : products;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Combined view: products from every vendor plus IcchaStore's own (vendorId: null),
    // each carrying its own vendor's display name.
    const shaped = items.map((p) => ({
      ...p,
      sellerName: p.vendor?.businessName ?? "IcchaStore",
    }));

    return NextResponse.json({ success: true, data: shaped, nextCursor });
  } catch (error) {
    console.error("Whole Seller products list error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}