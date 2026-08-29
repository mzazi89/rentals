import "server-only";

import crypto from "crypto";
import { getServerEnv } from "@/lib/env";
import { PaystackProvider } from "./providers/paystack";
import { MockProvider } from "./providers/mock";
import type { PaymentProvider } from "./types";

export * from "./types";

let provider: PaymentProvider | null = null;

/** Resolve the active provider from PAYMENT_PROVIDER (default: mock). */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const env = getServerEnv();
  switch (env.paymentProvider) {
    case "paystack":
      provider = new PaystackProvider();
      break;
    case "mock":
      provider = new MockProvider();
      break;
    default:
      throw new Error(
        `Unknown PAYMENT_PROVIDER "${env.paymentProvider}". Use "mock" or "paystack".`
      );
  }
  return provider;
}

/** Generate a unique, provider-safe payment reference. */
export function generatePaymentReference(): string {
  return `RH-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}
