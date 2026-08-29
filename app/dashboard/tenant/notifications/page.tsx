import { NotificationsList } from "@/components/notifications-list";

export const metadata = { title: "Notifications" };

export default function TenantNotificationsPage() {
  return <NotificationsList role="tenant" />;
}
