import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const select = {
  id: true,
  name: true,
  tag: true,
  contactPerson: true,
  phone: true,
  altPhone: true,
  whatsapp: true,
  email: true,
  addressLine: true,
  city: true,
  state: true,
  pincode: true,
  mapUrl: true,
  hours: true,
  closedDays: true,
  sortOrder: true,
} as const;

/* ------------------------------ helpers --------------------------------- */



const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const PHONE_RE = /^\+?[\d\s-]{10,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parse(raw: Record<string, unknown>, partial: boolean) {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];
  const has = (k: string) => raw[k] !== undefined;

  // required text fields
  const required: [string, number][] = [["name", 100], ["addressLine", 200], ["city", 80]];
  for (const [k, max] of required) {
    if (partial && !has(k)) continue;
    const v = text(raw[k], max);
    if (!v) errors.push(`${k} is required`);
    else data[k] = v;
  }

  if (!partial || has("phone")) {
    const v = text(raw.phone, 20);
    if (!PHONE_RE.test(v)) errors.push("phone is required and must be a valid number");
    else data.phone = v;
  }

  // optional text fields (empty string clears the value)
  const optional: [string, number][] = [
    ["tag", 40], ["contactPerson", 100], ["state", 80],
    ["pincode", 10], ["hours", 120], ["closedDays", 60],
  ];
  for (const [k, max] of optional) if (has(k)) data[k] = text(raw[k], max) || null;

  if (has("altPhone")) {
    const v = text(raw.altPhone, 20);
    if (v && !PHONE_RE.test(v)) errors.push("altPhone is invalid");
    else data.altPhone = v || null;
  }

  if (has("whatsapp")) {
    const d = text(raw.whatsapp, 20).replace(/\D/g, "");
    if (d && (d.length < 10 || d.length > 15)) errors.push("whatsapp is invalid");
    else data.whatsapp = d || null;
  }

  if (has("email")) {
    const v = text(raw.email, 150);
    if (v && !EMAIL_RE.test(v)) errors.push("email is invalid");
    else data.email = v || null;
  }

  if (has("mapUrl")) {
    const v = text(raw.mapUrl, 500);
    if (v && !/^https:\/\//i.test(v)) errors.push("mapUrl must start with https://");
    else data.mapUrl = v || null;
  }

  if (Number.isInteger(raw.sortOrder)) data.sortOrder = raw.sortOrder;
  if (typeof raw.isActive === "boolean") data.isActive = raw.isActive;

  return { data, errors };
}

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/* ---------------------- GET /api/contact (public) ----------------------- */

export async function GET() {
  try {
    const data = await prisma.contactBranch.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[contact] GET failed:", error);
    return fail("Could not load contacts.", 500);
  }
}

/* ------------------------ POST /api/contact (admin) --------------------- */
/* Body: { name, phone, addressLine, city, ...optional fields } */

export async function POST(req: NextRequest) {

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("Invalid JSON.", 400); }

  const { data, errors } = parse(body, false);
  if (errors.length) return NextResponse.json({ success: false, errors }, { status: 422 });

  try {
    const created = await prisma.contactBranch.create({ data: data as never, select });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[contact] POST failed:", error);
    return fail("Could not create contact.", 500);
  }
}

/* ------------------------ PATCH /api/contact (admin) -------------------- */
/* Body: { id, ...fields to change } */

export async function PATCH(req: NextRequest) {

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("Invalid JSON.", 400); }

  const id = text(body.id, 50);
  if (!id) return fail("id is required.", 422);

  const { data, errors } = parse(body, true);
  if (errors.length) return NextResponse.json({ success: false, errors }, { status: 422 });

  try {
    const updated = await prisma.contactBranch.update({ where: { id }, data: data as never, select });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return fail("Contact not found.", 404);
    console.error("[contact] PATCH failed:", error);
    return fail("Could not update contact.", 500);
  }
}

/* ---------------------- DELETE /api/contact?id=... (admin) --------------- */

export async function DELETE(req: NextRequest) {

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("id is required.", 422);

  try {
    await prisma.contactBranch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return fail("Contact not found.", 404);
    console.error("[contact] DELETE failed:", error);
    return fail("Could not delete contact.", 500);
  }
}