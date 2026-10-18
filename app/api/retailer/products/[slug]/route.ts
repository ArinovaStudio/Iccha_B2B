import { NextRequest, NextResponse } from "next/server";
import { resolveGstRate } from "@/lib/gst-rate";
import { prisma } from "@/lib/db";
import { requireCatalogueViewer } from "@/lib/auth/guard";
import { parseColors } from "@/lib/product-colors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const guard = await requireCatalogueViewer(request);

    if ("error" in guard) {
      return NextResponse.json(
        { success: false, error: guard.error },
        { status: guard.status }
      );
    }

    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            requiresSize: true,
            gst: true,
          },
        },

        vendor: {
          select: {
            id: true,
            businessName: true,
            defaultGstRate: true,
          },
        },

        // Fetch the warehouse assigned to this product.
        warehouse: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            isActive: true,
          },
        },

        // Return every size option; stock should not control
        // which sizes retailers can select.
        sizes: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            size: true,
            sortOrder: true,
          },
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
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            mediaAsset: {
              select: {
                publicUrl: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // IcchaStore-owned products fall back to the platform entity's default GST rate.
    const platformEntity = product.vendor
      ? null
      : await prisma.billingEntity.findFirst({
        where: {
          code: process.env.PLATFORM_BILLING_ENTITY_CODE || "platform",
          isActive: true,
        },
        select: { defaultGstRate: true },
      });
    const platformGstRate = platformEntity?.defaultGstRate;

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

      // Return warehouse data in the format expected by the frontend.
      warehouse: product.warehouse
        ? {
          id: product.warehouse.id,
          name: product.warehouse.name,
          address: product.warehouse.address,
          city: product.warehouse.city,
          state: product.warehouse.state,
          pincode: product.warehouse.pincode,
          isActive: product.warehouse.isActive,
        }
        : null,

      fabric: product.fabric,
      workType: product.workType,
      lining: product.lining,
      margin: product.margin,
      style: product.style,
      size: product.size,
      clothingType: product.clothingType,

      piecesPerSet: product.piecesPerSet,
      wholesalePricePerPiece: Number(product.wholesalePricePerPiece),
      wholesalePricePerSet: Number(product.wholesalePricePerSet),

      // Minimum sets for this product, separate from cart-wide MOQ.
      minOrderSets: product.minOrderSets,

      sizeCombination: product.sizeCombination,
      colorOptions: parseColors(product.color),

      // Preserve the existing response shape for frontend compatibility.
      // Stock counts are intentionally not exposed.
      sizeStocks: product.sizes.map((row) => ({
        size: row.size,
      })),

      sizes:
        product.sizes.length > 0
          ? product.sizes.map((row) => row.size)
          : product.sizeCombination
            .split(",")
            .map((s) => s.trim().split(/[\s(]/)[0])
            .filter(Boolean),

      billingEntityId: product.gstConfig?.billingEntityId ?? null,
      hsn: product.gstConfig?.hsnCode ?? product.hsnCode,
      gstRate: String(resolveGstRate(product.category?.gst, product.vendor ? product.vendor.defaultGstRate : platformGstRate)),

      media: product.media.map((m) => ({
        id: m.id,
        type: m.mediaType === "VIDEO" ? "video" : "image",
        url: m.mediaAsset.publicUrl,
        alt: product.name,
        isPrimary: m.isPrimary,
      })),
    };

    return NextResponse.json({
      success: true,
      data: shaped,
    });
  } catch (error) {
    console.error("Whole Seller product detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}