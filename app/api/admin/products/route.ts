import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";
import { resolveGstConfigId } from "@/lib/gst-config";
import { resolveProductBillingEntityId } from "@/lib/billing/entityResolver";

const PAGE_SIZE = 20;

const productFieldsSchema = z.object({
    sku: z.string().trim().min(1, "SKU is required"),
    designNumber: z.string().trim().min(1, "Design number is required"),
    name: z.string().trim().min(1, "Product name is required"),
    slug: z.string().trim().min(1, "Slug is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    subcategoryId: z.string().optional(),
    collectionId: z.string().optional(),

    wholesalePricePerPiece: z.number().nonnegative(),
    piecesPerSet: z.number().int().min(1),
    wholesalePricePerSet: z.number().nonnegative(),
    // Stock is optional: leaving it empty saves the product with 0 sets.
    availableSets: z.number().int().min(0, "Stock cannot be negative").default(0),
    minOrderSets: z.number().int().min(1, "Minimum order quantity must be at least 1 set.").default(1),

    sizeCombination: z.string().optional(),
    sizeStocks: z.array(z.object({
        size: z.string().trim().min(1, "Size is required"),
        availableSets: z.number().int().min(0, "Size stock cannot be negative"),
    })).optional(),
    color: z.string(),
    fabric: z.string(),
    workType: z.string(),
    style: z.string(),
    clothingType: z.string(),
    hsnCode: z.string(),
    // Billing entity is resolved server-side from the product owner.
    // Vendor products use the vendor's GST/billing details; house products use the platform entity.
    billingEntityId: z.string().uuid().optional(),
    mediaAssetIds: z.array(z.string()).optional(),
    vendorId: z.string().optional(),
    warehouseId: z.string().optional(),
    // Vendor edits treat these values as additions to existing inventory.
    stockAdjustment: z.number().int().min(0).optional(),
    sizeStockAdjustments: z.array(z.object({
        size: z.string().trim().min(1, "Size is required"),
        availableSets: z.number().int().min(0, "Stock addition cannot be negative"),
    })).optional(),
});

const updateProductSchema = productFieldsSchema.extend({
    productId: z.string().min(1, "Product ID is required"),
});

async function authenticateEither(request: NextRequest) {
    const staffResult = await requireStaff(request);

    if (!("error" in staffResult)) {
        return { kind: "staff" as const, ...staffResult };
    }

    const vendorResult = await requireVendor(request);

    if (!("error" in vendorResult)) {
        return { kind: "vendor" as const, ...vendorResult };
    }

    return {
        error: "Admin or vendor access required",
        status: 401 as const,
    };
}

async function validateVendorAndWarehouse(
    auth: Awaited<ReturnType<typeof authenticateEither>>,
    vendorId: string | null,
    warehouseId: string | undefined
) {
    if ("error" in auth) {
        return {
            error: auth.error,
            status: auth.status,
        };
    }

    if (auth.kind === "vendor") {
        if (!warehouseId) {
            return {
                error:
                    "You have not added a warehouse yet. Please add a warehouse before creating a product.",
                status: 400,
            };
        }

        const warehouse = await prisma.warehouse.findFirst({
            where: {
                id: warehouseId,
                vendorId: auth.vendorProfile.id,
                isActive: true,
            },
            select: { id: true },
        });

        if (!warehouse) {
            return {
                error: "The selected warehouse is invalid or inactive.",
                status: 400,
            };
        }
    } else if (vendorId && warehouseId) {
        const warehouse = await prisma.warehouse.findFirst({
            where: {
                id: warehouseId,
                vendorId,
                isActive: true,
            },
            select: { id: true },
        });

        if (!warehouse) {
            return {
                error: "The selected warehouse does not belong to this vendor.",
                status: 400,
            };
        }
    }

    if (vendorId && auth.kind === "staff") {
        const owningVendor = await prisma.vendorProfile.findUnique({
            where: { id: vendorId },
            select: { id: true },
        });

        if (!owningVendor) {
            return {
                error: "Vendor not found",
                status: 400,
            };
        }
    }

    return null;
}

const productInclude = {
    category: {
        select: { name: true, requiresSize: true },
    },

    vendor: {
        select: {
            id: true,
            businessName: true,
        },
    },

    sizes: {
        orderBy: { sortOrder: "asc" as const },
        select: { id: true, size: true, availableSets: true, sortOrder: true },
    },

    warehouse: {
        select: {
            id: true,
            name: true,
            city: true,
            state: true,
            isActive: true,
        },
    },

    gstConfig: {
        select: {
            id: true,
            hsnCode: true,
            cgstRate: true,
            sgstRate: true,
            igstRate: true,
            billingEntity: {
                select: {
                    id: true,
                    code: true,
                    legalName: true,
                    tradeName: true,
                    state: true,
                    stateCode: true,
                    gstin: true,
                },
            },
        },
    },

    media: {
        where: { isPrimary: true },
        take: 1,
        include: {
            mediaAsset: {
                select: { publicUrl: true },
            },
        },
    },
} as const;

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const body = await request.json();
        const parsed = productFieldsSchema.safeParse(body);

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

        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
            select: { id: true, requiresSize: true },
        });

        if (!category) {
            return NextResponse.json({ success: false, error: "Category not found." }, { status: 400 });
        }

        const sizeStocks = (data.sizeStocks ?? []).map((row) => ({
            size: row.size.trim(),
            availableSets: row.availableSets,
        }));

        // Stock/sizes are optional. Only guard against the same size entered twice.
        if (category.requiresSize) {
            const normalized = sizeStocks.map((row) => row.size.toUpperCase());
            if (new Set(normalized).size !== normalized.length) {
                return NextResponse.json({ success: false, error: "Each size can be entered only once." }, { status: 400 });
            }
        }

        const vendorId =
            auth.kind === "vendor"
                ? auth.vendorProfile.id
                : data.vendorId ?? null;

        const validationError = await validateVendorAndWarehouse(
            auth,
            vendorId,
            data.warehouseId
        );

        if (validationError) {
            return NextResponse.json(
                {
                    success: false,
                    error: validationError.error,
                },
                { status: validationError.status }
            );
        }

        const totalAvailableSets = category.requiresSize
            ? sizeStocks.reduce((sum, row) => sum + row.availableSets, 0)
            : data.availableSets;
        const totalAvailablePieces = totalAvailableSets * data.piecesPerSet;
        const billingEntityId = await resolveProductBillingEntityId(vendorId);
        const gstConfigId = await resolveGstConfigId(
            billingEntityId,
            data.hsnCode
        );
        const product = await prisma.product.create({
            data: {
                sku: data.sku,
                designNumber: data.designNumber,
                name: data.name,
                slug: data.slug,
                description: data.description,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                collectionId: data.collectionId,

                wholesalePricePerPiece: data.wholesalePricePerPiece,
                piecesPerSet: data.piecesPerSet,
                wholesalePricePerSet: data.wholesalePricePerSet,
                availableSets: totalAvailableSets,
                minOrderSets: data.minOrderSets,
                totalAvailablePieces,
                gstConfigId,
                sizeCombination: category.requiresSize
                    ? sizeStocks.map((row) => row.size).join(", ")
                    : "",
                color: data.color,
                fabric: data.fabric,
                workType: data.workType,
                style: data.style,
                clothingType: data.clothingType,
                hsnCode: data.hsnCode,

                vendorId,
                warehouseId: data.warehouseId ?? null,

                sizes:
                    category.requiresSize && sizeStocks.length > 0
                        ? {
                            create: sizeStocks.map((row, index) => ({
                                size: row.size,
                                availableSets: row.availableSets,
                                sortOrder: index,
                            })),
                        }
                        : undefined,

                media: {
                    create: (data.mediaAssetIds ?? []).map(
                        (mediaAssetId, index) => ({
                            mediaAssetId,
                            mediaType:
                                index === 0
                                    ? "MAIN_IMAGE"
                                    : "ALTERNATE_IMAGE",
                            isPrimary: index === 0,
                        })
                    ),
                },
            },
            include: productInclude,
        });

        return NextResponse.json(
            { success: true, data: product },
            { status: 201 }
        );
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            const field =
                (error.meta?.target as string[] | undefined)?.[0] ??
                "field";

            const message =
                field === "sku"
                    ? "A product with this SKU already exists. Please use a different SKU."
                    : `A product with this ${field} already exists. Please try again.`;

            return NextResponse.json(
                { success: false, error: message },
                { status: 409 }
            );
        }

        console.error("Create product error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const body = await request.json();
        const parsed = updateProductSchema.safeParse(body);

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

        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
            select: { id: true, requiresSize: true },
        });

        if (!category) {
            return NextResponse.json({ success: false, error: "Category not found." }, { status: 400 });
        }

        const sizeStocks = (data.sizeStocks ?? []).map((row) => ({
            size: row.size.trim(),
            availableSets: row.availableSets,
        }));

        // Stock/sizes are optional. Only guard against the same size entered twice.
        if (category.requiresSize) {
            const normalized = sizeStocks.map((row) => row.size.toUpperCase());
            if (new Set(normalized).size !== normalized.length) {
                return NextResponse.json({ success: false, error: "Each size can be entered only once." }, { status: 400 });
            }
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: data.productId },
            select: {
                id: true,
                vendorId: true,
            },
        });

        if (!existingProduct) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found",
                },
                { status: 404 }
            );
        }

        if (
            auth.kind === "vendor" &&
            existingProduct.vendorId !== auth.vendorProfile.id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "You are not allowed to edit this product.",
                },
                { status: 403 }
            );
        }

        const vendorId =
            auth.kind === "vendor"
                ? auth.vendorProfile.id
                : data.vendorId ?? existingProduct.vendorId ?? null;

        const validationError = await validateVendorAndWarehouse(
            auth,
            vendorId,
            data.warehouseId
        );

        if (validationError) {
            return NextResponse.json(
                {
                    success: false,
                    error: validationError.error,
                },
                { status: validationError.status }
            );
        }

        const billingEntityId = await resolveProductBillingEntityId(vendorId);

        // Vendor inventory changes are additive. This prevents an edit such as
        // "add 3 M and 5 XL" from replacing the existing stock with 8 total.
        if (auth.kind === "vendor") {
            const stockAdjustment = Math.max(0, data.stockAdjustment ?? 0);
            const sizeStockAdjustments = (data.sizeStockAdjustments ?? []).map((row) => ({
                size: row.size.trim(),
                availableSets: row.availableSets,
            }));

            const normalizedAdjustmentSizes = sizeStockAdjustments.map((row) => row.size.toUpperCase());
            if (new Set(normalizedAdjustmentSizes).size !== normalizedAdjustmentSizes.length) {
                return NextResponse.json(
                    { success: false, error: "Each stock-addition size can be entered only once." },
                    { status: 400 }
                );
            }

            const gstConfigId = await resolveGstConfigId(
                billingEntityId,
                data.hsnCode
            );

            const product = await prisma.$transaction(
                async (tx) => {
                const current = await tx.product.findUnique({
                    where: { id: data.productId },
                    select: {
                        id: true,
                        availableSets: true,
                        sizes: {
                            select: { id: true, size: true, availableSets: true, sortOrder: true },
                            orderBy: { sortOrder: "asc" },
                        },
                    },
                });

                if (!current) throw new Error("Product not found");

                let totalAvailableSets = current.availableSets;

                if (category.requiresSize) {
                    for (const adjustment of sizeStockAdjustments) {
                        if (adjustment.availableSets <= 0) continue;

                        const existingSize = current.sizes.find(
                            (row) => row.size.toLowerCase() === adjustment.size.toLowerCase()
                        );

                        if (existingSize) {
                            await tx.productSize.update({
                                where: { id: existingSize.id },
                                data: { availableSets: { increment: adjustment.availableSets } },
                            });
                        } else {
                            await tx.productSize.create({
                                data: {
                                    productId: current.id,
                                    size: adjustment.size.toUpperCase(),
                                    availableSets: adjustment.availableSets,
                                    sortOrder: current.sizes.length,
                                },
                            });
                        }
                    }

                    const updatedSizes = await tx.productSize.findMany({
                        where: { productId: current.id },
                        select: { availableSets: true },
                    });
                    totalAvailableSets = updatedSizes.reduce(
                        (sum, row) => sum + row.availableSets,
                        0
                    );
                } else {
                    totalAvailableSets = current.availableSets + stockAdjustment;
                }

                const totalAvailablePieces = totalAvailableSets * data.piecesPerSet;
                const finalSizes = category.requiresSize
                    ? await tx.productSize.findMany({
                        where: { productId: current.id },
                        orderBy: { sortOrder: "asc" },
                        select: { size: true },
                    })
                    : [];

                const updated = await tx.product.update({
                    where: { id: current.id },
                    data: {
                        sku: data.sku,
                        designNumber: data.designNumber,
                        name: data.name,
                        slug: data.slug,
                        description: data.description,
                        categoryId: data.categoryId,
                        subcategoryId: data.subcategoryId,
                        collectionId: data.collectionId,
                        wholesalePricePerPiece: data.wholesalePricePerPiece,
                        piecesPerSet: data.piecesPerSet,
                        wholesalePricePerSet: data.wholesalePricePerSet,
                        availableSets: totalAvailableSets,
                        minOrderSets: data.minOrderSets,
                        totalAvailablePieces,
                        sizeCombination: finalSizes.map((row) => row.size).join(", "),
                        color: data.color,
                        fabric: data.fabric,
                        workType: data.workType,
                        style: data.style,
                        clothingType: data.clothingType,
                        hsnCode: data.hsnCode,
                        gstConfigId,
                        vendorId,
                        warehouseId: data.warehouseId ?? null,
                        ...(data.mediaAssetIds && data.mediaAssetIds.length > 0
                            ? {
                                media: {
                                    deleteMany: {},
                                    create: data.mediaAssetIds.map((mediaAssetId, index) => ({
                                        mediaAssetId,
                                        mediaType: index === 0 ? "MAIN_IMAGE" : "ALTERNATE_IMAGE",
                                        isPrimary: index === 0,
                                    })),
                                },
                            }
                            : {}),
                    },
                    include: productInclude,
                });

                const adjustmentTotal = category.requiresSize
                    ? sizeStockAdjustments.reduce((sum, row) => sum + row.availableSets, 0)
                    : stockAdjustment;

                if (adjustmentTotal > 0) {
                    await tx.stockAdjustment.create({
                        data: {
                            productId: current.id,
                            previousSets: current.availableSets,
                            adjustmentSets: adjustmentTotal,
                            newSets: totalAvailableSets,
                            reason: "PRODUCTION_RECEIPT",
                            actorUserId: auth.user.id,
                        },
                    });
                }

                return updated;
                },
                {
                    maxWait: 10000,
                    timeout: 15000,
                }
            );

            return NextResponse.json({ success: true, data: product });
        }

        const totalAvailableSets = category.requiresSize
            ? sizeStocks.reduce((sum, row) => sum + row.availableSets, 0)
            : data.availableSets;
        const totalAvailablePieces = totalAvailableSets * data.piecesPerSet;
        const gstConfigId = await resolveGstConfigId(
            billingEntityId,
            data.hsnCode
        );
        const product = await prisma.product.update({
            where: {
                id: data.productId,
            },
            data: {
                sku: data.sku,
                designNumber: data.designNumber,
                name: data.name,
                slug: data.slug,
                description: data.description,

                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                collectionId: data.collectionId,

                wholesalePricePerPiece: data.wholesalePricePerPiece,
                piecesPerSet: data.piecesPerSet,
                wholesalePricePerSet: data.wholesalePricePerSet,
                availableSets: totalAvailableSets,
                minOrderSets: data.minOrderSets,
                totalAvailablePieces,

                sizeCombination: category.requiresSize
                    ? sizeStocks.map((row) => row.size).join(", ")
                    : "",
                color: data.color,
                fabric: data.fabric,
                workType: data.workType,
                style: data.style,
                clothingType: data.clothingType,
                hsnCode: data.hsnCode,
                gstConfigId,
                vendorId,
                warehouseId: data.warehouseId ?? null,

                sizes: {
                    deleteMany: {},
                    ...(category.requiresSize && sizeStocks.length > 0
                        ? {
                            create: sizeStocks.map((row, index) => ({
                                size: row.size,
                                availableSets: row.availableSets,
                                sortOrder: index,
                            })),
                        }
                        : {}),
                },

                ...(data.mediaAssetIds &&
                    data.mediaAssetIds.length > 0
                    ? {
                        media: {
                            deleteMany: {},
                            create: data.mediaAssetIds.map(
                                (mediaAssetId, index) => ({
                                    mediaAssetId,
                                    mediaType:
                                        index === 0
                                            ? "MAIN_IMAGE"
                                            : "ALTERNATE_IMAGE",
                                    isPrimary: index === 0,
                                })
                            ),
                        },
                    }
                    : {}),
            },
            include: productInclude,
        });

        return NextResponse.json({
            success: true,
            data: product,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            const field =
                (error.meta?.target as string[] | undefined)?.[0] ??
                "field";

            const message =
                field === "sku"
                    ? "A product with this SKU already exists. Please use a different SKU."
                    : `A product with this ${field} already exists. Please try again.`;

            return NextResponse.json(
                { success: false, error: message },
                { status: 409 }
            );
        }

        console.error("Update product error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("id");

        if (!productId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product ID is required.",
                },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                vendorId: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Product not found.",
                },
                { status: 404 }
            );
        }

        // Vendors may delete only products that belong to them.
        if (
            auth.kind === "vendor" &&
            product.vendorId !== auth.vendorProfile.id
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "You are not allowed to delete this product.",
                },
                { status: 403 }
            );
        }

        await prisma.product.delete({
            where: { id: productId },
        });

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully.",
        });
    } catch (error) {
        // Product records referenced by historical orders cannot safely be
        // hard-deleted because OrderItem keeps the productId for history.
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "This product cannot be permanently deleted because it is already referenced by an order or another record.",
                },
                { status: 409 }
            );
        }

        console.error("Delete product error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong while deleting the product.",
            },
            { status: 500 }
        );
    }
}

