import { CreditCard } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Payment } from "@/types";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const payments = await db<
    (Payment & { property?: { id: string; title: string } | null; tenant?: { full_name: string | null } | null })[]
  >`
    select pay.*,
      jsonb_build_object('id', p.id, 'title', p.title) as property,
      jsonb_build_object('full_name', t.full_name) as tenant
    from payments pay
    left join properties p on p.id = pay.property_id
    left join profiles t on t.id = pay.tenant_id
    order by pay.created_at desc limit 200
  `;

  const list = payments;

  return (
    <div>
      <PageHeader title="Payments" description="All transactions on the platform." />
      {list.length === 0 ? (
        <EmptyState icon={<CreditCard className="size-8" />} title="No payments yet" />
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
