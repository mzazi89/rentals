import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/helpers";

export const metadata = { title: "Add property" };

/**
 * Agents no longer add properties — the owner creates listings and assigns
 * them. This route is kept only to redirect anyone hitting the old URL.
 */
export default async function NewPropertyPage() {
  const profile = await requireProfile();
  if (profile.role === "agent") redirect("/dashboard/agent/properties");
  if (profile.role === "landlord") redirect("/dashboard/landlord/properties");
  redirect("/dashboard");
}
