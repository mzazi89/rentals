import { Home } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow, Avatar } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/feedback";
import { AdminUserActions } from "@/components/admin-actions";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export const metadata = { title: "Landlords" };

export default async function AdminLandlordsPage() {
  const list = await db<Profile[]>`select * from profiles where role = 'landlord' order by created_at desc limit 200`;

  return (
    <div>
      <PageHeader title="Landlords" description="All landlord accounts." />
      {list.length === 0 ? (
        <EmptyState icon={<Home className="size-8" />} title="No landlords yet" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>Landlord</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {list.map((u) => (
                  <TRow key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                        <div>
                          <p className="font-medium">{u.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{u.status}</Td>
                    <Td className="text-xs text-muted-foreground">{formatDate(u.created_at)}</Td>
                    <Td className="text-right">
                      <AdminUserActions userId={u.id} status={u.status} isAdmin={false} />
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
