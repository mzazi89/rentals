import { ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { CommissionStatusActions } from "@/components/admin-actions";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Commission } from "@/types";

export const metadata = { title: "Commissions" };

export default async function AdminCommissionsPage() {
  const commissions = await db<
    (Commission & { agent?: { full_name: string | null } | null; property?: { id: string; title: string } | null })[]
  >`
    select c.*,
      jsonb_build_object('full_name', ag.full_name) as agent,
      jsonb_build_object('id', p.id, 'title', p.title) as property
    from commissions c
    left join profiles ag on ag.id = c.agent_id
    left join properties p on p.id = c.property_id
    order by c.created_at desc limit 200
  `;

  const list = commissions;

  return (
    <div>
      <PageHeader title="Commissions" description="Agent commissions and payout management." />
      {list.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="size-8" />} title="No commissions yet" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Agent</Th>
                <Th>Property</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {list.map((c) => (
                  <TRow key={c.id}>
                    <Td className="font-medium">{c.agent?.full_name ?? "—"}</Td>
                    <Td>{c.property?.title ?? "—"}</Td>
                    <Td>{PAYMENT_TYPE_LABELS[c.commission_type] ?? c.commission_type}</Td>
                    <Td className="font-semibold">{formatMoney(c.commission_amount)}</Td>
                    <Td><StatusBadge status={c.status} /></Td>
                    <Td className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</Td>
                    <Td className="text-right">
                      <CommissionStatusActions commissionId={c.id} status={c.status} />
                    </Td>
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
