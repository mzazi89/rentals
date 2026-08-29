import { Star } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { RatingStars } from "@/components/agents";
import { ReviewModerateActions } from "@/components/admin-actions";
import { timeAgo } from "@/lib/utils";
import type { Review } from "@/types";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await db<
    (Review & { reviewer?: { full_name: string | null } | null; agent?: { full_name: string | null } | null })[]
  >`
    select r.*,
      jsonb_build_object('full_name', rev.full_name) as reviewer,
      jsonb_build_object('full_name', ag.full_name) as agent
    from reviews r
    left join profiles rev on rev.id = r.reviewer_id
    left join profiles ag on ag.id = r.agent_id
    order by r.created_at desc limit 200
  `;

  const list = reviews;

  return (
    <div>
      <PageHeader title="Review moderation" description="Approve or hide tenant reviews of agents." />
      {list.length === 0 ? (
        <EmptyState icon={<Star className="size-8" />} title="No reviews yet" />
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={r.rating} />
                    <span className="text-sm text-muted-foreground">
                      {r.reviewer?.full_name ?? "Tenant"} → {r.agent?.full_name ?? "Agent"} · {timeAgo(r.created_at)}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.comment ? <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p> : null}
                <div className="mt-3">
                  <ReviewModerateActions reviewId={r.id} status={r.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
