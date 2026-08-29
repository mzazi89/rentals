import { BadgeCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow, Avatar } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/feedback";
import type { Agent, Profile } from "@/types";

export const metadata = { title: "My agents" };

export default async function LandlordAgentsPage() {
  const profile = await requireProfile();
  
  const agentRows = await db<
    {
      agent: (Profile & { agents?: Agent | null }) | null;
      n: number;
    }[]
  >`
    select jsonb_build_object(
      'id', ag.id, 'full_name', ag.full_name, 'phone', ag.phone, 'avatar_url', ag.avatar_url,
      'agents', jsonb_build_object('id', a.id, 'agency_name', a.agency_name, 'verification_status', a.verification_status)
    ) as agent,
    count(*)::int as n
    from properties p
    join profiles ag on ag.id = p.agent_id
    left join agents a on a.id = ag.id
    where p.owner_id = ${profile.id} and p.agent_id is not null
    group by ag.id, ag.full_name, ag.phone, ag.avatar_url, a.id, a.agency_name, a.verification_status
  `;

  const seen = new Map<string, { agent: Profile & { agents?: Agent | null }; count: number }>();
  for (const row of agentRows) {
    const agent = row.agent as (Profile & { agents?: Agent | null }) | null;
    if (!agent) continue;
    seen.set(agent.id, { agent, count: row.n });
  }

  const rows = [...seen.values()];

  return (
    <div>
      <PageHeader title="My agents" description="Agents managing your properties." />
      {rows.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck className="size-8" />}
          title="No agents assigned yet"
          description="Assign a verified agent to your properties to have them manage viewings, applications and tenants."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Agent</Th>
                <Th>Agency</Th>
                <Th>Contact</Th>
                <Th>Properties managed</Th>
              </THead>
              <tbody>
                {rows.map(({ agent, count }) => (
                  <TRow key={agent.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={agent.avatar_url} name={agent.full_name} size="sm" />
                        <span className="font-medium">{agent.full_name}</span>
                      </div>
                    </Td>
                    <Td>{agent.agents?.agency_name ?? "—"}</Td>
                    <Td>{agent.phone ?? "—"}</Td>
                    <Td>{count} property{count > 1 ? "ies" : "y"}</Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
