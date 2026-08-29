import "server-only";

import { db } from "@/db";

/**
 * Mark overdue rent records (due before today, still pending).
 * Called from dashboards and the optional cron endpoint.
 * Notifies tenants whose records transition to overdue.
 */
export async function syncOverdueRent(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const overdue = await db<{ id: string; tenant_id: string; amount_due: number; due_date: string }[]>`
    select id, tenant_id, amount_due, due_date
    from rent_records
    where status = 'pending' and due_date < ${today}
  `;
  if (overdue.length === 0) return 0;

  await db`
    update rent_records set status = 'overdue'
    where status = 'pending' and due_date < ${today}
  `;

  for (const record of overdue) {
    await createOverdueNotification(record.tenant_id, record.amount_due, record.due_date);
  }
  return overdue.length;
}

async function createOverdueNotification(
  tenantId: string,
  amountDue: number,
  dueDate: string
): Promise<void> {
  const { createNotification } = await import("@/lib/notifications");
  await createNotification({
    userId: tenantId,
    type: "rent_overdue",
    title: "Rent payment overdue",
    body: `Your rent of KSh ${Number(amountDue).toLocaleString()} (due ${dueDate}) is now overdue. Please pay as soon as possible.`,
    link: "/dashboard/tenant/lease",
  });
}

/** Generate monthly rent records for a lease (from start month to end month). */
export async function createRentRecordsForLease(leaseId: string): Promise<void> {
  const lease = await db<
    {
      id: string;
      tenant_id: string;
      property_id: string;
      start_date: string;
      end_date: string;
      monthly_rent: number;
      payment_day: number;
    }[]
  >`
    select id, tenant_id, property_id, start_date, end_date, monthly_rent, payment_day
    from leases where id = ${leaseId}
  `;
  if (!lease[0]) throw new Error("Lease not found");
  const l = lease[0];

  const start = new Date(`${l.start_date}T00:00:00`);
  const end = new Date(`${l.end_date}T00:00:00`);
  const records: {
    lease_id: string;
    tenant_id: string;
    property_id: string;
    amount_due: number;
    due_date: string;
  }[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), l.payment_day);
  let guard = 0;
  while (cursor <= end && guard < 36) {
    records.push({
      lease_id: l.id,
      tenant_id: l.tenant_id,
      property_id: l.property_id,
      amount_due: Number(l.monthly_rent),
      due_date: cursor.toISOString().slice(0, 10),
    });
    cursor.setMonth(cursor.getMonth() + 1);
    guard += 1;
  }

  if (records.length > 0) {
    for (const record of records) {
      await db`
        insert into rent_records (lease_id, tenant_id, property_id, amount_due, due_date)
        values (${record.lease_id}, ${record.tenant_id}, ${record.property_id}, ${record.amount_due}, ${record.due_date})
      `;
    }
  }
}
