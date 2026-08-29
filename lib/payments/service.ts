import "server-only";

import crypto from "crypto";
import { db } from "@/db";
import { getPaymentProvider, generatePaymentReference, type InitiatePaymentParams } from "./index";
import { getSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { audit } from "@/lib/audit";

/**
 * Core payment service — the single entry point for initiating payments.
 * Client code never talks to the provider directly; it always goes through
 * here so amounts/statuses stay consistent and server-authoritative.
 */
export async function initiatePayment(params: InitiatePaymentParams): Promise<{
  paymentId: string;
  authorizationUrl: string;
}> {
  const settings = await getSettings();
  const provider = getPaymentProvider();

  // ---- server-side amount validation per payment type ----
  if (params.paymentType === "rent") {
    if (!params.rentRecordId) throw new Error("Rent payment requires a rent record.");
    const rentRecord = await db<
      { id: string; amount_due: number; amount_paid: number; status: string }[]
    >`select id, amount_due, amount_paid, status from rent_records where id = ${params.rentRecordId}`;
    const rr = rentRecord[0];
    if (!rr) throw new Error("Rent record not found.");
    const outstanding = Number(rr.amount_due) - Number(rr.amount_paid);
    if (params.amount > outstanding + 0.01) {
      throw new Error(`Amount exceeds outstanding balance of ${outstanding}.`);
    }
  }

  if (params.paymentType === "application_fee") {
    if (settings.applicationFee > 0 && params.amount !== settings.applicationFee) {
      throw new Error(`Application fee is ${settings.applicationFee}.`);
    }
  }

  const reference = generatePaymentReference();

  // Insert the payment record first so webhook verification has something to update.
  const inserted = (await db`
    insert into payments (
      payment_reference, provider, tenant_id, property_id, lease_id, rent_record_id,
      application_id, amount, currency, payment_type, status, provider_metadata
    ) values (
      ${reference}, ${provider.name}, ${params.tenantId}, ${params.propertyId ?? null},
      ${params.leaseId ?? null}, ${params.rentRecordId ?? null}, ${params.applicationId ?? null},
      ${params.amount}, ${params.currency ?? settings.currency}, ${params.paymentType},
      'pending', ${params.metadata ? JSON.stringify(params.metadata) : null}
    )
    returning id
  `) as unknown as { id: string }[];
  const paymentId = inserted[0]?.id;
  if (!paymentId) throw new Error("Failed to create payment record.");

  const callbackUrl = params.redirectPath
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${params.redirectPath}`
    : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/tenant/payments`;

  const { authorizationUrl } = await provider.initialize({
    amount: params.amount,
    currency: params.currency ?? settings.currency,
    email: params.email,
    reference,
    metadata: { paymentId, ...(params.metadata ?? {}) },
    callbackUrl,
  });

  return { paymentId, authorizationUrl };
}

/**
 * Handle a confirmed successful payment (called from the webhook handler or
 * verify flow). Idempotent — safe to call more than once per reference.
 */
export async function handlePaymentSuccess(reference: string): Promise<{ paymentId: string } | null> {
  const settings = await getSettings();

  const payment = await db<
    {
      id: string;
      payment_reference: string;
      tenant_id: string;
      property_id: string | null;
      rent_record_id: string | null;
      application_id: string | null;
      amount: number;
      payment_type: string;
      status: string;
      provider_metadata: Record<string, unknown> | null;
    }[]
  >`select * from payments where payment_reference = ${reference}`;
  const pay = payment[0];
  if (!pay) throw new Error(`Unknown payment reference: ${reference}`);

  // Idempotency: already processed.
  if (pay.status === "successful") {
    return { paymentId: pay.id };
  }

  const provider = getPaymentProvider();
  const verify = await provider.verify(reference);
  if (verify.status !== "success") {
    if (verify.status === "failed") {
      await db`update payments set status = 'failed' where payment_reference = ${reference}`;
    }
    return null;
  }

  const now = new Date().toISOString();

  // 1) Mark the payment successful (server-side, never trust the client).
  await db`
    update payments set
      status = 'successful',
      provider_transaction_id = ${verify.providerTransactionId ?? null},
      provider_metadata = ${JSON.stringify({
        ...(pay.provider_metadata ?? {}),
        verified_at: now,
      })}::jsonb,
      paid_at = ${now}
    where payment_reference = ${reference}
  `;

  // 2) Apply to the linked rent record, if any.
  if (pay.rent_record_id && pay.payment_type === "rent") {
    const rr = await db<{ amount_due: number; amount_paid: number; status: string }[]>`
      select amount_due, amount_paid, status from rent_records where id = ${pay.rent_record_id}
    `;
    if (rr[0]) {
      const newPaid = Number(rr[0].amount_paid) + Number(pay.amount);
      const status =
        newPaid >= Number(rr[0].amount_due) - 0.01
          ? "paid"
          : newPaid > 0
            ? "partially_paid"
            : rr[0].status;
      await db`
        update rent_records set amount_paid = ${newPaid}, payment_date = ${now}, status = ${status}
        where id = ${pay.rent_record_id}
      `;
    }
  }

  // 3) Create agent commission for rent/deposit payments.
  const isCommissionable = pay.payment_type === "rent" || pay.payment_type === "deposit";
  if (isCommissionable && pay.property_id) {
    const prop = await db<{ agent_id: string | null }[]>`
      select agent_id from properties where id = ${pay.property_id}
    `;
    const agentId = prop[0]?.agent_id;
    if (agentId) {
      const rate =
        pay.payment_type === "deposit"
          ? settings.depositCommissionRate
          : settings.rentCommissionRate;
      const commissionAmount = (Number(pay.amount) * rate) / 100;
      if (commissionAmount > 0) {
        await db`
          insert into commissions (
            agent_id, property_id, tenant_id, transaction_id,
            commission_type, commission_rate, commission_amount, status
          ) values (
            ${agentId}, ${pay.property_id}, ${pay.tenant_id}, ${pay.id},
            ${pay.payment_type}, ${rate}, ${Math.round(commissionAmount * 100) / 100}, 'pending'
          )
        `;
      }
    }
  }

  // 4) Notify the tenant.
  await createNotification({
    userId: pay.tenant_id,
    type: "payment_successful",
    title: "Payment successful",
    body: `Your ${pay.payment_type.replace("_", " ")} payment of KSh ${Number(pay.amount).toLocaleString()} was received.`,
    link: "/dashboard/tenant/payments",
  });

  await audit("payment_successful", "payments", pay.id, {
    reference,
    amount: pay.amount,
    type: pay.payment_type,
  });

  return { paymentId: pay.id };
}

export { generatePaymentReference };
export { crypto };
