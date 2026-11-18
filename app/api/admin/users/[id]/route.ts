import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { retailerProfile: true, vendorProfile: true },
  });
  if (!user || !["RETAILER", "VENDOR"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const [retailerOrderCount, vendorOrderCount] = await Promise.all([
    user.retailerProfile
      ? prisma.orderEnquiry.count({ where: { retailerProfileId: user.retailerProfile.id } })
      : Promise.resolve(0),
    user.vendorProfile
      ? prisma.sellerOrder.count({ where: { vendorId: user.vendorProfile.id } })
      : Promise.resolve(0),
  ]);
  if (retailerOrderCount || vendorOrderCount) {
    return NextResponse.json(
      { success: false, error: "This user has order history and cannot be deleted." },
      { status: 409 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
