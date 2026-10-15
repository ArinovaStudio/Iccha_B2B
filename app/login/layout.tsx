import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getSession";
import { isStaffRole } from "@/lib/auth/roles";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  if (isStaffRole(user.role)) {
    redirect("/admin");
  }

  if (user.role === "VENDOR") {
    redirect("/admin/products");
  }

  if (user.role === "RETAILER") {
    const status = user.retailerProfile?.status;

    // IMPORTANT: DEACTIVATED must be checked first
    if (status === "DEACTIVATED") {
      redirect("/retailer/deactivated");
    }

    if (status === "APPROVED") {
      redirect("/catalogue");
    }

    // Only pending/non-approved/non-deactivated retailers
    // should reach application status.
    redirect(`/application-status?email=${encodeURIComponent(user.email)}`);
  }

  return <>{children}</>;
}