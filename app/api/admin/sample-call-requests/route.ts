import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);

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
    const status =
      request.nextUrl.searchParams.get("status") ||
      "pending";

    /*
     * Admin receives requests only for products
     * that don't belong to a vendor.
     *
     * vendorId = null => IcchaStore/Admin owned product
     */
    const requests =
      await prisma.sellerContactRequest.findMany({
        where: {
          status,

          product: {
            vendorId: null,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          product: {
            select: {
              slug: true,
              media: {
                where: {
                  isPrimary: true
                }
              },
              id: true,
              name: true,
              sku: true,
              designNumber: true,
            },
          },

          retailerProfile: {
            select: {
              id: true,
              businessName: true,
              applicantName: true,
              mobile: true,
              whatsapp: true,

              user: {
                select: {
                  email: true,
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
      "Get admin sample call requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not load sample call requests.",
      },
      { status: 500 }
    );
  }
}