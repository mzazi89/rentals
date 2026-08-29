import Link from "next/link";
import { Home } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { PropertyDecisionActions, FeaturedToggle } from "@/components/admin-actions";
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

  const tabs = ["", "pending_review", "available", "reserved", "occupied", "draft", "rejected", "inactive"];

  return (
    <div>
      <PageHeader title="Property moderation" description="Approve, reject and feature listings." />

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
