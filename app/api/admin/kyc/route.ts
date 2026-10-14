import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const PAGE_SIZE = 20;

function formatApplication(app: any) {
  return {
    id: app.id,
    status: app.status,
    businessName: app.businessName,
    applicantName: app.applicantName,
    mobile: app.mobile,
    email: app.email,
    gstin: app.gstin,
    pan: app.pan,
    socialProof: app.socialProof,
    businessType: app.retailerProfile?.businessType,
    yearsInBusiness: app.retailerProfile?.yearsInBusiness,
    annualTurnover: app.retailerProfile?.annualTurnover,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    rejectionReason: app.rejectionReason,
    infoRequestNotes: app.infoRequestNotes,
    documents: app.documents.map((d: any) => ({
      id: d.id,
      name: d.originalFilename,
      type: d.documentType,
      size: `${(d.fileSize / (1024 * 1024)).toFixed(2)} MB`,
      downloadUrl: `/api/admin/kyc/documents/${d.id}/download`,
    })),
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ("error" in guard) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const id = searchParams.get("id");

  const where = {
    ...(status && status !== "all" ? { status: status as any } : {}),
    ...(search
      ? {
          OR: [
            { businessName: { contains: search, mode: "insensitive" as const } },
            { applicantName: { contains: search, mode: "insensitive" as const } },
            { gstin: { contains: search, mode: "insensitive" as const } },
            { mobile: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  if (id) {
    const application = await prisma.kYCApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        retailerProfile: { select: { businessName: true, businessType: true, yearsInBusiness: true, annualTurnover: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: application ? [formatApplication(application)] : [],
      nextCursor: null,
    });
  }

  const applications = await prisma.kYCApplication.findMany({
    where,
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }, { id: "desc" }], 
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      documents: true,
      retailerProfile: { select: { businessName: true, businessType: true, yearsInBusiness: true, annualTurnover: true } },
    },
  });

  const hasMore = applications.length > PAGE_SIZE;
  const page = hasMore ? applications.slice(0, PAGE_SIZE) : applications;

  return NextResponse.json({
    success: true,
    data: page.map(formatApplication),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}
