import { Flag } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { ReportResolveActions } from "@/components/admin-actions";
import { timeAgo } from "@/lib/utils";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import type { Report } from "@/types";

export const metadata = { title: "Reports & flags" };

export default async function AdminFlagsPage() {
  const reports = await db<
    (Report & {
      reporter?: { full_name: string | null } | null;
      reported_user?: { full_name: string | null } | null;
      property?: { id: string; title: string } | null;
    })[]
  >`
    select r.*,
      jsonb_build_object('full_name', rep.full_name) as reporter,
      jsonb_build_object('full_name', rp.full_name) as reported_user,
      jsonb_build_object('id', p.id, 'title', p.title) as property
    from reports r
    left join profiles rep on rep.id = r.reporter_id
    left join profiles rp on rp.id = r.reported_user_id
    left join properties p on p.id = r.property_id
    order by r.created_at desc limit 200
  `;

  const list = reports;

  return (
    <div>
      <PageHeader title="Reports & flags" description="Investigate user reports of properties and users." />
      {list.length === 0 ? (
        <EmptyState icon={<Flag className="size-8" />} title="No reports" description="User reports will appear here." />
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{REPORT_REASON_LABELS[r.reason] ?? r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Reported by {r.reporter?.full_name ?? "—"} · {timeAgo(r.created_at)}
                      {r.property ? ` · Property: ${r.property.title}` : ""}
                      {r.reported_user ? ` · User: ${r.reported_user.full_name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.description ? <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{r.description}</p> : null}
                {r.admin_notes ? <p className="mt-2 text-xs text-muted-foreground">Admin notes: {r.admin_notes}</p> : null}
                <div className="mt-3">
                  <ReportResolveActions reportId={r.id} status={r.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
