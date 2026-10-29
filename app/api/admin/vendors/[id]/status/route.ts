import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const statusSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "isActive must be true or false" }, { status: 400 });
  }

  const { id } = await params;
  const vendor = await prisma.vendorProfile.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!vendor) {
    return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.vendorProfile.update({ where: { id }, data: { isActive: parsed.data.isActive } }),
    prisma.user.update({ where: { id: vendor.userId }, data: { isActive: parsed.data.isActive } }),
  ]);

  return NextResponse.json({ success: true, data: { id, isActive: parsed.data.isActive } });
}
