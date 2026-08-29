import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  CalendarDays,
  Clock,
  DoorOpen,
  MapPin,
  Maximize,
  Phone,
  ShieldCheck,
  Sofa,
} from "lucide-react";
import {
  getPropertyBySlug,
  getSimilarProperties,
  incrementPropertyViews,
  type PropertyWithRelations,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/helpers";
import { buildMetadata } from "@/lib/seo";
import { formatDate, formatMoney } from "@/lib/utils";
import { PropertyGallery, AmenitiesList, VerificationBadge, FavoriteButton } from "@/components/properties";
import { PropertyDetailActions } from "@/components/property-detail-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { Avatar } from "@/components/ui/layout";
import { Alert } from "@/components/ui/feedback";
import { PropertyCard, PropertyGrid } from "@/components/properties";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) return buildMetadata({ title: "Property not found", path: `/properties/${params.slug}`, noIndex: true });
  const primary = property.images?.find((i) => i.is_primary) ?? property.images?.[0];
  const imageUrl = primary?.url ?? undefined;
  return buildMetadata({
    title: property.title,
    description: `${property.title} in ${[property.neighborhood, property.city, property.county].filter(Boolean).join(", ")} — ${formatMoney(property.monthly_rent)}/month. ${property.description?.slice(0, 140) ?? ""}`,
    path: `/properties/${property.slug}`,
    image: imageUrl,
  });
}

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  const property = await getPropertyBySlug(params.slug, user?.id);

  // Public users can only see available listings (owners/agents see their own via RLS).
  const isOwnerOrAgent =
    user && (property?.owner_id === user.id || property?.agent_id === user.id);
  if (!property) notFound();
  if (property.status !== "available" && !isOwnerOrAgent) notFound();

  const settings = await getSettings();
  void incrementPropertyViews(property.id);

  const similar = await getSimilarProperties(property, 3);

  const amenities = (property.amenity_list ?? []).map((a) => a.amenity);
  const primary = property.images?.find((i) => i.is_primary) ?? property.images?.[0];
  const imageUrl = primary?.url ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: property.title,
    description: property.description ?? undefined,
    image: imageUrl ?? undefined,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/properties/${property.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city ?? undefined,
      addressRegion: property.county ?? undefined,
      addressCountry: "KE",
    },
    offers: {
      "@type": "Offer",
      price: String(property.monthly_rent),
      priceCurrency: settings.currency,
      availability: "https://schema.org/InStock",
    },
  };

  const agent = property.agent as PropertyWithRelations["agent"];
  const agentName = agent?.full_name ?? "RentHub agent";
  const agentVerified = agent?.agents?.verification_status === "verified";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/properties" className="hover:text-foreground">Properties</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{property.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <PropertyGallery images={property.images ?? []} title={property.title} />

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">{property.title}</h1>
                  <VerificationBadge verified={property.verified} />
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {[property.neighborhood, property.city, property.county].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FavoriteButton propertyId={property.id} size="lg" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary sm:text-3xl">
                    {formatMoney(property.monthly_rent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deposit: {formatMoney(property.deposit_amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: BedDouble, label: "Bedrooms", value: property.bedrooms ?? 0 },
                { icon: Bath, label: "Bathrooms", value: property.bathrooms ?? 0 },
                { icon: Maximize, label: "Size", value: property.size ? `${property.size} m²` : "—" },
                { icon: Sofa, label: "Furnished", value: property.furnished ? "Yes" : "No" },
                { icon: CalendarDays, label: "Available", value: property.availability_date ? formatDate(property.availability_date) : "Now" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <s.icon className="size-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <AmenitiesList amenities={amenities} />
              </CardContent>
            </Card>

            {property.latitude && property.longitude ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Map abstraction — provider is configurable (MAPS_API_KEY) */}
                  <div className="overflow-hidden rounded-xl border">
                    <iframe
                      title="Property location map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01}%2C${property.latitude - 0.01}%2C${property.longitude + 0.01}%2C${property.latitude + 0.01}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                      className="h-72 w-full"
                      loading="lazy"
                    />
                  </div>
                  {property.approximate_location ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Clock className="mr-1 inline size-3" />
                      Approximate location shown for privacy. Exact address is shared with confirmed tenants.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div className="mt-6">
              <Alert variant="warning" title="Stay safe on RentHub">
                {settings.safetyTip}{" "}
                <Link href="/safety" className="font-medium underline">Read our safety guide</Link>.
              </Alert>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar src={agent?.avatar_url} name={agentName} size="lg" />
                  <div>
                    <p className="font-semibold">{agentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent?.agents?.agency_name ?? "RentHub agent"}
                    </p>
                    {agentVerified ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        <ShieldCheck className="size-3.5" /> Verified agent
                      </span>
                    ) : null}
                  </div>
                </div>
                {agent?.phone ? (
                  <a
                    href={`tel:${agent.phone}`}
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium hover:bg-muted"
                  >
                    <Phone className="size-4" /> {agent.phone}
                  </a>
                ) : null}
                <div className="mt-4">
                  <PropertyDetailActions propertyId={property.id} agentId={property.agent_id} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly rent</span>
                  <span className="font-semibold">{formatMoney(property.monthly_rent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-semibold">{formatMoney(property.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property type</span>
                  <span className="font-semibold">{property.property_type?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{property.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <span className="font-semibold">{formatDate(property.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Similar properties */}
        {similar.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Similar properties</h2>
            <PropertyGrid className="mt-5">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </PropertyGrid>
          </section>
        ) : null}
      </div>
    </>
  );
}
