
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "");

const createVendorSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  name: z
    .string()
    .trim()
    .min(1, "Account holder name is required"),

  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 10,
      "Enter a valid mobile number with at least 10 digits"
    ),

  businessName: z
    .string()
    .trim()
    .min(1, "Business name is required"),

  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .length(15, "GSTIN must contain exactly 15 characters")
    .regex(
      /^[A-Z0-9]{15}$/,
      "GSTIN must contain only letters and numbers"
    ),

  pan: z
    .string()
    .trim()
    .toUpperCase()
    .length(10, "PAN must contain exactly 10 characters")
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      "Enter a valid PAN format, e.g. ABCDE1234F"
    ),

  address: z
    .string()
    .trim()
    .min(1, "Address is required"),

  city: z
    .string()
    .trim()
    .min(1, "City is required"),

  state: z
    .string()
    .trim()
    .min(1, "State is required"),

  stateCode: z
    .string()
    .trim()
    .min(1, "State code is required"),

  bankName: optionalText,
  accountHolder: optionalText,
  accountNumber: optionalText,
  ifsc: optionalText,
  branch: optionalText,
  upiId: optionalText,
});

export async function POST(request: NextRequest) {
  // Only authorized staff can create vendors.
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      {
        success: false,
        error: guard.error,
      },
      { status: guard.status }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const parsed = createVendorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid vendor details.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const passwordHash = await hashPassword(data.password);

    const created = await prisma.$transaction(async (tx) => {
      // Create an active user with the VENDOR role.
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          mobile: data.mobile,
          role: "VENDOR",
          isActive: true,
        },
      });

      // Create an active vendor profile.
      const vendor = await tx.vendorProfile.create({
        data: {
          vendorCode: `VEN-${user.id}`,
          userId: user.id,
          businessName: data.businessName,

          // The form no longer asks for Contact Name.
          // Retain compatibility if the existing Prisma field is required.
          contactName: data.name,

          mobile: data.mobile,
          gstin: data.gstin,
          pan: data.pan,

          address: data.address,
          city: data.city,
          state: data.state,
          stateCode: data.stateCode,

          bankName: data.bankName || null,
          accountHolder: data.accountHolder || null,
          accountNumber: data.accountNumber || null,
          ifsc: data.ifsc || null,
          branch: data.branch || null,
          upiId: data.upiId || null,

          isActive: true,
        },
      });

      // Create the vendor's billing entity in the same transaction.
      await tx.billingEntity.create({
        data: {
          code: `vendor:${vendor.vendorCode}`,

          legalName: vendor.businessName,
          tradeName: vendor.businessName,

          gstin: vendor.gstin,
          pan: vendor.pan || "",

          state: vendor.state,
          stateCode: vendor.stateCode,

          registeredAddress: [
            vendor.address,
            vendor.city,
            vendor.state,
          ]
            .filter(Boolean)
            .join(", "),

          contactEmail: user.email,
          contactPhone: vendor.mobile,

          bankName: vendor.bankName || "",
          accountHolder: vendor.accountHolder || "",
          accountNumber: vendor.accountNumber || "",
          ifsc: vendor.ifsc || "",
          branch: vendor.branch || "",
          upiId: vendor.upiId || null,

          isActive: true,
          estimatePrefix: `EST-${vendor.vendorCode}-`,
          invoicePrefix: vendor.invoicePrefix,
          defaultGstRate: vendor.defaultGstRate,
        },
      });

      return {
        id: user.id,
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        email: user.email,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor account created and activated successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = String(error.meta?.target ?? "").toLowerCase();

      let message = "One of these values is already in use.";

      if (target.includes("email")) {
        message = "An account with this email already exists.";
      } else if (target.includes("gstin")) {
        message = "This GSTIN is already registered to another vendor.";
      } else if (target.includes("vendorcode")) {
        message = "A vendor with this vendor code already exists.";
      }

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 409 }
      );
    }

    console.error("Create vendor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create vendor account. Please try again.",
      },
      { status: 500 }
    );
  }
}
