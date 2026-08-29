"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Wallet,
  X,
  BadgeCheck,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/app/actions/data";
import { Avatar } from "@/components/ui/layout";
import { Badge } from "@/components/ui/feedback";
import type { Notification } from "@/types";

/* ------------------------------------------------------------------ */
/* Page header                                                        */
/* ------------------------------------------------------------------ */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                            */
/* ------------------------------------------------------------------ */
export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleLinks: Record<string, SidebarLink[]> = {
  tenant: [
    { href: "/dashboard/tenant", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tenant/saved", label: "Saved Properties", icon: Home },
    { href: "/dashboard/tenant/viewings", label: "Viewings", icon: CalendarDays },
    { href: "/dashboard/tenant/applications", label: "Applications", icon: ClipboardList },
    { href: "/dashboard/tenant/lease", label: "My Lease & Rent", icon: Wallet },
    { href: "/dashboard/tenant/payments", label: "Payments", icon: Wallet },
    { href: "/dashboard/tenant/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/tenant/settings", label: "Settings", icon: Settings },
  ],
  agent: [
    { href: "/dashboard/agent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agent/properties", label: "Properties", icon: Home },
    { href: "/dashboard/agent/tenants", label: "Tenants", icon: Users },
    { href: "/dashboard/agent/applications", label: "Applications", icon: ClipboardList },
    { href: "/dashboard/agent/viewings", label: "Viewings", icon: CalendarDays },
    { href: "/dashboard/agent/payments", label: "Payments", icon: Wallet },
    { href: "/dashboard/agent/commissions", label: "Commissions", icon: BadgeCheck },
    { href: "/dashboard/agent/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/agent/reports", label: "Reports", icon: FileBarChart },
    { href: "/dashboard/agent/profile", label: "Profile", icon: Users },
    { href: "/dashboard/agent/settings", label: "Settings", icon: Settings },
  ],
  landlord: [
    { href: "/dashboard/landlord", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/landlord/properties", label: "Properties", icon: Home },
    { href: "/dashboard/landlord/agents", label: "Agents", icon: BadgeCheck },
    { href: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
    { href: "/dashboard/landlord/applications", label: "Applications", icon: ClipboardList },
    { href: "/dashboard/landlord/payments", label: "Payments", icon: Wallet },
    { href: "/dashboard/landlord/reports", label: "Reports", icon: FileBarChart },
    { href: "/dashboard/landlord/settings", label: "Settings", icon: Settings },
  ],
};

export function DashboardSidebar({ role, userName }: { role: string; userName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const links = roleLinks[role] ?? [];

  const Nav = () => (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== `/dashboard/${role}` && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <l.icon className="size-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t pt-3">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Home className="size-4" /> Public site
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b px-4 py-4">
          <p className="truncate text-sm font-semibold capitalize">{role}</p>
          <p className="truncate text-xs text-muted-foreground">{userName}</p>
        </div>
        <Nav />
      </aside>

      {/* Mobile */}
      <button
        aria-label="Open dashboard menu"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-primary p-3 text-primary-foreground shadow-lift lg:hidden print-hidden"
      >
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-lift">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div>
                <p className="text-sm font-semibold capitalize">{role}</p>
                <p className="text-xs text-muted-foreground">{userName}</p>
              </div>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <Nav />
          </aside>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Notification bell                                                  */
/* ------------------------------------------------------------------ */
export function NotificationBell({ role }: { role?: string }) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = React.useCallback(async () => {
    try {
      const { items } = await getMyNotifications(10);
      setNotifications(items);
    } catch {
      /* not signed in */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openNotification = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-popover shadow-lift sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 ? (
              <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                <div className="skeleton h-10" />
                <div className="skeleton h-10" />
                <div className="skeleton h-10" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn("flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/50", !n.is_read && "bg-primary/[0.03]")}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {!n.is_read ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                    {n.title}
                  </span>
                  {n.body ? <span className="text-xs text-muted-foreground">{n.body}</span> : null}
                  <span className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                </button>
              ))
            )}
          </div>
          <div className="border-t p-2">
            <Link
              href={`/dashboard/${role ?? "tenant"}/notifications`}
              className="block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar                                                            */
/* ------------------------------------------------------------------ */
export function DashboardTopbar({
  profileName,
  profileAvatar,
  role,
}: {
  profileName?: string | null;
  profileAvatar?: string | null;
  role: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const logout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <p className="text-sm font-medium capitalize text-muted-foreground">
        {role === "admin" ? "Administration" : `${role} dashboard`}
      </p>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            aria-label="Account menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-muted"
          >
            <Avatar src={profileAvatar} name={profileName} size="sm" />
          </button>
          {menuOpen ? (
            <div role="menu" className="absolute right-0 z-50 mt-2 w-52 rounded-xl border bg-popover p-1 shadow-lift">
              <div className="border-b px-3 py-2">
                <p className="truncate text-sm font-medium">{profileName ?? "User"}</p>
              </div>
              <Link href="/dashboard/tenant/settings" className="hidden" />
              <button
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Simple month calendar (agent viewings)                             */
/* ------------------------------------------------------------------ */
export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  status?: string;
}

export function Calendar({ events, month }: { events: CalendarEvent[]; month: Date }) {
  const [cursor, setCursor] = React.useState(month);
  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();
  const firstDay = new Date(year, monthIdx, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  const byDate = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">
          {cursor.toLocaleString("en-KE", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, monthIdx - 1, 1))}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, monthIdx + 1, 1))}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="bg-muted/40 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="bg-card" />;
          const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
          const dayEvents = byDate[dateKey] ?? [];
          return (
            <div key={dateKey} className="min-h-16 bg-card p-1">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  dateKey === today ? "bg-primary font-bold text-primary-foreground" : "text-foreground"
                )}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    title={`${e.time} ${e.title}`}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                      e.status === "completed"
                        ? "bg-success/10 text-success"
                        : e.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    )}
                  >
                    {e.time} {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Notification link helper (all notifications page per role) */
export function notificationsHref(role: string): string {
  return `/dashboard/${role}/notifications`;
}

export { Badge };
