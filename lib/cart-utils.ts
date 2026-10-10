import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { evaluateMoq } from "@/lib/moq";
const CART_ITEM_INCLUDE = {
    product: {
        include: {
            media: {
                where: { isPrimary: true },
                take: 1,
                include: { mediaAsset: { select: { publicUrl: true } } },
            },
            vendor: {
                select: {
                    id: true,
                    vendorCode: true,
                    businessName: true,
                    gstin: true,
                    pan: true,
                    address: true,
                    city: true,
                    state: true,
                    stateCode: true,
                    mobile: true,
                },
            },
            gstConfig: true,
            category: { select: { requiresSize: true, gst:true } },
            sizes: { orderBy: { sortOrder: "asc" } },
        },
    },
} satisfies Prisma.CartItemInclude;
type CartWithItems = Prisma.CartGetPayload<{
    include: { items: { include: typeof CART_ITEM_INCLUDE } };
}>;
const CART_INCLUDE = {
    items: { include: CART_ITEM_INCLUDE, orderBy: { createdAt: "asc" } },
} satisfies Prisma.CartInclude;
export async function getOrCreateCart(retailerProfileId: string): Promise<CartWithItems> {
    // "join" = ONE SQL query for the whole cart -> items -> product -> media/vendor/sizes tree.
    // The default strategy issues a separate query per relation level, and each one is a
    // full network round-trip to the database.
    const find = () =>
        prisma.cart.findUnique({
            where: { retailerProfileId },
            include: CART_INCLUDE,
            relationLoadStrategy: "join",
        });
    const existing = await find();
    if (existing) return existing;
    try {
        return await prisma.cart.create({
            data: { retailerProfileId },
            include: CART_INCLUDE,
            relationLoadStrategy: "join",
        });
    } catch (err) {
        // Two requests raced to create the same retailer's first cart (unique on retailerProfileId).
        if ((err as { code?: string })?.code === "P2002") {
            const raced = await find();
            if (raced) return raced;
        }
        throw err;
    }
}
// Field names below intentionally mirror the legacy mock `Cart`/`CartItem`/
// `EntityCartSummary` shapes (lib/types) so existing cart UI components
// (GSTEntityBreakdown, MOQProgressBar) keep working unmodified once
// AppContext is wired to this real, DB-backed cart.
export async function serializeCartFull(cart: CartWithItems, retailerProfileId: string) {
    const rawItems = cart.items.map((item) => {
        const p = item.product;
        const rate = item?.product?.category?.gst;
        const gstRate = p.gstConfig
            ? Number(p.gstConfig.cgstRate) + Number(p.gstConfig.sgstRate)
            : 5;
        const totalPieces = item.sets * p.piecesPerSet;
        const unitPrice = Number(p.wholesalePricePerPiece);
        const setPrice = Number(p.wholesalePricePerSet);
        const lineSubtotal = setPrice * item.sets;
        const entityCode = p.vendor?.vendorCode
            ? `vendor:${p.vendor.vendorCode}`
            : (process.env.PLATFORM_BILLING_ENTITY_CODE || "platform");
        return {
            productId: item.productId,
            selectedSets: item.sets,
            selectedSize: item.selectedSize === "__NO_SIZE__" ? null : item.selectedSize,
            piecesPerSet: p.piecesPerSet,
            totalPieces,
            unitPrice,
            setPrice,
            lineSubtotal,
            billingEntityId: entityCode,
            product: {
                name: p.name,
                slug: p.slug,
                sku: p.sku,
                designNumber: p.designNumber,
                fabric: p.fabric,
                sizeCombination: p.sizeCombination,
                requiresSize: p.category.requiresSize,
                sizeStocks: p.sizes.map((row) => ({ size: row.size, availableSets: row.availableSets })),
                availableSets: p.availableSets,
                minOrderSets: p.minOrderSets,
                isActive: p.isActive,
                vendorName: p.vendor?.businessName || "IcchaStore",
                gstRate,
                hsn: p.gstConfig?.hsnCode ?? p.hsnCode,
                media: [{ url: p.media[0]?.mediaAsset?.publicUrl || null }],
            },
        };
    });
    const totalDesigns = new Set(rawItems.map((i) => i.productId)).size;
    const totalSets = rawItems.reduce((sum, i) => sum + i.selectedSets, 0);
    const totalPieces = rawItems.reduce((sum, i) => sum + i.totalPieces, 0);
    const subtotal = rawItems.reduce((sum, i) => sum + i.lineSubtotal, 0);
    // Seller-owned GST: vendor products use the vendor's current legal/GST data. That data is
    // already loaded with each cart item (CART_ITEM_INCLUDE), so no extra vendor query is needed.
    // Only IcchaStore-owned products (vendorId = null) use the platform entity.
    const platformCode = process.env.PLATFORM_BILLING_ENTITY_CODE || "platform";
    const vendorByCode = new Map<string, NonNullable<(typeof cart.items)[number]["product"]["vendor"]>>();
    for (const item of cart.items) {
        const v = item.product.vendor;
        if (v?.vendorCode) vendorByCode.set(v.vendorCode, v);
    }
    const hasPlatformItems = cart.items.some((item) => !item.product.vendor?.vendorCode);
    // The three lookups below are independent of each other, so run them concurrently
    // (one round-trip of waiting instead of three in a row).
    const [address, platform, moq] = await Promise.all([
        // Retailer's default billing address, for interstate GST determination
        prisma.retailerAddress.findFirst({
            where: { retailerProfileId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        }),
        hasPlatformItems
            ? prisma.billingEntity.findFirst({
                where: { code: platformCode, isActive: true },
                select: {
                    id: true,
                    code: true,
                    legalName: true,
                    tradeName: true,
                    gstin: true,
                    state: true,
                    stateCode: true,
                    registeredAddress: true,
                },
            })
            : Promise.resolve(null),
        // MOQ evaluation — same engine checkout uses, so cart and order can never disagree.
        evaluateMoq(prisma, {
            retailerProfileId,
            totalSets,
            totalPieces,
            totalDesigns,
            subtotal,
        }),
    ]);
    const entitySummaries = Array.from(
        new Set(rawItems.map((item) => item.billingEntityId))
    ).map((entityId) => {
        const entItems = rawItems.filter((i) => i.billingEntityId === entityId);
        const entSets = entItems.reduce((s, i) => s + i.selectedSets, 0);
        const entPieces = entItems.reduce((s, i) => s + i.totalPieces, 0);
        const entSubtotal = entItems.reduce((s, i) => s + i.lineSubtotal, 0);
        const entGst = entItems.reduce(
            (s, i) => s + Math.round((i.lineSubtotal * i.product.gstRate) / 100),
            0
        );
        const entShipping = 0;
        const vendorCode = entityId.startsWith("vendor:")
            ? entityId.slice("vendor:".length)
            : null;
        const vendor = vendorCode ? vendorByCode.get(vendorCode) : undefined;
        const entity = vendor
            ? {
                id: vendor.id,
                code: `vendor:${vendor.vendorCode}`,
                legalName: vendor.businessName,
                tradeName: vendor.businessName,
                gstin: vendor.gstin,
                state: vendor.state,
                stateCode: vendor.stateCode,
                registeredAddress: [vendor.address, vendor.city, vendor.state]
                    .filter(Boolean)
                    .join(", "),
            }
            : entityId === platformCode && platform
                ? platform
                : null;
        const isInterState = !!entity && !!address && address.stateCode !== entity.stateCode;
        const cgst = isInterState ? 0 : Math.round(entGst / 2);
        const sgst = isInterState ? 0 : Math.round(entGst / 2);
        const igst = isInterState ? entGst : 0;
        return {
            entityId,
            entity,
            items: entItems,
            totalSets: entSets,
            totalPieces: entPieces,
            subtotal: entSubtotal,
            cgst,
            sgst,
            igst,
            totalGst: entGst,
            shipping: entShipping,
            total: entSubtotal + entGst,
        };
    });
    const estimatedGst = entitySummaries.reduce((sum, e) => sum + e.totalGst, 0);
    const shippingEstimate = 0;
    const estimatedTotal = subtotal + estimatedGst;
    return {
        id: cart.id,
        items: rawItems,
        totalDesigns,
        totalSets,
        totalPieces,
        subtotal,
        entitySummaries,
        estimatedGst,
        shippingEstimate,
        estimatedTotal,
        moq,
    };
}