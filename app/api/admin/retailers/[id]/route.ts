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

  const retailer = await prisma.retailerProfile.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!retailer || retailer.user.role !== "RETAILER") {
    return NextResponse.json({ success: false, error: "Whole Seller not found" }, { status: 404 });
  }

  const orderCount = await prisma.orderEnquiry.count({
    where: { retailerProfileId: id },
  });

  if (orderCount > 0) {
    return NextResponse.json(
      {
        success: false,
        error: "This retailer has order history and cannot be deleted.",
      },
      { status: 409 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: retailer.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete retailer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete retailer" },
      { status: 500 }
    );
  }
}