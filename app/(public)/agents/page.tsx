import { db } from "@/db";
import { getVerifiedAgents, type AgentWithProfile } from "@/lib/queries";
import { AgentCard, type AgentWithProfileCard } from "@/components/agents";
import { EmptyState } from "@/components/ui/feedback";
import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { Users } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Verified rent agents in Kenya",
  description: "Browse verified rent agents across Kenya. Every agent is screened by the RentHub team.",
  path: "/agents",
});

export default async function AgentsPage() {
  const agents = (await getVerifiedAgents(50)) as AgentWithProfile[];

  if (agents.length > 0) {
    const ids = agents.map((a) => a.id).filter(Boolean) as string[];
    const counts = await db<{ agent_id: string; n: number }[]>`
      select agent_id, count(*)::int as n from properties
      where agent_id = any(${ids}) and status = 'available'
      group by agent_id
    `;
    const countMap = new Map(counts.map((c) => [c.agent_id, c.n]));
    for (const a of agents) a.property_count = countMap.get(a.id ?? "") ?? 0;
  }

  return (
    <div>
      <PublicPageHero
        title="Our agents"
        subtitle="Every agent on RentHub is verified by our team. Browse their profiles, listings and reviews — and connect with the professional who knows your area best."
        image={PAGE_IMAGES.facade}
      />
      <div className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a as AgentWithProfileCard} />
          ))}
          {agents.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<Users className="size-8" />}
                title="No verified agents yet"
                description="Agents who complete verification will appear here."
                action={
                  <a href="/signup" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Join as an agent
                  </a>
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
