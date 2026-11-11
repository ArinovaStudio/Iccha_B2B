import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const guard = await requireStaff(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search")?.trim();

    const vendors = await prisma.vendorProfile.findMany({
      where: {
        user: { role: "VENDOR" },
        ...(search
          ? {
              OR: [
              { businessName: { contains: search, mode: "insensitive" } },
              { contactName: { contains: search, mode: "insensitive" } },
              { gstin: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { businessName: "asc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        userId: true,
        businessName: true,
        contactName: true,
        mobile: true,
        gstin: true,
        pan: true,
        address: true,
        city: true,
        state: true,
        stateCode: true,
        vendorCode: true,
        invoicePrefix: true,
        defaultGstRate: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        ifsc: true,
        branch: true,
        upiId: true,
        isActive: true,
        createdAt: true,
        bannerAsset: { select: { publicUrl: true } },
        user: { select: { email: true, lastLoginAt: true, hsnCode: true } },
        _count: { select: { products: true, warehouses: true, sellerOrders: true } },
      },
    });

    const hasMore = vendors.length > PAGE_SIZE;
    const items = (hasMore ? vendors.slice(0, PAGE_SIZE) : vendors).map(vendor => ({
      ...vendor,
      hsnCode: vendor.user.hsnCode,
    }));
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ success: true, data: items, nextCursor });
  } catch (error) {
    console.error("Vendors list error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
