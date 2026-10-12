import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getOrCreateCart, serializeCartFull } from "@/lib/cart-utils";
import { NO_COLOR } from "@/lib/cart-colors";

const NO_SIZE = "__NO_SIZE__";

const updateSchema = z.object({
  sets: z
    .number()
    .int()
    .min(1, "Must have at least 1 set — use DELETE to remove the item"),
  selectedSize: z.string().trim().optional(),
  selectedColor: z.string().trim().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { productId } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { sets } = parsed.data;
  const selectedSize = parsed.data.selectedSize?.trim() || NO_SIZE;
  const selectedColor = parsed.data.selectedColor?.trim() || NO_COLOR;

  const cart = await prisma.cart.findUnique({
    where: { retailerProfileId: guard.retailerProfile.id },
  });

  if (!cart) {
    return NextResponse.json(
      { success: false, error: "Cart is empty" },
      { status: 404 }
    );
  }

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, selectedSize, selectedColor },
    include: {
      product: {
        include: {
          category: { select: { requiresSize: true } },
          sizes: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found in your cart" },
      { status: 404 }
    );
  }

  // The per-design minimum applies to the total across all colours of this design (in this size),
  // so one colour may drop below it as long as the combined total still meets it.
  const siblings = await prisma.cartItem.findMany({
    where: { cartId: cart.id, productId, selectedSize, NOT: { id: item.id } },
    select: { sets: true },
  });
  const otherColorSets = siblings.reduce((sum, row) => sum + row.sets, 0);
  if (otherColorSets + sets < item.product.minOrderSets) {
    return NextResponse.json(
      {
        success: false,
        error: `This design has a minimum order of ${item.product.minOrderSets} set(s) across all colours. Add more to another colour first, or remove the item instead.`,
      },
      { status: 400 }
    );
  }

  // Intentionally do not validate the requested quantity against stock.
  // Stock limits are not enforced when changing cart quantities.
  await prisma.cartItem.update({
    where: { id: item.id },
    data: { sets },
  });

  // Updating cart quantity counts as meaningful activity — reset the inactivity clock.
  await prisma.retailerProfile.update({
    where: { id: guard.retailerProfile.id },
    data: { lastActivityAt: new Date() },
  });

  const updatedCart = await getOrCreateCart(guard.retailerProfile.id);
  const data = await serializeCartFull(
    updatedCart,
    guard.retailerProfile.id
  );

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { productId } = await params;
  const { searchParams } = new URL(request.url);
  const selectedSize = searchParams.get("selectedSize")?.trim() || NO_SIZE;
  const selectedColor = searchParams.get("selectedColor")?.trim() || NO_COLOR;

  const cart = await prisma.cart.findUnique({
    where: { retailerProfileId: guard.retailerProfile.id },
  });

  if (!cart) {
    return NextResponse.json(
      { success: false, error: "Cart is empty" },
      { status: 404 }
    );
  }

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, selectedSize, selectedColor },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found in your cart" },
      { status: 404 }
    );
  }

  await prisma.cartItem.delete({ where: { id: item.id } });

  const updatedCart = await getOrCreateCart(guard.retailerProfile.id);
  const data = await serializeCartFull(
    updatedCart,
    guard.retailerProfile.id
  );

  return NextResponse.json({ success: true, data });
}