import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PropertyWizard } from "@/components/forms/property-wizard";
import { PageHeader } from "@/components/dashboard";
import { Alert } from "@/components/ui/feedback";
import { isVerifiedAgent } from "@/lib/permissions";
import type { Amenity, PropertyType } from "@/types";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  const profile = await requireProfile();

  if (profile.role === "agent") {
    const verified = await isVerifiedAgent(profile.id);
    if (!verified) {
      redirect("/dashboard/agent/profile");
    }
  }

  const [types, amenities] = await Promise.all([
    db<PropertyType[]>`select * from property_types where is_active = true order by sort_order`,
    db<Amenity[]>`select * from amenities where is_active = true order by sort_order`,
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add a new property"
        description="Complete the steps below to publish your listing."
      />
      {profile.role === "agent" ? (
        <div className="mb-4">
          <Alert variant="info" title="Verification required">
            Your listing will be reviewed by our team before going live.
          </Alert>
        </div>
      ) : null}
      <PropertyWizard propertyTypes={types} amenities={amenities} />
    </div>
  );
}
