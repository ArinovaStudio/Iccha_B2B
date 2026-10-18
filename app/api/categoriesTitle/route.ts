import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Fetch all categories titles or a single title by ID
export async function GET(req: NextRequest) {
  try {

    const categoryTitles = await prisma.categoriesTitle.findMany({});

    return NextResponse.json(categoryTitles, { status: 200 });

  } catch (error) {
    console.error("GET CategoriesTitle error:", error);

    return NextResponse.json(
      { error: "Failed to fetch category titles" },
      { status: 500 }
    );
  }
}

// POST: Create a new category title
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title } = body;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const categoryTitle = await prisma.categoriesTitle.create({
      data: {
        title: title.trim(),
      },
    });

    return NextResponse.json(categoryTitle, { status: 201 });
  } catch (error) {
    console.error("POST CategoriesTitle error:", error);

    return NextResponse.json(
      { error: "Failed to create category title" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing category title
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "Valid ID is required" },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const existingCategoryTitle = await prisma.categoriesTitle.findUnique({
      where: { id },
    });

    if (!existingCategoryTitle) {
      return NextResponse.json(
        { error: "Category title not found" },
        { status: 404 }
      );
    }

    const categoryTitle = await prisma.categoriesTitle.update({
      where: { id },
      data: {
        title: title.trim(),
      },
    });

    return NextResponse.json(categoryTitle, { status: 200 });
  } catch (error) {
    console.error("PUT CategoriesTitle error:", error);

    return NextResponse.json(
      { error: "Failed to update category title" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a category title using its ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.categoriesTitle.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Category title deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE CategoriesTitle error:", error);

    return NextResponse.json(
      { error: "Failed to delete category title" },
      { status: 500 }
    );
  }
}