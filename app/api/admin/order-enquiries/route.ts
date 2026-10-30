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

const itemSelect = {
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
      vendor: { select: { id: true, businessName: true } },
      warehouse: {
        select: { id: true, name: true, city: true, state: true },
      },
    },
  },
} as const;

function serializeItem(item: any) {
  return {
    ...item,
    pieceRate: Number(item.pieceRate),
    setRate: Number(item.setRate),
    lineSubtotal: Number(item.lineSubtotal),
    gstRate: Number(item.gstRate),
    gstAmount: Number(item.gstAmount),
    totalWithGst: Number(item.totalWithGst),
  };
}

function serializeOrder(order: any, items: any[], scoped: boolean) {
  const visibleItems = items.map(serializeItem);
  const subtotal = visibleItems.reduce((s, i) => s + i.lineSubtotal, 0);
  const gst = visibleItems.reduce((s, i) => s + i.gstAmount, 0);
  const total = visibleItems.reduce((s, i) => s + i.totalWithGst, 0);
  const sets = visibleItems.reduce((s, i) => s + i.sets, 0);
  const pieces = visibleItems.reduce((s, i) => s + i.totalPieces, 0);
  const designs = new Set(visibleItems.map(i => i.designNumber)).size;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    retailerBusinessName: order.retailerBusinessName,
    retailerApplicantName: order.retailerApplicantName,
    retailerGstin: order.retailerGstin,
    retailerContact: order.retailerContact,
    retailerEmail: order.retailerEmail,
    customerRemarks: order.customerRemarks,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    totalDesigns: scoped ? designs : order.totalDesigns,
    totalSets: scoped ? sets : order.totalSets,
    totalPieces: scoped ? pieces : order.totalPieces,
    subtotal: scoped ? subtotal : Number(order.subtotal),
    totalGst: scoped ? gst : Number(order.totalGst),
    shipping: scoped ? 0 : Number(order.shipping),
    masterTotal: scoped
  ? roundMoney(total)
  : roundMoney(subtotal + gst),
    items: visibleItems,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const view = searchParams.get("view") || "mine";
    const requestedVendorId = searchParams.get("vendorId");

    let vendorId: string | null = null;
    let house = false;

    if (auth.kind === "vendor") {
      vendorId = auth.vendorProfile.id;
    } else if (view === "vendor") {
      if (!requestedVendorId) {
        return NextResponse.json(
          { success: false, error: "Vendor selection is required." },
          { status: 400 }
        );
      }
      vendorId = requestedVendorId;
    } else {
      house = true;
    }

    const where: any = {};

    if (vendorId) {
      where.items = { some: { product: { vendorId } } };
    } else if (house) {
      where.items = { some: { product: { vendorId: null } } };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { retailerBusinessName: { contains: search, mode: "insensitive" } },
        { retailerApplicantName: { contains: search, mode: "insensitive" } },
      ];
    }

    const itemWhere = vendorId
      ? { product: { vendorId } }
      : house
        ? { product: { vendorId: null } }
        : undefined;

    const orders = await prisma.orderEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        retailerBusinessName: true,
        retailerApplicantName: true,
        retailerGstin: true,
        retailerContact: true,
        retailerEmail: true,
        customerRemarks: true,
        totalDesigns: true,
        totalSets: true,
        totalPieces: true,
        subtotal: true,
        totalGst: true,
        shipping: true,
        masterTotal: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          where: itemWhere,
          orderBy: { id: "asc" },
          select: itemSelect,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: orders.map(o =>
        serializeOrder(
          o,
          o.items,
          Boolean(vendorId)
        )
      ),
      scope: auth.kind === "vendor" ? "vendor" : house ? "house" : "vendor",
      vendorId,
    });
  } catch (error) {
    console.error("Get admin/vendor order enquiries error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load order enquiries." },
      { status: 500 }
    );
  }
}
