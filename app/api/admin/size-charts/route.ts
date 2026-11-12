import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff, requireStaffOrVendor } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireStaffOrVendor(request);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const requestedVendorId = request.nextUrl.searchParams.get("vendorId");
    const vendorId = (auth as { vendorProfile?: { id: string } }).vendorProfile?.id;
    const owner = vendorId
      ? { vendorId }
      : requestedVendorId
        ? { vendorId: requestedVendorId }
        : { userId: auth.user.id };
    const options = await prisma.sizeChartOption.findMany({
      where: owner,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(
      { success: true, data: options },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Fetch size charts error:", error);
    return NextResponse.json({ success: false, error: "Could not load size charts." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a size chart name.").max(50, "Size chart names must be 50 characters or fewer."),
});

export async function POST(request: NextRequest) {
  const auth = await requireStaffOrVendor(request);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const requestedVendorId = request.nextUrl.searchParams.get("vendorId");
    let owner: { userId: string } | { vendorId: string };
    const authenticatedVendorId = (auth as { vendorProfile?: { id: string } }).vendorProfile?.id;
    if (authenticatedVendorId) {
      owner = { vendorId: authenticatedVendorId };
    } else if (requestedVendorId) {
      const vendor = await prisma.vendorProfile.findUnique({ where: { id: requestedVendorId }, select: { id: true } });
      if (!vendor) return NextResponse.json({ success: false, error: "Vendor not found." }, { status: 404 });
      owner = { vendorId: vendor.id };
    } else {
      owner = { userId: auth.user.id };
    }
    const maximum = await prisma.sizeChartOption.aggregate({ where: owner, _max: { sortOrder: true } });
    const option = await prisma.sizeChartOption.create({
      data: { ...owner, name: parsed.data.name, sortOrder: (maximum._max.sortOrder ?? -1) + 1 },
    });
    return NextResponse.json({ success: true, data: option }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "That size chart already exists." }, { status: 409 });
    }
    console.error("Create size chart error:", error);
    return NextResponse.json({ success: false, error: "Could not create the size chart." }, { status: 500 });
  }
}
