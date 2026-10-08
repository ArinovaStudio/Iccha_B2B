import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";
import { z } from "zod";

const updateWarehouseSchema = z.object({
    name: z.string().trim().min(1, "Warehouse name is required"),
    address: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().optional().or(z.literal("")),
    state: z.string().trim().optional().or(z.literal("")),
    pincode: z.string().trim().optional().or(z.literal("")),
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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { id } = await params;

        const warehouse = await prisma.warehouse.findUnique({ where: { id } });

        if (!warehouse) {
            return NextResponse.json(
                { success: false, error: "Warehouse not found" },
                { status: 404 }
            );
        }

        // Same ownership rule as DELETE: vendors edit only their own
        // warehouses, staff only the platform pool (vendorId = null).
        const owns =
            auth.kind === "vendor"
                ? warehouse.vendorId === auth.vendorProfile.id
                : true; // staff can manage platform and vendor warehouses

        if (!owns) {
            return NextResponse.json(
                { success: false, error: "You don't have permission to edit this warehouse" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = updateWarehouseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const updated = await prisma.warehouse.update({
            where: { id },
            data: {
                name: data.name,
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                pincode: data.pincode || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...updated, vendorName: null, isMine: true },
        });
    } catch (error) {
        console.error("Update warehouse error:", error);

        return NextResponse.json(
            { success: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        const { id } = await params;

        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
        });

        if (!warehouse) {
            return NextResponse.json(
                { success: false, error: "Warehouse not found" },
                { status: 404 }
            );
        }

        // Vendors can only remove their own warehouses. Staff can only
        // remove platform-owned warehouses (vendorId = null) — a vendor's
        // warehouse stays under that vendor's own control.
        const owns =
            auth.kind === "vendor"
                ? warehouse.vendorId === auth.vendorProfile.id
                : true; // staff can manage platform and vendor warehouses

        if (!owns) {
            return NextResponse.json(
                { success: false, error: "You don't have permission to delete this warehouse" },
                { status: 403 }
            );
        }

        // Products in this warehouse are deleted with it (Product.warehouse is
        // onDelete: Cascade), including their order line items, so report the count.
        const productCount = await prisma.product.count({
            where: { warehouseId: id },
        });

        await prisma.warehouse.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: "Warehouse deleted",
            deletedProducts: productCount,
        });
    } catch (error) {
        console.error("Delete warehouse error:", error);

        return NextResponse.json(
            { success: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}