"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Heart,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/feedback";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { getPropertyTypes } from "@/app/actions/data";
import { getMyFavoriteIds } from "@/app/actions/favorites";
import { toggleFavorite } from "@/app/actions/favorites";
import type { PropertyImage, PropertyType } from "@/types";

/* ------------------------------------------------------------------ */
/* PropertyImage — renders absolute URLs (Blob / /uploads/…)           */
/* ------------------------------------------------------------------ */
export function PropertyImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <Home className="size-10 opacity-40" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} sizes={sizes} className={cn("object-cover", className)} />;
}

export function VerificationBadge({ verified, className }: { verified?: boolean | null; className?: string }) {
  if (!verified) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[11px] font-semibold text-white", className)}>
      <ShieldCheck className="size-3" /> Verified
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* FavoriteButton                                                     */
/* ------------------------------------------------------------------ */
export function FavoriteButton({
  propertyId,
  initialFavorited = false,
  size = "md",
}: {
  propertyId: string;
  initialFavorited?: boolean;
  size?: "md" | "lg";
}) {
  const [favorited, setFavorited] = React.useState<boolean | null>(initialFavorited ? true : null);
  const [loading, setLoading] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // When no initial state is given, resolve the current state once.
  React.useEffect(() => {
    if (initialFavorited) return;
    let cancelled = false;
    getMyFavoriteIds()
      .then((ids) => {
        if (!cancelled) setFavorited(ids.includes(propertyId));
      })
      .catch(() => {
        if (!cancelled) setFavorited(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, initialFavorited]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const session = await authClient.getSession();
    if (!session?.data) {
      setPromptOpen(true);
      return;
    }
    setLoading(true);
    try {
      const result = await toggleFavorite(propertyId);
      if (result.ok) {
        setFavorited(result.favorited);
        toast(result.favorited ? "Property saved" : "Removed from saved properties", result.favorited ? "success" : "info");
        router.refresh();
      } else {
        toast("Something went wrong. Please try again.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const active = favorited ?? false;

  return (
    <>
      <button
        type="button"
        aria-label={active ? "Remove from saved" : "Save property"}
        aria-pressed={active}
        disabled={loading}
        onClick={toggle}
        className={cn(
          "flex items-center justify-center rounded-full bg-white/95 shadow transition-transform hover:scale-105 disabled:opacity-60",
          size === "lg" ? "size-11" : "size-9"
        )}
      >
        <Heart className={cn("size-4", active ? "fill-red-500 text-red-500" : "text-foreground")} />
      </button>
      <SignInPrompt open={promptOpen} onClose={() => setPromptOpen(false)} title="Save favourite properties" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* PropertyCard                                                       */
/* ------------------------------------------------------------------ */
export function PropertyCard({
  property,
  className,
}: {
  property: {
    id: string;
    slug: string;
    title: string;
    monthly_rent: number;
    bedrooms: number | null;
    bathrooms: number | null;
    furnished?: boolean;
    city?: string | null;
    neighborhood?: string | null;
    county?: string | null;
    verified?: boolean;
    status?: string;
    is_favorited?: boolean;
    images?: PropertyImage[];
    property_type?: PropertyType | null;
  };
  className?: string;
}) {
  const primary = property.images?.find((i) => i.is_primary) ?? property.images?.[0];
  const location = [property.neighborhood, property.city].filter(Boolean).join(", ") || property.county || "Location on request";

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyImage
          src={primary?.url}
          alt={property.title}
          className="size-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow">
            {property.property_type?.name ?? "Property"}
          </span>
          {property.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white shadow">
              <ShieldCheck className="size-3" /> Verified
            </span>
          ) : null}
        </div>
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={property.id} initialFavorited={property.is_favorited} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {location}
        </p>
        <h3 className="mt-1 line-clamp-1 font-semibold">{property.title}</h3>
        <p className="mt-1.5 text-lg font-bold text-primary">
          {formatMoney(property.monthly_rent)}
          <span className="text-xs font-normal text-muted-foreground"> / month</span>
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {property.bedrooms ?? 0} Beds</span>
          <span className="flex items-center gap-1"><Bath className="size-3.5" /> {property.bathrooms ?? 0} Baths</span>
          {property.furnished ? <span className="rounded bg-muted px-1.5 py-0.5">Furnished</span> : null}
        </div>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary">
          View property <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-5 w-28" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export function PropertyGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* PropertyGallery                                                    */
/* ------------------------------------------------------------------ */
export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const list = images.length > 0 ? images : [];
  const current = list[active]?.url;

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <PropertyImage src={current} alt={`${title} — image ${active + 1}`} priority className="size-full" />
        {list.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {list.map((img, i) => (
              <button
                key={img.id}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-white" : "w-1.5 bg-white/60")}
              />
            ))}
          </div>
        ) : null}
      </div>
      {list.length > 1 ? (
        <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent hover:border-primary/40"
              )}
            >
              <PropertyImage src={img.url} alt="" className="size-full" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Amenities list                                                     */
/* ------------------------------------------------------------------ */
export function AmenitiesList({
  amenities,
  className,
}: {
  amenities: { id: string; name: string; icon?: string | null }[];
  className?: string;
}) {
  if (amenities.length === 0) {
    return <p className="text-sm text-muted-foreground">No amenities listed.</p>;
  }
  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {amenities.map((a) => (
        <li key={a.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <Building2 className="size-4 text-primary" />
          {a.name}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Hero / search bar                                                  */
/* ------------------------------------------------------------------ */
export function PropertySearchBar() {
  const router = useRouter();
  const [location, setLocation] = React.useState("");
  const [type, setType] = React.useState("");
  const [minRent, setMinRent] = React.useState("");
  const [maxRent, setMaxRent] = React.useState("");
  const [bedrooms, setBedrooms] = React.useState("");
  const [types, setTypes] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    getPropertyTypes().then(setTypes).catch(() => {});
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="grid w-full gap-2 rounded-2xl border border-white/15 bg-black/50 p-3 shadow-lift backdrop-blur sm:grid-cols-2 lg:grid-cols-5"
      role="search"
    >
      <label className="relative">
        <span className="sr-only">Location</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g. Kilimani)"
          className="h-12 w-full rounded-lg border border-white/15 bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label>
        <span className="sr-only">Property type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Property type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id} className="bg-background text-foreground">{t.name}</option>
          ))}
        </select>
      </label>
      <input
        value={minRent}
        onChange={(e) => setMinRent(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder="Min rent (KSh)"
        aria-label="Minimum rent"
        className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        value={maxRent}
        onChange={(e) => setMaxRent(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder="Max rent (KSh)"
        aria-label="Maximum rent"
        className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex gap-2">
        <select
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          aria-label="Bedrooms"
          className="h-12 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Bedrooms</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n} className="bg-background text-foreground">{n}+ Beds</option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
        >
          <Search className="size-4" /> <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Filters panel (URL-driven)                                         */
/* ------------------------------------------------------------------ */
export function PropertyFiltersPanel({
  current,
  onChange,
  onClose,
  amenities,
  types,
}: {
  current: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  onClose?: () => void;
  amenities: { id: string; name: string }[];
  types: { id: string; name: string }[];
}) {
  const set = (key: string, value: string) => {
    const next = { ...current };
    if (value === "" || value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const toggleAmenity = (id: string) => {
    const existing = current.amenities ? current.amenities.split(",").filter(Boolean) : [];
    const next = existing.includes(id) ? existing.filter((a) => a !== id) : [...existing, id];
    set("amenities", next.join(","));
  };

  const clearAll = () => {
    onChange({});
    onClose?.();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Location</h3>
        <input
          value={current.location ?? ""}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Neighborhood, city or county"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="f-type" className="text-sm font-semibold">Type</label>
          <select id="f-type" value={current.type ?? ""} onChange={(e) => set("type", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="f-beds" className="text-sm font-semibold">Bedrooms</label>
          <select id="f-beds" value={current.bedrooms ?? ""} onChange={(e) => set("bedrooms", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="f-baths" className="text-sm font-semibold">Bathrooms</label>
          <select id="f-baths" value={current.bathrooms ?? ""} onChange={(e) => set("bathrooms", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="f-max" className="text-sm font-semibold">Max rent</label>
          <input id="f-max" inputMode="numeric" value={current.maxRent ?? ""} onChange={(e) => set("maxRent", e.target.value.replace(/\D/g, ""))} placeholder="KSh" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={current.furnished === "true"} onChange={(e) => set("furnished", e.target.checked ? "true" : "")} className="size-4 accent-primary" />
          Furnished
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={current.verifiedOnly === "true"} onChange={(e) => set("verifiedOnly", e.target.checked ? "true" : "")} className="size-4 accent-primary" />
          Verified only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={current.featuredOnly === "true"} onChange={(e) => set("featuredOnly", e.target.checked ? "true" : "")} className="size-4 accent-primary" />
          Featured only
        </label>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Amenities</h3>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map((a) => {
            const active = (current.amenities ?? "").split(",").includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleAmenity(a.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
                )}
              >
                <SlidersHorizontal className="size-3.5" /> {a.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 border-t pt-4">
        <button type="button" onClick={clearAll} className="h-10 flex-1 rounded-md border px-4 text-sm font-medium hover:bg-muted">
          Clear all
        </button>
        {onClose ? (
          <button type="button" onClick={onClose} className="h-10 flex-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Show results
          </button>
        ) : null}
      </div>
    </div>
  );
}
