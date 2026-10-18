import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  subcategoryId: z.string().optional(),
  collectionId: z.string().optional(),
  wholesalePricePerPiece: z.number().positive().optional(),
  piecesPerSet: z.number().int().positive().optional(),
  wholesalePricePerSet: z.number().positive().optional(),
  availableSets: z.number().int().min(0).optional(),
  sizeCombination: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  fabric: z.string().min(1).optional(),
  workType: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  size: z.union([
    z.array(z.string()),
    z.string().transform((s) => (s.trim() ? [s.trim()] : [])),
  ]).optional(),
  clothingType: z.string().min(1).optional(),
  hsnCode: z.string().optional(),
  lining: z.string().trim().max(200).nullable().optional(),
  margin: z.string().trim().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

async function authenticateEither(request: NextRequest) {
  const staffResult = await requireStaff(request);
  if (!("error" in staffResult)) {
    return { kind: "staff" as const, ...staffResult };
  }

  const vendorResult = await requireVendor(request);
  if (!("error" in vendorResult)) {
    return { kind: "vendor" as const, ...vendorResult };
  }

  return { error: "Admin or vendor access required", status: 401 as const };
}

async function assertOwnership(
  productId: string,
  auth: { kind: "staff" | "vendor"; vendorProfile?: { id: string } }
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found", status: 404 as const };

  // A vendor may only touch their own products. Staff may touch any product.
  if (auth.kind === "vendor" && product.vendorId !== auth.vendorProfile?.id) {
    return { error: "You do not have access to this product", status: 403 as const };
  }

  return { product };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateEither(request);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ownership = await assertOwnership(id, auth);
    if ("error" in ownership) {
      return NextResponse.json({ success: false, error: ownership.error }, { status: ownership.status });
    }

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Keep totalAvailablePieces in sync if either input changed
    if (data.availableSets !== undefined || data.piecesPerSet !== undefined) {
      const sets = data.availableSets ?? ownership.product.availableSets;
      const pieces = data.piecesPerSet ?? ownership.product.piecesPerSet;
      updateData.totalAvailablePieces = sets * pieces;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { vendor: { select: { id: true, businessName: true } }, category: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateEither(request);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ownership = await assertOwnership(id, auth);
    if ("error" in ownership) {
      return NextResponse.json({ success: false, error: ownership.error }, { status: ownership.status });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "This product is still referenced by another record and cannot be deleted." },
        { status: 409 }
      );
    }
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}