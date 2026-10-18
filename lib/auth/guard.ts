import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"];

export async function requireStaff(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: "Not logged in", status: 401 as const };

  const session = await verifySessionToken(token);
  if (!session) return { error: "Session expired or invalid", status: 401 as const };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return { error: "Account not found or inactive", status: 401 as const };

  if (!STAFF_ROLES.includes(user.role)) {
    return { error: "Staff access required", status: 403 as const };
  }

  return { user };
}
export async function requireVendor(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: "Not logged in", status: 401 as const };

  const session = await verifySessionToken(token);
  if (!session) return { error: "Session expired or invalid", status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { vendorProfile: true },
    relationLoadStrategy: "join",
  });

  if (!user || !user.isActive) {
    return { error: "Account not found or inactive", status: 401 as const };
  }
  if (user.role !== "VENDOR" || !user.vendorProfile) {
    return { error: "Vendor access required", status: 403 as const };
  }
  if (!user.vendorProfile.isActive) {
    return { error: "Vendor account is inactive", status: 403 as const };
  }

  return { user, vendorProfile: user.vendorProfile };
}
export async function requireRetailer(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: "Not logged in", status: 401 as const };

  const session = await verifySessionToken(token);
  if (!session) return { error: "Session expired or invalid", status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { retailerProfile: true },
    relationLoadStrategy: "join",
  });

  if (!user || !user.isActive) {
    return { error: "Account not found or inactive", status: 401 as const };
  }
  if (user.role !== "RETAILER" || !user.retailerProfile) {
    return { error: "Whole Seller access required", status: 403 as const };
  }
  if (user.retailerProfile.status !== "APPROVED") {
    return { error: "Your retailer account is not yet approved", status: 403 as const };
  }

  return { user, retailerProfile: user.retailerProfile };
}
// Read-only catalogue browsing: approved retailers, plus staff and vendors.
export async function requireCatalogueViewer(request: NextRequest) {
  const retailer = await requireRetailer(request);
  if (!("error" in retailer)) return retailer;

  const staffOrVendor = await requireStaffOrVendor(request);
  if (!("error" in staffOrVendor)) return staffOrVendor;

  // Nobody matched: keep the retailer error (401 vs "not approved").
  return retailer;
}
export async function requireStaffOrVendor(request: NextRequest) {
  const staff = await requireStaff(request);
  if (!("error" in staff)) return staff;

  const vendor = await requireVendor(request);
  if (!("error" in vendor)) return vendor;

  // Not logged in at all -> 401; logged in but wrong role -> 403.
  const status = staff.status === 401 ? (401 as const) : (403 as const);
  return { error: "Admin or vendor access required", status };
}