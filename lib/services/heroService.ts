import { prisma } from "@/lib/db";
import { AuditService } from "@/lib/services/auditService";
import {
  CreateHeroSlideDTO,
  HeroSlide,
  HeroSliderConfig,
} from "@/lib/types/hero";
import {
  HeroContentPosition,
  HeroSlideStatus,
  HeroTextTheme,
  Prisma,
} from "@prisma/client";
import { HERO_SLIDER_CONFIG } from "@/lib/data/heroData";
type Actor = {
  id?: string;
  email?: string;
  role?: string;
};
function parseFabricTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}
function mapHeroSlide(slide: any): HeroSlide {
  return {
    id: slide.id,
    internalName: slide.internalName,
    slideNumber: slide.slideNumber,
    navLabel: slide.navLabel,
    eyebrow: slide.eyebrow,
    title: slide.title,
    description: slide.description,
    desktopImage:
      slide.desktopAsset?.publicUrl ||
      slide.desktopImageUrl,
    mobileImage:
      slide.mobileAsset?.publicUrl ||
      slide.mobileImageUrl ||
      slide.desktopAsset?.publicUrl ||
      slide.desktopImageUrl,
    imageAlt: slide.imageAlt,
    primaryCTA: {
      label: slide.primaryCtaLabel,
      href: slide.primaryCtaUrl,
    },
    secondaryCTA: slide.secondaryCtaLabel
      ? {
          label: slide.secondaryCtaLabel,
          href: slide.secondaryCtaUrl || "/register",
        }
      : undefined,
    contentPosition: slide.contentPosition.toLowerCase() as
      | "left"
      | "right"
      | "center",
    textTheme: slide.textTheme.toLowerCase() as
      | "light"
      | "dark",
    desktopImagePosition: slide.desktopImagePosition,
    mobileImagePosition: slide.mobileImagePosition,
    productId: slide.linkedProductId || undefined,
    categoryId: slide.linkedCategoryId || undefined,
    collectionId: slide.linkedCollectionId || undefined,
    fabricTags: parseFabricTags(slide.fabricTagsJson),
    editorialBadge: slide.editorialBadge || undefined,
    sortOrder: slide.sortOrder,
    status: slide.status,
    startAt: slide.startAt?.toISOString() || null,
    endAt: slide.endAt?.toISOString() || null,
    publishedAt: slide.publishedAt?.toISOString() || null,
    updatedAt: slide.updatedAt?.toISOString(),
  };
}
function serializeSlide(slide: any): HeroSlide {
  return mapHeroSlide(slide);
}
const heroInclude = {
  desktopAsset: true,
  mobileAsset: true,
} satisfies Prisma.HeroSlideInclude;
export class HeroService {
  /**
   * Public hero slides.
   *
   * Only PUBLISHED slides inside their scheduling window
   * are returned.
   */
  static async getHeroSlides(): Promise<HeroSlide[]> {
    const now = new Date();
    const slides = await prisma.heroSlide.findMany({
      where: {
        status: HeroSlideStatus.PUBLISHED,
        AND: [
          {
            OR: [
              { startAt: null },
              { startAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
        ],
      },
      include: heroInclude,
      orderBy: {
        sortOrder: "asc",
      },
    });
    return slides.map(serializeSlide);
  }
  /**
   * Hero slider configuration.
   *
   * Stored in SiteSetting so it survives deployments.
   */
  static async getHeroConfig(): Promise<HeroSliderConfig> {
    const setting = await prisma.siteSetting.findUnique({
      where: {
        key: "hero_slider_config",
      },
    });
    if (!setting) {
      return HERO_SLIDER_CONFIG;
    }
    try {
      return {
        ...HERO_SLIDER_CONFIG,
        ...JSON.parse(setting.value),
      };
    } catch {
      return HERO_SLIDER_CONFIG;
    }
  }
  /**
   * Admin: all slides.
   */
  static async getAllAdminSlides(): Promise<HeroSlide[]> {
    const slides = await prisma.heroSlide.findMany({
      include: heroInclude,
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
    return slides.map(serializeSlide);
  }
  /**
   * Admin: single slide.
   */
  static async getSlideById(
    id: string
  ): Promise<HeroSlide | null> {
    const slide = await prisma.heroSlide.findUnique({
      where: {
        id,
      },
      include: heroInclude,
    });
    if (!slide) {
      return null;
    }
    return serializeSlide(slide);
  }
  /**
   * Create hero slide.
   */
  static async createSlide(
    dto: CreateHeroSlideDTO,
    actor: Actor = {}
  ): Promise<HeroSlide> {
    const lastSlide = await prisma.heroSlide.findFirst({
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });
    const nextOrder = (lastSlide?.sortOrder || 0) + 1;
    const slideNumber = String(nextOrder).padStart(2, "0");
    const requestedStatus =
      dto.status || "DRAFT";
    const status =
      requestedStatus === "SCHEDULED"
        ? HeroSlideStatus.SCHEDULED
        : requestedStatus === "PUBLISHED"
        ? HeroSlideStatus.PUBLISHED
        : requestedStatus === "ARCHIVED"
        ? HeroSlideStatus.ARCHIVED
        : HeroSlideStatus.DRAFT;
    const startAt = parseDate(dto.startAt);
    const endAt = parseDate(dto.endAt);
    if (startAt && endAt && startAt >= endAt) {
      throw new Error("startAt must be before endAt");
    }
    const contentPosition =
      (dto.contentPosition || "left").toUpperCase() as HeroContentPosition;
    const textTheme =
      (dto.textTheme || "light").toUpperCase() as HeroTextTheme;
    const slide = await prisma.heroSlide.create({
      data: {
        internalName:
          dto.internalName || `Slide ${slideNumber}`,
        slideNumber,
        navLabel:
          dto.navLabel ||
          dto.eyebrow.slice(0, 30) ||
          `Slide ${slideNumber}`,
        eyebrow: dto.eyebrow,
        title: dto.title,
        description: dto.description,
        desktopImageUrl: dto.desktopImage,
        mobileImageUrl:
          dto.mobileImage || dto.desktopImage,
        imageAlt:
  dto.imageAlt ||
  dto.title.replace(/\n/g, " "),
        primaryCtaLabel:
          dto.primaryCtaLabel ||
          "EXPLORE COLLECTION",
        primaryCtaUrl:
          dto.primaryCtaUrl ||
          "/collections",
        secondaryCtaLabel:
          dto.secondaryCtaLabel || null,
        secondaryCtaUrl:
          dto.secondaryCtaUrl || null,
        contentPosition,
        textTheme,
        desktopImagePosition:
          dto.desktopImagePosition ||
          "center 25%",
        mobileImagePosition:
          dto.mobileImagePosition ||
          "60% 20%",
        linkedProductId:
          dto.productId || null,
        linkedCategoryId:
          dto.categoryId || null,
        linkedCollectionId:
          dto.collectionId || null,
        fabricTagsJson: JSON.stringify(
          dto.fabricTags || []
        ),
        editorialBadge:
          dto.editorialBadge ||
          "Direct Factory Archive",
        sortOrder:
          dto.sortOrder ?? nextOrder,
        status,
        startAt,
        endAt,
        publishedAt:
          status === HeroSlideStatus.PUBLISHED
            ? new Date()
            : null,
        createdById:
          actor.id || null,
        updatedById:
          actor.id || null,
      },
      include: heroInclude,
    });
    /**
     * Store version snapshot.
     */
    await prisma.heroSlideVersion.create({
      data: {
        heroSlideId: slide.id,
        payloadJson: JSON.stringify(dto),
        createdById:
          actor.id || null,
      },
    });
    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_CREATED",
      entityType: "HeroSlide",
      entityId: slide.id,
      metadata: {
        title: slide.title,
        status: slide.status,
      },
    });
    return serializeSlide(slide);
  }
  /**
   * Update hero slide.
   */
  static async updateSlide(
    id: string,
    dto: Partial<CreateHeroSlideDTO> & {
      slideNumber?: string;
    },
    actor: Actor = {}
  ): Promise<HeroSlide | null> {
    const existing = await prisma.heroSlide.findUnique({
      where: {
        id,
      },
    });
    if (!existing) {
      return null;
    }
    const data: Prisma.HeroSlideUpdateInput = {};
    if (dto.internalName !== undefined) {
      data.internalName = dto.internalName;
    }
    if (dto.slideNumber !== undefined) {
      data.slideNumber = dto.slideNumber;
    }
    if (dto.navLabel !== undefined) {
      data.navLabel = dto.navLabel;
    }
    if (dto.eyebrow !== undefined) {
      data.eyebrow = dto.eyebrow;
    }
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.desktopImage !== undefined) {
      data.desktopImageUrl = dto.desktopImage;
    }
    if (dto.mobileImage !== undefined) {
      data.mobileImageUrl = dto.mobileImage;
    }
    if (dto.imageAlt !== undefined) {
      data.imageAlt = dto.imageAlt;
    }
    if (dto.primaryCtaLabel !== undefined) {
      data.primaryCtaLabel = dto.primaryCtaLabel;
    }
    if (dto.primaryCtaUrl !== undefined) {
      data.primaryCtaUrl = dto.primaryCtaUrl;
    }
    if (dto.secondaryCtaLabel !== undefined) {
      data.secondaryCtaLabel =
        dto.secondaryCtaLabel || null;
    }
    if (dto.secondaryCtaUrl !== undefined) {
      data.secondaryCtaUrl =
        dto.secondaryCtaUrl || null;
    }
    if (dto.contentPosition !== undefined) {
      data.contentPosition =
        dto.contentPosition.toUpperCase() as HeroContentPosition;
    }
    if (dto.textTheme !== undefined) {
      data.textTheme =
        dto.textTheme.toUpperCase() as HeroTextTheme;
    }
    if (dto.desktopImagePosition !== undefined) {
      data.desktopImagePosition =
        dto.desktopImagePosition;
    }
    if (dto.mobileImagePosition !== undefined) {
      data.mobileImagePosition =
        dto.mobileImagePosition;
    }
    if (dto.productId !== undefined) {
      data.linkedProduct = dto.productId
        ? {
            connect: {
              id: dto.productId,
            },
          }
        : {
            disconnect: true,
          };
    }
    if (dto.categoryId !== undefined) {
      data.linkedCategory = dto.categoryId
        ? {
            connect: {
              id: dto.categoryId,
            },
          }
        : {
            disconnect: true,
          };
    }
    if (dto.collectionId !== undefined) {
      data.linkedCollection = dto.collectionId
        ? {
            connect: {
              id: dto.collectionId,
            },
          }
        : {
            disconnect: true,
          };
    }
    if (dto.fabricTags !== undefined) {
      data.fabricTagsJson =
        JSON.stringify(dto.fabricTags);
    }
    if (dto.editorialBadge !== undefined) {
      data.editorialBadge =
        dto.editorialBadge || null;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.startAt !== undefined) {
      data.startAt = parseDate(dto.startAt);
    }
    if (dto.endAt !== undefined) {
      data.endAt = parseDate(dto.endAt);
    }
    if (dto.status !== undefined) {
      data.status =
        dto.status.toUpperCase() as HeroSlideStatus;
      if (dto.status === "PUBLISHED") {
        data.publishedAt =
          existing.publishedAt || new Date();
      }
      if (
        dto.status === "DRAFT" ||
        dto.status === "ARCHIVED"
      ) {
        data.publishedAt =
          existing.publishedAt;
      }
    }
    data.updatedBy = actor.id
      ? {
          connect: {
            id: actor.id,
          },
        }
      : undefined;
    const updated = await prisma.$transaction(
      async (tx) => {
        const slide = await tx.heroSlide.update({
          where: {
            id,
          },
          data,
          include: heroInclude,
        });
        await tx.heroSlideVersion.create({
          data: {
            heroSlideId: slide.id,
            payloadJson: JSON.stringify(
              dto
            ),
            createdById:
              actor.id || null,
          },
        });
        return slide;
      }
    );
    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_UPDATED",
      entityType: "HeroSlide",
      entityId: id,
      metadata: {
        fields: Object.keys(dto),
      },
    });
    return serializeSlide(updated);
  }
  /**
   * Publish.
   */
  static async publishSlide(
    id: string,
    actor: Actor = {}
  ): Promise<HeroSlide | null> {
    return this.updateSlide(
      id,
      {
        status: "PUBLISHED",
      },
      actor
    );
  }
  /**
   * Unpublish.
   */
  static async unpublishSlide(
    id: string,
    actor: Actor = {}
  ): Promise<HeroSlide | null> {
    return this.updateSlide(
      id,
      {
        status: "DRAFT",
      },
      actor
    );
  }
  /**
   * Archive.
   */
  static async archiveSlide(
    id: string,
    actor: Actor = {}
  ): Promise<boolean> {
    const existing = await prisma.heroSlide.findUnique({
      where: {
        id,
      },
    });
    if (!existing) {
      return false;
    }
    await prisma.heroSlide.update({
      where: {
        id,
      },
      data: {
        status: HeroSlideStatus.ARCHIVED,
        updatedBy: actor.id
          ? {
              connect: {
                id: actor.id,
              },
            }
          : undefined,
      },
    });
    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_ARCHIVED",
      entityType: "HeroSlide",
      entityId: id,
    });
    return true;
  }
  /**
   * Permanently delete a hero slide.
   */
  static async deleteSlide(
    id: string,
    actor: Actor = {}
  ): Promise<boolean> {
    const existing = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (!existing) {
      return false;
    }

    await prisma.heroSlide.delete({
      where: { id },
    });

    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_DELETED",
      entityType: "HeroSlide",
      entityId: id,
      metadata: {
        title: existing.title,
        internalName: existing.internalName,
        status: existing.status,
      },
    });

    return true;
  }

  /**
   * Duplicate slide as DRAFT.
   */
  static async duplicateSlide(
    id: string,
    actor: Actor = {}
  ): Promise<HeroSlide | null> {
    const original =
      await prisma.heroSlide.findUnique({
        where: {
          id,
        },
        include: heroInclude,
      });
    if (!original) {
      return null;
    }
    const lastSlide =
      await prisma.heroSlide.findFirst({
        orderBy: {
          sortOrder: "desc",
        },
        select: {
          sortOrder: true,
        },
      });
    const nextOrder =
      (lastSlide?.sortOrder || 0) + 1;
    const duplicated =
      await prisma.heroSlide.create({
        data: {
          internalName: `${original.internalName} (Copy)`,
          slideNumber:
            String(nextOrder).padStart(2, "0"),
          navLabel:
            `${original.navLabel} Copy`,
          eyebrow: original.eyebrow,
          title: original.title,
          description: original.description,
          desktopAssetId:
            original.desktopAssetId,
          mobileAssetId:
            original.mobileAssetId,
          desktopImageUrl:
            original.desktopImageUrl,
          mobileImageUrl:
            original.mobileImageUrl,
          imageAlt:
            original.imageAlt,
          primaryCtaLabel:
            original.primaryCtaLabel,
          primaryCtaUrl:
            original.primaryCtaUrl,
          secondaryCtaLabel:
            original.secondaryCtaLabel,
          secondaryCtaUrl:
            original.secondaryCtaUrl,
          contentPosition:
            original.contentPosition,
          textTheme:
            original.textTheme,
          desktopImagePosition:
            original.desktopImagePosition,
          mobileImagePosition:
            original.mobileImagePosition,
          linkedProductId:
            original.linkedProductId,
          linkedCategoryId:
            original.linkedCategoryId,
          linkedCollectionId:
            original.linkedCollectionId,
          fabricTagsJson:
            original.fabricTagsJson,
          editorialBadge:
            original.editorialBadge,
          sortOrder: nextOrder,
          status: HeroSlideStatus.DRAFT,
          startAt: null,
          endAt: null,
          publishedAt: null,
          createdById:
            actor.id || null,
          updatedById:
            actor.id || null,
        },
        include: heroInclude,
      });
    await prisma.heroSlideVersion.create({
      data: {
        heroSlideId: duplicated.id,
        payloadJson: JSON.stringify({
          duplicatedFrom: original.id,
        }),
        createdById:
          actor.id || null,
      },
    });
    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_CREATED",
      entityType: "HeroSlide",
      entityId: duplicated.id,
      metadata: {
        duplicatedFrom: original.id,
      },
    });
    return serializeSlide(duplicated);
  }
  /**
   * Reorder slides transactionally.
   */
  static async reorderSlides(
    reordered: {
      id: string;
      sortOrder: number;
    }[],
    actor: Actor = {}
  ): Promise<HeroSlide[]> {
    const result =
      await prisma.$transaction(
        async (tx) => {
          for (const item of reordered) {
            await tx.heroSlide.update({
              where: {
                id: item.id,
              },
              data: {
                sortOrder:
                  item.sortOrder,
                updatedBy: actor.id
                  ? {
                      connect: {
                        id: actor.id,
                      },
                    }
                  : undefined,
              },
            });
          }
          return tx.heroSlide.findMany({
            include: heroInclude,
            orderBy: {
              sortOrder: "asc",
            },
          });
        }
      );
    await AuditService.log({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "HERO_SLIDE_UPDATED",
      entityType: "HeroSlide",
      entityId: "bulk-reorder",
      metadata: {
        slides: reordered,
      },
    });
    return result.map(serializeSlide);
  }
  /**
   * Save hero slider configuration.
   */
  static async updateHeroConfig(
    config: Partial<HeroSliderConfig>
  ): Promise<HeroSliderConfig> {
    const current =
      await this.getHeroConfig();
    const updated = {
      ...current,
      ...config,
    };
    await prisma.siteSetting.upsert({
      where: {
        key: "hero_slider_config",
      },
      create: {
        key: "hero_slider_config",
        value: JSON.stringify(updated),
        description:
          "Homepage hero slider configuration",
      },
      update: {
        value: JSON.stringify(updated),
      },
    });
    return updated;
  }
}
