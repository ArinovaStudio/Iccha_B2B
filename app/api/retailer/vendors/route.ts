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
    // an empty vendor filter option would be a dead end for the retailer.
    const [vendors, hasStoreProducts] = await Promise.all([
      prisma.vendorProfile.findMany({
        where: { products: { some: { isActive: true } } },
        select: { id: true, businessName: true },
        orderBy: { businessName: "asc" },
      }),
      prisma.product.count({ where: { isActive: true, vendorId: null } }),
    ]);

    const data = [
      // vendorId: null products are IcchaStore's own listings, not a vendor's.
      ...(hasStoreProducts > 0 ? [{ id: "icchastore", name: "IcchaStore" }] : []),
      ...vendors.map((v) => ({ id: v.id, name: v.businessName })),
    ];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Retailer vendors list error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}