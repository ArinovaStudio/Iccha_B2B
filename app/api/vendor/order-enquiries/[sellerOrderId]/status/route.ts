import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireVendor } from "@/lib/auth/guard";

const statusSchema = z.object({
  status: z.enum([
    "ENQUIRY_RECEIVED",
    "ORDER_ACCEPTED",
  ]),
  notes: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sellerOrderId: string }> }
) {
  const guard = await requireVendor(request);

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

    // SECURITY: the authenticated vendor must own this SellerOrder.
    const sellerOrder = await prisma.sellerOrder.findFirst({
      where: {
        id: sellerOrderId,
        vendorId: guard.vendorProfile.id,
      },
      select: {
        id: true,
        status: true,
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
          error: "Seller order not found or access denied.",
        },
        { status: 404 }
      );
    }

    if (sellerOrder.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "This seller order was cancelled by the retailer and cannot be reopened.",
        },
        { status: 409 }
      );
    }

    if (sellerOrder.status === parsed.data.status) {
      return NextResponse.json({
        success: true,
        data: {
          id: sellerOrder.id,
          status: sellerOrder.status.toLowerCase(),
        },
      });
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
          actorUserId: guard.vendorProfile.userId,
          actorName:
            guard.vendorProfile.contactName ||
            guard.vendorProfile.businessName,
          notes: parsed.data.notes || null,
        },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: `Order ${sellerOrder.orderEnquiry.orderNumber} status updated successfully.`,
      data: {
        id: updated.id,
        status: updated.status.toLowerCase(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update vendor seller order status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not update order status.",
      },
      { status: 500 }
    );
  }
}
