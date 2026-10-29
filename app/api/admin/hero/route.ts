import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { HeroService } from "@/lib/services/heroService";
import { requireStaff } from "@/lib/auth/guard";

const createHeroSlideSchema = z.object({
  internalName: z.string().min(1),

  eyebrow: z.string().min(1),

  title: z.string().min(1),

  description: z.string().min(1),

  desktopImage: z.string().url(),

  mobileImage: z.string().url().optional(),
  desktopAssetId: z.string().optional(),
  mobileAssetId: z.string().optional(),

  imageAlt: z.string().min(1),

  primaryCtaLabel: z.string().min(1),

  primaryCtaUrl: z.string().min(1),

  secondaryCtaLabel: z.string().optional(),

  secondaryCtaUrl: z.string().optional(),

  contentPosition: z
    .enum(["left", "right", "center"])
    .default("left"),

  textTheme: z
    .enum(["light", "dark"])
    .default("light"),

  desktopImagePosition: z
    .string()
    .default("center 25%"),

  mobileImagePosition: z
    .string()
    .default("60% 20%"),

  productId: z.string().optional(),

  categoryId: z.string().optional(),

  collectionId: z.string().optional(),

  fabricTags: z
    .array(z.string())
    .optional(),

  editorialBadge: z.string().optional(),

  navLabel: z.string().optional(),

  sortOrder: z.number().int().optional(),

  status: z
    .enum([
      "PUBLISHED",
      "DRAFT",
      "SCHEDULED",
      "ARCHIVED",
    ])
    .default("DRAFT"),

  startAt: z
    .string()
    .nullable()
    .optional(),

  endAt: z
    .string()
    .nullable()
    .optional(),
});

export async function GET(
  request: NextRequest
) {
  const auth =
    await requireStaff(request);

  if ("error" in auth) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: auth.error,
      },
      {
        status: auth.status,
      }
    );
  }

  try {
    const slides =
      await HeroService.getAllAdminSlides();

    return NextResponse.json({
      success: true,
      data: slides,
      meta: {
        total: slides.length,
      },
      error: null,
    });
  } catch (error) {
    console.error(
      "Admin hero GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "HERO_FETCH_FAILED",
          message:
            "Failed to retrieve hero slides",
        },
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  const auth =
    await requireStaff(request);

  if ("error" in auth) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: auth.error,
      },
      {
        status: auth.status,
      }
    );
  }

  try {
    const body =
      await request.json();

    const validated =
      createHeroSlideSchema.parse(body);

    const slide =
      await HeroService.createSlide(
        validated,
        {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        }
      );

    return NextResponse.json(
      {
        success: true,
        data: slide,
        error: null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Invalid hero slide submission",
            details: error.issues,
          },
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "Admin hero POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "HERO_CREATION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create hero slide",
        },
      },
      {
        status: 500,
      }
    );
  }
}
