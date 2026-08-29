import { redirect } from "next/navigation";
import { RoleSelectForm } from "@/components/auth-forms";
import { getCurrentProfile, dashboardPathForRole } from "@/lib/auth/helpers";

export const metadata = {
  title: "Choose your role",
  robots: { index: false, follow: false } as const,
};

export default async function RoleSelectionPage() {
  const profile = await getCurrentProfile();

  // Already onboarded → straight to their dashboard
  if (profile?.role && profile.is_onboarded) {
    redirect(dashboardPathForRole(profile.role) ?? "/login");
  }

  return (
    <>
      <h1 className="text-2xl font-bold">What brings you to RentHub?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Pick a role to personalise your experience.</p>
      <div className="mt-6">
        <RoleSelectForm />
      </div>
    </>
  );
}
