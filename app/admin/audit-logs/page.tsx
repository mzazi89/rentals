import { ScrollText } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/types";

export const metadata = { title: "Audit logs" };

export default async function AdminAuditLogsPage() {
  const logs = await db<(AuditLog & { actor?: { full_name: string | null } | null })[]>`
    select l.*, jsonb_build_object('full_name', pr.full_name) as actor
    from audit_logs l left join profiles pr on pr.id = l.actor_id
    order by l.created_at desc limit 300
  `;

  const list = logs;

  return (
    <div>
      <PageHeader title="Audit logs" description="A record of sensitive actions on the platform." />
      {list.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-8" />} title="No audit entries yet" description="Sensitive actions (verifications, suspensions, payment changes) are logged here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Details</Th>
              </THead>
              <tbody>
                {list.map((l) => (
                  <TRow key={l.id}>
                    <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(l.created_at)}</Td>
                    <Td>{l.actor?.full_name ?? (l.actor_role ?? "system")}</Td>
                    <Td className="font-medium">{l.action}</Td>
                    <Td className="text-xs">{l.entity}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}</Td>
                    <Td className="max-w-52 truncate text-xs text-muted-foreground">{JSON.stringify(l.metadata ?? {})}</Td>
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
