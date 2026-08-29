import { Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow, Avatar } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatMoney } from "@/lib/utils";
import type { Profile } from "@/types";

export const metadata = { title: "My tenants" };

export default async function LandlordTenantsPage() {
  const profile = await requireProfile();
  
  const rows = (await db<
    {
      id: string;
      status: string;
      monthly_rent: number;
      start_date: string;
      end_date: string;
      property: { title: string } | null;
      tenant: Partial<Profile> | null;
    }[]
  >`
    select l.id, l.status, l.monthly_rent, l.start_date, l.end_date,
      jsonb_build_object('title', p.title) as property,
      jsonb_build_object('id', t.id, 'full_name', t.full_name, 'phone', t.phone, 'avatar_url', t.avatar_url) as tenant
    from leases l
    left join properties p on p.id = l.property_id
    left join profiles t on t.id = l.tenant_id
    where l.landlord_id = ${profile.id}
    order by l.created_at desc limit 100
  `) as unknown as {
    id: string;
    status: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
    property: { title: string } | null;
    tenant: Partial<Profile> | null;
  }[];

  return (
    <div>
      <PageHeader title="My tenants" description="Tenants renting your properties." />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="No tenants yet"
          description="Tenants will appear here once leases are created on your properties."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th>Rent</Th>
                <Th>Lease</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {rows.map((row) => (
                  <TRow key={row.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={row.tenant?.avatar_url} name={row.tenant?.full_name} size="sm" />
                        <div>
                          <p className="font-medium">{row.tenant?.full_name ?? "Tenant"}</p>
                          <p className="text-xs text-muted-foreground">{row.tenant?.phone}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{row.property?.title ?? "—"}</Td>
                    <Td className="font-semibold">{formatMoney(row.monthly_rent)}</Td>
                    <Td className="text-xs text-muted-foreground">{row.start_date} → {row.end_date}</Td>
                    <Td><StatusBadge status={row.status} /></Td>
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
