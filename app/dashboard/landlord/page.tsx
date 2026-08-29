import Link from "next/link";
import { ArrowRight, BadgeCheck, Home, Users, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { syncOverdueRent } from "@/lib/rent";
import { PageHeader } from "@/components/dashboard";
import { StatCard, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui/layout";
import { StatusBadge, EmptyState, Alert } from "@/components/ui/feedback";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { Application, Payment } from "@/types";

export default async function LandlordDashboardPage() {
  const profile = await requireProfile();
    void syncOverdueRent();

  const landlordRow = await db<{ verification_status: string; verification_notes: string | null }[]>`
    select verification_status, verification_notes from landlords where id = ${profile.id}
  `;
  const landlordStatus = landlordRow[0]?.verification_status ?? "pending";

  const [properties, leaseRows] = await Promise.all([
    db<{ id: string; title: string; status: string; monthly_rent: number; slug: string }[]>`
      select id, title, status, monthly_rent, slug from properties where owner_id = ${profile.id}
    `,
    db<{ id: string; status: string; tenant_id: string; property_id: string; monthly_rent: number }[]>`
      select id, status, tenant_id, property_id, monthly_rent from leases where landlord_id = ${profile.id}
    `,
  ]);

  const props = properties;
  const ownedIds = props.map((p) => p.id);

  const [applications, payments] = await Promise.all([
    ownedIds.length > 0
      ? db<(Application & { property?: { id: string; title: string } | null })[]>`
          select a.*, jsonb_build_object('id', p.id, 'title', p.title) as property
          from applications a left join properties p on p.id = a.property_id
          where a.property_id = any(${ownedIds})
          order by a.created_at desc limit 5
        `
      : [],
    ownedIds.length > 0
      ? db<(Payment & { property?: { id: string; title: string } | null; tenant?: { full_name: string | null } | null })[]>`
          select pay.*,
            jsonb_build_object('id', p.id, 'title', p.title) as property,
            jsonb_build_object('full_name', t.full_name) as tenant
          from payments pay
          left join properties p on p.id = pay.property_id
          left join profiles t on t.id = pay.tenant_id
          where pay.property_id = any(${ownedIds})
          order by pay.created_at desc limit 5
        `
      : [],
  ]);
  const occupied = props.filter((p) => p.status === "occupied").length;
  const available = props.filter((p) => p.status === "available").length;
  const occupancy = props.length > 0 ? Math.round((occupied / props.length) * 100) : 0;
  const monthlyIncome = leaseRows
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + Number(l.monthly_rent), 0);
  const outstanding = leaseRows
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + Number(l.monthly_rent), 0); // simplified: outstanding ≈ monthly obligations
  const totalRentCollected = ((payments ?? []) as Payment[])
    .filter((p) => p.status === "successful")
    .reduce((s, p) => s + Number(p.amount), 0);

  const appRows = applications as Application[];
  const payRows = payments as (Payment & { tenant?: { full_name: string | null } | null })[];

  return (
    <div>
      <PageHeader
        title="Landlord dashboard"
        description="Monitor your properties, tenants and income."
        actions={
          <Link href="/dashboard/landlord/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Manage properties
          </Link>
        }
      />

      {landlordStatus === "pending" ? (
        <div className="mb-6">
          <Alert variant="warning" title="Account pending owner verification">
            Your buildings will appear in explore only after the owner verifies your account.
            You can still prepare your buildings and floors in the meantime.
          </Alert>
        </div>
      ) : landlordStatus === "rejected" ? (
        <div className="mb-6">
          <Alert variant="error" title="Verification was not approved">
            {landlordRow[0]?.verification_notes ?? "Contact support for details."}
          </Alert>
        </div>
      ) : landlordStatus === "info_requested" ? (
        <div className="mb-6">
          <Alert variant="info" title="More information requested">
            {landlordRow[0]?.verification_notes ?? "Please update your details so the owner can verify you."}
          </Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total properties" value={props.length} icon={<Home className="size-5" />} />
        <StatCard label="Occupied" value={occupied} icon={<Users className="size-5" />} />
        <StatCard label="Available" value={available} icon={<Home className="size-5" />} />
        <StatCard label="Monthly income" value={formatMoney(monthlyIncome)} icon={<Wallet className="size-5" />} />
        <StatCard label="Collected (all time)" value={formatMoney(totalRentCollected)} icon={<Wallet className="size-5" />} />
      </div>

      {/* Occupancy */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Occupancy rate</p>
            <span className="text-sm font-bold">{occupancy}%</span>
          </div>
          <Progress value={occupancy} className="mt-2" />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property performance</CardTitle>
            <Link href="/dashboard/landlord/properties" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {props.length === 0 ? (
              <EmptyState icon={<Home className="size-6" />} title="No properties yet" description="Add your first property to start tracking income." />
            ) : (
              <ul className="space-y-3">
                {props.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <Link href={`/properties/${p.slug}`} className="truncate text-sm font-medium hover:underline">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">{formatMoney(p.monthly_rent)}/month</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent payments</CardTitle>
              <Link href="/dashboard/landlord/payments" className="text-sm text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {payRows.length === 0 ? (
                <EmptyState icon={<Wallet className="size-6" />} title="No payments yet" description="Tenant payments on your properties will appear here." />
              ) : (
                <ul className="space-y-2">
                  {payRows.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{p.property?.title}</p>
                        <p className="text-xs text-muted-foreground">{p.tenant?.full_name} · {timeAgo(p.created_at)}</p>
                      </div>
                      <span className="font-semibold text-success">{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <Link href="/dashboard/landlord/applications" className="text-sm text-primary hover:underline">Review</Link>
            </CardHeader>
            <CardContent>
              {appRows.length === 0 ? (
                <EmptyState icon={<Users className="size-6" />} title="No applications" description="Applications for your properties will appear here." />
              ) : (
                <ul className="space-y-2">
                  {appRows.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{a.full_name}</p>
                        <p className="text-xs text-muted-foreground">{a.property?.title}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
