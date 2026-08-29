import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import {
  ProfileSettingsForm,
  PasswordForm,
  NotificationPrefsForm,
  AgencySettingsForm,
} from "@/components/settings-forms";
import type { Agent, NotificationPreferences } from "@/types";

export const metadata = { title: "Settings" };

export default async function AgentSettingsPage() {
  const profile = await requireProfile();
  
  const [agent, prefs] = await Promise.all([
    db<Agent[]>`select * from agents where id = ${profile.id}`.then((r) => r[0] ?? null),
    db<NotificationPreferences[]>`select * from notification_preferences where user_id = ${profile.id}`.then((r) => r[0] ?? null),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, agency and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal profile</CardTitle></CardHeader>
          <CardContent>
            <ProfileSettingsForm fullName={profile.full_name} phone={profile.phone} avatarUrl={profile.avatar_url} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agency details</CardTitle></CardHeader>
          <CardContent>
            <AgencySettingsForm agent={(agent as Agent) ?? null} />
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
            <NotificationPrefsForm prefs={(prefs as NotificationPreferences) ?? null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
