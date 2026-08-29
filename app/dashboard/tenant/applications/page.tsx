import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { WithdrawButton } from "@/components/withdraw-button";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { Application } from "@/types";

export const metadata = { title: "My applications" };

export default async function TenantApplicationsPage() {
  const profile = await requireProfile();

  const rows = await db<
    (Application & {
      property: { id: string; title: string; slug: string; monthly_rent: number } | null;
    })[]
  >`
    select a.*,
      jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'monthly_rent', p.monthly_rent) as property
    from applications a
    left join properties p on p.id = a.property_id
    where a.applicant_id = ${profile.id}
    order by a.created_at desc
  `;

  return (
    <div>
      <PageHeader title="My applications" description="Track the status of every application you've submitted." />
      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-8" />}
          title="You haven't submitted an application yet"
          description="Apply to any available property from its detail page."
          action={
            <Link href="/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Find a property →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/properties/${app.property?.slug}`} className="font-medium hover:underline">
                    {app.property?.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {app.property ? `${formatMoney(app.property.monthly_rent)}/mo · ` : ""}
                    Applied {timeAgo(app.created_at)}
                    {app.monthly_income ? ` · Income ${formatMoney(app.monthly_income)}/mo` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  {["submitted", "under_review"].includes(app.status) ? (
                    <WithdrawButton applicationId={app.id} />
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
