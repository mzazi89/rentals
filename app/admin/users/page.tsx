import { Users } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow, Avatar } from "@/components/ui/layout";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { AdminUserActions } from "@/components/admin-actions";
import { AdminUsersSearch } from "@/components/admin-users-search";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const role = searchParams.role ?? "";

  const list = await db<Profile[]>`
    select * from profiles
    ${role ? db`where role = ${role}` : db``}
    ${q ? db`and (full_name ilike ${`%${q}%`} or email ilike ${`%${q}%`})` : db``}
    order by created_at desc limit 200
  `;

  return (
    <div>
      <PageHeader title="User management" description="Search, view and manage all platform users." />
      <AdminUsersSearch currentQ={q} currentRole={role} />
      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState icon={<Users className="size-8" />} title="No users found" description="Try a different search or filter." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <Th>User</Th>
                  <Th>Role</Th>
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
                      <Td className="capitalize">{u.role ?? "unassigned"}</Td>
                      <Td><StatusBadge status={u.status} /></Td>
                      <Td className="text-xs text-muted-foreground">{formatDate(u.created_at)}</Td>
                      <Td className="text-right">
                        <AdminUserActions userId={u.id} status={u.status} isAdmin={u.role === "admin"} />
                      </Td>
                    </TRow>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
