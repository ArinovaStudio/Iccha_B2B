import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { randomUUID } from "node:crypto";

const contentSchema = z.record(z.string(), z.unknown());
async function ensureContentTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SiteContent" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ key: string }> }) {
  const auth = await requireStaff(request);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const { key } = await context.params;
  if (key !== "about" && key !== "contact" && key !== "homeFeatures") return NextResponse.json({ success: false, error: "Unknown content page" }, { status: 404 });
  try {
    const content = contentSchema.parse(await request.json());
    const jsonContent = JSON.parse(JSON.stringify(content));
    await ensureContentTable();
    await prisma.$executeRaw`INSERT INTO "SiteContent" ("id", "key", "content", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${key}, ${JSON.stringify(jsonContent)}::jsonb, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "content" = EXCLUDED."content", "updatedAt" = NOW()`;
    return NextResponse.json({ success: true, data: jsonContent });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: "Content must be a JSON object" }, { status: 400 });
    console.error(`Admin ${key} content save failed`, error);
    return NextResponse.json({ success: false, error: "Failed to save page content" }, { status: 500 });
  }
}
