import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function getAuth(request: NextRequest) {
  const staff = await requireStaff(request);
  if (!("error" in staff)) return { kind: "staff" as const, ...staff };

  const vendor = await requireVendor(request);
  if (!("error" in vendor)) return { kind: "vendor" as const, ...vendor };

  return { error: "Admin or vendor access required.", status: 401 as const };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuth(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const requestedVendorId = searchParams.get("vendorId");

    const vendorId =
      auth.kind === "vendor"
        ? auth.vendorProfile.id
        : requestedVendorId?.trim() || null;

    const order = await prisma.orderEnquiry.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
        ...(vendorId
          ? {
              items: {
                some: {
                  product: { vendorId },
                },
              },
            }
          : {}),
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
        createdAt: true,
        updatedAt: true,
        items: {
          where: vendorId
            ? { product: { vendorId } }
            : undefined,
          orderBy: { id: "asc" },
          select: {
            id: true,
            productId: true,
            billingEntityId: true,
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
                id: true,
                vendorId: true,
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                    contactName: true,
                  },
                },
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            status: true,
            actorName: true,
            notes: true,
            createdAt: true,
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

    if (vendorId && order.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No products from this vendor are in the order." },
        { status: 403 }
      );
    }

    const items = order.items.map(item => ({
      ...item,
      pieceRate: Number(item.pieceRate),
      setRate: Number(item.setRate),
      lineSubtotal: Number(item.lineSubtotal),
      gstRate: Number(item.gstRate),
      gstAmount: Number(item.gstAmount),
      totalWithGst: Number(item.totalWithGst),
    }));

    const isScoped = Boolean(vendorId);
    const subtotal = items.reduce((s, i) => s + i.lineSubtotal, 0);
    const gst = items.reduce((s, i) => s + i.gstAmount, 0);
    const total = items.reduce((s, i) => s + i.totalWithGst, 0);
    const sets = items.reduce((s, i) => s + i.sets, 0);
    const pieces = items.reduce((s, i) => s + i.totalPieces, 0);
    const designs = new Set(items.map(i => i.designNumber)).size;

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        totalDesigns: isScoped ? designs : order.totalDesigns,
        totalSets: isScoped ? sets : order.totalSets,
        totalPieces: isScoped ? pieces : order.totalPieces,
        subtotal: isScoped ? subtotal : Number(order.subtotal),
        totalGst: isScoped ? gst : Number(order.totalGst),
        shipping: isScoped ? 0 : Number(order.shipping),
        masterTotal: isScoped
  ? roundMoney(total)
  : roundMoney(subtotal + gst),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items,
        history: order.history.map(h => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
        })),
        scope: isScoped ? "vendor" : "admin",
        vendorId,
      },
    });
  } catch (error) {
    console.error("Get order enquiry detail error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load this order." },
      { status: 500 }
    );
  }
}
