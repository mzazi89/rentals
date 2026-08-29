import Link from "next/link";
import { Heart } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { getMyFavoriteProperties } from "@/app/actions/favorites";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui/feedback";
import { PropertyCard, PropertyGrid } from "@/components/properties";

export const metadata = { title: "Saved properties" };

export default async function SavedPropertiesPage() {
  await requireProfile();
  const properties = await getMyFavoriteProperties();

  return (
    <div>
      <PageHeader title="Saved properties" description="Properties you've saved for later." />
      {properties.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="You haven't saved any properties yet"
          description="Tap the heart icon on any property to save it here."
          action={
            <Link href="/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Browse properties →
            </Link>
          }
        />
      ) : (
        <PropertyGrid>
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </PropertyGrid>
      )}
    </div>
  );
}
