import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { db } from "@/db";
import { getAgentById, countActiveListingsForAgent } from "@/lib/queries";
import { fetchPropertiesByAgent } from "@/lib/db/queries";
import { buildMetadata } from "@/lib/seo";
import { Avatar, Card, CardContent } from "@/components/ui/layout";
import { RatingStars } from "@/components/agents";
import { PropertyCard, PropertyGrid } from "@/components/properties";
import { ContactAgentButton } from "@/components/forms";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const agent = await getAgentById(params.id);
  if (!agent) return buildMetadata({ title: "Agent not found", path: `/agents/${params.id}`, noIndex: true });
  return buildMetadata({
    title: `${agent.profile?.full_name ?? "Agent"} — RentHub`,
    description: `${agent.profile?.full_name ?? "Agent"} is a verified rent agent${agent.agency_name ? ` at ${agent.agency_name}` : ""} on RentHub.`,
    path: `/agents/${params.id}`,
  });
}

export default async function AgentProfilePage({ params }: { params: { id: string } }) {
  const agent = await getAgentById(params.id);
  if (!agent) notFound();
  if (agent.verification_status !== "verified") notFound();

  const listingCount = await countActiveListingsForAgent(agent.id ?? "");
  const properties = await fetchPropertiesByAgent(agent.id ?? "", "available");

  const reviewRows = await db<
    { rating: number; comment: string | null; created_at: string; reviewer: string | null }[]
  >`
    select r.rating, r.comment, r.created_at, pr.full_name as reviewer
    from reviews r left join profiles pr on pr.id = r.reviewer_id
    where r.agent_id = ${params.id} and r.status = 'approved'
    order by r.created_at desc
  `;

  const avgRating =
    reviewRows.length > 0
      ? reviewRows.reduce((s, r) => s + Number(r.rating), 0) / reviewRows.length
      : 0;

  return (
    <div className="container py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <Avatar src={agent.profile?.avatar_url} name={agent.profile?.full_name} size="lg" className="size-20 text-xl" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{agent.profile?.full_name ?? "Agent"}</h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                      <BadgeCheck className="size-3.5" /> Verified Agent
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{agent.agency_name ?? "Independent agent"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RatingStars rating={avgRating} /> ({reviewRows.length} reviews)
                    </span>
                    <span>{listingCount} active listings</span>
                    {agent.years_experience ? <span>{agent.years_experience} yrs experience</span> : null}
                  </div>
                </div>
                <ContactAgentButton agentId={agent.id ?? ""} label="Message agent" />
              </div>
              {agent.bio ? (
                <p className="mt-5 whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">{agent.bio}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                {agent.profile?.phone ? (
                  <a href={`tel:${agent.profile.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="size-4" /> {agent.profile.phone}
                  </a>
                ) : null}
                {agent.agency_address ? <span className="text-muted-foreground">{agent.agency_address}</span> : null}
                {agent.areas_served && agent.areas_served.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-4" /> {agent.areas_served.join(", ")}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <h2 className="mt-8 text-xl font-bold">Active listings</h2>
          <PropertyGrid className="mt-4">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
            {properties.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No active listings right now — check back soon.
              </p>
            ) : null}
          </PropertyGrid>
        </div>

        <aside>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Reviews</h2>
              {reviewRows.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {reviewRows.slice(0, 10).map((r, i) => (
                    <li key={i} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <RatingStars rating={Number(r.rating)} />
                        <span className="text-xs text-muted-foreground">{r.reviewer ?? "Tenant"}</span>
                      </div>
                      {r.comment ? <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
