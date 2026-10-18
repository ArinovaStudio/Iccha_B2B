import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRetailer } from "@/lib/auth/guard";
import { getActiveMoqOverride, getGlobalMoqRule } from "@/lib/moq";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireRetailer(request);
    if ("error" in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    const { user, retailerProfile } = guard;

    const [addresses, override, globalRule, kyc] = await Promise.all([
      prisma.retailerAddress.findMany({
        where: { retailerProfileId: retailerProfile.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      getActiveMoqOverride(prisma, retailerProfile.id),
      getGlobalMoqRule(prisma),
      prisma.kYCApplication.findFirst({
        where: { retailerProfileId: retailerProfile.id },
        orderBy: { submittedAt: "desc" },
        include: {
          documents: { orderBy: { uploadedAt: "asc" } },
          activities: { orderBy: { createdAt: "asc" } },
        },
      }),
    ]);

    const billing = addresses.find((a) => a.type === "billing") ?? addresses[0] ?? null;
    const shipping = addresses.find((a) => a.type === "shipping") ?? billing;

    const pickAddress = (a: typeof billing) =>
      a
        ? {
          street: a.street,
          area: a.area,
          city: a.city,
          state: a.state,
          stateCode: a.stateCode,
          pincode: a.pincode,
          landmark: a.landmark,
        }
        : null;

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          businessName: retailerProfile.businessName,
          applicantName: retailerProfile.applicantName,
          mobile: retailerProfile.mobile,
          whatsapp: retailerProfile.whatsapp,
          email: user.email,
          gstin: retailerProfile.gstin,
          pan: retailerProfile.pan,
          businessType: retailerProfile.businessType,
          yearsInBusiness: retailerProfile.yearsInBusiness,
          status: retailerProfile.status,
        },
        moq: {
          requiredSets: override ? override.permittedMinSets : globalRule.minSets,
          overrideApplied: Boolean(override),
        },
        billingAddress: pickAddress(billing),
        shippingAddress: pickAddress(shipping),
        kyc: kyc
          ? {
            status: kyc.status,
            gstin: kyc.gstin,
            pan: kyc.pan,
            submittedAt: kyc.submittedAt,
            reviewedAt: kyc.reviewedAt,
            rejectionReason: kyc.rejectionReason,
            infoRequestNotes: kyc.infoRequestNotes,
            documents: kyc.documents.map((d) => ({
              id: d.id,
              type: d.documentType,
              name: d.originalFilename,
              sizeMb: Number((d.fileSize / (1024 * 1024)).toFixed(2)),
              uploadedAt: d.uploadedAt,
            })),
            activities: kyc.activities.map((a) => ({
              id: a.id,
              action: a.action,
              notes: a.notes,
              createdAt: a.createdAt,
            })),
          }
          : null,
      },
    });
  } catch (error) {
    console.error("Whole Seller profile error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}