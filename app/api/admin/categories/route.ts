import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireStaff,
  requireVendor,
  requireRetailer,
} from "@/lib/auth/guard";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const vendorId = searchParams.get("vendorId");
    const owner = searchParams.get("owner");

    const staffResult = await requireStaff(request);

    if (!("error" in staffResult)) {
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          ...(owner === "admin"
            ? { vendorId: null }
            : vendorId
              ? { vendorId }
              : {}),
        },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          requiresSize: true,
          vendorId: true,
          gst: true,
          mediaAsset: {
            select: { publicUrl: true },
          },
          _count: {
            select: { products: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    const vendorResult = await requireVendor(request);

    if (!("error" in vendorResult)) {
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          vendorId: vendorResult.vendorProfile.id,
        },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          requiresSize: true,
          vendorId: true,
          mediaAsset: {
            select: { publicUrl: true },
          },
          _count: {
            select: { products: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    const retailerResult = await requireRetailer(request);

    if (!("error" in retailerResult)) {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          requiresSize: true,
          vendorId: true,
          mediaAsset: {
            select: { publicUrl: true },
          },
          _count: {
            select: { products: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    return NextResponse.json(
      { success: false, error: "Login required" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Categories list error:", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default("kurti_pant_set"),
  mediaAssetId: z.string().optional(),
  requiresSize: z.boolean().default(false),
  vendorId: z.string().nullable().optional(),
  gst: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const staffResult = await requireStaff(request);

    if (!("error" in staffResult)) {
      const body = await request.json();
      const parsed = createCategorySchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const category = await prisma.category.create({
        data: parsed.data,
      });

      return NextResponse.json(
        { success: true, data: category },
        { status: 201 }
      );
    }

    const vendorResult = await requireVendor(request);

    if (!("error" in vendorResult)) {
      const body = await request.json();
      const parsed = createCategorySchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const category = await prisma.category.create({
        data: {
          ...parsed.data,
          vendorId: vendorResult.vendorProfile.id,
        },
      });

      return NextResponse.json(
        { success: true, data: category },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Staff or vendor access required" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Create category error:", error);

    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
