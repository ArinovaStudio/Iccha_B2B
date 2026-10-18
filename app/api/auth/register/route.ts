import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

// Same rules as the login route, so a saved mobile number always matches what
// the retailer types into the login form.
function isPhoneFormat(value: string): boolean {
  const digitsOnly = value.replace(/[\s\-()]/g, "");
  return /^\+?\d{7,15}$/.test(digitsOnly);
}

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

const registerSchema = z.object({
  // Email is optional now; an empty string counts as "not provided"
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  // Optional: when blank, the mobile number becomes the password
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  accountType: z.enum(["retailer", "drop_shipper"]).default("retailer"),
  businessName: z.string().min(1, "Business name is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  mobile: z.string().trim().refine(isPhoneFormat, "Enter a valid mobile number"),
  whatsapp: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  socialProof: z.string().trim().max(200).optional(),
  businessType: z.string().optional(),
  // Address details are no longer collected at signup (collected at checkout)
  street: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().min(1, "State is required"),
  stateCode: z.string().min(1, "State code is required"),
  pincode: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  if (data.accountType === "retailer" && !data.gstin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "GSTIN is required for a Whole Seller account",
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

    const email = data.email ? data.email.toLowerCase() : null;
    const mobile = normalizePhone(data.mobile);
    // The mobile number doubles as the WhatsApp number unless one is given
    const whatsapp = data.whatsapp ? normalizePhone(data.whatsapp) : mobile;

    // Duplicate check on mobile, and on email when one was provided
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ mobile }, ...(email ? [{ email }] : [])],
      },
      select: { email: true, mobile: true },
    });

    if (existingUser) {
      const emailTaken = email && existingUser.email === email;
      return NextResponse.json(
        {
          success: false,
          error: emailTaken
            ? "An account with this email already exists"
            : "An account with this mobile number already exists",
        },
        { status: 409 }
      );
    }

    // No password given -> use the last 10 digits of the mobile number
    const mobileDigits = mobile.replace(/\D/g, "");
    const plainPassword = data.password || mobileDigits.slice(-10);
    if (plainPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Enter a password of at least 8 characters, or a longer mobile number" },
        { status: 400 }
      );
    }
    const passwordHash = await hashPassword(plainPassword);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: data.applicantName,
        mobile,
        role: "RETAILER",
        retailerProfile: {
          create: {
            businessName: data.businessName,
            applicantName: data.applicantName,
            mobile,
            whatsapp,
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
                mobile,
                email,
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
        mobile: user.mobile,
        retailerStatus: user.retailerProfile?.status,
        kycApplicationId: user.retailerProfile?.kycApplications?.[0]?.id,
      },
      message: "Application submitted. You'll be able to log in once it's approved.",
    });
  } catch (error: any) {
    // Two people submitting the same number/email at the same moment
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "An account with these details already exists" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}