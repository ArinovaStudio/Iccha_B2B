import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search")?.trim();

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["RETAILER", "VENDOR"] },
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { retailerProfile: { businessName: { contains: search, mode: "insensitive" } } },
              { vendorProfile: { businessName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      retailerProfile: {
        select: {
          businessName: true,
          status: true,
          gstin: true,
          businessType: true,
          mobile: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
            select: { street: true, city: true, state: true, stateCode: true, pincode: true },
          },
        },
      },
      vendorProfile: { select: { businessName: true, gstin: true, isActive: true, mobile: true } },
    },
  });

  const hasMore = users.length > PAGE_SIZE;
  const page = hasMore ? users.slice(0, PAGE_SIZE) : users;

  return NextResponse.json({
    success: true,
    data: page.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      mobile: u.vendorProfile?.mobile || u.retailerProfile?.mobile || null,
      role: u.role,
      businessName: u.vendorProfile?.businessName || u.retailerProfile?.businessName || null,
      retailerStatus: u.retailerProfile?.status || null,
      businessType: u.retailerProfile?.businessType || null,
      gstin: u.vendorProfile?.gstin || u.retailerProfile?.gstin || null,
      vendorActive: u.vendorProfile?.isActive ?? null,
      address: u.retailerProfile?.addresses?.[0]
        ? {
            street: u.retailerProfile.addresses[0].street,
            city: u.retailerProfile.addresses[0].city,
            state: u.retailerProfile.addresses[0].state,
            stateCode: u.retailerProfile.addresses[0].stateCode,
            pincode: u.retailerProfile.addresses[0].pincode,
          }
        : null,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}
