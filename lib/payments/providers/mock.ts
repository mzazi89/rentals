import "server-only";

import { db } from "@/db";
import { getAppUrl } from "@/lib/env-public";
import type { InitializePaymentInput, PaymentProvider, VerifyResult } from "../types";

/**
 * Mock payment provider for local development.
 *
 * "Authorization" redirects the tenant to /api/payments/mock-complete,
 * which simulates the gateway webhook and marks the payment successful —
 * the exact same success path a real provider triggers. No real money moves.
 */
export class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async initialize(input: InitializePaymentInput) {
    const appUrl = getAppUrl();
    const url = new URL("/api/payments/mock-complete", appUrl);
    url.searchParams.set("reference", input.reference);
    url.searchParams.set("redirect", input.callbackUrl ?? "/dashboard/tenant/payments");
    return { authorizationUrl: url.toString() };
  }

  async verify(reference: string): Promise<VerifyResult> {
    const rows = await db<
      { status: string; provider_transaction_id: string | null; provider_metadata: Record<string, unknown> | null }[]
    >`
      select status, provider_transaction_id, provider_metadata
      from payments where payment_reference = ${reference}
    `;
    const data = rows[0];
    if (!data) return { status: "failed" };

    // The mock "gateway" only reports success after /api/payments/mock-complete
    // has authorized the payment (see that route). Client input is never trusted.
    const metadata = (data.provider_metadata ?? {}) as { mock_authorized?: boolean };
    if (data.status === "successful" || metadata.mock_authorized === true) {
      return {
        status: "success",
        providerTransactionId: data.provider_transaction_id ?? `MOCK-${reference}`,
      };
    }
    if (data.status === "failed") return { status: "failed" };
    return { status: "pending" };
  }

  verifyWebhookSignature(_rawBody: string, _signature: string | null): boolean {
    // The mock provider's "webhook" is our own internal route — the request
    // comes from the tenant's own browser, so it is never trusted. The mock
    // complete handler is strictly a dev convenience (see route handler).
    return true;
  }
}
