"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Textarea } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { getLocations, getPropertyTypes } from "@/app/actions/data";
import {
  tenantOnboardingSchema,
  agentOnboardingSchema,
  landlordOnboardingSchema,
} from "@/lib/validations";
import {
  completeTenantOnboarding,
  completeAgentOnboarding,
  completeLandlordOnboarding,
} from "@/app/actions/auth";
import type { z } from "zod";

/* ------------------------------------------------------------------ */
/* Tenant onboarding                                                  */
/* ------------------------------------------------------------------ */
export function TenantOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [locations, setLocations] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<{ id: string; name: string }[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof tenantOnboardingSchema>>({
    resolver: zodResolver(tenantOnboardingSchema),
    defaultValues: { preferredLocations: [], minBudget: undefined, maxBudget: undefined, monthlyIncome: undefined },
  });

  const selected = watch("preferredLocations") ?? [];

  React.useEffect(() => {
    getLocations("neighborhood").then(setLocations).catch(() => {});
    getPropertyTypes().then(setTypes).catch(() => {});
  }, []);

  const toggleLocation = (name: string) => {
    const next = selected.includes(name) ? selected.filter((l) => l !== name) : [...selected, name].slice(-10);
    setValue("preferredLocations", next, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof tenantOnboardingSchema>) => {
    const result = await completeTenantOnboarding(values);
    if (result.ok) {
      toast("Welcome to RentHub!", "success");
      router.push("/dashboard/tenant");
    } else {
      toast(result.error ?? "Could not save profile.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName?.message}>
          <Input autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="+254 7XX XXX XXX" />
        </Field>
      </div>
      <Field label="Preferred locations" hint="Tap to select neighborhoods (max 10)" error={errors.preferredLocations?.message}>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => {
            const active = selected.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLocation(loc)}
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
        <Field label="Property type" error={errors.propertyType?.message}>
          <select {...register("propertyType")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Any</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Occupation" error={errors.occupation?.message}>
          <Input {...register("occupation")} placeholder="e.g. Software Engineer" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min budget (KSh)" error={errors.minBudget?.message}>
          <Input inputMode="numeric" {...register("minBudget")} />
        </Field>
        <Field label="Max budget (KSh)" error={errors.maxBudget?.message}>
          <Input inputMode="numeric" {...register("maxBudget")} />
        </Field>
        <Field label="Monthly income (KSh)" error={errors.monthlyIncome?.message}>
          <Input inputMode="numeric" {...register("monthlyIncome")} />
        </Field>
      </div>
      <Button type="submit" className="w-full">Save and continue</Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Agent onboarding                                                   */
/* ------------------------------------------------------------------ */
export function AgentOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [areas, setAreas] = React.useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof agentOnboardingSchema>>({
    resolver: zodResolver(agentOnboardingSchema),
    defaultValues: { areasServed: [], yearsExperience: undefined },
  });

  const selected = watch("areasServed") ?? [];

  React.useEffect(() => {
    getLocations("neighborhood").then(setAreas).catch(() => {});
  }, []);

  const toggleArea = (name: string) => {
    const next = selected.includes(name) ? selected.filter((a) => a !== name) : [...selected, name].slice(-20);
    setValue("areasServed", next, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof agentOnboardingSchema>) => {
    const result = await completeAgentOnboarding(values);
    if (result.ok) {
      toast("Profile submitted for verification.", "success");
      router.push("/dashboard/agent");
    } else {
      toast(result.error ?? "Could not save profile.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName?.message}>
          <Input autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Agency name" required error={errors.agencyName?.message}>
          <Input {...register("agencyName")} placeholder="e.g. Wanjiku Realty" />
        </Field>
        <Field label="Agency phone" required error={errors.agencyPhone?.message}>
          <Input {...register("agencyPhone")} />
        </Field>
      </div>
      <Field label="Agency address" error={errors.agencyAddress?.message}>
        <Input {...register("agencyAddress")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Years of experience" error={errors.yearsExperience?.message}>
          <Input type="number" min={0} max={100} {...register("yearsExperience")} />
        </Field>
        <Field label="National ID number" required error={errors.idNumber?.message}>
          <Input {...register("idNumber")} />
        </Field>
      </div>
      <Field label="Areas you serve" hint="Tap to select neighborhoods (max 20)" error={errors.areasServed?.message}>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => {
            const active = selected.includes(area);
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
      <Field label="Short bio (optional)" error={errors.bio?.message}>
        <Textarea rows={3} {...register("bio")} placeholder="Tell tenants about yourself and your agency." />
      </Field>
      <Button type="submit" className="w-full">Submit for verification</Button>
      <p className="text-center text-xs text-muted-foreground">
        Your profile will be reviewed by our team before you can list properties.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Landlord onboarding                                                */
/* ------------------------------------------------------------------ */
export function LandlordOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof landlordOnboardingSchema>>({ resolver: zodResolver(landlordOnboardingSchema) });

  const onSubmit = async (values: z.infer<typeof landlordOnboardingSchema>) => {
    const result = await completeLandlordOnboarding(values);
    if (result.ok) {
      toast("Welcome to RentHub!", "success");
      router.push("/dashboard/landlord");
    } else {
      toast(result.error ?? "Could not save profile.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Full name" required error={errors.fullName?.message}>
        <Input autoComplete="name" {...register("fullName")} />
      </Field>
      <Field label="Phone" required error={errors.phone?.message}>
        <Input {...register("phone")} />
      </Field>
      <Field label="Company name (optional)" error={errors.companyName?.message}>
        <Input {...register("companyName")} />
      </Field>
      <Field label="Address" error={errors.address?.message}>
        <Input {...register("address")} />
      </Field>
      <Button type="submit" className="w-full">Save and continue</Button>
    </form>
  );
}
