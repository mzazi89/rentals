"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Switch, Textarea } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { getLocations } from "@/app/actions/data";
import {
  profileSettingsSchema,
  notificationPrefsSchema,
  agencySettingsSchema,
} from "@/lib/validations";
import {
  updateProfileSettings,
  updatePassword,
  updateNotificationPrefs,
  updateAgencySettings,
  updateTenantDetails,
} from "@/app/actions/profile";
import { uploadImageFile } from "@/lib/storage";
import type { Agent, NotificationPreferences, Tenant } from "@/types";
import type { z } from "zod";

export function ProfileSettingsForm({
  fullName,
  phone,
  avatarUrl,
}: {
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof profileSettingsSchema>>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: { fullName: fullName ?? "", phone: phone ?? "", avatarUrl: avatarUrl ?? "" },
  });

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, "profile-images", "avatars");
      await updateProfileSettings({ fullName: fullName ?? "", phone: phone ?? "", avatarUrl: url });
      toast("Photo updated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSettingsSchema>) => {
    const result = await updateProfileSettings(values);
    if (result.ok) {
      toast("Profile updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not save.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Profile photo">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile" className="size-14 rounded-full object-cover" />
          ) : null}
          <label className="cursor-pointer rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
            {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onAvatar} />
          </label>
        </div>
      </Field>
      <Field label="Full name" required error={errors.fullName?.message}>
        <Input {...register("fullName")} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input {...register("phone")} />
      </Field>
      <Button type="submit">Save changes</Button>
    </form>
  );
}

