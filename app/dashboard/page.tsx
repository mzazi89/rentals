import { redirect } from "next/navigation";
import { getCurrentProfile, dashboardPathForRole } from "@/lib/auth/helpers";

export default async function DashboardIndexPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(dashboardPathForRole(profile.role) ?? "/signup/role");
}
