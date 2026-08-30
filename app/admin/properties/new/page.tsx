import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { PropertyWizard } from "@/components/forms/property-wizard";
import type { Amenity, PropertyType } from "@/types";

export const metadata = { title: "New property" };

export default async function AdminNewPropertyPage() {
  const [types, amenities] = await Promise.all([
    db<PropertyType[]>`select * from property_types where is_active = true order by sort_order`,
    db<Amenity[]>`select * from amenities where is_active = true order by sort_order`,
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add a new property"
        description="The owner adds buildings. After saving, assign a verified agent to manage it."
      />
      <PropertyWizard propertyTypes={types} amenities={amenities} successHref="/admin/properties" />
    </div>
  );
}
