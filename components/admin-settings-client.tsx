"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { useToast } from "@/components/ui/feedback";
import {
  savePlatformSettings,
  managePropertyType,
  manageAmenity,
  manageLocation,
} from "@/app/actions/admin";

export function PlatformSettingsForm({ settings }: { settings: Record<string, unknown> }) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const fields: { key: string; label: string; type: "text" | "number" | "boolean" }[] = [
    { key: "site.name", label: "Site name", type: "text" },
    { key: "site.tagline", label: "Tagline", type: "text" },
    { key: "site.currency", label: "Currency (ISO)", type: "text" },
    { key: "site.contact_email", label: "Contact email", type: "text" },
    { key: "site.contact_phone", label: "Contact phone", type: "text" },
    { key: "payments.application_fee", label: "Application fee (KES)", type: "number" },
    { key: "payments.booking_fee", label: "Booking fee (KES)", type: "number" },
    { key: "commissions.rent_rate", label: "Commission % on rent", type: "number" },
    { key: "commissions.deposit_rate", label: "Commission % on deposit", type: "number" },
    { key: "features.require_property_verification", label: "Require property verification", type: "boolean" },
    { key: "features.require_agent_verification", label: "Require agent verification", type: "boolean" },
    { key: "features.allow_public_registration", label: "Allow public registration", type: "boolean" },
    { key: "features.allow_landlord_registration", label: "Allow landlord registration", type: "boolean" },
    { key: "seo.default_description", label: "Default meta description", type: "text" },
    { key: "site.safety_tip", label: "Safety tip text", type: "text" },
  ];

  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => {
        const raw = settings[f.key];
        return [f.key, f.type === "boolean" ? String(raw ?? "true") : String(raw ?? "")];
      })
    )
  );

  const save = async () => {
    setSaving(true);
    const payload: Record<string, string | number | boolean> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.type === "boolean") payload[f.key] = v === "true";
      else if (f.type === "number") payload[f.key] = Number(v) || 0;
      else payload[f.key] = v;
    }
    const result = await savePlatformSettings(payload);
    if (result.ok) {
      toast("Settings saved", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not save.", "error");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Platform settings</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "boolean" ? (
                <select
                  value={values[f.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>
        <Button className="mt-4" onClick={save} loading={saving}>Save settings</Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue management (types / amenities / locations)               */
/* ------------------------------------------------------------------ */
function CatalogueManager({
  title,
  items,
  onAdd,
  onDelete,
  onToggle,
  addLabel,
}: {
  title: string;
  items: { id: string; name: string; is_active?: boolean }[];
  onAdd: (name: string) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onToggle?: (id: string, active: boolean) => Promise<{ ok: boolean; error?: string }>;
  addLabel: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const result = await onAdd(name.trim());
    if (result.ok) {
      toast(`${addLabel} added`, "success");
      setName("");
      router.refresh();
    } else {
      toast(result.error ?? "Could not add.", "error");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`New ${addLabel.toLowerCase()} name`} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add} loading={busy} disabled={!name.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${item.is_active === false ? "opacity-50" : ""}`}>
              {item.name}
              {onToggle ? (
                <button
                  aria-label={item.is_active === false ? "Activate" : "Deactivate"}
                  onClick={() => onToggle(item.id, item.is_active !== false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.is_active === false ? "activate" : "hide"}
                </button>
              ) : null}
              <button aria-label={`Delete ${item.name}`} onClick={() => void onDelete(item.id)} className="text-destructive hover:opacity-70">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {items.length === 0 ? <li className="text-sm text-muted-foreground">Nothing here yet.</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}

export function CatalogueManagerTypes({ items }: { items: { id: string; name: string; is_active?: boolean }[] }) {
  return (
    <CatalogueManager
      title="Property types"
      items={items}
      addLabel="Type"
      onAdd={async (name) => managePropertyType({ action: "create", name })}
      onDelete={async (id) => managePropertyType({ action: "delete", id })}
      onToggle={async (id, isActive) => managePropertyType({ action: "update", id, isActive })}
    />
  );
}

export function CatalogueManagerAmenities({ items }: { items: { id: string; name: string; is_active?: boolean }[] }) {
  return (
    <CatalogueManager
      title="Amenities"
      items={items}
      addLabel="Amenity"
      onAdd={async (name) => manageAmenity({ action: "create", name })}
      onDelete={async (id) => manageAmenity({ action: "delete", id })}
      onToggle={async (id, isActive) => manageAmenity({ action: "update", id, isActive })}
    />
  );
}

export function CatalogueManagerLocations({ items }: { items: { id: string; name: string; is_active?: boolean }[] }) {
  return (
    <CatalogueManager
      title="Locations"
      items={items}
      addLabel="Location"
      onAdd={async (name) => manageLocation({ action: "create", name, type: "neighborhood" })}
      onDelete={async (id) => manageLocation({ action: "delete", id })}
      onToggle={async (id, isActive) => manageLocation({ action: "update", id, isActive })}
    />
  );
}
