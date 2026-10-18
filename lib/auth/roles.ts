
export const STAFF_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "OPERATIONS_MANAGER",
] as const;

export const ADMIN_AREA_ROLES = [...STAFF_ROLES, "VENDOR"] as const;

// The /admin pages a VENDOR may open.
export const VENDOR_ALLOWED_ADMIN_PATHS = [
  "/admin/products",
  "/admin/collections",
  "/admin/collection",
  "/admin/warehouses",
  "/admin/orders",
  "/admin/sample-call-requests",
  "/admin/profile",
  "/admin/categories",
];

export function isStaffRole(
  role: string | undefined | null
): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function canAccessAdminPath(
  role: string | undefined | null,
  pathname: string
): boolean {
  if (isStaffRole(role)) return true;

  if (role === "VENDOR") {
    const path = pathname.replace(/\/+$/, "") || "/";

    return VENDOR_ALLOWED_ADMIN_PATHS.some(
      (p) => path === p || path.startsWith(p + "/")
    );
  }

  return false;
}