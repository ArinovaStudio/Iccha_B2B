import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";

export async function PATCH(
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
    include: { retailerProfile: { select: { mobile: true } }, vendorProfile: { select: { mobile: true } } },
  });
  if (!user || !["RETAILER", "VENDOR"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const mobile = user.vendorProfile?.mobile || user.retailerProfile?.mobile || user.mobile;
  if (!mobile?.trim()) {
    return NextResponse.json({ success: false, error: "This user has no phone number to use as a default password." }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(mobile.trim());
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    return NextResponse.json({
      success: true,
      message: `Default password set successfully for ${user.name}. They can sign in with their registered phone number.`,
    });
  } catch (error) {
    console.error("Default password reset error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
  }
}
