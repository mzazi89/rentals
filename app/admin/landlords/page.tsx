import { Home } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { LandlordVerifyActions } from "@/components/admin-actions";
import { formatDate } from "@/lib/utils";
import type { Landlord, Profile } from "@/types";

export const metadata = { title: "Landlords" };

export default async function AdminLandlordsPage() {
  const landlords = await db<
    (Landlord & { profile?: (Profile & { created_at: string }) | null })[]
  >`
    select ld.*,
      jsonb_build_object('id', pr.id, 'full_name', pr.full_name, 'email', pr.email,
        'phone', pr.phone, 'avatar_url', pr.avatar_url, 'created_at', pr.created_at) as profile
    from landlords ld join profiles pr on pr.id = ld.id
    order by ld.created_at desc limit 200
  `;

  const pending = landlords.filter((l) => l.verification_status === "pending");
  const rest = landlords.filter((l) => l.verification_status !== "pending");

  return (
    <div>
      <PageHeader
        title="Landlord verification"
        description="Owner approval is required before a landlord's buildings appear in explore."
      />

      <h2 className="mb-3 text-lg font-semibold">Pending verification ({pending.length})</h2>
      {pending.length === 0 ? (
        <EmptyState
          icon={<Home className="size-8" />}
          title="No pending landlords"
          description="New landlord registrations will appear here for verification."
        />
      ) : (
        <div className="grid gap-3">
          {pending.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{l.profile?.full_name ?? "Landlord"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {l.profile?.email} · {l.profile?.phone ?? "no phone"} · joined{" "}
                      {l.profile?.created_at ? formatDate(l.profile.created_at) : "—"}
                    </p>
                  </div>
                  <StatusBadge status={l.verification_status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Company</dt>
                    <dd className="font-medium">{l.company_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">{l.address ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <LandlordVerifyActions landlordId={l.id} status={l.verification_status} />
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
            {rest.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{l.profile?.full_name ?? "Landlord"}</p>
                    <p className="text-sm text-muted-foreground">
                      {l.company_name ?? "—"} · {l.profile?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LandlordVerifyActions landlordId={l.id} status={l.verification_status} />
                    <StatusBadge status={l.verification_status} />
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
