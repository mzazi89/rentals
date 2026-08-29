import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Flag,
  Home,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { requireProfile, isOwnerRole } from "@/lib/auth/helpers";
import { DashboardTopbar } from "@/components/dashboard";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/agents", label: "Agents", icon: BadgeCheck },
  { href: "/admin/landlords", label: "Landlords", icon: Home },
  { href: "/admin/tenants", label: "Tenants", icon: Users },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/viewings", label: "Viewings", icon: BarChart3 },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/commissions", label: "Commissions", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/flags", label: "Reports/Flags", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!isOwnerRole(profile.role) && profile.role !== "owner") redirect("/forbidden");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopbar profileName={profile.full_name} profileAvatar={profile.avatar_url} role="admin" />
      <div className="flex flex-1">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col overflow-y-auto border-r bg-card p-3 lg:flex">
          <p className="mb-2 px-3 pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Administration</p>
          <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <l.icon className="size-4 shrink-0" />
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="mt-auto rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            ← Public site
          </Link>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl pb-16">{children}</div>
        </main>
      </div>
    </div>
  );
}
