import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const updateWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required"),
  address: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  pincode: z.string().trim().optional().or(z.literal("")),
});
const disableWarehouseSchema = z.object({ isDisabled: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireStaff(request);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: { vendor: { select: { businessName: true } } },
    });

    if (!warehouse) {
      return NextResponse.json({ success: false, error: "Warehouse not found" }, { status: 404 });
    }

    const body = await request.json();
    if (typeof body?.isDisabled === "boolean") {
      const toggle = disableWarehouseSchema.safeParse(body);
      if (!toggle.success) {
        return NextResponse.json({ success: false, error: "Invalid disabled state." }, { status: 400 });
      }
      if (toggle.data.isDisabled) {
        const orderedProduct = await prisma.orderItem.findFirst({
          where: { product: { warehouseId: id } },
          select: { productName: true },
        });
        if (orderedProduct) {
          return NextResponse.json(
            {
              success: false,
              error: `It is linked to an order containing “${orderedProduct.productName}”. Warehouses with ordered products cannot be disabled so existing order records remain supported.`,
            },
            { status: 409 }
          );
        }
      }
      const updated = await prisma.warehouse.update({
        where: { id },
        data: { isDisabled: toggle.data.isDisabled },
        include: { vendor: { select: { businessName: true } } },
      });
      return NextResponse.json({
        success: true,
        data: { ...updated, vendorName: updated.vendor?.businessName ?? null, isMine: updated.vendorId === null },
      });
    }

    const parsed = updateWarehouseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
      },
      include: { vendor: { select: { businessName: true } } },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, vendorName: updated.vendor?.businessName ?? null, isMine: updated.vendorId === null },
    });
  } catch (error) {
    console.error("Admin update vendor warehouse error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
