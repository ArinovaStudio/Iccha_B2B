import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getAllowSampleOrders } from "@/lib/moq";


const createSchema = z.object({
  productId: z.string().uuid(),

  customerName: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(150),

  mobile: z.string().trim().min(7).max(20),

  whatsapp: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .optional()
    .or(z.literal("")),

  preferredDate: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("")),

  preferredTime: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("")),

  remarks: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const guard = await requireRetailer(request);

  if ("error" in guard) {
    return NextResponse.json(
      {
        success: false,
        error: guard.error,
      },
      {
        status: guard.status,
      }
    );
  }

  try {
    if (!(await getAllowSampleOrders(prisma))) {
      return NextResponse.json(
        { success: false, error: "Sample and video-call requests are currently unavailable." },
        { status: 403 }
      );
    }
    const body = createSchema.parse(await request.json());


    const product = await prisma.product.findFirst({
      where: {
        id: body.productId,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        sku: true,
        designNumber: true,

        piecesPerSet: true,
        wholesalePricePerSet: true,

        vendorId: true,

        vendor: {
          select: {
            id: true,
            businessName: true,
            userId: true,
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found or inactive.",
        },
        { status: 404 }
      );
    }

    /*
     * Product belongs to a vendor, but vendor is inactive.
     */
    if (
      product.vendorId &&
      (!product.vendor || !product.vendor.isActive)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The vendor for this product is currently unavailable.",
        },
        { status: 409 }
      );
    }

    /*
     * Don't allow multiple pending requests for the
     * same retailer + product.
     */
    const existing =
      await prisma.sellerContactRequest.findFirst({
        where: {
          retailerProfileId: guard.retailerProfile.id,
          productId: product.id,
          status: "pending",
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have a pending sample call request for this product.",
          requestId: existing.id,
        },
        { status: 409 }
      );
    }

    /*
     * Vendor-owned product:
     *
     * assignedToUserId = vendor's User ID
     *
     * Admin-owned product:
     *
     * vendorId = null
     * assignedToUserId remains null
     * and the request enters the admin queue.
     */
    const created =
      await prisma.sellerContactRequest.create({
        data: {
          retailerProfileId:
            guard.retailerProfile.id,

          productId: product.id,

          customerName: body.customerName,
          businessName: body.businessName,

          mobile: body.mobile,
          whatsapp: body.whatsapp || null,

          totalDesigns: 1,
          totalSets: 1,
          totalPieces: product.piecesPerSet,

          cartSubtotal:
            product.wholesalePricePerSet,

          preferredDate:
            body.preferredDate || null,

          preferredTime:
            body.preferredTime || null,

          remarks: body.remarks || null,

          status: "pending",

          assignedToUserId:
            product.vendor?.userId ?? null,
        },

        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              designNumber: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        data: {
          id: created.id,
          status: created.status,
          product: created.product,
          createdAt:
            created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data.",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error(
      "Create sample call request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not submit the sample call request.",
      },
      { status: 500 }
    );
  }
}

/*
 * Whole Seller can see their own requests.
 *
 * This is what lets the retailer see:
 *
 * pending
 * approved
 * rejected + rejectionReason
 */
export async function GET(request: NextRequest) {
  const guard = await requireRetailer(request);

  if ("error" in guard) {
    return NextResponse.json(
      {
        success: false,
        error: guard.error,
      },
      {
        status: guard.status,
      }
    );
  }

  try {
    const requests =
      await prisma.sellerContactRequest.findMany({
        where: {
          retailerProfileId:
            guard.retailerProfile.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              designNumber: true,

              vendor: {
                select: {
                  id: true,
                  businessName: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      data: requests.map((item) => ({
        ...item,

        cartSubtotal:
          Number(item.cartSubtotal),

        createdAt:
          item.createdAt.toISOString(),

        updatedAt:
          item.updatedAt.toISOString(),

        reviewedAt:
          item.reviewedAt?.toISOString() ??
          null,
      })),
    });
  } catch (error) {
    console.error(
      "Get retailer sample call requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not load your sample call requests.",
      },
      { status: 500 }
    );
  }
}