export function PasswordForm() {
  const { toast } = useToast();
  const [current, setCurrent] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast("Password must be at least 8 characters.", "error");
      return;
    }
    if (password !== confirm) {
      toast("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    const result = await updatePassword({ currentPassword: current, newPassword: password });
    if (result.ok) {
      toast("Password updated", "success");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } else {
      toast(result.error ?? "Could not update password. Check your current password.", "error");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Current password" required>
        <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" required hint="At least 8 characters">
        <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm new password" required>
        <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button type="submit" loading={loading}>Update password</Button>
    </form>
  );
}

export function NotificationPrefsForm({ prefs }: { prefs: NotificationPreferences | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = React.useState({
    notifyViewing: prefs?.notify_viewing ?? true,
    notifyApplication: prefs?.notify_application ?? true,
    notifyPayment: prefs?.notify_payment ?? true,
    notifyRent: prefs?.notify_rent ?? true,
    notifyMessage: prefs?.notify_message ?? true,
    notifySystem: prefs?.notify_system ?? true,
    emailEnabled: prefs?.email_enabled ?? true,
    inAppEnabled: prefs?.in_app_enabled ?? true,
  });
  const [saving, setSaving] = React.useState(false);

  const set = (key: keyof typeof state) => (v: boolean) => setState((prev) => ({ ...prev, [key]: v }));

  const save = async () => {
    setSaving(true);
    const parsed = notificationPrefsSchema.safeParse(state);
    if (!parsed.success) {
      toast("Invalid preferences.", "error");
      setSaving(false);
      return;
    }
    const result = await updateNotificationPrefs(parsed.data);
    if (result.ok) {
      toast("Preferences saved", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not save.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Switch id="np-viewing" checked={state.notifyViewing} onCheckedChange={set("notifyViewing")} label="Viewing updates" />
        <Switch id="np-app" checked={state.notifyApplication} onCheckedChange={set("notifyApplication")} label="Application updates" />
        <Switch id="np-pay" checked={state.notifyPayment} onCheckedChange={set("notifyPayment")} label="Payment updates" />
        <Switch id="np-rent" checked={state.notifyRent} onCheckedChange={set("notifyRent")} label="Rent reminders" />
        <Switch id="np-msg" checked={state.notifyMessage} onCheckedChange={set("notifyMessage")} label="Messages" />
        <Switch id="np-sys" checked={state.notifySystem} onCheckedChange={set("notifySystem")} label="System announcements" />
      </div>
      <div className="border-t pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Switch id="np-inapp" checked={state.inAppEnabled} onCheckedChange={set("inAppEnabled")} label="In-app notifications" />
          <Switch id="np-email" checked={state.emailEnabled} onCheckedChange={set("emailEnabled")} label="Email notifications" />
        </div>
      </div>
      <Button onClick={save} loading={saving}>Save preferences</Button>
    </div>
  );
}

export function AgencySettingsForm({ agent }: { agent: Agent | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [areas, setAreas] = React.useState<string[]>(agent?.areas_served ?? []);
  const [locationOptions, setLocationOptions] = React.useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof agencySettingsSchema>>({
    resolver: zodResolver(agencySettingsSchema),
    defaultValues: {
      agencyName: agent?.agency_name ?? "",
      agencyPhone: agent?.agency_phone ?? "",
      agencyAddress: agent?.agency_address ?? "",
      bio: agent?.bio ?? "",
      areasServed: agent?.areas_served ?? [],
      isAvailable: agent?.is_available ?? true,
    },
  });

  const selected = watch("areasServed");

  React.useEffect(() => {
    getLocations("neighborhood").then(setLocationOptions).catch(() => {});
  }, []);

  const toggleArea = (name: string) => {
    const next = selected.includes(name) ? selected.filter((a) => a !== name) : [...selected, name].slice(-20);
    setAreas(next);
    setValue("areasServed", next, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof agencySettingsSchema>) => {
    const result = await updateAgencySettings(values);
    if (result.ok) {
      toast("Agency settings saved", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not save.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Agency name" required error={errors.agencyName?.message}>
          <Input {...register("agencyName")} />
        </Field>
        <Field label="Agency phone" required error={errors.agencyPhone?.message}>
          <Input {...register("agencyPhone")} />
        </Field>
      </div>
      <Field label="Agency address" error={errors.agencyAddress?.message}>
        <Input {...register("agencyAddress")} />
      </Field>
      <Field label="Bio" error={errors.bio?.message}>
        <Textarea rows={3} {...register("bio")} />
      </Field>
      <Field label="Areas served">
        <div className="flex flex-wrap gap-2">
          {locationOptions.map((area) => {
            const active = areas.includes(area);
            return (
              <button
                key={area}
                type="button"
                aria-pressed={active}
                onClick={() => toggleArea(area)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                {area}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Accepting new clients">
        <Switch id="agent-avail" checked={watch("isAvailable")} onCheckedChange={(v) => setValue("isAvailable", v)} label={watch("isAvailable") ? "Yes, available" : "Currently unavailable"} />
      </Field>
      <Button type="submit">Save agency settings</Button>
    </form>
  );
}

export function TenantDetailsForm({ tenant }: { tenant: Tenant | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [locations, setLocations] = React.useState<string[]>(tenant?.preferred_locations ?? []);
  const [options, setOptions] = React.useState<string[]>([]);
  const [occupation, setOccupation] = React.useState(tenant?.occupation ?? "");
  const [employer, setEmployer] = React.useState(tenant?.employer ?? "");
  const [minBudget, setMinBudget] = React.useState(tenant?.min_budget ? String(tenant.min_budget) : "");
  const [maxBudget, setMaxBudget] = React.useState(tenant?.max_budget ? String(tenant.max_budget) : "");
  const [monthlyIncome, setMonthlyIncome] = React.useState(tenant?.monthly_income ? String(tenant.monthly_income) : "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    getLocations("neighborhood").then(setOptions).catch(() => {});
  }, []);

  const toggle = (name: string) =>
    setLocations((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name].slice(-10)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateTenantDetails({
      preferredLocations: locations,
      occupation: occupation || undefined,
      employer: employer || undefined,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
    });
    if (result.ok) {
      toast("Details saved", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not save.", "error");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Preferred locations">
        <div className="flex flex-wrap gap-2">
          {options.map((loc) => {
            const active = locations.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(loc)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Occupation">
          <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </Field>
        <Field label="Employer">
          <Input value={employer} onChange={(e) => setEmployer(e.target.value)} />
        </Field>
        <Field label="Min budget (KSh)">
          <Input inputMode="numeric" value={minBudget} onChange={(e) => setMinBudget(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Max budget (KSh)">
          <Input inputMode="numeric" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Monthly income (KSh)" className="sm:col-span-2">
          <Input inputMode="numeric" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </div>
      <Button type="submit" loading={saving}>Save details</Button>
    </form>
  );
}
