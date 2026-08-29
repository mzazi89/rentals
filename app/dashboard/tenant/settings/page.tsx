import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import {
  ProfileSettingsForm,
  PasswordForm,
  NotificationPrefsForm,
  TenantDetailsForm,
} from "@/components/settings-forms";
import type { NotificationPreferences, Tenant } from "@/types";

export const metadata = { title: "Settings" };

export default async function TenantSettingsPage() {
  const profile = await requireProfile();
  
  const [tenant, prefs] = await Promise.all([
    db<Record<string, unknown>[]>`select * from tenants where id = ${profile.id}`.then((r) => r[0] ?? null),
    db<Record<string, unknown>[]>`select * from notification_preferences where user_id = ${profile.id}`.then((r) => r[0] ?? null),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, preferences and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <ProfileSettingsForm fullName={profile.full_name} phone={profile.phone} avatarUrl={profile.avatar_url} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rental preferences</CardTitle></CardHeader>
          <CardContent>
            <TenantDetailsForm tenant={(tenant as unknown as Tenant) ?? null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Password</CardTitle></CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            <NotificationPrefsForm prefs={(prefs as unknown as NotificationPreferences) ?? null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
