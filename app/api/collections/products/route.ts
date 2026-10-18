import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/collection/collection-auth";
import { fail } from "@/lib/collection/callable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await getActor(req);
    if (!actor) return fail("Unauthorized. Please log in.", 401);
    if (!actor.isAdmin && !actor.vendorId) return fail("Forbidden.", 403);

    const search = req.nextUrl.searchParams.get("search")?.trim();
    const vendorParam = req.nextUrl.searchParams.get("vendorId");

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Strict vendor scoping:
    if (!actor.isAdmin) {
      // Vendor CANNOT see or pick any other vendor's products
      where.vendorId = actor.vendorId;
    } else if (vendorParam) {
      // Admin scoping to a specific vendor (or platform if 'platform' or 'admin')
      if (vendorParam === "platform" || vendorParam === "admin") {
        where.vendorId = null;
      } else {
        where.vendorId = vendorParam;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { designNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        name: true,
        sku: true,
        designNumber: true,
        wholesalePricePerSet: true,
        piecesPerSet: true,
        availableSets: true,
        vendorId: true,
        vendor: {
          select: {
            businessName: true,
          },
        },
        media: {
          where: { mediaType: { not: "VIDEO" }, mediaAsset: { visibility: "PUBLIC" } },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: {
            mediaAsset: {
              select: {
                publicUrl: true,
              },
            },
          },
        },
      },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      designNumber: p.designNumber,
      wholesalePricePerSet: Number(p.wholesalePricePerSet),
      piecesPerSet: p.piecesPerSet,
      availableSets: p.availableSets,
      vendorId: p.vendorId,
      vendorName: p.vendor?.businessName ?? null,
      image: p.media[0]?.mediaAsset?.publicUrl ?? null,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[collections/products] search failed:", error);
    return fail("Could not search products.", 500);
  }
}
