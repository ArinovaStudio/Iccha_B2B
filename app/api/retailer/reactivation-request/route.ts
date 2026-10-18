import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Not logged in",
        },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired or invalid",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        retailerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 }
      );
    }

    if (user.role !== "RETAILER") {
      return NextResponse.json(
        {
          success: false,
          error: "Whole Seller access required",
        },
        { status: 403 }
      );
    }

    if (!user.retailerProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Whole Seller profile not found",
        },
        { status: 404 }
      );
    }

    const retailerProfile = user.retailerProfile;

    if (retailerProfile.status !== "DEACTIVATED") {
      return NextResponse.json(
        {
          success: false,
          error: "Your account is not currently deactivated.",
        },
        { status: 400 }
      );
    }

    /*
     * Check the latest reactivation event.
     *
     * If the latest event is REQUESTED, the request is already pending.
     * If the latest event is REJECTED, the retailer can submit again.
     */
    const latestRequest = await prisma.auditLog.findFirst({
      where: {
        entityType: "RetailerProfile",
        entityId: retailerProfile.id,
        action: {
          in: [
            "RETAILER_REACTIVATION_REQUESTED",
            "RETAILER_REACTIVATION_APPROVED",
            "RETAILER_REACTIVATION_REJECTED",
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (
      latestRequest?.action ===
      "RETAILER_REACTIVATION_REQUESTED"
    ) {
      return NextResponse.json({
        success: true,
        alreadyRequested: true,
        message:
          "Your reactivation request has already been submitted and is waiting for admin review.",
      });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "RETAILER_REACTIVATION_REQUESTED",
        entityType: "RetailerProfile",
        entityId: retailerProfile.id,
        metadataJson: JSON.stringify({
          requestedAt: new Date().toISOString(),
          reason:
            "Whole Seller requested reactivation after automatic inactivity deactivation",
        }),
      },
    });

    console.log(
      "[reactivation-request] created:",
      auditLog.id,
      "retailer:",
      retailerProfile.id
    );

    return NextResponse.json({
      success: true,
      alreadyRequested: false,
      message:
        "Your reactivation request has been submitted successfully. An administrator will review your request.",
      data: {
        requestId: auditLog.id,
        requestedAt: auditLog.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "[reactivation-request] POST failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to submit your reactivation request. Please try again.",
      },
      { status: 500 }
    );
  }
}