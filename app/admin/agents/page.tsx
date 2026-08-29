import { BadgeCheck } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { AgentVerifyActions } from "@/components/admin-actions";
import { formatDate } from "@/lib/utils";
import type { Agent, Profile } from "@/types";

export const metadata = { title: "Agent verification" };

export default async function AdminAgentsPage() {
  const agents = await db<
    (Agent & {
      profile?: (Profile & { created_at: string }) | null;
    })[]
  >`
    select ag.*,
      jsonb_build_object('id', pr.id, 'full_name', pr.full_name, 'email', pr.email,
        'phone', pr.phone, 'avatar_url', pr.avatar_url, 'created_at', pr.created_at) as profile
    from agents ag join profiles pr on pr.id = ag.id
    order by ag.created_at desc limit 200
  `;

  const list = agents;

  const pending = list.filter((a) => a.verification_status === "pending");
  const rest = list.filter((a) => a.verification_status !== "pending");

  return (
    <div>
      <PageHeader title="Agent verification" description="Review and verify rent agents." />

      <h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <EmptyState icon={<BadgeCheck className="size-8" />} title="No pending verifications" description="New agent signups will appear here for review." />
      ) : (
        <div className="grid gap-3">
          {pending.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{a.profile?.full_name ?? "Agent"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {a.profile?.email} · {a.profile?.phone ?? "no phone"} · joined {a.profile?.created_at ? formatDate(a.profile.created_at) : "—"}
                    </p>
                  </div>
                  <StatusBadge status={a.verification_status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Agency</dt>
                    <dd className="font-medium">{a.agency_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Agency phone</dt>
                    <dd className="font-medium">{a.agency_phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">ID number</dt>
                    <dd className="font-medium">{a.id_number ? "••••" + a.id_number.slice(-4) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Experience</dt>
                    <dd className="font-medium">{a.years_experience ?? 0} years</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Areas served</dt>
                    <dd className="font-medium">{(a.areas_served ?? []).join(", ") || "—"}</dd>
                  </div>
                </dl>
                {a.bio ? <p className="mt-3 text-sm text-muted-foreground">{a.bio}</p> : null}
                <div className="mt-4">
                  <AgentVerifyActions agentId={a.id} status={a.verification_status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rest.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Processed</h2>
          <div className="grid gap-2">
            {rest.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{a.profile?.full_name ?? "Agent"}</p>
                    <p className="text-sm text-muted-foreground">{a.agency_name ?? "—"} · {a.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AgentVerifyActions agentId={a.id} status={a.verification_status} />
                    <StatusBadge status={a.verification_status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
