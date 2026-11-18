import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireVendor } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const guard = await requireVendor(request);

  if ("error" in guard) {
    return NextResponse.json(
      {
        success: false,
        error: guard.error,
      },
      {
        status: guard.status,
      },
    );
  }

  try {
    const status = request.nextUrl.searchParams.get("status") || "pending";

    const requests = await prisma.sellerContactRequest.findMany({
      where: {
        status,

        /*
         * SECURITY:
         *
         * Vendor can ONLY see requests for products
         * that belong to this vendor.
         */
        product: {
          vendorId: guard.vendorProfile.id,
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
                isPrimary: true,
              },
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

        cartSubtotal: Number(item.cartSubtotal),

        createdAt: item.createdAt.toISOString(),

        updatedAt: item.updatedAt.toISOString(),

        reviewedAt: item.reviewedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Get vendor sample call requests error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load sample call requests.",
      },
      { status: 500 },
    );
  }
}
