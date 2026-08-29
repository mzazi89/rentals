import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { ViewingActions } from "@/components/dashboard-actions";
import { formatDateTime } from "@/lib/utils";
import type { Viewing } from "@/types";

export const metadata = { title: "My viewings" };

export default async function TenantViewingsPage() {
  const profile = await requireProfile();
  
  const viewings = await db<(Viewing & { property?: { id: string; title: string; slug: string } | null })[]>`
    select v.*, jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
    from viewings v left join properties p on p.id = v.property_id
    where v.tenant_id = ${profile.id}
    order by v.scheduled_at desc limit 50
  `;

  const list = viewings as Viewing[];
  const upcoming = list.filter((v) => ["pending", "confirmed", "rescheduled"].includes(v.status) && new Date(v.scheduled_at) >= new Date());
  const past = list.filter((v) => !upcoming.includes(v));

  return (
    <div>
      <PageHeader
        title="My viewings"
        description="Track and manage your viewing requests."
        actions={
          <Link href="/properties" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Find a property
          </Link>
        }
      />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-8" />}
          title="You don't have any upcoming viewings"
          description="Book a viewing from any property page and the agent will confirm."
          action={
            <Link href="/properties" className="text-sm font-medium text-primary hover:underline">Find a property →</Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {upcoming.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/properties/${v.property?.slug}`} className="font-medium hover:underline">
                    {v.property?.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">{formatDateTime(v.scheduled_at)}</p>
                  {v.tenant_message ? <p className="mt-1 text-xs text-muted-foreground">"{v.tenant_message}"</p> : null}
                  {v.agent_message ? <p className="mt-1 text-xs italic text-muted-foreground">Agent: {v.agent_message}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} />
                  <ViewingActions viewingId={v.id} status={v.status} role="tenant" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Past viewings</h2>
          <div className="grid gap-3">
            {past.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{v.property?.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(v.scheduled_at)}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
