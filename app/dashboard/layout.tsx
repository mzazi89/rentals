import { redirect } from "next/navigation";
import { requireProfile, dashboardPathForRole, isOwnerRole } from "@/lib/auth/helpers";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  if (!profile.role) redirect("/signup/role");
  if (!profile.is_onboarded && !isOwnerRole(profile.role)) {
    redirect(`/signup/onboarding/${profile.role}`);
  }
  if (profile.status === "suspended") redirect("/account-suspended");
  if (profile.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopbar profileName={profile.full_name} profileAvatar={profile.avatar_url} role={profile.role} />
      <div className="flex flex-1">
        <DashboardSidebar role={profile.role} userName={profile.full_name} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl pb-16 lg:pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
