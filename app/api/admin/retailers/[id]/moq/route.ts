import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { AuditService } from "@/lib/services/auditService";

const moqSchema = z.object({
  permittedMinSets: z.number().int().min(1).max(50).nullable(), // null = reset to the global default
  reason: z.string().trim().max(300).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const parsed = moqSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const retailer = await prisma.retailerProfile.findUnique({
    where: { id },
    select: { id: true, businessName: true },
  });
  if (!retailer) {
    return NextResponse.json({ success: false, error: "Whole Seller not found" }, { status: 404 });
  }

  const { permittedMinSets, reason } = parsed.data;

  try {
    // Deactivate the old override and create the new one together, so a retailer is never left
    // with zero or two active overrides if something fails half-way.
    await prisma.$transaction(async (tx) => {
      await tx.mOQOverride.updateMany({
        where: { retailerProfileId: id, isUsed: false },
        data: { isUsed: true },
      });

      if (permittedMinSets !== null) {
        await tx.mOQOverride.create({
          data: {
            retailerProfileId: id,
            approvedByUserId: guard.user.id,
            permittedMinSets,
            reason: reason || `Set to ${permittedMinSets} set(s) via admin panel`,
          },
        });
      }
    });

    AuditService.log({
      actorUserId: guard.user.id,
      actorEmail: guard.user.email,
      actorRole: guard.user.role,
      action: permittedMinSets === null ? "MOQ_OVERRIDE_RESET" : "MOQ_OVERRIDE_SET",
      entityType: "RetailerProfile",
      entityId: id,
      metadata: { businessName: retailer.businessName, permittedMinSets, reason: reason ?? null },
    }).catch((e) => console.error("Audit log failed:", e));

    return NextResponse.json({
      success: true,
      data: { moqOverride: permittedMinSets !== null, customMoqSets: permittedMinSets },
    });
  } catch (error) {
    console.error("MOQ override error:", error);
    return NextResponse.json({ success: false, error: "Failed to update retailer MOQ" }, { status: 500 });
  }
}