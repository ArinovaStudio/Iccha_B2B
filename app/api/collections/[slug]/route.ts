import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/collection/collection-auth";
import {
  canManage,
  detailSelect,
  fail,
  invalid,
  parseInput,
  productsAllowed,
  publicWhere,
  toDetail,
} from "@/lib/collection/callable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/* --------------------------------- GET ---------------------------------- */

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug: identifier } = await context.params;
    if (!identifier) return fail("Collection identifier required.", 400);

    const decoded = decodeURIComponent(identifier);

    // Fetch collection by slug or ID
    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ slug: decoded }, { id: decoded }],
      },
      select: detailSelect,
    });

    if (!collection) return fail("Collection not found.", 404);

    // If published, it is viewable
    if (collection.isPublished) {
      return NextResponse.json({ success: true, data: toDetail(collection) });
    }

    // If draft/unpublished, only authorized admin or owning vendor can view
    const actor = await getActor(req);
    if (!actor) return fail("Please log in to view this collection.", 401);
    if (!canManage(actor, collection.vendorId)) {
      return fail("This collection is not currently published.", 404);
    }

    return NextResponse.json({ success: true, data: toDetail(collection) });
  } catch (error) {
    console.error("[collections] GET item failed:", error);
    return fail("Could not load collection.", 500);
  }
}

/* --------------------------------- PATCH -------------------------------- */

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { slug: identifier } = await context.params;
    if (!identifier) return fail("Collection identifier required.", 400);

    const actor = await getActor(req);
    if (!actor) return fail("Unauthorized. Please log in.", 401);

    const decoded = decodeURIComponent(identifier);

    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ slug: decoded }, { id: decoded }],
      },
      select: {
        id: true,
        slug: true,
        vendorId: true,
        isPublished: true,
        _count: { select: { products: true } },
      },
    });

    if (!existing) return fail("Collection not found.", 404);
    if (!canManage(actor, existing.vendorId)) return fail("Forbidden.", 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return fail("Invalid JSON payload.", 400);
    }

    const { data, errors } = parseInput(body, true);

    const count = data.productIds ? data.productIds.length : existing._count.products;
    const willBePublished = data.isPublished !== undefined ? data.isPublished : existing.isPublished;

    if (willBePublished && count === 0) {
      errors.push("Add at least one product before publishing this collection");
    }

    if (errors.length) return invalid(errors);

    const targetVendorId =
      actor.isAdmin && data.vendorId !== undefined ? data.vendorId : existing.vendorId;

    if (data.productIds) {
      const allowed = await productsAllowed(actor, data.productIds, targetVendorId);
      if (!allowed) {
        return invalid([
          "Some products were not found, are inactive, or do not belong to the selected vendor",
        ]);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.startAt !== undefined) updateData.startAt = data.startAt;
    if (data.endAt !== undefined) updateData.endAt = data.endAt;
    if (data.mediaAssetId !== undefined) updateData.mediaAssetId = data.mediaAssetId;
    if (actor.isAdmin && data.vendorId !== undefined) updateData.vendorId = data.vendorId;

    if (data.productIds) {
      updateData.products = {
        deleteMany: {},
        create: data.productIds.map((productId, position) => ({
          productId,
          position,
        })),
      };
    }

    const updated = await prisma.collection.update({
      where: { id: existing.id },
      data: updateData,
      select: detailSelect,
    });

    return NextResponse.json({ success: true, data: toDetail(updated) });
  } catch (error) {
    console.error("[collections] PATCH failed:", error);
    return fail("Could not update collection.", 500);
  }
}

/* -------------------------------- DELETE -------------------------------- */

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { slug: identifier } = await context.params;
    if (!identifier) return fail("Collection identifier required.", 400);

    const actor = await getActor(req);
    if (!actor) return fail("Unauthorized. Please log in.", 401);

    const decoded = decodeURIComponent(identifier);

    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ slug: decoded }, { id: decoded }],
      },
      select: {
        id: true,
        vendorId: true,
      },
    });

    if (!existing) return fail("Collection not found.", 404);
    if (!canManage(actor, existing.vendorId)) return fail("Forbidden.", 403);

    await prisma.collection.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Collection deleted successfully." });
  } catch (error) {
    console.error("[collections] DELETE failed:", error);
    return fail("Could not delete collection.", 500);
  }
}
