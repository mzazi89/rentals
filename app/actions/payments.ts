"use server";

import { requireProfile } from "@/lib/auth/helpers";
import { assertRole } from "@/lib/permissions";
import { initiatePayment } from "@/lib/payments/service";
import { paymentInitSchema } from "@/lib/validations";
import type { z } from "zod";

type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/**
 * Start a payment. Creates the DB record (status pending) then returns
 * the provider's authorization URL. The client redirects there; the
 * webhook/verify flow marks the payment successful server-side.
 */
export async function payFor(values: z.infer<typeof paymentInitSchema>): Promise<ActionResult> {
  const profile = await requireProfile();
  assertRole(profile, ["tenant", "owner", "admin"]);
  const parsed = paymentInitSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const { authorizationUrl, paymentId } = await initiatePayment({
      tenantId: profile.id,
      email: profile.email,
      amount: parsed.data.amount,
      paymentType: parsed.data.paymentType,
      propertyId: parsed.data.propertyId,
      leaseId: parsed.data.leaseId,
      rentRecordId: parsed.data.rentRecordId,
      applicationId: parsed.data.applicationId,
      redirectPath: parsed.data.redirectPath,
    });
    return { ok: true, authorizationUrl, paymentId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start payment.";
    return { ok: false, error: message };
  }
}
