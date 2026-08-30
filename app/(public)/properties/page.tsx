import { Suspense } from "react";
import { EmptyState } from "@/components/ui/feedback";
import { Home as HomeIcon } from "lucide-react";
import { db } from "@/db";
import { getPublicProperties, type PropertyWithRelations } from "@/lib/queries";
import { PropertyCard, PropertyGrid, PropertyCardSkeleton } from "@/components/properties";
import { PropertySearchClient } from "@/components/properties-search-client";
import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Rental properties in Kenya",
  description:
    "Browse apartments, houses, bedsitters and more across Kenya. Filter by location, budget, bedrooms and amenities.",
  path: "/properties",
});

function parseNum(value: string | string[] | undefined): number | undefined {
  if (Array.isArray(value)) value = value[0];
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    location: typeof searchParams.location === "string" ? searchParams.location : undefined,
    county: typeof searchParams.county === "string" ? searchParams.county : undefined,
    neighborhood: typeof searchParams.neighborhood === "string" ? searchParams.neighborhood : undefined,
    type: typeof searchParams.type === "string" ? searchParams.type : undefined,
    minRent: parseNum(searchParams.minRent),
    maxRent: parseNum(searchParams.maxRent),
    bedrooms: parseNum(searchParams.bedrooms),
    bathrooms: parseNum(searchParams.bathrooms),
    furnished: searchParams.furnished === "true",
    verifiedOnly: searchParams.verifiedOnly === "true",
    featuredOnly: searchParams.featuredOnly === "true",
    amenities: typeof searchParams.amenities === "string" && searchParams.amenities
      ? searchParams.amenities.split(",")
      : undefined,
    sort: (typeof searchParams.sort === "string" ? searchParams.sort : "newest") as
      | "newest"
      | "lowest_rent"
      | "highest_rent"
      | "most_popular"
      | "recommended",
    page: parseNum(searchParams.page) ?? 1,
  };

  const [result, typesData, amenitiesData] = await Promise.all([
    getPublicProperties(filters),
    db<{ id: string; name: string }[]>`select id, name from property_types where is_active = true order by sort_order`,
    db<{ id: string; name: string }[]>`select id, name from amenities where is_active = true order by sort_order`,
  ]);

  const currentFilters: Record<string, string> = {};
  if (filters.q) currentFilters.q = filters.q;
  if (filters.location) currentFilters.location = filters.location;
  if (filters.type) currentFilters.type = filters.type;
  if (filters.minRent) currentFilters.minRent = String(filters.minRent);
  if (filters.maxRent) currentFilters.maxRent = String(filters.maxRent);
  if (filters.bedrooms) currentFilters.bedrooms = String(filters.bedrooms);
  if (filters.bathrooms) currentFilters.bathrooms = String(filters.bathrooms);
  if (filters.furnished) currentFilters.furnished = "true";
  if (filters.verifiedOnly) currentFilters.verifiedOnly = "true";
  if (filters.featuredOnly) currentFilters.featuredOnly = "true";
  if (filters.amenities && filters.amenities.length > 0) currentFilters.amenities = filters.amenities.join(",");

  return (
    <div>
      <PublicPageHero
        title="Rental properties"
        subtitle={
          filters.location
            ? `Properties in or near ${filters.location}`
            : "Verified rentals across Kenya — filter by location, budget, bedrooms and amenities to find your next home."
        }
        image={PAGE_IMAGES.dusk}
      />
      <div className="container py-8">
      <Suspense fallback={null}>
        <PropertySearchClient
          filters={currentFilters}
          sort={filters.sort}
          types={typesData}
          amenities={amenitiesData}
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
        >
          <Suspense
            fallback={
              <PropertyGrid>
                {Array.from({ length: 8 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </PropertyGrid>
            }
          >
            {result.properties.length === 0 ? (
              <EmptyState
                icon={<HomeIcon className="size-8" />}
                title="No properties match your search"
                description="Try adjusting your filters, or browse all available rentals."
                action={
                  <a
                    href="/properties"
                    className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Clear all filters
                  </a>
                }
              />
            ) : (
              <PropertyGrid>
                {result.properties.map((p: PropertyWithRelations) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </PropertyGrid>
            )}
          </Suspense>
        </PropertySearchClient>
      </Suspense>
      </div>
    </div>
  );
}
