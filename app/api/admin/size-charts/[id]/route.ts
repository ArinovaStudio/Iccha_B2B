import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaffOrVendor } from "@/lib/auth/guard";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Enter a size chart name.").max(50, "Size chart names must be 50 characters or fewer."),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaffOrVendor(request);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const vendorId = (auth as { vendorProfile?: { id: string } }).vendorProfile?.id;
    const owner = vendorId
      ? { vendorId }
      : { userId: auth.user.id };
    const option = await prisma.sizeChartOption.updateMany({
      where: { id, ...owner },
      data: { name: parsed.data.name },
    });
    if (!option.count) return NextResponse.json({ success: false, error: "Size chart not found." }, { status: 404 });
    const updated = await prisma.sizeChartOption.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ success: false, error: "That size chart already exists." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ success: false, error: "Size chart not found." }, { status: 404 });
      }
    }
    console.error("Update size chart error:", error);
    return NextResponse.json({ success: false, error: "Could not update the size chart." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaffOrVendor(request);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const vendorId = (auth as { vendorProfile?: { id: string } }).vendorProfile?.id;
    const owner = vendorId
      ? { vendorId }
      : { userId: auth.user.id };
    const deleted = await prisma.sizeChartOption.deleteMany({ where: { id, ...owner } });
    if (!deleted.count) return NextResponse.json({ success: false, error: "Size chart not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Size chart not found." }, { status: 404 });
    }
    console.error("Delete size chart error:", error);
    return NextResponse.json({ success: false, error: "Could not remove the size chart." }, { status: 500 });
  }
}
