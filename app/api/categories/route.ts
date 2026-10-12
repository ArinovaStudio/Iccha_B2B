import { prisma } from "@/lib/db";
import { colorNames } from "@/lib/product-colors";
import { Category, Product } from "@/lib/types";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const categoryInclude = {
  subcategories: {
    select: {
      name: true,
    },
  },
  mediaAsset: {
    select: {
      publicUrl: true,
    },
  },
  _count: {
    select: {
      products: true,
    },
  },
} satisfies Prisma.CategoryInclude;

const productInclude = {
  category: {
    select: {
      name: true,
    },
  },
  subcategory: {
    select: {
      name: true,
    },
  },
  collection: {
    select: {
      name: true,
    },
  },
  media: {
    include: {
      mediaAsset: {
        select: {
          publicUrl: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80";

function mapCategoryType(type: string): Category["type"] {
  if (type === "3_pc_suit") return "3_piece";
  if (type === "kurti_only") return "kurti_only";
  if (type === "kurti_pant_set") return "2_piece";

  return "mixed";
}

function toProduct(p: DbProduct): Product {
  const availableSets = p.availableSets;

  const status: Product["status"] =
    availableSets === 0
      ? "out_of_stock"
      : availableSets <= 5
        ? "low_stock"
        : "available";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    designNumber: p.designNumber,

    categoryId: p.categoryId,
    categoryName: p.category.name,

    subcategory: p.subcategory?.name || "",

    description: p.description || "",

    minOrderSets: p.minOrderSets ?? 1,

    fabric: p.fabric,
    workType: p.workType,
    style: p.style,

    clothingType: p.clothingType as Product["clothingType"],

    piecesPerSet: p.piecesPerSet,

    wholesalePricePerPiece: Number(p.wholesalePricePerPiece),
    wholesalePricePerSet: Number(p.wholesalePricePerSet),

    availableSets: p.availableSets,
    totalAvailablePieces: p.totalAvailablePieces,

    sizeCombination: p.sizeCombination,

    sizes: [],

    colors: colorNames(p.color),

    collectionName: p.collection?.name || "General Wholesale",

    billingEntityId: undefined,

    hsn: p.hsnCode,
    gstRate: 5,

    status,

    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,

    media: p.media.map((m) => ({
      id: m.id,
      type: m.mediaType === "VIDEO" ? "video" : "image",
      url: m.mediaAsset.publicUrl,
      alt: p.name,
      isPrimary: m.isPrimary,
    })),

    createdAt: p.createdAt.toISOString(),
  };
}

function toCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,

    description:
      c.description || `Wholesale ${c.name} manufactured in-house.`,

    image: c.mediaAsset?.publicUrl || FALLBACK_IMAGE,

    billingEntityId: c.billingEntityId || undefined,

    subcategories: c.subcategories.map((s: { name: string }) => s.name),

    itemCount: c._count.products,

    representativeTagline: c.name,

    featured: c.isFeatured,

    type: mapCategoryType(c.type),

    popularFabrics: [],

    // Transform category products using the same product mapper
    products: c.products?.map(toProduct) || [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const slug = params.get("slug");

    /*
     * GET /api/categories?slug=some-category
     *
     * Returns one category with its products.
     */
    if (slug) {
      const cat = await prisma.category.findFirst({
        where: {
          slug,
          isActive: true,
        },
        include: {
          ...categoryInclude,

          products: {
            include: productInclude,
          },
        },
      });

      if (!cat) {
        return NextResponse.json(
          {
            error: "Category not found",
          },
          {
            status: 404,
          }
        );
      }

      const category = toCategory(cat);

      return NextResponse.json(
        {
          category,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * GET /api/categories
     *
     * Returns all categories.
     */
    const categoriesFromDb = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: categoryInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    const categories = categoriesFromDb.map(toCategory);

    return NextResponse.json(
      {
        categories,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Categories API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch categories",
      },
      {
        status: 500,
      }
    );
  }
}