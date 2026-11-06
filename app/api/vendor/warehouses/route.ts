import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, requireVendor } from "@/lib/auth/guard";

const createWarehouseSchema = z.object({
    name: z.string().trim().min(1, "Warehouse name is required"),
    address: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().optional().or(z.literal("")),
    state: z.string().trim().optional().or(z.literal("")),
    pincode: z.string().trim().optional().or(z.literal("")),
    // Staff only: create the warehouse on behalf of this vendor. Ignored for vendors.
    vendorId: z.string().trim().optional().or(z.literal("")),
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

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateEither(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, error: auth.error },
                { status: auth.status }
            );
        }

        // Vendors see their own warehouses. Staff see the full catalogue by
        // default, or a specific owner when vendorId is supplied by a product form.
        const requestedVendorId =
            request.nextUrl.searchParams.get("vendorId")?.trim() || null;

        const warehouses = await prisma.warehouse.findMany({
            where: auth.kind === "vendor"
                ? { vendorId: auth.vendorProfile.id }
                : requestedVendorId
                    ? { vendorId: requestedVendorId }
                    : undefined,
            include: {
                vendor: { select: { businessName: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const data = warehouses.map((w) => ({
            id: w.id,
            name: w.name,
            address: w.address,
            city: w.city,
            state: w.state,
            pincode: w.pincode,
            isActive: w.isActive,
            isDisabled: w.isDisabled,
            createdAt: w.createdAt,
            vendorId: w.vendorId,
            vendorName: w.vendor?.businessName ?? null,
            // On the staff directory, only the platform pool is managed here.
            isMine: auth.kind === "vendor"
                ? w.vendorId === auth.vendorProfile.id
                : w.vendorId === null,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Fetch warehouses error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}

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

        const parsed = createWarehouseSchema.safeParse(body);

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

        // Vendors always own what they create. Staff create platform warehouses
        // unless a vendorId is given, in which case it is created for that vendor.
        let ownerVendorId: string | null = null;

        if (auth.kind === "vendor") {
            ownerVendorId = auth.vendorProfile.id;
        } else if (data.vendorId) {
            const vendor = await prisma.vendorProfile.findUnique({
                where: { id: data.vendorId },
                select: { id: true },
            });

            if (!vendor) {
                return NextResponse.json(
                    { success: false, error: "Vendor not found." },
                    { status: 400 }
                );
            }

            ownerVendorId = vendor.id;
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                vendorId: ownerVendorId,
                name: data.name,
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                pincode: data.pincode || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    ...warehouse,
                    vendorName: null,
                    isMine: true,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create warehouse error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}
