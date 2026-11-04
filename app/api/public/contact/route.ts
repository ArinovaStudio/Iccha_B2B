import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";

export async function GET() {
  try {
    const row = await prisma.contactBranch.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json({ success: true, data: row });
  } catch (error) { console.error("Public contact load failed", error); return NextResponse.json({ success: false, error: "Could not load contact details" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request); if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  try { const data = await request.json(); const created = await prisma.contactBranch.create({ data }); return NextResponse.json({ success: true, data: created }, { status: 201 }); }
  catch (error) { console.error("Contact create failed", error); return NextResponse.json({ success: false, error: "Could not create contact" }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  const auth = await requireStaff(request); if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  try { const { id, ...data } = await request.json(); const updated = await prisma.contactBranch.update({ where: { id }, data }); return NextResponse.json({ success: true, data: updated }); }
  catch (error) { console.error("Contact update failed", error); return NextResponse.json({ success: false, error: "Could not update contact" }, { status: 500 }); }
}
export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request); if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ success: false, error: "Contact ID is required" }, { status: 400 });
  try { await prisma.contactBranch.delete({ where: { id } }); return NextResponse.json({ success: true }); }
  catch (error) { console.error("Contact delete failed", error); return NextResponse.json({ success: false, error: "Could not delete contact" }, { status: 500 }); }
}
