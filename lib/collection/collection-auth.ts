import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

/** Roles that can manage every collection */
const ADMIN_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"];

export type Actor = {
  userId: string;
  name: string;
  email: string | null;
  role: UserRole;
  isAdmin: boolean;
  vendorId: string | null; // VendorProfile.id when the user is a vendor
  vendorBusinessName: string | null;
};

/**
 * Current logged-in user, or null.
 * Can be called inside route handlers with `req` or in server components without args.
 */
export async function getActor(request?: NextRequest): Promise<Actor | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Called in an environment without cookie context
      token = undefined;
    }
  }

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session || !session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      vendorProfile: {
        select: {
          id: true,
          isActive: true,
          businessName: true,
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const isAdmin = ADMIN_ROLES.includes(user.role);
  const isVendor = user.role === "VENDOR" && !!user.vendorProfile?.isActive;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin,
    vendorId: isVendor ? user.vendorProfile!.id : null,
    vendorBusinessName: isVendor ? user.vendorProfile!.businessName : null,
  };
}
