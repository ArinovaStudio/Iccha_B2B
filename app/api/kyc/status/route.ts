import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();

  if (!identifier) {
    return NextResponse.json(
      { success: false, error: "Email or mobile number is required" },
      { status: 400 }
    );
  }

  const isEmail = identifier.includes("@");

  const email = isEmail ? identifier.toLowerCase() : "";
  const mobile = isEmail ? "" : identifier.replace(/\D/g, "");

  if (!isEmail && mobile.length === 0) {
    return NextResponse.json(
      { success: false, error: "Enter a valid email or mobile number" },
      { status: 400 }
    );
  }

  try {
    const retailerProfile = await prisma.retailerProfile.findFirst({
      where: {
        user: {
          OR: [{ email }, { mobile }],
        },
      },
      include: {
        kycApplications: {
          orderBy: { submittedAt: "desc" },
          take: 1,
          include: {
            documents: true,
            activities: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!retailerProfile || retailerProfile.kycApplications.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No application found for this email or mobile number",
        },
        { status: 404 }
      );
    }

    const application = retailerProfile.kycApplications[0];

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        businessName: application.businessName,
        applicantName: application.applicantName,
        mobile: application.mobile,
        gstin: application.gstin,
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        rejectionReason: application.rejectionReason,
        infoRequestNotes: application.infoRequestNotes,
        documents: application.documents.map((d) => ({
          id: d.id,
          name: d.originalFilename,
          type: d.documentType,
          size: `${(d.fileSize / (1024 * 1024)).toFixed(2)} MB`,
        })),
        activities: application.activities.map((a) => ({
          action: a.action,
          notes: a.notes,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("KYC status lookup failed:", error);

    return NextResponse.json(
      { success: false, error: "Failed to retrieve application status" },
      { status: 500 }
    );
  }
}