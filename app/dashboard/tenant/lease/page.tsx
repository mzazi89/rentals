import Link from "next/link";
import { FileText } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { syncOverdueRent } from "@/lib/rent";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { PayButton } from "@/components/payments";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Lease, RentRecord } from "@/types";

export const metadata = { title: "My lease & rent" };

export default async function TenantLeasePage() {
  const profile = await requireProfile();
    void syncOverdueRent();

  const leases = await db<Lease[]>`
    select * from leases where tenant_id = ${profile.id} order by created_at desc limit 5
  `;
  const rentRecords = await db<RentRecord[]>`
    select * from rent_records where tenant_id = ${profile.id} order by due_date desc limit 60
  `;

  const activeLease = leases.find((l) => l.status === "active");
  const records = rentRecords as RentRecord[];

  if (!activeLease) {
    return (
      <div>
        <PageHeader title="My lease & rent" />
        <EmptyState
          icon={<FileText className="size-8" />}
          title="No active lease"
          description="Once your application is approved and a lease is created, you'll see your rent schedule and payments here."
          action={
            <Link href="/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Browse properties →
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My lease & rent" description="Your lease details, rent schedule and payments." />

      <Card>
        <CardHeader>
          <CardTitle>{activeLease.property?.title}</CardTitle>
          <StatusBadge status={activeLease.status} />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Monthly rent</p>
              <p className="mt-0.5 text-lg font-bold">{formatMoney(activeLease.monthly_rent)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deposit</p>
              <p className="mt-0.5 text-lg font-bold">{formatMoney(activeLease.deposit_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lease period</p>
              <p className="mt-0.5 font-semibold">{formatDate(activeLease.start_date)} – {formatDate(activeLease.end_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment day</p>
              <p className="mt-0.5 font-semibold">Day {activeLease.payment_day} of each month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Rent schedule</h2>
      <div className="grid gap-3">
        {records.map((r) => {
          const progress = r.amount_due > 0 ? Math.min(100, Math.round((Number(r.amount_paid) / Number(r.amount_due)) * 100)) : 0;
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{formatDate(r.due_date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(r.amount_due)}{" "}
                      {Number(r.amount_paid) > 0 ? `· paid ${formatMoney(r.amount_paid)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden w-32 sm:block">
                      <Progress value={progress} />
                    </div>
                    <StatusBadge status={r.status} />
                    {r.status !== "paid" && r.status !== "cancelled" ? (
                      <PayButton
                        amount={Number(r.amount_due) - Number(r.amount_paid)}
                        paymentType="rent"
                        propertyId={r.property_id}
                        leaseId={r.lease_id}
                        rentRecordId={r.id}
                        label={`Pay ${formatMoney(Number(r.amount_due) - Number(r.amount_paid))}`}
                      />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {records.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Your rent schedule is being generated.
          </p>
        ) : null}
      </div>
    </div>
  );
}
