import { BadgeCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { StatCard, Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Commission } from "@/types";

export const metadata = { title: "Commissions" };

export default async function AgentCommissionsPage() {
  const profile = await requireProfile();
  
  const commissions = await db<(Commission & { property?: { id: string; title: string } | null })[]>`
    select c.*, jsonb_build_object('id', p.id, 'title', p.title) as property
    from commissions c left join properties p on p.id = c.property_id
    where c.agent_id = ${profile.id}
    order by c.created_at desc limit 100
  `;

  const list = commissions as (Commission & { property?: { title: string } | null })[];
  const totalEarned = list
    .filter((c) => ["approved", "paid"].includes(c.status))
    .reduce((s, c) => s + Number(c.commission_amount), 0);
  const pending = list.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);

  return (
    <div>
      <PageHeader title="Commissions" description="Your earnings from rent and deposit payments." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total earned" value={formatMoney(totalEarned)} icon={<BadgeCheck className="size-5" />} />
        <StatCard label="Pending approval" value={formatMoney(pending)} icon={<BadgeCheck className="size-5" />} />
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <EmptyState icon={<BadgeCheck className="size-8" />} title="No commissions yet" description="Commissions are earned when tenants pay rent or deposits on your properties." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <Th>Property</Th>
                  <Th>Type</Th>
                  <Th>Rate</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </THead>
                <tbody>
                  {list.map((c) => (
                    <TRow key={c.id}>
                      <Td className="font-medium">{c.property?.title ?? "—"}</Td>
                      <Td>{PAYMENT_TYPE_LABELS[c.commission_type] ?? c.commission_type}</Td>
                      <Td>{c.commission_rate != null ? `${c.commission_rate}%` : "—"}</Td>
                      <Td className="font-semibold">{formatMoney(c.commission_amount)}</Td>
                      <Td><StatusBadge status={c.status} /></Td>
                      <Td className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</Td>
                    </TRow>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
