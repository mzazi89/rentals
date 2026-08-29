import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { buildMetadata } from "@/lib/seo";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { Payment } from "@/types";

export const metadata = buildMetadata({ title: "Receipt", path: "/receipt", noIndex: true });

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  
  const rows = await db<
    (Payment & {
      tenant: { full_name: string | null; email: string | null };
      property: { id: string; title: string; city: string | null; county: string | null; agent: { full_name: string | null } | null } | null;
    })[]
  >`
    select pay.*,
      jsonb_build_object('full_name', t.full_name, 'email', t.email) as tenant,
      jsonb_build_object('id', p.id, 'title', p.title, 'city', p.city, 'county', p.county,
        'agent', jsonb_build_object('full_name', ag.full_name)) as property
    from payments pay
    left join profiles t on t.id = pay.tenant_id
    left join properties p on p.id = pay.property_id
    left join profiles ag on ag.id = p.agent_id
    where pay.id = ${params.id} and pay.tenant_id = ${profile.id}
  `;

  const payment = rows[0] as Payment & {
    tenant?: { full_name: string | null; email: string | null };
    property?: {
      id: string;
      title: string;
      city: string | null;
      county: string | null;
      agent?: { full_name: string | null } | null;
    } | null;
  };

  if (!payment || payment.status !== "successful") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="print-hidden mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Payment receipt</h1>
        <button
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Printer className="size-4" /> Print / Download PDF
        </button>
      </div>

      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-lg font-bold">RentHub</p>
            <p className="text-xs text-muted-foreground">Nairobi, Kenya</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">RECEIPT</p>
            <p className="text-muted-foreground">Receipt #{payment.payment_reference}</p>
            <p className="text-muted-foreground">{formatDateTime(payment.created_at)}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tenant</dt>
            <dd className="font-medium">{payment.tenant?.full_name ?? "Tenant"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{payment.tenant?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Property</dt>
            <dd className="text-right font-medium">
              {payment.property?.title ?? "—"}
              {payment.property?.city ? <span className="block text-xs text-muted-foreground">{payment.property.city}, {payment.property.county ?? ""}</span> : null}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Agent</dt>
            <dd className="font-medium">{payment.property?.agent?.full_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment type</dt>
            <dd className="font-medium">{PAYMENT_TYPE_LABELS[payment.payment_type] ?? payment.payment_type}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Transaction ID</dt>
            <dd className="font-medium">{payment.provider_transaction_id ?? payment.payment_reference}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment method</dt>
            <dd className="font-medium capitalize">{payment.provider}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-success">{PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <span className="text-sm font-medium">Total paid</span>
          <span className="text-2xl font-bold">{formatMoney(payment.amount, payment.currency)}</span>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Thank you for using RentHub. This receipt was generated automatically on{" "}
          {formatDateTime(payment.paid_at ?? payment.created_at)}.
        </p>
      </div>
    </div>
  );
}
