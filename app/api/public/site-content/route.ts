import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [about, homeFeatures] = await Promise.all([
      prisma.aboutPageContent.findUnique({ where: { id: "main" } }),
      prisma.homeFeaturesContent.findUnique({ where: { id: "main" } }),
    ]);
    return NextResponse.json({ success: true, data: { about: about?.content ?? null, homeFeatures: homeFeatures?.content ?? null } });
  } catch (error) {
    console.error("Public site content fetch failed", error);
    return NextResponse.json({ success: false, error: "Could not load site content" }, { status: 500 });
  }
}
