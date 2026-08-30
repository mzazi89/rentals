import Link from "next/link";
import { Home } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { PropertyActions } from "@/components/property-manage-actions";
import { formatMoney } from "@/lib/utils";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { Property } from "@/types";

export const metadata = { title: "My properties" };

export default async function AgentPropertiesPage() {
  const profile = await requireProfile();
  
  const properties = await db<(Property & { property_type?: { name: string } | null })[]>`
    select p.*, jsonb_build_object('name', pt.name) as property_type
    from properties p left join property_types pt on pt.id = p.property_type_id
    where p.agent_id = ${profile.id}
    order by p.created_at desc
  `;

  const list = properties;

  return (
    <div>
      <PageHeader
        title="Assigned properties"
        description="Properties the owner has assigned to you to manage."
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<Home className="size-8" />}
          title="No assignments yet"
          description="The owner adds properties and assigns them to you. Assigned buildings and their units will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Property</Th>
                <Th>Rent</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {list.map((p) => (
                  <TRow key={p.id}>
                    <Td>
                      <Link href={`/properties/${p.slug}`} className="font-medium hover:underline">
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.property_type?.name ?? "Property"} · {[p.neighborhood, p.city].filter(Boolean).join(", ") || "—"}
                      </p>
                    </Td>
                    <Td className="font-semibold">{formatMoney(p.monthly_rent)}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-right">
                      <PropertyActions
                        propertyId={p.id}
                        status={p.status}
                        slug={p.slug}
                        manageHref={`/dashboard/agent/properties/${p.id}/units`}
                      />
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
