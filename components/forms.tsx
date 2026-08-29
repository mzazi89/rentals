"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, MessageSquare, Send } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { authClient } from "@/lib/auth-client";
import { viewingCreateSchema, applicationCreateSchema } from "@/lib/validations";
import { bookViewing } from "@/app/actions/viewings";
import { applyToProperty } from "@/app/actions/applications";
import { startConversation } from "@/app/actions/conversations";
import type { z } from "zod";

type ViewingValues = z.infer<typeof viewingCreateSchema>;
type ApplicationValues = z.infer<typeof applicationCreateSchema>;

/* ------------------------------------------------------------------ */
/* Viewing booking form                                               */
/* ------------------------------------------------------------------ */
export function ViewingForm({ propertyId, onDone }: { propertyId: string; onDone?: () => void }) {
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ViewingValues>({ resolver: zodResolver(viewingCreateSchema), defaultValues: { propertyId } });

  const date = watch("scheduledAt") ?? "";
  const time = watch("time") ?? "";

  const onSubmit = async (values: ViewingValues) => {
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${values.scheduledAt}T${values.time ?? "10:00"}`).toISOString();
      const result = await bookViewing({ ...values, scheduledAt });
      if (result.ok) {
        toast("Viewing request sent. The agent will confirm shortly.", "success");
        router.refresh();
        onDone?.();
      } else {
        toast(result.error ?? "Could not book viewing.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Date" required error={errors.scheduledAt?.message}>
        <Input type="date" min={new Date().toISOString().slice(0, 10)} {...register("scheduledAt")} />
      </Field>
      <Field label="Time" required error={errors.time?.message}>
        <Input type="time" {...register("time")} />
      </Field>
      <Field label="Message to the agent (optional)" error={errors.tenantMessage?.message}>
        <Textarea rows={3} placeholder="e.g. I'd like to see the property after work." {...register("tenantMessage")} />
      </Field>
      <Button type="submit" loading={submitting} className="w-full">
        <CalendarDays className="size-4" /> Request viewing
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {date && time ? `Viewing scheduled for ${date} at ${time}` : "The agent will confirm availability."}
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Application form                                                   */
/* ------------------------------------------------------------------ */
export function ApplicationForm({ propertyId, onDone }: { propertyId: string; onDone?: () => void }) {
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationValues>({
    resolver: zodResolver(applicationCreateSchema),
    defaultValues: { propertyId, numberofOccupants: 1 },
  });

  const onSubmit = async (values: ApplicationValues) => {
    setSubmitting(true);
    try {
      const result = await applyToProperty(values);
      if (result.ok) {
        toast("Application submitted successfully.", "success");
        router.refresh();
        onDone?.();
      } else {
        toast(result.error ?? "Could not submit application.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName?.message}>
          <Input placeholder="Jane Wanjiku" {...register("fullName")} />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input placeholder="+254 7XX XXX XXX" {...register("phone")} />
        </Field>
      </div>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Occupation" error={errors.occupation?.message}>
          <Input placeholder="e.g. Software Engineer" {...register("occupation")} />
        </Field>
        <Field label="Employer" error={errors.employer?.message}>
          <Input placeholder="Company name" {...register("employer")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly income (KSh)" error={errors.monthlyIncome?.message}>
          <Input inputMode="numeric" placeholder="e.g. 120000" {...register("monthlyIncome")} />
        </Field>
        <Field label="Number of occupants" required error={errors.numberofOccupants?.message}>
          <Input type="number" min={1} max={20} {...register("numberofOccupants")} />
        </Field>
      </div>
      <Field label="Preferred move-in date" error={errors.preferredMoveInDate?.message}>
        <Input type="date" {...register("preferredMoveInDate")} />
      </Field>
      <Field label="Additional notes (optional)" error={errors.notes?.message}>
        <Textarea rows={3} placeholder="Anything the landlord or agent should know." {...register("notes")} />
      </Field>
      <Button type="submit" loading={submitting} className="w-full">
        Submit application
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Contact agent (starts a conversation)                              */
/* ------------------------------------------------------------------ */
export function ContactAgentButton({
  agentId,
  propertyId,
  variant = "outline",
  label = "Message agent",
}: {
  agentId: string;
  propertyId?: string;
  variant?: "outline" | "default";
  label?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handle = async () => {
    setLoading(true);
    try {
      const session = await authClient.getSession();
      if (!session.data) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const result = await startConversation({ propertyId: propertyId ?? "", agentId });
      if (result.ok) {
        router.push(`/dashboard/tenant/messages?conversation=${String(result.conversationId)}`);
      } else {
        toast(result.error ?? "Could not start conversation.", "error");
      }
    } catch {
      toast("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handle} loading={loading} className="w-full sm:w-auto">
      <MessageSquare className="size-4" /> {label}
    </Button>
  );
}

export function SendButton({ loading }: { loading?: boolean }) {
  return (
    <Button type="submit" size="icon" loading={loading} aria-label="Send message">
      <Send className="size-4" />
    </Button>
  );
}
