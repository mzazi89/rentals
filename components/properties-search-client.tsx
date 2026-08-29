"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { PropertyFiltersPanel } from "@/components/properties";
import { Sheet } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/layout";

function buildQuery(filters: Record<string, string>, sort: string, page = 1): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) params.set(k, v);
  });
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

/**
 * Client controller for the search page: sort, filter drawer/sidebar and
 * pagination all push URL params; the results grid (server-rendered
 * `children`) re-renders with the new query.
 */
export function PropertySearchClient({
  filters,
  sort,
  types,
  amenities,
  page,
  pageSize,
  total,
  children,
}: {
  filters: Record<string, string>;
  sort: string;
  types: { id: string; name: string }[];
  amenities: { id: string; name: string }[];
  page: number;
  pageSize: number;
  total: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const applyFilters = (patch: Record<string, string>) => {
    setSheetOpen(false);
    router.push(`/properties?${buildQuery(patch, sort)}`);
  };

  const changeSort = (value: string) => {
    router.push(`/properties?${buildQuery(filters, value)}`);
  };

  const changePage = (p: number) => {
    router.push(`/properties?${buildQuery(filters, sort, p)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mt-6">
      {/* Sort row + mobile filter trigger */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> Properties found
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">Sort results</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="recommended">Recommended</option>
            <option value="lowest_rent">Lowest rent</option>
            <option value="highest_rent">Highest rent</option>
            <option value="most_popular">Most popular</option>
          </select>
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-xl border bg-card p-5 lg:block">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Filters</h2>
          <PropertyFiltersPanel current={filters} onChange={applyFilters} amenities={amenities} types={types} />
        </aside>

        {/* Results (server-rendered) */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filters" side="right">
        <PropertyFiltersPanel
          current={filters}
          onChange={applyFilters}
          onClose={() => setSheetOpen(false)}
          amenities={amenities}
          types={types}
        />
      </Sheet>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={changePage} />
      </div>
    </div>
  );
}
