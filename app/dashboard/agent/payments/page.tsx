import { Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Payment } from "@/types";

export const metadata = { title: "Payments" };

export default async function AgentPaymentsPage() {
  const profile = await requireProfile();
  
  const myProperties = await db<{ id: string }[]>`select id from properties where agent_id = ${profile.id}`;
  const propertyIds = myProperties.map((p) => p.id);

  const payments = propertyIds.length > 0
    ? await db<(Payment & { property?: { id: string; title: string } | null; tenant?: { full_name: string | null } | null })[]>`
        select pay.*,
          jsonb_build_object('id', p.id, 'title', p.title) as property,
          jsonb_build_object('full_name', t.full_name) as tenant
        from payments pay
        left join properties p on p.id = pay.property_id
        left join profiles t on t.id = pay.tenant_id
        where pay.property_id = any(${propertyIds})
        order by pay.created_at desc limit 100
      `
    : [];

  const list = payments as (Payment & { tenant?: { full_name: string | null } | null })[];

  return (
    <div>
      <PageHeader title="Payments" description="Payments made by tenants on your properties." />
      {list.length === 0 ? (
        <EmptyState icon={<Wallet className="size-8" />} title="No payments yet" description="Successful tenant payments will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Transaction</Th>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </THead>
              <tbody>
                {list.map((p) => (
                  <TRow key={p.id}>
                    <Td className="font-mono text-xs">{p.payment_reference}</Td>
                    <Td>{p.tenant?.full_name ?? "—"}</Td>
                    <Td>{p.property?.title ?? "—"}</Td>
                    <Td>{PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type}</Td>
                    <Td className="font-semibold">{formatMoney(p.amount)}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</Td>
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
