"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getMyNotifications } from "@/app/actions/data";
import { Card, CardContent } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/dashboard";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationsList({ role }: { role: string }) {
  const [list, setList] = React.useState<Notification[] | null>(null);

  React.useEffect(() => {
    getMyNotifications(100)
      .then(({ items }) => setList(items))
      .catch(() => setList([]));
  }, []);

  return (
    <div>
      <PageHeader title="Notifications" description="All your updates in one place." />
      {list === null ? (
        <div className="space-y-2">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-8" />}
          title="No notifications"
          description="Updates about viewings, applications, payments and rent will appear here."
        />
      ) : (
        <div className="grid gap-2">
          {list.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.is_read ? "bg-muted" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body ? <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
                {n.link ? (
                  <Link href={n.link} className="shrink-0 text-sm font-medium text-primary hover:underline">
                    View →
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
