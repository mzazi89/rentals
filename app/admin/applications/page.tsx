import { ClipboardList } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { Application } from "@/types";

export const metadata = { title: "Applications" };

export default async function AdminApplicationsPage() {
  const applications = await db<(Application & { property?: { id: string; title: string; slug: string } | null })[]>`
    select a.*, jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
    from applications a left join properties p on p.id = a.property_id
    order by a.created_at desc limit 200
  `;

  const list = applications as Application[];

  return (
    <div>
      <PageHeader title="Applications" description="All tenant applications across the platform." />
      {list.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-8" />} title="No applications yet" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Applicant</Th>
                <Th>Property</Th>
                <Th>Income</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </THead>
              <tbody>
                {list.map((a) => (
                  <TRow key={a.id}>
                    <Td>
                      <p className="font-medium">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.phone}</p>
                    </Td>
                    <Td>{a.property?.title ?? "—"}</Td>
                    <Td>{a.monthly_income ? formatMoney(a.monthly_income) : "—"}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</Td>
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
