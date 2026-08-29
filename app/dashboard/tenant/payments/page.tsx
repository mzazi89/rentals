import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Payment } from "@/types";

export const metadata = { title: "Payments" };

export default async function TenantPaymentsPage() {
  const profile = await requireProfile();
  
  const payments = await db<(Payment & { property?: { id: string; title: string } | null })[]>`
    select pay.*, jsonb_build_object('id', p.id, 'title', p.title) as property
    from payments pay left join properties p on p.id = pay.property_id
    where pay.tenant_id = ${profile.id}
    order by pay.created_at desc limit 100
  `;

  const list = payments as Payment[];

  return (
    <div>
      <PageHeader title="Payments" description="View your payment history and download receipts." />

      {list.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-8" />}
          title="No payments yet"
          description="Your application fees, deposits and rent payments will appear here."
          action={
            <Link href="/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Browse properties →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {list.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.property?.title ?? "Platform payment"} · {p.payment_reference}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatMoney(p.amount)}</span>
                  <StatusBadge status={p.status} />
                  {p.status === "successful" ? (
                    <Link
                      href={`/dashboard/tenant/payments/${p.id}/receipt`}
                      className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                    >
                      Receipt
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
