import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function parseJson(value: string | null | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const FREE_SHIPPING_THRESHOLD = 20000;
const FLAT_SHIPPING = 350;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const guard = await requireRetailer(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const { orderId } = await params;
    const retailerProfileId = guard.retailerProfile.id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.orderEnquiry.findFirst({
      where: {
        id: orderId,
        retailerProfileId,
      },
      select: {
        id: true,
        orderNumber: true,
        retailerBusinessName: true,
        retailerApplicantName: true,
        retailerGstin: true,
        retailerContact: true,
        retailerEmail: true,
        billingAddressJson: true,
        shippingAddressJson: true,
        totalDesigns: true,
        totalSets: true,
        totalPieces: true,
        subtotal: true,
        totalGst: true,
        shipping: true,
        masterTotal: true,
        status: true,
        customerRemarks: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,

        items: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            productId: true,
            billingEntityId: true,
            sellerOrderId: true,
            productName: true,
            sku: true,
            designNumber: true,
            categoryName: true,
            sets: true,
            piecesPerSet: true,
            totalPieces: true,
            pieceRate: true,
            setRate: true,
            lineSubtotal: true,
            hsn: true,
            gstRate: true,
            gstAmount: true,
            totalWithGst: true,
            imageUrl: true,
            color: true,
            sizeCombination: true,
            product: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                    contactName: true,
                  },
                },
              },
            },
          },
        },

        estimates: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            estimateNumber: true,
            orderEnquiryId: true,
            billingEntityId: true,
            date: true,
            validUntil: true,
            totalSets: true,
            totalPieces: true,
            taxableSubtotal: true,
            isInterState: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            totalGst: true,
            shippingCharge: true,
            grandTotal: true,
            pdfMediaAssetId: true,
            billingEntity: {
              select: {
                id: true,
                code: true,
                legalName: true,
                tradeName: true,
                gstin: true,
                pan: true,
                state: true,
                stateCode: true,
                registeredAddress: true,
                contactEmail: true,
                contactPhone: true,
                bankName: true,
                accountHolder: true,
                accountNumber: true,
                ifsc: true,
                branch: true,
                upiId: true,
                invoicePrefix: true,
                defaultGstRate: true,
                isActive: true,
              },
            },
          },
        },

        history: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            status: true,
            actorUserId: true,
            actorName: true,
            notes: true,
            createdAt: true,
          },
        },

        sellerOrders: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            vendorId: true,
            sellerName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const productIds = Array.from(
      new Set(order.items.map((item) => item.productId))
    );

    const vendorProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactName: true,
          },
        },
      },
    });

    const vendorByProductId = new Map(
      vendorProducts.map((product) => [product.id, product.vendor])
    );

    const cancelledSellerOrderIds = new Set(
      order.sellerOrders
        .filter((sellerOrder) => sellerOrder.status === "CANCELLED")
        .map((sellerOrder) => sellerOrder.id)
    );

    // Exclude items belonging to cancelled seller orders.
    const activeItems = order.items.filter(
      (item) =>
        !item.sellerOrderId ||
        !cancelledSellerOrderIds.has(item.sellerOrderId)
    );

    const activeBillingEntityIds = new Set(
      activeItems.map((item) => item.billingEntityId)
    );

    let activeSubtotal = 0;
    let activeGst = 0;
    let activeSets = 0;
    let activePieces = 0;

    const activeProductIds = new Set<string>();

    for (const item of activeItems) {
      activeProductIds.add(item.productId);
      activeSets += item.sets;
      activePieces += item.totalPieces;
      activeSubtotal += Number(item.lineSubtotal);
      activeGst += Number(item.gstAmount);
    }

    activeSubtotal = roundMoney(activeSubtotal);
    activeGst = roundMoney(activeGst);

    // Shipping is calculated separately and is not included in masterTotal.
    const activeShipping =
      activeItems.length === 0
        ? 0
        : activeSubtotal > FREE_SHIPPING_THRESHOLD
          ? 0
          : activeBillingEntityIds.size * FLAT_SHIPPING;

    // Master total includes only subtotal and GST.
    const activeMasterTotal = roundMoney(
      activeSubtotal + activeGst
    );

    const visibleEstimates = order.estimates.filter((estimate) =>
      activeBillingEntityIds.has(estimate.billingEntityId)
    );

    const data = {
      id: order.id,
      orderNumber: order.orderNumber,
      retailerBusinessName: order.retailerBusinessName,
      retailerApplicantName: order.retailerApplicantName,
      retailerGstin: order.retailerGstin,
      retailerContact: order.retailerContact,
      retailerEmail: order.retailerEmail,

      billingAddress: parseJson(order.billingAddressJson),
      shippingAddress: parseJson(order.shippingAddressJson),

      totalDesigns: activeProductIds.size,
      totalSets: activeSets,
      totalPieces: activePieces,

      subtotal: activeSubtotal,
      totalGst: activeGst,

      // Separate shipping amount.
      shipping: activeShipping,

      // Shipping is excluded from this amount.
      masterTotal: activeMasterTotal,

      status: normalizeStatus(order.status),
      customerRemarks: order.customerRemarks,
      internalNotes: order.internalNotes,

      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),

      items: order.items.map((item) => ({
        ...item,
        pieceRate: toNumber(item.pieceRate),
        setRate: toNumber(item.setRate),
        lineSubtotal: toNumber(item.lineSubtotal),
        gstRate: toNumber(item.gstRate),
        gstAmount: toNumber(item.gstAmount),
        totalWithGst: toNumber(item.totalWithGst),
        vendor:
          vendorByProductId.get(item.productId) ??
          item.product?.vendor ??
          null,
      })),

      estimates: visibleEstimates.map((estimate) => {
        const taxableSubtotal = toNumber(estimate.taxableSubtotal);
        const totalGst = toNumber(estimate.totalGst);

        return {
          id: estimate.id,
          estimateNumber: estimate.estimateNumber,
          orderId: estimate.orderEnquiryId,
          orderNumber: order.orderNumber,
          date: estimate.date.toISOString(),
          validUntil: estimate.validUntil.toISOString(),
          totalSets: estimate.totalSets,
          totalPieces: estimate.totalPieces,
          taxableSubtotal,
          isInterState: estimate.isInterState,
          cgstAmount: toNumber(estimate.cgstAmount),
          sgstAmount: toNumber(estimate.sgstAmount),
          igstAmount: toNumber(estimate.igstAmount),
          totalGst,

          // Shipping remains separate.
          shippingCharge: toNumber(estimate.shippingCharge),

          // Estimate grand total excludes shipping.
          grandTotal: roundMoney(taxableSubtotal + totalGst),

          pdfMediaAssetId: estimate.pdfMediaAssetId,
          billingEntity: estimate.billingEntity,
          paymentTerms: [],
          items: [],
        };
      }),

      timeline: order.history.map((entry) => ({
        id: entry.id,
        status: normalizeStatus(entry.status),
        actorUserId: entry.actorUserId,
        actorName: entry.actorName,
        notes: entry.notes,
        timestamp: entry.createdAt.toISOString(),
      })),

      sellerOrders: order.sellerOrders.map((sellerOrder) => ({
        id: sellerOrder.id,
        vendorId: sellerOrder.vendorId,
        sellerName: sellerOrder.sellerName,
        status: normalizeStatus(sellerOrder.status),
        createdAt: sellerOrder.createdAt.toISOString(),
        updatedAt: sellerOrder.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get retailer order detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load this order.",
      },
      { status: 500 }
    );
  }
}