import Link from "next/link";
import { BadgeCheck, ClipboardList, CreditCard, Home, Users, Wallet } from "lucide-react";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { StatCard } from "@/components/ui/layout";
import { AdminCharts } from "@/components/admin-charts";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Admin dashboard", path: "/admin", noIndex: true });

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = ["7", "30", "90", "365"].includes(searchParams.range ?? "")
    ? Number(searchParams.range)
    : 30;

  const since = new Date(Date.now() - range * 86400000).toISOString();

  const [users, tenants, agents, landlords, properties, pendingAgents, pendingProps, transactions, revenue, leases] =
    await Promise.all([
      db<{ n: number }[]>`select count(*)::int as n from profiles`,
      db<{ n: number }[]>`select count(*)::int as n from profiles where role = 'tenant'`,
      db<{ n: number }[]>`select count(*)::int as n from profiles where role = 'agent'`,
      db<{ n: number }[]>`select count(*)::int as n from profiles where role = 'landlord'`,
      db<{ n: number }[]>`select count(*)::int as n from properties`,
      db<{ n: number }[]>`select count(*)::int as n from agents where verification_status = 'pending'`,
      db<{ n: number }[]>`select count(*)::int as n from properties where status = 'pending_review'`,
      db<{ n: number }[]>`select count(*)::int as n from payments where status = 'successful' and created_at >= ${since}`,
      db<{ sum: number }[]>`select coalesce(sum(amount), 0)::int as sum from payments where status = 'successful' and created_at >= ${since}`,
      db<{ n: number }[]>`select count(*)::int as n from leases where status = 'active'`,
    ]);

  const revenueTotal = revenue[0]?.sum ?? 0;

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Platform health at a glance."
        actions={
          <Link
            href="/admin/agents"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Review pending ({pendingAgents[0]?.n ?? 0})
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total users" value={users[0]?.n ?? 0} icon={<Users className="size-5" />} />
        <StatCard label="Tenants" value={tenants[0]?.n ?? 0} icon={<Users className="size-5" />} />
        <StatCard label="Agents" value={agents[0]?.n ?? 0} icon={<BadgeCheck className="size-5" />} />
        <StatCard label="Landlords" value={landlords[0]?.n ?? 0} icon={<Home className="size-5" />} />
        <StatCard label="Properties" value={properties[0]?.n ?? 0} icon={<Home className="size-5" />} />
        <StatCard label="Pending agent verifications" value={pendingAgents[0]?.n ?? 0} icon={<BadgeCheck className="size-5" />} />
        <StatCard label="Properties pending review" value={pendingProps[0]?.n ?? 0} icon={<ClipboardList className="size-5" />} />
        <StatCard label={`Transactions (${range}d)`} value={transactions[0]?.n ?? 0} icon={<CreditCard className="size-5" />} />
        <StatCard label={`Revenue (${range}d)`} value={`KSh ${Math.round(revenueTotal).toLocaleString()}`} icon={<Wallet className="size-5" />} />
        <StatCard label="Active leases" value={leases[0]?.n ?? 0} icon={<Home className="size-5" />} />
      </div>

      <div className="mt-6">
        <AdminCharts range={range} />
      </div>
    </div>
  );
}
