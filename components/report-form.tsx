"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Select, Textarea } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { reportCreateSchema } from "@/lib/validations";
import { createReport } from "@/app/actions/reports";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import type { z } from "zod";

export function ReportForm({
  propertyId,
  reportedUserId,
  onDone,
}: {
  propertyId?: string;
  reportedUserId?: string;
  onDone?: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof reportCreateSchema>>({ resolver: zodResolver(reportCreateSchema) });

  const onSubmit = async (values: z.infer<typeof reportCreateSchema>) => {
    setSubmitting(true);
    try {
      const result = await createReport({
        ...values,
        propertyId: propertyId ?? undefined,
        reportedUserId: reportedUserId ?? undefined,
      });
      if (result.ok) {
        toast("Report submitted. Thank you for keeping RentHub safe.", "success");
        onDone?.();
      } else {
        toast(result.error ?? "Could not submit report.", "error");
      }
    } catch {
      toast("Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Reason" required error={errors.reason?.message}>
        <Select {...register("reason")}>
          <option value="">Select a reason…</option>
          {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Details" required error={errors.description?.message}>
        <Textarea rows={4} placeholder="Describe what happened…" {...register("description")} />
      </Field>
      <Button type="submit" variant="destructive" loading={submitting} className="w-full">
        Submit report
      </Button>
    </form>
  );
}
