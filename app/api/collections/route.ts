import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActor } from "@/lib/collection/collection-auth";
import {
  detailSelect,
  fail,
  invalid,
  listSelect,
  parseInput,
  productsAllowed,
  publicWhere,
  toDetail,
  toListItem,
  uniqueSlug,
} from "@/lib/collection/callable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --------------------------------- GET ---------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");

    /* ---- Managed list (Vendor / Admin Dashboard) ---- */
    if (scope === "manage") {
      const actor = await getActor(req);
      if (!actor) return fail("Unauthorized. Please log in.", 401);
      if (!actor.isAdmin && !actor.vendorId) return fail("Forbidden.", 403);

      const where: Prisma.CollectionWhereInput = {};

      if (!actor.isAdmin) {
        // Vendor only sees their own collections
        where.vendorId = actor.vendorId;
      } else {
        // Admin: can filter by vendorId (or platform collections where vendorId is null)
        const vendorFilter = req.nextUrl.searchParams.get("vendorId");
        if (vendorFilter === "platform" || vendorFilter === "admin") {
          where.vendorId = null;
        } else if (vendorFilter && vendorFilter !== "all") {
          where.vendorId = vendorFilter;
        }
      }

      const rows = await prisma.collection.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: listSelect,
      });

      return NextResponse.json({ success: true, data: rows.map(toListItem) });
    }

    /* ---- Public list (Whole Seller / Website Lookbooks) ---- */
    const tag = req.nextUrl.searchParams.get("tag")?.trim();
    const vendorId = req.nextUrl.searchParams.get("vendorId")?.trim();

    const rows = await prisma.collection.findMany({
      where: {
        AND: [
          publicWhere(),
          tag ? { tags: { has: tag } } : {},
          vendorId ? { vendorId } : {},
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 60,
      select: listSelect,
    });

    return NextResponse.json({ success: true, data: rows.map(toListItem) });
  } catch (error) {
    console.error("[collections] GET list failed:", error);
    return fail("Could not load collections.", 500);
  }
}

/* --------------------------------- POST --------------------------------- */

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return fail("Unauthorized. Please log in.", 401);
  if (!actor.isAdmin && !actor.vendorId) return fail("Forbidden.", 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload.", 400);
  }

  const { data, errors } = parseInput(body, false);
  const productIds = data.productIds ?? [];

  if (data.isPublished && productIds.length === 0) {
    errors.push("Add at least one product before publishing this collection");
  }

  if (errors.length) return invalid(errors);

  // Vendor can only create for their own profile. Admin can assign to vendor or leave null.
  const targetVendorId = actor.isAdmin ? (data.vendorId || null) : actor.vendorId;

  const allowed = await productsAllowed(actor, productIds, targetVendorId);
  if (!allowed) {
    return invalid([
      "Some products were not found, are inactive, or do not belong to the selected vendor",
    ]);
  }

  try {
    const slug = await uniqueSlug(data.name!);

    const created = await prisma.collection.create({
      data: {
        slug,
        name: data.name!,
        description: data.description ?? null,
        tags: data.tags ?? [],
        isPublished: data.isPublished ?? false,
        sortOrder: data.sortOrder ?? 0,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        mediaAssetId: data.mediaAssetId ?? null,
        vendorId: targetVendorId,
        createdById: actor.userId,
        products: {
          create: productIds.map((productId, position) => ({
            productId,
            position,
          })),
        },
      },
      select: detailSelect,
    });

    return NextResponse.json(
      { success: true, data: toDetail(created) },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("A collection with a similar name already exists.", 409);
    }
    console.error("[collections] POST failed:", error);
    return fail("Could not create collection.", 500);
  }
}