import { ClipboardList } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { ApplicationActions } from "@/components/dashboard-actions";
import { formatDate, formatMoney, timeAgo } from "@/lib/utils";
import type { Application } from "@/types";

export const metadata = { title: "Applications" };

export default async function LandlordApplicationsPage() {
  const profile = await requireProfile();
  
  const owned = await db<{ id: string }[]>`select id from properties where owner_id = ${profile.id}`;
  const ownedIds = owned.map((p) => p.id);

  const applications = ownedIds.length > 0
    ? await db<(Application & { property?: { id: string; title: string; slug: string } | null })[]>`
        select a.*, jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
        from applications a left join properties p on p.id = a.property_id
        where a.property_id = any(${ownedIds})
        order by a.created_at desc limit 100
      `
    : [];

  const list = applications as Application[];
  const active = list.filter((a) => ["submitted", "under_review"].includes(a.status));
  const decided = list.filter((a) => !active.includes(a));

  return (
    <div>
      <PageHeader title="Applications" description="Review applications for your properties." />
      {list.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-8" />} title="No applications" description="Applications for your properties will appear here." />
      ) : (
        <>
          <div className="grid gap-3">
            {active.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{app.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{app.property?.title} · applied {timeAgo(app.created_at)}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Contact</dt>
                      <dd className="font-medium">{app.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Income</dt>
                      <dd className="font-medium">{app.monthly_income ? formatMoney(app.monthly_income) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Move-in</dt>
                      <dd className="font-medium">{app.preferred_move_in_date ? formatDate(app.preferred_move_in_date) : "Flexible"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <ApplicationActions applicationId={app.id} status={app.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {decided.length > 0 ? (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Reviewed</h2>
              <div className="grid gap-2">
                {decided.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="flex items-center justify-between gap-2 p-4">
                      <div>
                        <p className="font-medium">{app.full_name}</p>
                        <p className="text-sm text-muted-foreground">{app.property?.title}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
