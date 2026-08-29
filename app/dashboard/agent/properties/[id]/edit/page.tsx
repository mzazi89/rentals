import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PropertyWizard } from "@/components/forms/property-wizard";
import { PageHeader } from "@/components/dashboard";
import type { Amenity, Property, PropertyImage, PropertyType } from "@/types";

export const metadata = { title: "Edit property" };

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  
  const rows = await db<(Property & { images?: PropertyImage[] })[]>`
    select p.*,
      (select coalesce(jsonb_agg(jsonb_build_object('id', pi.id, 'url', pi.url, 'position', pi.position, 'is_primary', pi.is_primary) order by pi.position), '[]'::jsonb)
       from property_images pi where pi.property_id = p.id) as images
    from properties p where p.id = ${params.id}
  `;
  const property = rows[0] ?? null;

  if (!property) notFound();
  if (property.owner_id !== profile.id && property.agent_id !== profile.id && profile.role !== "admin") {
    redirect("/dashboard/agent/properties");
  }

  const [types, amenities, amenityRows] = await Promise.all([
    db<PropertyType[]>`select * from property_types where is_active = true order by sort_order`,
    db<Amenity[]>`select * from amenities where is_active = true order by sort_order`,
    db<{ amenity_id: string }[]>`select amenity_id from property_amenities where property_id = ${params.id}`,
  ]);

  const propertyWithAmenities = {
    ...property,
    amenity_ids: amenityRows.map((r) => r.amenity_id),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit property" description="Update your listing details." />
      <PropertyWizard
        propertyTypes={types}
        amenities={amenities}
        initial={propertyWithAmenities}
      />
    </div>
  );
}
