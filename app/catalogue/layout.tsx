import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getSession";
import { ADMIN_AREA_ROLES } from "@/lib/auth/roles";
import {
  CatalogueViewerProvider,
  type CatalogueViewerRole,
} from "@/lib/context/CatalogueViewerContext";

// The wholesale catalogue needs a login, but not a retailer role:
// approved retailers can order from it; admins and vendors can only browse it.
export default async function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "RETAILER") {
    const status = user.retailerProfile?.status;

    if (status === "DEACTIVATED") {
      redirect("/retailer/deactivated");
    }
    if (status !== "APPROVED") {
      redirect(`/application-status?email=${encodeURIComponent(user.email)}`);
    }

    return (
      <CatalogueViewerProvider role="RETAILER">{children}</CatalogueViewerProvider>
    );
  }

  if ((ADMIN_AREA_ROLES as readonly string[]).includes(user.role)) {
    const viewerRole: CatalogueViewerRole =
      user.role === "VENDOR" ? "VENDOR" : "ADMIN";

    return (
      <CatalogueViewerProvider role={viewerRole}>{children}</CatalogueViewerProvider>
    );
  }

  redirect("/login");
}
