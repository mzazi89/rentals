import { db } from "@/db";
import { PageHeader } from "@/components/dashboard";
import {
  PlatformSettingsForm,
  CatalogueManagerTypes,
  CatalogueManagerAmenities,
  CatalogueManagerLocations,
} from "@/components/admin-settings-client";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [settingsRows, types, amenities, locations] = await Promise.all([
    db<{ key: string; value: unknown }[]>`select key, value from platform_settings`,
    db<{ id: string; name: string; is_active: boolean }[]>`select id, name, is_active from property_types order by sort_order`,
    db<{ id: string; name: string; is_active: boolean }[]>`select id, name, is_active from amenities order by sort_order`,
    db<{ id: string; name: string; type: string; is_active: boolean }[]>`select id, name, type, is_active from locations order by sort_order limit 100`,
  ]);

  const raw = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  return (
    <div>
      <PageHeader title="Platform settings" description="Configure branding, fees and catalogue." />
      <div className="grid gap-6">
        <PlatformSettingsForm settings={raw} />
        <CatalogueManagerTypes items={types} />
        <CatalogueManagerAmenities items={amenities} />
        <CatalogueManagerLocations items={locations} />
      </div>
    </div>
  );
}
