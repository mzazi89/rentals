import { CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { ViewingActions } from "@/components/dashboard-actions";
import { formatDateTime } from "@/lib/utils";
import type { Viewing } from "@/types";

export const metadata = { title: "Viewings" };

export default async function AgentViewingsPage() {
  const profile = await requireProfile();
  
  const viewings = await db<
    (Viewing & {
      property?: { id: string; title: string } | null;
      tenant?: { full_name: string | null; phone: string | null } | null;
    })[]
  >`
    select v.*,
      jsonb_build_object('id', p.id, 'title', p.title) as property,
      jsonb_build_object('full_name', t.full_name, 'phone', t.phone) as tenant
    from viewings v
    left join properties p on p.id = v.property_id
    left join profiles t on t.id = v.tenant_id
    where v.agent_id = ${profile.id}
    order by v.scheduled_at desc limit 100
  `;

  const list = viewings;

  const upcoming = list
    .filter((v) => ["pending", "confirmed", "rescheduled"].includes(v.status) && new Date(v.scheduled_at) >= new Date())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = list.filter((v) => !upcoming.includes(v));

  return (
    <div>
      <PageHeader title="Viewing requests" description="Accept, reschedule or complete viewings." />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-8" />}
          title="No upcoming viewings"
          description="When tenants request viewings of your properties, they'll appear here."
        />
      ) : (
        <div className="grid gap-3">
          {upcoming.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{v.property?.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDateTime(v.scheduled_at)} · {v.tenant?.full_name ?? "Tenant"}
                    {v.tenant?.phone ? ` · ${v.tenant.phone}` : ""}
                  </p>
                  {v.tenant_message ? <p className="mt-1 text-xs italic text-muted-foreground">"{v.tenant_message}"</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} />
                  <ViewingActions viewingId={v.id} status={v.status} role="agent" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Past viewings</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <Th>Property</Th>
                  <Th>Tenant</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  {past.map((v) => (
                    <TRow key={v.id}>
                      <Td className="font-medium">{v.property?.title}</Td>
                      <Td>{v.tenant?.full_name ?? "—"}</Td>
                      <Td>{formatDateTime(v.scheduled_at)}</Td>
                      <Td><StatusBadge status={v.status} /></Td>
                    </TRow>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
