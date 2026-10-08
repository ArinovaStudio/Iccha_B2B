import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, businessName: true, vendorCode: true },
  });

  if (!vendor) {
    return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
  }

  try {
    const soleVendorOrders = await prisma.orderEnquiry.findMany({
      where: {
        sellerOrders: {
          some: { vendorId: id },
          none: { OR: [{ vendorId: null }, { vendorId: { not: id } }] },
        },
      },
      select: { id: true },
    });

    // The vendor's BillingEntity is created with the vendor but has no FK to the
    // user/vendor, so the cascade never removes it. It holds the unique GSTIN, so it
    // must be deleted explicitly or the GSTIN can't be reused.
    const billingCode = `vendor:${vendor.vendorCode}`;

    // Operations in a $transaction array run in order, so the orders (and their
    // estimates) are gone before the billing entity is deleted.
    await prisma.$transaction([
      prisma.orderEnquiry.deleteMany({
        where: { id: { in: soleVendorOrders.map((o) => o.id) } },
      }),
      // Estimates on shared orders that point at this vendor's billing entity.
      // Estimate -> BillingEntity has no cascade and would block the delete.
      prisma.estimate.deleteMany({
        where: { billingEntity: { code: billingCode } },
      }),
      prisma.billingEntity.deleteMany({ where: { code: billingCode } }),
      prisma.user.delete({ where: { id: vendor.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `${vendor.businessName} deleted.`,
      deletedOrders: soleVendorOrders.length,
    });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}