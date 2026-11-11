import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Not logged in" },
      { status: 401 }
    );
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Session expired or invalid" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { retailerProfile: true, vendorProfile: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, error: "Account not found or inactive" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hsnCode: user.hsnCode,
      retailerStatus: user.retailerProfile?.status,
      vendorBusinessName: user.vendorProfile?.businessName,
      retailerBusinessName: user.retailerProfile?.businessName,
      retailerGstin: user.retailerProfile?.gstin,
    },
  });
}
