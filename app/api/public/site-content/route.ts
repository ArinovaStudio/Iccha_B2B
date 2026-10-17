import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { defaultAbout, defaultContact, defaultHomeFeatures } from "@/lib/site-content";

export const dynamic = "force-dynamic";

async function ensureContentTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SiteContent" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function GET() {
  try {
    await ensureContentTable();
    const rows = await prisma.$queryRaw<Array<{ key: string; content: unknown }>>`SELECT "key", "content" FROM "SiteContent" WHERE "key" IN ('about', 'contact', 'homeFeatures')`;
    const content = Object.fromEntries(rows.map((row) => [row.key, row.content]));
    return NextResponse.json({ success: true, data: { about: content.about ?? defaultAbout, contact: content.contact ?? defaultContact, homeFeatures: content.homeFeatures ?? defaultHomeFeatures } });
  } catch (error) {
    console.error("Public site content fetch failed", error);
    return NextResponse.json({ success: true, data: { about: defaultAbout, contact: defaultContact, homeFeatures: defaultHomeFeatures } });
  }
}
