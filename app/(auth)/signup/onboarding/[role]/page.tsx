import { notFound, redirect } from "next/navigation";
import { getCurrentProfile, dashboardPathForRole } from "@/lib/auth/helpers";
import {
  TenantOnboardingForm,
  AgentOnboardingForm,
  LandlordOnboardingForm,
} from "@/components/onboarding-forms";
import type { Role } from "@/types";

export const metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false } as const,
};

const TITLES: Record<string, { title: string; sub: string }> = {
  tenant: { title: "Tell us about you", sub: "We'll use this to recommend the best properties." },
  agent: { title: "Agent profile", sub: "Your profile goes to our team for verification." },
  landlord: { title: "Landlord profile", sub: "Your account must be verified by the owner before your buildings appear in explore." },
};

export default async function OnboardingPage({ params }: { params: { role: string } }) {
  const role = params.role as Role;
  if (!["tenant", "agent", "landlord"].includes(role)) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role && profile.role !== role) redirect(dashboardPathForRole(profile.role) ?? "/signup/role");
  if (profile.is_onboarded && profile.role) redirect(dashboardPathForRole(profile.role) ?? "/dashboard");

  const copy = TITLES[role];

  return (
    <>
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.sub}</p>
      <div className="mt-6">
        {role === "tenant" ? <TenantOnboardingForm /> : role === "agent" ? <AgentOnboardingForm /> : <LandlordOnboardingForm />}
      </div>
    </>
  );
}
