import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireCatalogueViewer } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireCatalogueViewer(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    // Only vendors who currently have at least one active, listed product —
    // an empty vendor filter option would be a dead end for the whole seller.
    const [vendors, storeProducts, storeProductCount] = await Promise.all([
      prisma.vendorProfile.findMany({
        where: { products: { some: { isActive: true } } },
        select: {
          id: true,
          businessName: true,
          description: true,
          bannerAsset: { select: { publicUrl: true } },
          _count: { select: { products: { where: { isActive: true } } } },
          products: {
            where: { isActive: true },
            take: 8,
            select: {
              category: { select: { name: true } },
              style: true,
              clothingType: true,
              media: {
                take: 1,
                orderBy: { isPrimary: "desc" },
                select: { mediaAsset: { select: { publicUrl: true } } },
              },
            },
          },
        },
        orderBy: { businessName: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true, vendorId: null },
        take: 8,
        select: {
          category: { select: { name: true } },
          style: true,
          clothingType: true,
          media: {
            take: 1,
            orderBy: { isPrimary: "desc" },
            select: { mediaAsset: { select: { publicUrl: true } } },
          },
        },
      }),
      prisma.product.count({ where: { isActive: true, vendorId: null } }),
    ]);

    const formattedVendors = vendors.map((v) => {
      // Find circular image: bannerAsset or primary image of first product
      const productImg = v.products.find((p) => p.media[0]?.mediaAsset?.publicUrl)?.media[0]?.mediaAsset?.publicUrl || null;
      const imageUrl = v.bannerAsset?.publicUrl || productImg || null;

      // Extract distinct categories or styles they sell
      const catNames = Array.from(new Set(v.products.map((p) => p.category?.name).filter(Boolean)));
      const styleNames = Array.from(new Set(v.products.map((p) => p.style).filter(Boolean)));
      const clothingTypes = Array.from(new Set(v.products.map((p) => p.clothingType).filter(Boolean)));
      const specialtyItems = Array.from(new Set([...catNames, ...styleNames, ...clothingTypes].filter(Boolean)));
      const specialty =
        specialtyItems.length > 0
          ? specialtyItems.slice(0, 2).join(" · ")
          : v.description || "Ethnic Wear · Kurtis";

      return {
        id: v.id,
        name: v.businessName,
        imageUrl,
        specialty,
        productCount: v._count.products,
      };
    });

    const storeCategories = Array.from(new Set(storeProducts.map((p) => p.category?.name).filter(Boolean)));
    const storeSpecialty =
      storeCategories.length > 0
        ? storeCategories.slice(0, 2).join(" · ")
        : "Signature Ethnic Wear · House Lots";

    const storeProductImg = storeProducts.find((p) => p.media[0]?.mediaAsset?.publicUrl)?.media[0]?.mediaAsset?.publicUrl || null;

    const data = [
      // vendorId: null products are IcchaStore's own listings, not a vendor's.
      ...(storeProductCount > 0
        ? [
            {
              id: "icchastore",
              name: "Iccha Direct",
              imageUrl: storeProductImg || "/brand/iccha-symbol-dark.png",
              specialty: storeSpecialty,
              productCount: storeProductCount,
            },
          ]
        : []),
      ...formattedVendors,
    ];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Whole Seller vendors list error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}