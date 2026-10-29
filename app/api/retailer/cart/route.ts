import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getOrCreateCart, serializeCartFull } from "@/lib/cart-utils";
import { resolveColor } from "@/lib/cart-colors";

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

const addItemSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID"),
    // Single-line add (products without colours, or one colour).
    sets: z.number().int().min(1, "Must add at least 1 set").optional(),
    selectedSize: z.string().trim().min(1).optional(),
    selectedColor: z.string().trim().min(1).optional(),
    // Multi-colour add: one entry per colour. Colours with 0 sets should simply be omitted.
    colorQuantities: z
      .array(
        z.object({
          color: z.string().trim().min(1),
          sets: z.number().int().min(1, "Each selected colour needs at least 1 set"),
        })
      )
      .min(1)
      .optional(),
  })
  .refine((v) => v.sets !== undefined || v.colorQuantities !== undefined, {
    message: "Provide the quantity to add",
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

  const { productId, selectedSize } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { requiresSize: true } }, sizes: true, vendor: { select: { isActive: true } } },
  });

  if (!product || !product.isActive || (product.vendorId && !product.vendor?.isActive)) {
    return NextResponse.json(
      { success: false, error: "Product not found or unavailable" },
      { status: 404 }
    );
  }

  if (!selectedSize || !selectedSize.trim() || selectedSize === NO_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: "Please select a size before adding this product.",
      },
      { status: 400 }
    );
  }

  const normalizedSize = selectedSize.trim();

  // Validate selected size against product.size (Size Charts) or product.sizes
  if (Array.isArray(product.size) && product.size.length > 0) {
    const inputSizes = normalizedSize.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const valid = inputSizes.every((inSz) =>
      product.size.some((s) => s.toLowerCase() === inSz)
    );
    if (!valid && product.category.requiresSize) {
      const allExistInSizes = inputSizes.every((inSz) =>
        product.sizes.some((s) => s.size.toLowerCase() === inSz)
      );
      if (!allExistInSizes) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more selected sizes are not available for this product.",
          },
          { status: 409 }
        );
      }
    }
  } else if (product.category.requiresSize) {
    const inputSizes = normalizedSize.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const allExistInSizes = inputSizes.every((inSz) =>
      product.sizes.some((s) => s.size.toLowerCase() === inSz)
    );

    if (!allExistInSizes) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected size is not available for this product.",
        },
        { status: 409 }
      );
    }
  }

  // Normalise the request into one line per colour (merging duplicates).
  const requestedLines: { color: string | undefined; sets: number }[] =
    parsed.data.colorQuantities
      ? parsed.data.colorQuantities.map((l) => ({ color: l.color, sets: l.sets }))
      : [{ color: parsed.data.selectedColor, sets: parsed.data.sets! }];

  const lineMap = new Map<string, number>();
  for (const line of requestedLines) {
    const color = resolveColor(product.color, line.color);
    if (color === null) {
      return NextResponse.json(
        {
          success: false,
          error: line.color
            ? `"${line.color}" is not an available colour for this product.`
            : "Please select a colour before adding this product.",
        },
        { status: 400 }
      );
    }
    lineMap.set(color, (lineMap.get(color) ?? 0) + line.sets);
  }
  const lines = Array.from(lineMap, ([color, sets]) => ({ color, sets }));
  const addedSets = lines.reduce((sum, l) => sum + l.sets, 0);

  const cart = await getOrCreateCart(guard.retailerProfile.id);

  // The per-design minimum applies to the TOTAL across all colours of this design (in this size),
  // e.g. min 100 -> 60 red + 30 green + 10 brown is fine.
  const alreadyInCart = cart.items
    .filter((item) => item.productId === productId && item.selectedSize === normalizedSize)
    .reduce((sum, item) => sum + item.sets, 0);

  if (alreadyInCart + addedSets < product.minOrderSets) {
    return NextResponse.json(
      {
        success: false,
        error: `This design has a minimum order of ${product.minOrderSets} set(s) across all colours. You have ${alreadyInCart + addedSets} so far - add at least ${product.minOrderSets - alreadyInCart - addedSets} more.`,
      },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    lines.map((line) => {
      const existingItem = cart.items.find(
        (item) =>
          item.productId === productId &&
          item.selectedSize === normalizedSize &&
          item.selectedColor === line.color
      );
      return existingItem
        ? prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { sets: existingItem.sets + line.sets },
          })
        : prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              sets: line.sets,
              selectedSize: normalizedSize,
              selectedColor: line.color,
            },
          });
    })
  );

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
