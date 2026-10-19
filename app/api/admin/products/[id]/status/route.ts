import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";

const statusSchema = z.object({
  isActive: z.boolean({ message: "isActive must be true or false" }),
});

// Staff (admin) may change the status of ANY product — their own (vendorId = null)
// and every vendor's. A vendor may change the status of their OWN products only.
async function authenticateEither(request: NextRequest) {
  const staffResult = await requireStaff(request);
  if (!("error" in staffResult)) {
    return { kind: "staff" as const, ...staffResult };
  }

  const vendorResult = await requireVendor(request);
  if (!("error" in vendorResult)) {
    return { kind: "vendor" as const, ...vendorResult };
  }

  return { error: "Admin or vendor access required", status: 401 as const };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateEither(request);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const parsed = statusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, vendorId: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    if (auth.kind === "vendor" && product.vendorId !== auth.vendorProfile.id) {
      return NextResponse.json(
        { success: false, error: "You can only change the status of your own products." },
        { status: 403 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update product status error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
