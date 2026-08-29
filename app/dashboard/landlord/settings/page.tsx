import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { ProfileSettingsForm, PasswordForm, NotificationPrefsForm } from "@/components/settings-forms";
import type { NotificationPreferences } from "@/types";

export const metadata = { title: "Settings" };

export default async function LandlordSettingsPage() {
  const profile = await requireProfile();
  
  const prefs = (await db<NotificationPreferences[]>`select * from notification_preferences where user_id = ${profile.id}`)[0] ?? null;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <ProfileSettingsForm fullName={profile.full_name} phone={profile.phone} avatarUrl={profile.avatar_url} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Password</CardTitle></CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            <NotificationPrefsForm prefs={(prefs as NotificationPreferences) ?? null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
