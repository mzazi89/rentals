import { CalendarDays } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/utils";
import type { Viewing } from "@/types";

export const metadata = { title: "Viewings" };

export default async function AdminViewingsPage() {
  const viewings = await db<
    (Viewing & { property?: { id: string; title: string } | null; tenant?: { full_name: string | null } | null })[]
  >`
    select v.*,
      jsonb_build_object('id', p.id, 'title', p.title) as property,
      jsonb_build_object('full_name', t.full_name) as tenant
    from viewings v
    left join properties p on p.id = v.property_id
    left join profiles t on t.id = v.tenant_id
    order by v.scheduled_at desc limit 200
  `;

  const list = viewings;

  return (
    <div>
      <PageHeader title="Viewings" description="All viewing requests across the platform." />
      {list.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-8" />} title="No viewings yet" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Property</Th>
                <Th>Tenant</Th>
                <Th>Scheduled</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {list.map((v) => (
                  <TRow key={v.id}>
                    <Td className="font-medium">{v.property?.title ?? "—"}</Td>
                    <Td>{v.tenant?.full_name ?? "—"}</Td>
                    <Td>{formatDateTime(v.scheduled_at)}</Td>
                    <Td><StatusBadge status={v.status} /></Td>
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
