import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const guard = await requireRetailer(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, requiresSize: true, gst: true } },
        vendor: { select: { id: true, businessName: true } },
        // Return every size option; stock should not control which sizes retailers can select.
        sizes: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, size: true, sortOrder: true },
        },
        gstConfig: {
          select: {
            hsnCode: true,
            cgstRate: true,
            sgstRate: true,
            igstRate: true,
            billingEntityId: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          include: { mediaAsset: { select: { publicUrl: true } } },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const shaped = {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      designNumber: product.designNumber,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? "",
      categoryRequiresSize: product.category?.requiresSize ?? false,
      sellerName: product.vendor?.businessName ?? "IcchaStore",
      fabric: product.fabric,
      workType: product.workType,
      style: product.style,
      clothingType: product.clothingType,
      piecesPerSet: product.piecesPerSet,
      wholesalePricePerPiece: Number(product.wholesalePricePerPiece),
      wholesalePricePerSet: Number(product.wholesalePricePerSet),
      // Minimum sets a retailer must add for THIS product in one cart line — separate from,
      // and in addition to, the cart-wide MOQ. Set by the vendor (or admin for house products).
      minOrderSets: product.minOrderSets,
      sizeCombination: product.sizeCombination,
      // Keep the existing response shape for clients that use sizeStocks, but do not expose stock counts.
      sizeStocks: product.sizes.map((row) => ({ size: row.size })),
      sizes: product.sizes.length > 0
        ? product.sizes.map((row) => row.size)
        : product.sizeCombination
            .split(",")
            .map((s) => s.trim().split(/[\s(]/)[0])
            .filter(Boolean),
      billingEntityId: product.gstConfig?.billingEntityId ?? null,
      hsn: product.gstConfig?.hsnCode ?? product.hsnCode,
      gstRate: product.category?.gst ?? "",
      media: product.media.map((m) => ({
        id: m.id,
        type: m.mediaType === "VIDEO" ? "video" : "image",
        url: m.mediaAsset.publicUrl,
        alt: product.name,
        isPrimary: m.isPrimary,
      })),
    };

    return NextResponse.json({ success: true, data: shaped });
  } catch (error) {
    console.error("Retailer product detail error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
