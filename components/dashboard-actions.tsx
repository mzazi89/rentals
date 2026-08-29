"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Check, FilePlus2, X } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/core";
import { Dialog } from "@/components/ui/overlays";
import { useToast } from "@/components/ui/feedback";
import { manageViewing } from "@/app/actions/viewings";
import { reviewApplication } from "@/app/actions/applications";
import { createLease } from "@/app/actions/leases";
import { leaseCreateSchema } from "@/lib/validations";
import type { z } from "zod";

/* ------------------------------------------------------------------ */
/* Viewing management buttons (agent / tenant)                        */
/* ------------------------------------------------------------------ */
export function ViewingActions({
  viewingId,
  status,
  role,
}: {
  viewingId: string;
  status: string;
  role: "agent" | "tenant";
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [newTime, setNewTime] = React.useState("");

  const act = async (
    action: "confirm" | "reject" | "complete" | "no_show" | "cancel" | "reschedule",
    extra?: Record<string, string>
  ) => {
    setBusy(action);
    const result = await manageViewing({ viewingId, action, ...extra });
    if (result.ok) {
      toast("Viewing updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update viewing.", "error");
    }
    setBusy(null);
    setRescheduleOpen(false);
  };

  if (role === "tenant") {
    if (status === "pending" || status === "confirmed") {
      return (
        <Button size="sm" variant="destructive" loading={busy === "cancel"} onClick={() => act("cancel")}>
          <X className="size-3.5" /> Cancel
        </Button>
      );
    }
    return null;
  }

  // agent controls
  const rescheduleDialog = (
    <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen} title="Reschedule viewing" description="Pick a new date and time for this viewing.">
      <div className="space-y-4">
        <Field label="New date & time" required>
          <Input type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        </Field>
        <Button
          className="w-full"
          disabled={!newTime}
          loading={busy === "reschedule"}
          onClick={() => act("reschedule", { rescheduleAt: new Date(newTime).toISOString() })}
        >
          Confirm new time
        </Button>
      </div>
    </Dialog>
  );

  if (status === "pending" || status === "rescheduled") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {rescheduleDialog}
        <Button size="sm" variant="success" loading={busy === "confirm"} onClick={() => act("confirm")}>
          <Check className="size-3.5" /> Confirm
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)}>
          <CalendarClock className="size-3.5" /> Reschedule
        </Button>
        <Button size="sm" variant="destructive" loading={busy === "reject"} onClick={() => act("reject")}>
          <X className="size-3.5" /> Decline
        </Button>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {rescheduleDialog}
        <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)}>
          <CalendarClock className="size-3.5" /> Reschedule
        </Button>
        <Button size="sm" variant="success" loading={busy === "complete"} onClick={() => act("complete")}>
          <Check className="size-3.5" /> Mark complete
        </Button>
        <Button size="sm" variant="destructive" loading={busy === "no_show"} onClick={() => act("no_show")}>
          No show
        </Button>
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Application review (agent / landlord) + lease creation             */
/* ------------------------------------------------------------------ */
export function ApplicationActions({ applicationId, status }: { applicationId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const act = async (action: "approve" | "reject" | "under_review") => {
    setBusy(action);
    const result = await reviewApplication({ applicationId, action });
    if (result.ok) {
      toast(
        action === "approve" ? "Application approved — create a lease to finish." : "Application updated",
        "success"
      );
      router.refresh();
    } else {
      toast(result.error ?? "Could not update application.", "error");
    }
    setBusy(null);
  };

  if (["submitted", "under_review"].includes(status)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" loading={busy === "under_review"} onClick={() => act("under_review")}>
          Mark under review
        </Button>
        <Button size="sm" variant="success" loading={busy === "approve"} onClick={() => act("approve")}>
          <Check className="size-3.5" /> Approve
        </Button>
        <Button size="sm" variant="destructive" loading={busy === "reject"} onClick={() => act("reject")}>
          <X className="size-3.5" /> Reject
        </Button>
      </div>
    );
  }
  if (status === "approved") {
    return <LeaseCreateButton applicationId={applicationId} />;
  }
  return null;
}

function LeaseCreateButton({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof leaseCreateSchema>>({
    resolver: zodResolver(leaseCreateSchema),
    defaultValues: { applicationId, monthlyRent: 0, depositAmount: 0, paymentDay: 1 },
  });

  const onSubmit = async (values: z.infer<typeof leaseCreateSchema>) => {
    const result = await createLease(values);
    if (result.ok) {
      toast("Lease created. Rent schedule generated.", "success");
      setOpen(false);
      router.refresh();
    } else {
      toast(result.error ?? "Could not create lease.", "error");
    }
  };

  return (
    <>
      <Button size="sm" variant="accent" onClick={() => setOpen(true)}>
        <FilePlus2 className="size-3.5" /> Create lease
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title="Create lease" description="Generate the lease and monthly rent schedule.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" required error={errors.startDate?.message}>
              <Input type="date" {...register("startDate")} />
            </Field>
            <Field label="End date" required error={errors.endDate?.message}>
              <Input type="date" {...register("endDate")} />
            </Field>
            <Field label="Monthly rent (KSh)" required error={errors.monthlyRent?.message}>
              <Input inputMode="numeric" {...register("monthlyRent")} />
            </Field>
            <Field label="Deposit (KSh)" error={errors.depositAmount?.message}>
              <Input inputMode="numeric" {...register("depositAmount")} />
            </Field>
            <Field label="Payment day of month" required error={errors.paymentDay?.message}>
              <Input type="number" min={1} max={28} {...register("paymentDay")} />
            </Field>
          </div>
          <Button type="submit" className="w-full">Create lease</Button>
        </form>
      </Dialog>
    </>
  );
}
