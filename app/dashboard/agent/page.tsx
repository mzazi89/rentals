import Link from "next/link";
import { ClipboardList, Home, IndianRupee, MessageSquare, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { syncOverdueRent } from "@/lib/rent";
import { PageHeader } from "@/components/dashboard";
import { StatCard, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { Calendar, type CalendarEvent } from "@/components/dashboard";
import { StatusBadge, EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatMoney, timeAgo } from "@/lib/utils";
import type { Application, Message, Payment, Viewing } from "@/types";

export default async function AgentDashboardPage() {
  const profile = await requireProfile();
  void syncOverdueRent();

  const now = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);

  const [properties, applications, viewings, messages, commissions] = await Promise.all([
    db<{ id: string; status: string; monthly_rent: number }[]>`
      select id, status, monthly_rent from properties where agent_id = ${profile.id}
    `,
    db<(Application & { property?: { id: string; title: string } | null })[]>`
      select a.*, jsonb_build_object('id', p.id, 'title', p.title) as property
      from applications a left join properties p on p.id = a.property_id
      where a.agent_id = ${profile.id}
      order by a.created_at desc limit 5
    `,
    db<(Viewing & { property?: { id: string; title: string } | null })[]>`
      select v.*, jsonb_build_object('id', p.id, 'title', p.title) as property
      from viewings v left join properties p on p.id = v.property_id
      where v.agent_id = ${profile.id} and v.scheduled_at >= ${monthStart.toISOString()}
      order by v.scheduled_at asc limit 100
    `,
    db<Message[]>`select * from messages where sender_id = ${profile.id} order by created_at desc limit 5`,
    db<{ commission_amount: number; status: string }[]>`
      select commission_amount, status from commissions where agent_id = ${profile.id}
    `,
  ]);

  const { data: recentPayments } = await (async () => {
    const ids = properties.map((p) => p.id);
    if (ids.length === 0) return { data: [] as (Payment & { property?: { id: string; title: string } | null })[] };
    const rows = await db<(Payment & { property?: { id: string; title: string } | null })[]>`
      select pay.*, jsonb_build_object('id', p.id, 'title', p.title) as property
      from payments pay left join properties p on p.id = pay.property_id
      where pay.property_id = any(${ids}) and pay.status = 'successful'
      order by pay.created_at desc limit 5
    `;
    return { data: rows };
  })();

  const props = properties ?? [];
  const available = props.filter((p) => p.status === "available").length;
  const occupied = props.filter((p) => p.status === "occupied").length;
  const pendingApps = applications.filter((a) => ["submitted", "under_review"].includes(a.status)).length;
  const monthlyRentalValue = props
    .filter((p) => p.status === "available")
    .reduce((s, p) => s + Number(p.monthly_rent), 0);
  const commissionEarned = (commissions ?? []).reduce(
    (s, c) => s + (c.status === "paid" || c.status === "approved" ? Number(c.commission_amount) : 0),
    0
  );

  const viewingList = viewings as Viewing[];
  const todayKey = now.slice(0, 10);
  const todaysViewings = viewingList.filter((v) => v.scheduled_at.slice(0, 10) === todayKey);

  const calendarEvents: CalendarEvent[] = viewingList
    .filter((v) => ["pending", "confirmed", "rescheduled", "completed"].includes(v.status))
    .map((v) => ({
      id: v.id,
      date: v.scheduled_at.slice(0, 10),
      time: v.scheduled_at.slice(11, 16),
      title: v.property?.title?.slice(0, 18) ?? "Viewing",
      status: v.status,
    }));

  return (
    <div>
      <PageHeader
        title="Agent dashboard"
        description="Work on the properties the owner assigns to you — process tenant requests and mark taken units."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Properties" value={props.length} icon={<Home className="size-5" />} />
        <StatCard label="Available" value={available} icon={<Home className="size-5" />} />
        <StatCard label="Occupied" value={occupied} icon={<Home className="size-5" />} />
        <StatCard label="Pending applications" value={pendingApps} icon={<ClipboardList className="size-5" />} />
        <StatCard label="Monthly rental value" value={formatMoney(monthlyRentalValue)} icon={<IndianRupee className="size-5" />} />
        <StatCard label="Commission earned" value={formatMoney(commissionEarned)} icon={<Wallet className="size-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Viewing calendar</CardTitle>
            <Link href="/dashboard/agent/viewings" className="text-sm text-primary hover:underline">Manage</Link>
          </CardHeader>
          <CardContent>
            <Calendar events={calendarEvents} month={new Date()} />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">
                Today's viewings ({todaysViewings.length})
              </p>
              {todaysViewings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No viewings scheduled for today.</p>
              ) : (
                todaysViewings.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <span className="font-medium">{formatDateTime(v.scheduled_at)}</span>
                    <span className="truncate pl-2 text-muted-foreground">{v.property?.title}</span>
                    <StatusBadge status={v.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent applications</CardTitle>
            <Link href="/dashboard/agent/applications" className="text-sm text-primary hover:underline">Review all</Link>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <EmptyState icon={<ClipboardList className="size-6" />} title="No applications yet" description="Applications for your listings will appear here." />
            ) : (
              <ul className="space-y-3">
                {applications.map((app) => (
                  <li key={app.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.property?.title} · {timeAgo(app.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <Link href="/dashboard/agent/payments" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <EmptyState icon={<Wallet className="size-6" />} title="No payments yet" description="Successful tenant payments will show here." />
            ) : (
              <ul className="space-y-3">
                {recentPayments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{p.property?.title}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                    </div>
                    <span className="font-semibold text-success">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent messages</CardTitle>
            <Link href="/dashboard/agent/messages" className="text-sm text-primary hover:underline">Open chat</Link>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <EmptyState icon={<MessageSquare className="size-6" />} title="No messages yet" description="Tenant messages will appear here." />
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-sm">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(m.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
