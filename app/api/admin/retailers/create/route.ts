import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { getStorageService } from "@/lib/services/storageService";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const ALLOWED_DOCUMENT_TYPES = [
  "gst_certificate",
  "pan_card",
  "business_proof",
  "shop_photo",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Every field is optional. Blank strings are normalised to undefined so that
// "optional" inputs left empty in the form never fail validation.
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const createRetailerSchema = z.object({
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toLowerCase() : undefined))
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email"
    ),
  password: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || value.length >= 8,
      "Password must be at least 8 characters"
    ),
  businessName: optionalText,
  applicantName: optionalText,
  mobile: optionalText,
  whatsapp: optionalText,
  gstin: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined))
    .refine(
      (value) => !value || /^[0-9A-Z]{15}$/.test(value),
      "GSTIN must be exactly 15 letters and numbers"
    ),
  pan: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined))
    .refine(
      (value) => !value || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value),
      "Enter a valid PAN, e.g. ABCDE1234F"
    ),
  businessType: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || "boutique"),
  street: optionalText,
  city: optionalText,
  state: optionalText,
  stateCode: optionalText,
  pincode: optionalText,
});

type UploadedDocument = {
  file: File;
  documentType: string;
  storageKey: string;
  bucket: string;
  storageProvider: string;
  publicUrl: string;
};

