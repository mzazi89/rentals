import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { PropertyDecisionActions, FeaturedToggle } from "@/components/admin-actions";
import { AdminAssignAgent } from "@/components/admin-assign-agent";
import { AdminAssignLandlord } from "@/components/admin-assign-landlord";
import { formatMoney } from "@/lib/utils";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { Property } from "@/types";

export const metadata = { title: "Properties" };

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "";

  const list = await db<
    (Property & {
      property_type?: { name: string } | null;
      agent?: { full_name: string | null } | null;
      owner?: { full_name: string | null } | null;
    })[]
  >`
    select p.*,
      jsonb_build_object('name', pt.name) as property_type,
      jsonb_build_object('full_name', ag.full_name) as agent,
      jsonb_build_object('full_name', ow.full_name) as owner
    from properties p
    left join property_types pt on pt.id = p.property_type_id
    left join profiles ag on ag.id = p.agent_id
    left join profiles ow on ow.id = p.owner_id
    ${status ? db`where p.status = ${status}` : db``}
    order by p.created_at desc limit 200
  `;

  // Verified agents available for assignment (owner assigns work).
  const agents = await db<{ id: string; full_name: string | null }[]>`
    select pr.id, pr.full_name
    from agents a join profiles pr on pr.id = a.id
    where a.verification_status = 'verified'
    order by pr.full_name
  `;

  // Landlords that buildings can be assigned to (owner adds on their behalf).
  const landlords = await db<{ id: string; full_name: string | null; verification_status: string }[]>`
    select pr.id, pr.full_name, ld.verification_status
    from landlords ld join profiles pr on pr.id = ld.id
    order by pr.full_name
  `;

  const tabs = ["", "pending_review", "available", "reserved", "occupied", "draft", "rejected", "inactive"];

  return (
    <div>
      <PageHeader
        title="Property moderation"
        description="Add buildings, approve listings and assign agents to manage them."
        actions={
          <Link
            href="/admin/properties/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> New property
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t ? `/admin/properties?status=${t}` : "/admin/properties"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              status === t ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            }`}
          >
            {t === "" ? "All" : PROPERTY_STATUS_LABELS[t]}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Home className="size-8" />} title="No properties found" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Property</Th>
                <Th>Agent / Owner</Th>
                <Th>Rent</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {list.map((p) => (
                  <TRow key={p.id}>
                    <Td>
                      <Link href={`/properties/${p.slug}`} className="font-medium hover:underline">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {p.property_type?.name ?? "Property"} · {[p.neighborhood, p.city].filter(Boolean).join(", ") || "—"}
                      </p>
                    </Td>
                    <Td className="text-sm">
                      <p>{p.agent?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.owner?.full_name ?? ""}</p>
                      <div className="mt-1 space-y-1">
                        <AdminAssignAgent
                          propertyId={p.id}
                          currentAgentId={p.agent_id}
                          agents={agents.map((a) => ({ id: a.id, name: a.full_name ?? "Agent" }))}
                        />
                        <AdminAssignLandlord
                          propertyId={p.id}
                          currentLandlordId={p.owner_id}
                          landlords={landlords.map((l) => ({
                            id: l.id,
                            name: l.full_name ?? "Landlord",
                            verified: l.verification_status === "verified",
                          }))}
                        />
                      </div>
                    </Td>
                    <Td className="font-semibold">{formatMoney(p.monthly_rent)}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <PropertyDecisionActions propertyId={p.id} status={p.status} />
                        <FeaturedToggle propertyId={p.id} featured={p.featured} />
                      </div>
                    </Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
