import "server-only";

import type { PaymentType } from "@/types";

export interface InitializePaymentInput {
  amount: number; // in currency minor units as stored (KES)
  currency?: string;
  email: string;
  reference: string;
  metadata: Record<string, unknown>;
  callbackUrl?: string;
}

export interface VerifyResult {
  status: "success" | "pending" | "failed";
  providerTransactionId?: string | null;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  initialize(input: InitializePaymentInput): Promise<{ authorizationUrl: string }>;
  verify(reference: string): Promise<VerifyResult>;
  /** Verify an incoming webhook signature. Implementations MUST return false on any mismatch. */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
}

export interface InitiatePaymentParams {
  tenantId: string;
  email: string;
  amount: number;
  paymentType: PaymentType;
  propertyId?: string | null;
  leaseId?: string | null;
  rentRecordId?: string | null;
  applicationId?: string | null;
  currency?: string;
  metadata?: Record<string, unknown>;
  redirectPath?: string;
}

export type { PaymentType };
