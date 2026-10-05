import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";

const FREE_SHIPPING_THRESHOLD = 20000;
const FLAT_SHIPPING = 350;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sellerOrderId: string }> }
) {
  const guard = await requireRetailer(request);
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
    const result = await prisma.$transaction(
      async (tx) => {
        const sellerOrder = await tx.sellerOrder.findFirst({
          where: {
            id: sellerOrderId,
            orderEnquiry: { retailerProfileId: guard.retailerProfile.id },
          },
          select: {
            id: true,
            status: true,
            sellerName: true,
            orderEnquiryId: true,
            orderEnquiry: { select: { id: true, orderNumber: true } },
          },
        });

        if (!sellerOrder) {
          throw new Error("Seller order not found or access denied.");
        }

        const alreadyCancelled = sellerOrder.status === "CANCELLED";
        if (sellerOrder.status === "DISPATCHED") {
          throw new Error(
            "This seller order can no longer be cancelled after dispatch."
          );
        }

        if (!alreadyCancelled) {
          // Stock is not deducted during order submission, so cancellation must not restore it.
          // Remove any legacy reservations left by orders created before this change.
          await tx.stockReservation.deleteMany({
            where: { orderEnquiryId: sellerOrder.orderEnquiryId },
          });

          await tx.sellerOrder.update({
            where: { id: sellerOrder.id },
            data: { status: "CANCELLED" },
          });

          await tx.sellerOrderStatusHistory.create({
            data: {
              sellerOrderId: sellerOrder.id,
              status: "CANCELLED",
              actorUserId: guard.retailerProfile.userId,
              actorName: guard.retailerProfile.applicantName,
              notes: `Cancelled by retailer for ${sellerOrder.sellerName}.`,
            },
          });
        }

        const activeSellerOrders = await tx.sellerOrder.findMany({
          where: {
            orderEnquiryId: sellerOrder.orderEnquiryId,
            status: { not: "CANCELLED" },
          },
          select: {
            id: true,
            items: {
              select: {
                productId: true,
                billingEntityId: true,
                sets: true,
                totalPieces: true,
                lineSubtotal: true,
                gstAmount: true,
              },
            },
          },
        });

        let subtotal = 0;
        let totalGst = 0;
        let totalSets = 0;
        let totalPieces = 0;
        const productIds = new Set<string>();
        const billingEntityIds = new Set<string>();

        for (const activeSellerOrder of activeSellerOrders) {
          for (const item of activeSellerOrder.items) {
            productIds.add(item.productId);
            billingEntityIds.add(item.billingEntityId);
            totalSets += item.sets;
            totalPieces += item.totalPieces;
            subtotal += Number(item.lineSubtotal);
            totalGst += Number(item.gstAmount);
          }
        }

        subtotal = roundMoney(subtotal);
        totalGst = roundMoney(totalGst);
        const shipping =
          subtotal === 0
            ? 0
            : subtotal > FREE_SHIPPING_THRESHOLD
              ? 0
              : billingEntityIds.size * FLAT_SHIPPING;
        const masterTotal = roundMoney(subtotal + totalGst + shipping);
        const masterCancelled = activeSellerOrders.length === 0;

        await tx.orderEnquiry.update({
          where: { id: sellerOrder.orderEnquiryId },
          data: {
            totalDesigns: productIds.size,
            totalSets,
            totalPieces,
            subtotal,
            totalGst,
            shipping,
            masterTotal,
            ...(masterCancelled ? { status: "CANCELLED" } : {}),
          },
        });

        if (masterCancelled) {
          const existingCancellation = await tx.orderStatusHistory.findFirst({
            where: {
              orderEnquiryId: sellerOrder.orderEnquiryId,
              status: "CANCELLED",
            },
            select: { id: true },
          });

          if (!existingCancellation) {
            await tx.orderStatusHistory.create({
              data: {
                orderEnquiryId: sellerOrder.orderEnquiryId,
                status: "CANCELLED",
                actorUserId: guard.retailerProfile.userId,
                actorName: guard.retailerProfile.applicantName,
                notes: "All seller orders were cancelled by the retailer.",
              },
            });
          }
        }

        return {
          orderNumber: sellerOrder.orderEnquiry.orderNumber,
          sellerName: sellerOrder.sellerName,
          masterCancelled,
          subtotal,
          totalGst,
          shipping,
          masterTotal,
          totalSets,
          totalPieces,
        };
      },
      { maxWait: 10000, timeout: 15000 }
    );

    return NextResponse.json({
      success: true,
      message: result.masterCancelled
        ? `Order ${result.orderNumber} has been cancelled.`
        : `${result.sellerName} order has been cancelled and the master total has been recalculated.`,
      data: {
        masterCancelled: result.masterCancelled,
        totals: {
          subtotal: result.subtotal,
          totalGst: result.totalGst,
          shipping: result.shipping,
          masterTotal: result.masterTotal,
          totalSets: result.totalSets,
          totalPieces: result.totalPieces,
        },
      },
    });
  } catch (error) {
    console.error("Cancel retailer seller order error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not cancel this seller order.",
      },
      { status: 400 }
    );
  }
}
