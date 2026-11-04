import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

const schema = z.record(z.string(), z.unknown());
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  try {
    const row = await prisma.aboutPageContent.findUnique({ where: { id: "main" } });
    return NextResponse.json({ success: true, data: row?.content ?? null });
  } catch (error) {
    console.error("Admin About content load failed", error);
    return NextResponse.json({ success: false, error: "Failed to load About content" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  try {
    const content = schema.parse(await request.json());
    const row = await prisma.aboutPageContent.upsert({ where: { id: "main" }, create: { id: "main", content }, update: { content } });
    return NextResponse.json({ success: true, data: row.content });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: "Content must be a JSON object" }, { status: 400 });
    console.error("Admin About content save failed", error);
    return NextResponse.json({ success: false, error: "Failed to save About content" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  await prisma.aboutPageContent.deleteMany({ where: { id: "main" } });
  return NextResponse.json({ success: true });
}
