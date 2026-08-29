import "server-only";

import crypto from "crypto";
import { getServerEnv } from "@/lib/env";
import type { InitializePaymentInput, PaymentProvider, VerifyResult } from "../types";

/**
 * Paystack payment provider (KES, Kenya).
 * Docs: https://paystack.com/docs/api
 *
 * All amounts are converted to the provider's minor unit (×100).
 * Secrets come from environment variables only.
 */
export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    const env = getServerEnv();
    if (!env.paymentSecretKey) {
      throw new Error("PAYMENT_SECRET_KEY is required when PAYMENT_PROVIDER=paystack");
    }
    this.secretKey = env.paymentSecretKey;
    this.webhookSecret = env.paymentWebhookSecret;
  }

  private async request(path: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`https://api.paystack.co${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = await res.json();
    if (!res.ok || body.status === false) {
      throw new Error(`Paystack error (${res.status}): ${body.message ?? "unknown"}`);
    }
    return body;
  }

  async initialize(input: InitializePaymentInput) {
    const body = await this.request("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        email: input.email,
        reference: input.reference,
        currency: input.currency ?? "KES",
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });
    return { authorizationUrl: body.data.authorization_url as string };
  }

  async verify(reference: string): Promise<VerifyResult> {
    const body = await this.request(`/transaction/verify/${encodeURIComponent(reference)}`);
    const status = body.data?.status as string;
    if (status === "success") {
      return {
        status: "success",
        providerTransactionId: body.data?.id ? String(body.data.id) : null,
        raw: body.data,
      };
    }
    if (status === "abandoned" || status === "failed") return { status: "failed" };
    return { status: "pending" };
  }

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature || !this.webhookSecret) return false;
    const hash = crypto.createHmac("sha512", this.webhookSecret).update(rawBody).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
