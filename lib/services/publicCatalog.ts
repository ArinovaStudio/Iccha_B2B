import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { colorNames } from '@/lib/product-colors';
import { Category, Product } from '@/lib/types';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80';

function mapCategoryType(type: string): Category['type'] {
  if (type === '3_pc_suit') return '3_piece';
  if (type === 'kurti_only') return 'kurti_only';
  if (type === 'kurti_pant_set') return '2_piece';
  return 'mixed';
}

const categoryInclude = {
  subcategories: { select: { name: true } },
  mediaAsset: { select: { publicUrl: true } },
  _count: { select: { products: true } },
} satisfies Prisma.CategoryInclude;

type DbCategory = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

async function fetchDbCategories(): Promise<DbCategory[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: categoryInclude,
  });
}

function toCategory(c: DbCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || `Wholesale ${c.name} manufactured in-house.`,
    image: c.mediaAsset?.publicUrl || FALLBACK_IMAGE,
    billingEntityId: c.billingEntityId || undefined,
    subcategories: c.subcategories.map((s) => s.name),
    itemCount: c._count.products,
    representativeTagline: c.name,
    featured: c.isFeatured,
    type: mapCategoryType(c.type),
    popularFabrics: [],
  };
}

const productInclude = {
  category: { select: { name: true } },
  subcategory: { select: { name: true } },
  media: {
    include: { mediaAsset: { select: { publicUrl: true } } },
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function toProduct(p: DbProduct): Product {
  const availableSets = p.availableSets;
  const status: Product['status'] =
    availableSets === 0 ? 'out_of_stock' : availableSets <= 5 ? 'low_stock' : 'available';

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    designNumber: p.designNumber,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    subcategory: p.subcategory?.name || '',
    description: p.description || '',
    minOrderSets: p.minOrderSets ?? 1,
    fabric: p.fabric,
    workType: p.workType,
    style: p.style,
    clothingType: p.clothingType as Product['clothingType'],
    piecesPerSet: p.piecesPerSet,
    wholesalePricePerPiece: Number(p.wholesalePricePerPiece),
    wholesalePricePerSet: Number(p.wholesalePricePerSet),
    availableSets: p.availableSets,
    totalAvailablePieces: p.totalAvailablePieces,
    sizeCombination: p.sizeCombination,
    sizes: [],
    colors: colorNames(p.color),
    billingEntityId: undefined,
    hsn: p.hsnCode,
    gstRate: 5,
    status,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    media: p.media.map((m) => ({
      id: m.id,
      type: m.mediaType === 'VIDEO' ? 'video' : 'image',
      url: m.mediaAsset.publicUrl,
      alt: p.name,
      isPrimary: m.isPrimary,
    })),
    createdAt: p.createdAt.toISOString(),
  };
}

export const PublicCatalogService = {
  async getCategories(): Promise<Category[]> {
    const categories = await fetchDbCategories();
    return categories.map(toCategory);
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      include: categoryInclude,
    });
    return category ? toCategory(category) : null;
  },

  async getRepresentativeProducts(limit = 8): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true, isPublicRepresentative: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    });
    return products.map(toProduct);
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { categoryId, isActive: true, isPublicRepresentative: true },
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    });
    return products.map(toProduct);
  }
};