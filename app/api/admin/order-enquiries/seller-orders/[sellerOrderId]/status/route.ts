import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { SellerOrderStatus } from "@prisma/client";

const statusSchema = z.object({
  status: z.nativeEnum(SellerOrderStatus),
  notes: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sellerOrderId: string }> }
) {
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { sellerOrderId } = await params;

  if (!sellerOrderId) {
    return NextResponse.json(
      { success: false, error: "Seller order ID is required." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsed.error.issues[0]?.message ||
            "Invalid seller order status.",
        },
        { status: 400 }
      );
    }

    // Staff can manage any seller order. Vendor access remains restricted to
    // the vendor-owned status endpoint, which verifies ownership separately.
    const sellerOrder = await prisma.sellerOrder.findFirst({
      where: {
        id: sellerOrderId,
      },
      select: {
        id: true,
        status: true,
        sellerName: true,
        orderEnquiry: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    if (!sellerOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Seller order not found.",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async tx => {
      const result = await tx.sellerOrder.update({
        where: {
          id: sellerOrder.id,
        },
        data: {
          status: parsed.data.status,
        },
      });

      await tx.sellerOrderStatusHistory.create({
        data: {
          sellerOrderId: sellerOrder.id,
          status: parsed.data.status,
          actorName: "Admin",
          notes: parsed.data.notes || null,
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: `${sellerOrder.sellerName} order ${sellerOrder.orderEnquiry.orderNumber} status updated successfully.`,
      data: {
        id: updated.id,
        status: updated.status.toLowerCase(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update IcchaStore seller order status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not update order status.",
      },
      { status: 500 }
    );
  }
}
