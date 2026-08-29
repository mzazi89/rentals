import { NotificationsList } from "@/components/notifications-list";

export const metadata = { title: "Notifications" };

export default function AgentNotificationsPage() {
  return <NotificationsList role="agent" />;
}
