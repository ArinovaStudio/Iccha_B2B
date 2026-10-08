import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { id } = await params;

  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        businessName: true,
        vendorCode: true,
        gstin: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        { status: 404 }
      );
    }
    const soleVendorOrders = await prisma.orderEnquiry.findMany({
      where: {
        sellerOrders: {
          some: {
            vendorId: id,
          },
          none: {
            OR: [
              { vendorId: null },
              { vendorId: { not: id } },
            ],
          },
        },
      },
      select: {
        id: true,
      },
    });

    const billingCode = `vendor:${vendor.vendorCode}`;

    await prisma.$transaction(async (tx) => {
      if (soleVendorOrders.length > 0) {
        await tx.orderEnquiry.deleteMany({
          where: {
            id: {
              in: soleVendorOrders.map((order) => order.id),
            },
          },
        });
      }
      await tx.estimate.deleteMany({
        where: {
          billingEntity: {
            code: billingCode,
          },
        },
      });

      await tx.billingEntity.deleteMany({
        where: {
          code: billingCode,
          gstin: vendor.gstin,
        },
      });

      await tx.user.delete({
        where: {
          id: vendor.userId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `${vendor.businessName} deleted successfully.`,
      deletedOrders: soleVendorOrders.length,
    });
  } catch (error) {
    console.error("Delete vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete vendor",
      },
      { status: 500 }
    );
  }
}