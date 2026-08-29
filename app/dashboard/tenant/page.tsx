import Link from "next/link";
import { Bell, CalendarDays, ClipboardList, Heart, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { syncOverdueRent } from "@/lib/rent";
import { fetchPropertyById } from "@/lib/db/queries";
import { PageHeader } from "@/components/dashboard";
import { StatCard, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { PropertyCard, PropertyGrid } from "@/components/properties";
import { formatDate, formatDateTime, formatMoney, timeAgo } from "@/lib/utils";
import type { Application, Lease, Notification, RentRecord, Viewing } from "@/types";

export default async function TenantDashboardPage() {
  const profile = await requireProfile();
  void syncOverdueRent();

  const [leaseRows, rentRecords, applicationRows, viewingRows, favoriteRows, notificationRows] =
    await Promise.all([
      db<(Lease & { property?: { id: string; title: string; slug: string; city: string | null; neighborhood: string | null; monthly_rent: number } | null })[]>`
        select l.*,
          jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'city', p.city, 'neighborhood', p.neighborhood, 'monthly_rent', p.monthly_rent) as property
        from leases l left join properties p on p.id = l.property_id
        where l.tenant_id = ${profile.id} and l.status in ('active', 'pending')
        order by l.created_at desc
      `,
      db<RentRecord[]>`select * from rent_records where tenant_id = ${profile.id} order by due_date desc limit 50`,
      db<(Application & { property?: { id: string; title: string; slug: string } | null })[]>`
        select a.*, jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
        from applications a left join properties p on p.id = a.property_id
        where a.applicant_id = ${profile.id} order by a.created_at desc limit 3
      `,
      db<(Viewing & { property?: { id: string; title: string; slug: string } | null })[]>`
        select v.*, jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
        from viewings v left join properties p on p.id = v.property_id
        where v.tenant_id = ${profile.id} and v.scheduled_at >= ${new Date().toISOString()}
          and v.status in ('pending', 'confirmed', 'rescheduled')
        order by v.scheduled_at asc limit 3
      `,
      db<{ property_id: string }[]>`select property_id from favorites where user_id = ${profile.id} order by created_at desc limit 3`,
      db<Notification[]>`select * from notifications where user_id = ${profile.id} order by created_at desc limit 5`,
    ]);

  const activeLease = leaseRows[0];
  const records = rentRecords as RentRecord[];
  const outstanding = records
    .filter((r) => ["pending", "overdue", "partially_paid"].includes(r.status))
    .reduce((s, r) => s + Number(r.amount_due) - Number(r.amount_paid), 0);
  const nextDue = records
    .filter((r) => ["pending", "overdue"].includes(r.status))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const latestApplication = applicationRows[0];
  const upcomingViewings = viewingRows as Viewing[];

  const favoritesList = [];
  for (const fav of favoriteRows) {
    const property = await fetchPropertyById(fav.property_id);
    if (property) favoritesList.push(property);
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name?.split(" ")[0] ?? "there"} 👋`}
        description="Here's what's happening with your rentals."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current rent"
          value={activeLease ? formatMoney(activeLease.monthly_rent) : "No lease"}
          sub={activeLease?.property?.title ? `for ${activeLease.property.title}` : undefined}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Outstanding balance"
          value={formatMoney(outstanding)}
          sub={outstanding > 0 ? "Due now" : "All settled 🎉"}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Next payment date"
          value={nextDue ? formatDate(nextDue.due_date) : "—"}
          sub={nextDue ? formatMoney(nextDue.amount_due - nextDue.amount_paid) + " due" : undefined}
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Application status"
          value={latestApplication ? <StatusBadge status={latestApplication.status} /> : "No applications"}
          sub={latestApplication?.property?.title ?? undefined}
          icon={<ClipboardList className="size-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming viewings</CardTitle>
            <Link href="/dashboard/tenant/viewings" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {upcomingViewings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="size-6" />}
                title="No upcoming viewings"
                description="Book a viewing from any property page."
                action={<Link href="/properties" className="text-sm font-medium text-primary hover:underline">Browse properties →</Link>}
              />
            ) : (
              <ul className="space-y-3">
                {upcomingViewings.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <Link href={`/properties/${v.property?.slug}`} className="text-sm font-medium hover:underline">
                        {v.property?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDateTime(v.scheduled_at)}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Saved properties</CardTitle>
            <Link href="/dashboard/tenant/saved" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {favoritesList.length === 0 ? (
              <EmptyState
                icon={<Heart className="size-6" />}
                title="No saved properties yet"
                description="Tap the heart on any property to save it here."
                action={<Link href="/properties" className="text-sm font-medium text-primary hover:underline">Browse properties →</Link>}
              />
            ) : (
              <PropertyGrid className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {favoritesList.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </PropertyGrid>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent applications</CardTitle>
            <Link href="/dashboard/tenant/applications" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {applicationRows.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="size-6" />}
                title="No applications yet"
                description="Apply to a property to track it here."
              />
            ) : (
              <ul className="space-y-3">
                {applicationRows.map((app) => (
                  <li key={app.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <Link href={`/properties/${app.property?.slug}`} className="text-sm font-medium hover:underline">
                        {app.property?.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">Applied {timeAgo(app.created_at)}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <Link href="/dashboard/tenant/notifications" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {notificationRows.length === 0 ? (
              <EmptyState icon={<Bell className="size-6" />} title="No notifications" description="Updates about your viewings, applications and rent will appear here." />
            ) : (
              <ul className="space-y-3">
                {notificationRows.map((n) => (
                  <li key={n.id} className="flex gap-3 rounded-lg border p-3">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? <p className="truncate text-xs text-muted-foreground">{n.body}</p> : null}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