const SORT_OPTIONS: Record<
    string,
    Prisma.ProductOrderByWithRelationInput[]
> = {
    price_high: [
        { wholesalePricePerSet: "desc" },
        { id: "desc" },
    ],

    price_low: [
        { wholesalePricePerSet: "asc" },
        { id: "desc" },
    ],

    newest: [
        { createdAt: "desc" },
        { id: "desc" },
    ],

    oldest: [
        { createdAt: "asc" },
        { id: "desc" },
    ],
};

type SortKey = keyof typeof SORT_OPTIONS;

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);

        const cursor = searchParams.get("cursor");
        const search = searchParams.get("search")?.trim();
        const sortParam = searchParams.get("sortBy");

        const sortKey: SortKey =
            sortParam && sortParam in SORT_OPTIONS
                ? (sortParam as SortKey)
                : "newest";

        const vendorId =
            auth.kind === "vendor"
                ? auth.vendorProfile.id
                : searchParams.get("vendorId");

        const products = await prisma.product.findMany({
            where: {
                vendorId: vendorId ?? null,

                ...(search
                    ? {
                        OR: [
                            {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                sku: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                designNumber: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    }
                    : {}),
            },

            orderBy: SORT_OPTIONS[sortKey],
            take: PAGE_SIZE + 1,

            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1,
                }
                : {}),

            include: productInclude,
        });

        const hasMore = products.length > PAGE_SIZE;
        const items = hasMore
            ? products.slice(0, PAGE_SIZE)
            : products;

        const nextCursor = hasMore
            ? items[items.length - 1].id
            : null;

        return NextResponse.json({
            success: true,
            data: items,
            nextCursor,
            sortBy: sortKey,
        });
    } catch (error) {
        console.error("Products list error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}