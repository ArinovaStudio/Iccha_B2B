import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";

const NON_CANCELLABLE_STATUSES = new Set(["DISPATCHED", "COMPLETED", "CANCELLED"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orderEnquiry.findFirst({
        where: { id: orderId, retailerProfileId: guard.retailerProfile.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          retailerApplicantName: true,
          sellerOrders: { select: { id: true, status: true } },
          items: {
            select: {
              productId: true,
              sets: true,
              sizeCombination: true,
              product: {
                select: {
                  category: { select: { requiresSize: true } },
                  sizes: { select: { id: true, size: true } },
                },
              },
            },
          },
        },
      });

      if (!order) throw new Error("Order not found.");
      if (NON_CANCELLABLE_STATUSES.has(order.status)) {
        if (order.status === "CANCELLED") throw new Error("This order is already cancelled.");
        throw new Error("This order can no longer be cancelled because it has already been dispatched or completed.");
      }

      // No inventory is changed here because order submission no longer deducts stock.
      await tx.stockReservation.deleteMany({ where: { orderEnquiryId: order.id } });

      const updatedOrder = await tx.orderEnquiry.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderEnquiryId: order.id,
          status: "CANCELLED",
          actorUserId: guard.retailerProfile.userId,
          actorName: order.retailerApplicantName,
          notes: "Order cancelled by the retailer.",
        },
      });

      // Keep every vendor-side SellerOrder synchronized with the master order.
      for (const sellerOrder of order.sellerOrders) {
        if (sellerOrder.status === "CANCELLED") continue;
        await tx.sellerOrder.update({
          where: { id: sellerOrder.id },
          data: { status: "CANCELLED" },
        });
        await tx.sellerOrderStatusHistory.create({
          data: {
            sellerOrderId: sellerOrder.id,
            status: "CANCELLED",
            actorUserId: guard.retailerProfile.userId,
            actorName: order.retailerApplicantName,
            notes: `Master order ${order.orderNumber} was cancelled by the retailer.`,
          },
        });
      }

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: `Order ${result.orderNumber} has been cancelled successfully.`,
      data: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status.toLowerCase(),
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Cancel retailer order error:", error);
    const message = error instanceof Error ? error.message : "Could not cancel this order.";
    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Order not found." ? 404 : 400 }
    );
  }
}
