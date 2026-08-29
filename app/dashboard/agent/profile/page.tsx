import Link from "next/link";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Avatar } from "@/components/ui/layout";
import { Alert } from "@/components/ui/feedback";
import { AGENT_VERIFICATION_LABELS } from "@/lib/constants";
import type { Agent } from "@/types";

export const metadata = { title: "Agent profile" };

export default async function AgentProfilePage() {
  const profile = await requireProfile();
  
  const agentRow = (await db<Agent[]>`select * from agents where id = ${profile.id}`)[0] ?? null;

  const status = agentRow?.verification_status ?? "pending";

  return (
    <div>
      <PageHeader title="Agent profile" description="Your verification status and public profile." />

      {status !== "verified" ? (
        <div className="mb-6">
          {status === "pending" ? (
            <Alert variant="warning" title="Profile pending verification">
              <p>
                Our team is reviewing your details. You'll be notified once verified.
                Until then you cannot publish new listings.
              </p>
            </Alert>
          ) : status === "rejected" ? (
            <Alert variant="error" title="Profile was not approved">
              <p>{agentRow?.verification_notes ?? "Contact support for details."}</p>
            </Alert>
          ) : (
            <Alert variant="info" title="More information requested">
              <p>{agentRow?.verification_notes ?? "Please update your details and resubmit."}</p>
            </Alert>
          )}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" className="size-16 text-xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                {status === "verified" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    <BadgeCheck className="size-3.5" /> {AGENT_VERIFICATION_LABELS[status]}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                    {status === "pending" ? <Clock className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                    {AGENT_VERIFICATION_LABELS[status]}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{agentRow?.agency_name ?? "Independent agent"}</p>
              <p className="text-sm text-muted-foreground">{profile.email} · {profile.phone}</p>
            </div>
            <Link href="/dashboard/agent/settings" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Edit agency details
            </Link>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Agency phone</dt>
              <dd className="font-medium">{agentRow?.agency_phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Agency address</dt>
              <dd className="font-medium">{agentRow?.agency_address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Years of experience</dt>
              <dd className="font-medium">{agentRow?.years_experience ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Areas served</dt>
              <dd className="font-medium">{(agentRow?.areas_served ?? []).join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ID number (private)</dt>
              <dd className="font-medium">{agentRow?.id_number ? "••••••" + agentRow.id_number.slice(-4) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{AGENT_VERIFICATION_LABELS[status]}</dd>
            </div>
          </dl>
          {agentRow?.bio ? <p className="mt-4 text-sm text-muted-foreground">{agentRow.bio}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
