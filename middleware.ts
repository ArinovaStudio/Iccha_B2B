import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { canAccessAdminPath, ADMIN_AREA_ROLES } from "@/lib/auth/roles";

// Build redirect URLs from the public host (set by nginx), not the
// internal localhost:3000 address Next.js sees behind the proxy.
function publicUrl(request: NextRequest, path: string) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return new URL(path, `${proto}://${host}`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isRetailerRoute = pathname === "/retailer" || pathname.startsWith("/retailer/");

  if (!isAdminRoute && !isRetailerRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = publicUrl(request, "/login");
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!(ADMIN_AREA_ROLES as readonly string[]).includes(session.role)) {
      return NextResponse.redirect(publicUrl(request, "/login"));
    }
    // Vendors get the vendor pages only — not KYC, roles, settings, hero, etc.
    if (!canAccessAdminPath(session.role, pathname)) {
      return NextResponse.redirect(publicUrl(request, "/admin/products"));
    }
  }

  if (isRetailerRoute && session.role !== "RETAILER") {
    return NextResponse.redirect(publicUrl(request, "/login"));
  }

  // Hand the path to server components so the layout can re-check against the DB role.
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/retailer/:path*"],
};