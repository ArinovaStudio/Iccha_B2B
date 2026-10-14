import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accountType: z.enum(["retailer", "drop_shipper"]).default("retailer"),
  businessName: z.string().min(1, "Business name is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  whatsapp: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  socialProof: z.string().trim().max(200).optional(),
  businessType: z.string().optional(),
  street: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  stateCode: z.string().min(1, "State code is required"),
  pincode: z.string().min(1, "Pincode is required"),
}).superRefine((data, ctx) => {
  if (data.accountType === "retailer" && !data.gstin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "GSTIN is required for a Retailer account",
      path: ["gstin"],
    });
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.applicantName,
        mobile: data.mobile,
        role: "RETAILER",
        retailerProfile: {
          create: {
            businessName: data.businessName,
            applicantName: data.applicantName,
            mobile: data.mobile,
            whatsapp: data.whatsapp,
            gstin: data.accountType === "retailer" ? data.gstin : null,
            pan: data.pan || null,
            businessType: data.accountType === "drop_shipper" ? "drop_shipper" : null,
            addresses: {
              create: {
                type: "billing",
                street: data.street,
                city: data.city,
                state: data.state,
                stateCode: data.stateCode,
                pincode: data.pincode,
                isDefault: true,
              },
            },
            kycApplications: {
              create: {
                gstin: data.gstin || null,
                pan: data.pan || null,
                socialProof: data.accountType === "drop_shipper" ? data.socialProof || null : null,
                businessName: data.businessName,
                applicantName: data.applicantName,
                mobile: data.mobile,
                email: data.email,
                status: "APPLICATION_RECEIVED",
                activities: {
                  create: {
                    actorName: data.applicantName,
                    action: "SUBMITTED",
                    notes: "Application submitted at registration.",
                  },
                },
              },
            },
          },
        },
      },
      include: {
        retailerProfile: {
          include: {
            kycApplications: true,
          },
        },
      },
    });

    // No session cookie here — retailer stays logged out until approved.
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        retailerStatus: user.retailerProfile?.status,
        kycApplicationId: user.retailerProfile?.kycApplications?.[0]?.id,
      },
      message: "Application submitted. You'll be able to log in once it's approved.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}