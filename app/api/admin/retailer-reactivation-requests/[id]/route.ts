import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid request.",
      },
      { status: 400 }
    );
  }

  const { action, reason } = parsed.data;

  if (action === "REJECT" && !reason) {
    return NextResponse.json(
      {
        success: false,
        error: "A rejection reason is required.",
      },
      { status: 400 }
    );
  }

  try {
    const retailer = await prisma.retailerProfile.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!retailer || retailer.user.role !== "RETAILER") {
      return NextResponse.json(
        {
          success: false,
          error: "Whole Seller not found.",
        },
        { status: 404 }
      );
    }

    if (retailer.status !== "DEACTIVATED") {
      return NextResponse.json(
        {
          success: false,
          error: "This retailer is no longer deactivated.",
        },
        { status: 409 }
      );
    }

    /*
     * Make sure the latest reactivation event is actually a
     * pending request. This prevents an old request from being
     * approved/rejected twice.
     */
    const latestReactivationEvent =
      await prisma.auditLog.findFirst({
        where: {
          entityType: "RetailerProfile",
          entityId: retailer.id,
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
      !latestReactivationEvent ||
      latestReactivationEvent.action !==
      "RETAILER_REACTIVATION_REQUESTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "There is no pending reactivation request for this retailer.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    if (action === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        await tx.retailerProfile.update({
          where: {
            id: retailer.id,
          },
          data: {
            status: "APPROVED",
            lastActivityAt: now,
            deactivatedAt: null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: guard.user.id,
            actorEmail: guard.user.email,
            actorRole: guard.user.role,
            action: "RETAILER_REACTIVATION_APPROVED",
            entityType: "RetailerProfile",
            entityId: retailer.id,
            metadataJson: JSON.stringify({
              businessName: retailer.businessName,
              approvedAt: now.toISOString(),
              previousStatus: "DEACTIVATED",
              newStatus: "APPROVED",
            }),
          },
        });
      });

      return NextResponse.json({
        success: true,
        action: "APPROVE",
        message: `${retailer.businessName} has been reactivated successfully.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      /*
       * Keep the retailer DEACTIVATED.
       */
      await tx.retailerProfile.update({
        where: {
          id: retailer.id,
        },
        data: {
          status: "DEACTIVATED",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: guard.user.id,
          actorEmail: guard.user.email,
          actorRole: guard.user.role,
          action: "RETAILER_REACTIVATION_REJECTED",
          entityType: "RetailerProfile",
          entityId: retailer.id,
          metadataJson: JSON.stringify({
            businessName: retailer.businessName,
            rejectedAt: now.toISOString(),
            reason,
            status: "DEACTIVATED",
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      action: "REJECT",
      message: `${retailer.businessName}'s reactivation request was rejected.`,
    });
  } catch (error) {
    console.error(
      "[admin/retailer-reactivation-requests] PATCH failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process the reactivation request.",
      },
      { status: 500 }
    );
  }
}