export async function POST(request: NextRequest) {
  // Authorization is enforced on the server. Vendors and retailers cannot
  // create accounts through this endpoint.
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const uploadedDocuments: UploadedDocument[] = [];
  const storage = getStorageService();

  try {
    const formData = await request.formData();

    const parsed = createRetailerSchema.safeParse({
      email: formData.get("email") ?? undefined,
      password: formData.get("password") ?? undefined,
      businessName: formData.get("businessName") ?? undefined,
      applicantName: formData.get("applicantName") ?? undefined,
      mobile: formData.get("mobile") ?? undefined,
      whatsapp: formData.get("whatsapp") ?? undefined,
      gstin: formData.get("gstin") ?? undefined,
      pan: formData.get("pan") ?? undefined,
      businessType: formData.get("businessType") ?? undefined,
      street: formData.get("street") ?? undefined,
      city: formData.get("city") ?? undefined,
      state: formData.get("state") ?? undefined,
      stateCode: formData.get("stateCode") ?? undefined,
      pincode: formData.get("pincode") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const rawFiles = formData.getAll("files");
    const rawTypes = formData.getAll("documentTypes");

    // KYC documents are optional, but every uploaded file needs a document type.
    if (rawFiles.length !== rawTypes.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Each uploaded KYC document needs a document type.",
        },
        { status: 400 }
      );
    }

    const documents: Array<{ file: File; documentType: string }> = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const documentType = rawTypes[i];

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { success: false, error: "One of the uploaded files is invalid." },
          { status: 400 }
        );
      }

      if (
        typeof documentType !== "string" ||
        !ALLOWED_DOCUMENT_TYPES.includes(documentType)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid KYC document type." },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name}: only JPEG, PNG, WebP and PDF files are allowed.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `${file.name} exceeds the 5 MB file size limit.`,
          },
          { status: 400 }
        );
      }

      documents.push({ file, documentType });
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }
    }

    if (data.gstin) {
      const existingGstin = await prisma.retailerProfile.findUnique({
        where: { gstin: data.gstin },
        select: { id: true },
      });

      if (existingGstin) {
        return NextResponse.json(
          { success: false, error: "This GSTIN is already registered." },
          { status: 409 }
        );
      }
    }

    // Upload the private files first. If the database operation fails,
    // the catch block attempts to remove the uploaded objects.
    for (const document of documents) {
      const uploadResult = await storage.uploadFile(
        Buffer.from(await document.file.arrayBuffer()),
        document.file.name,
        {
          contentType: document.file.type,
          folder: "kyc-documents",
          isPrivate: true,
        }
      );

      uploadedDocuments.push({
        file: document.file,
        documentType: document.documentType,
        storageKey: uploadResult.storageKey,
        bucket: uploadResult.bucket,
        storageProvider: uploadResult.storageProvider,
        publicUrl: uploadResult.publicUrl,
      });
    }

    // The DB requires a password hash. When no password is given, store a hash of
    // a random secret so the account exists but cannot be logged into until an
    // admin sets a real password.
    const passwordHash = await hashPassword(
      data.password ?? randomBytes(24).toString("hex")
    );
    const now = new Date();
    const displayName =
      data.applicantName || data.businessName || data.email || "Wholesaler";
    const hasAddress = Boolean(
      data.street || data.city || data.state || data.stateCode || data.pincode
    );

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: displayName,
          mobile: data.mobile ?? null,
          role: "RETAILER",
          isActive: true,

          retailerProfile: {
            create: {
              businessName: data.businessName ?? "",
              applicantName: data.applicantName ?? "",
              mobile: data.mobile ?? "",
              whatsapp: data.whatsapp ?? null,
              gstin: data.gstin ?? null,
              pan: data.pan ?? null,
              businessType: data.businessType,
              status: "APPROVED",

              // Only create an address row when at least one address field was given.
              ...(hasAddress
                ? {
                    addresses: {
                      create: {
                        type: "billing",
                        street: data.street ?? "",
                        city: data.city ?? "",
                        state: data.state ?? "",
                        stateCode: data.stateCode ?? "",
                        pincode: data.pincode ?? "",
                        isDefault: true,
                      },
                    },
                  }
                : {}),

              kycApplications: {
                create: {
                  gstin: data.gstin ?? null,
                  pan: data.pan ?? null,
                  businessName: data.businessName ?? "",
                  applicantName: data.applicantName ?? "",
                  mobile: data.mobile ?? "",
                  email: data.email ?? null,
                  status: "APPROVED",
                  reviewedByUserId: guard.user.id,
                  reviewedAt: now,

                  activities: {
                    create: [
                      {
                        actorUserId: guard.user.id,
                        actorName: guard.user.name,
                        action: "ADMIN_CREATED",
                        notes: "Whole Seller account created by an authorized staff member.",
                      },
                      {
                        actorUserId: guard.user.id,
                        actorName: guard.user.name,
                        action: "APPROVED",
                        notes: "Approved during admin account creation.",
                      },
                    ],
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

      const profile = user.retailerProfile;
      const application = profile?.kycApplications[0];

      if (!profile || !application) {
        throw new Error("Whole Seller profile or KYC application was not created.");
      }

      for (const document of uploadedDocuments) {
        const mediaAsset = await tx.mediaAsset.create({
          data: {
            storageProvider: document.storageProvider,
            bucket: document.bucket,
            storageKey: document.storageKey,
            publicUrl: document.publicUrl,
            visibility: "PRIVATE",
            mimeType: document.file.type,
            originalFilename: document.file.name,
            fileExtension: document.file.name.split(".").pop() || "",
            sizeBytes: document.file.size,
            mediaType: "KYC_DOCUMENT",
          },
        });

        await tx.kYCDocument.create({
          data: {
            applicationId: application.id,
            documentType: document.documentType,
            mediaAssetId: mediaAsset.id,
            originalFilename: document.file.name,
            fileSize: document.file.size,
            mimeType: document.file.type,
          },
        });
      }

      return {
        userId: user.id,
        profileId: profile.id,
        applicationId: application.id,
      };
    },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Whole Seller account created and approved successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create retailer error:", error);

    // Best-effort cleanup if uploading or the database transaction failed.
    await Promise.all(
      uploadedDocuments.map((document) =>
        storage
          .deleteFile(document.storageKey, document.bucket)
          .catch((cleanupError) => {
            console.error("KYC file cleanup failed:", cleanupError);
            return false;
          })
      )
    );

    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "The email or GSTIN is already registered.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create the retailer account. Please try again.",
      },
      { status: 500 }
    );
  }
}