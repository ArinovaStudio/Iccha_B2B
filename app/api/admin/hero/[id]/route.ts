import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { HeroService } from "@/lib/services/heroService";
import { requireStaff } from "@/lib/auth/guard";

const updateHeroSlideSchema = z.object({
  internalName: z.string().optional(),
  slideNumber: z.string().optional(),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  desktopImage: z.string().url().optional(),
  mobileImage: z.string().url().optional(),
  imageAlt: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaUrl: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaUrl: z.string().optional(),

  contentPosition: z
    .enum(["left", "right", "center"])
    .optional(),

  textTheme: z
    .enum(["light", "dark"])
    .optional(),

  desktopImagePosition: z.string().optional(),
  mobileImagePosition: z.string().optional(),
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
    .optional(),

  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const auth = await requireStaff(request);

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

  const { id } = await params;

  const slide = await HeroService.getSlideById(id);

  if (!slide) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "HERO_SLIDE_NOT_FOUND",
          message: "Hero slide not found",
        },
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    success: true,
    data: slide,
    error: null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  const auth = await requireStaff(request);

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
    const { id } = await params;
    const body = await request.json();

    const validated = updateHeroSlideSchema.parse(body);

    const slide = await HeroService.updateSlide(
      id,
      validated,
      {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
      }
    );

    if (!slide) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "HERO_SLIDE_NOT_FOUND",
            message: "Hero slide not found",
          },
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: slide,
      error: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid hero slide data",
            details: error.issues,
          },
        },
        {
          status: 400,
        }
      );
    }

    console.error("Hero update error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "HERO_UPDATE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update hero slide",
        },
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  const auth = await requireStaff(request);

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
    const { id } = await params;

    // Permanently delete the hero slide instead of archiving it.
    const deleted = await HeroService.deleteSlide(
      id,
      {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
      }
    );

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "HERO_SLIDE_NOT_FOUND",
            message: "Hero slide not found",
          },
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        deleted: true,
      },
      error: null,
    });
  } catch (error) {
    console.error("Hero deletion error:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "HERO_DELETE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete hero slide",
        },
      },
      {
        status: 500,
      }
    );
  }
}
