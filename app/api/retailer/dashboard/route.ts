import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getOrCreateCart, serializeCartFull } from "@/lib/cart-utils";

export const dynamic = "force-dynamic";

const CLOSED_STATUSES = ["COMPLETED", "CANCELLED"] as const;

export async function GET(request: NextRequest) {
  try {
    const guard = await requireRetailer(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const retailerProfileId = guard.retailerProfile.id;
    const orderScope = { retailerProfileId, status: { not: "CANCELLED" as const } };

    const [cart, estimates, activeEnquiries, dispatchedOrders, pendingSampleCalls, categories] =
      await Promise.all([
        getOrCreateCart(retailerProfileId).then((c) => serializeCartFull(c, retailerProfileId)),
        // Estimates on this retailer's non-cancelled orders, with the issuing hub
        prisma.estimate.findMany({
          where: { orderEnquiry: orderScope },
          select: {
            billingEntity: { select: { id: true, tradeName: true, legalName: true, state: true } },
          },
        }),
        prisma.orderEnquiry.count({
          where: { retailerProfileId, status: { notIn: [...CLOSED_STATUSES] } },
        }),
        prisma.orderEnquiry.count({
          where: { retailerProfileId, status: "DISPATCHED" },
        }),
        prisma.sellerContactRequest.count({
          where: { retailerProfileId, status: "pending" },
        }),
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          take: 8,
          select: {
            id: true,
            name: true,
            slug: true,
            mediaAsset: { select: { publicUrl: true } },
          },
        }),
      ]);

    // Distinct billing hubs that have issued estimates to this retailer
    const hubMap = new Map<string, { id: string; name: string; state: string }>();
    for (const e of estimates) {
      const b = e.billingEntity;
      if (!hubMap.has(b.id)) {
        hubMap.set(b.id, { id: b.id, name: b.tradeName || b.legalName, state: b.state });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        retailer: {
          businessName: guard.retailerProfile.businessName,
          applicantName: guard.retailerProfile.applicantName,
          gstin: guard.retailerProfile.gstin,
        },
        cart: {
          totalSets: cart.totalSets,
          totalPieces: cart.totalPieces,
          totalDesigns: cart.totalDesigns,
          subtotal: cart.subtotal,
        },
        moq: {
          isMet: cart.moq.isMet,
          currentSets: cart.moq.currentSets,
          requiredSets: cart.moq.requiredSets,
          overrideApplied: cart.moq.overrideApplied,
        },
        estimatesCount: estimates.length,
        hubs: Array.from(hubMap.values()),
        activeEnquiries,
        dispatchedOrders,
        pendingSampleCalls,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.mediaAsset?.publicUrl ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("Whole Seller dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}