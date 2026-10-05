import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getOrCreateCart, serializeCartFull } from "@/lib/cart-utils";

export async function GET(request: NextRequest) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const cart = await getOrCreateCart(guard.retailerProfile.id);
  const data = await serializeCartFull(cart, guard.retailerProfile.id);
  return NextResponse.json({ success: true, data });
}

const NO_SIZE = "__NO_SIZE__";

const addItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  sets: z.number().int().min(1, "Must add at least 1 set"),
  selectedSize: z.string().trim().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const body = await request.json();
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { productId, sets, selectedSize } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { requiresSize: true } }, sizes: true },
  });

  if (!product || !product.isActive) {
    return NextResponse.json(
      { success: false, error: "Product not found or unavailable" },
      { status: 404 }
    );
  }

  const normalizedSize = selectedSize?.trim() || NO_SIZE;

  // Keep size-selection validation, but do not limit cart quantities by stock.
  if (product.category.requiresSize) {
    if (!selectedSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a size before adding this product.",
        },
        { status: 400 }
      );
    }

    const sizeRow = product.sizes.find(
      (row) =>
        row.size.toLowerCase() === selectedSize.trim().toLowerCase()
    );

    if (!sizeRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected size is not available for this product.",
        },
        { status: 409 }
      );
    }
  } else if (selectedSize) {
    return NextResponse.json(
      {
        success: false,
        error: "This product does not require size selection.",
      },
      { status: 400 }
    );
  }

  const cart = await getOrCreateCart(guard.retailerProfile.id);
  const existingItem = cart.items.find(
    (item) =>
      item.productId === productId &&
      item.selectedSize === normalizedSize
  );

  if (existingItem) {
    // Allow increasing the quantity without checking available stock.
    const newSets = existingItem.sets + sets;

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { sets: newSets },
    });
  } else {
    // Preserve the vendor/admin-defined minimum for each new product line.
    if (sets < product.minOrderSets) {
      return NextResponse.json(
        {
          success: false,
          error: `This product has a minimum order of ${product.minOrderSets} set(s). Please add at least ${product.minOrderSets} set(s).`,
        },
        { status: 400 }
      );
    }

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        sets,
        selectedSize: normalizedSize,
      },
    });
  }

  // Adding to cart counts as meaningful activity — reset the inactivity clock.
  await prisma.retailerProfile.update({
    where: { id: guard.retailerProfile.id },
    data: { lastActivityAt: new Date() },
  });

  const updatedCart = await getOrCreateCart(guard.retailerProfile.id);
  const data = await serializeCartFull(
    updatedCart,
    guard.retailerProfile.id
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireRetailer(request);
  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const cart = await getOrCreateCart(guard.retailerProfile.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const updatedCart = await getOrCreateCart(guard.retailerProfile.id);
  const data = await serializeCartFull(
    updatedCart,
    guard.retailerProfile.id
  );

  return NextResponse.json({ success: true, data });
}
