import "server-only";

import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth/helpers";

/**
 * Record a sensitive action in the audit log (admin actions, verification
 * decisions, payment changes, settings changes, etc.).
 */
export async function audit(
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await getCurrentUser();
    let role: string | null = null;
    if (user) {
      const rows = await db<{ role: string | null }[]>`select role from profiles where id = ${user.id}`;
      role = rows[0]?.role ?? null;
    }
    await db`
      insert into audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
      values (${user?.id ?? null}, ${role}, ${action}, ${entity}, ${entityId ?? null}, ${JSON.stringify(metadata ?? {})})
    `;
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}
