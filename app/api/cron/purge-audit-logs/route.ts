import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Audit rows older than this many days are deleted.
const RETENTION_DAYS = 20;

/**
 * Place at: app/api/cron/purge-audit-logs/route.ts
 *
 * Deletes AuditLog rows older than RETENTION_DAYS.
 *
 * RETAILER_REACTIVATION_* rows are intentionally kept: the reactivation
 * workflow reads the latest such row per retailer to decide whether a
 * request is still pending. Purging them would break approve/reject.
 *
 * VPS scheduling (system cron), e.g. daily at 3am:
 *   0 3 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/purge-audit-logs
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        NOT: { action: { startsWith: "RETAILER_REACTIVATION_" } },
      },
    });

    console.log(
      `[cron/purge-audit-logs] deleted ${result.count} rows older than ${RETENTION_DAYS} days`
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("[cron/purge-audit-logs] failed:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}