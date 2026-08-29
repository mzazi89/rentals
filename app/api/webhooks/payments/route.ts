import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handlePaymentSuccess } from "@/lib/payments/service";
import { db } from "@/db";

/**
 * Payment webhook endpoint.
 *
 * Security:
 *  - Verifies the provider signature over the RAW body (never the parsed body).
 *  - Never trusts client-side payment status — the provider is the source of truth.
 *  - Idempotent: handlePaymentSuccess is safe to call multiple times per reference.
 *
 * Provider-specific signature headers:
 *  - Paystack: "x-paystack-signature" (HMAC-SHA512 of raw body with webhook secret)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? request.headers.get("x-signature");

  try {
    const provider = getPaymentProvider();
    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      console.warn("[webhook] signature verification failed");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const event = (payload as { event?: string; data?: { reference?: string } }) ?? {};
    const reference = event.data?.reference;

    if (event.event === "charge.success" && reference) {
      const result = await handlePaymentSuccess(reference);
      if (result) {
        return NextResponse.json({ received: true, paymentId: result.paymentId });
      }
      return NextResponse.json({ received: true, pending: true });
    }

    // Acknowledge all other events (charge.failed, transfer.*, etc.)
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "webhook processing failed";
    console.error("[webhook] processing error:", message);
    try {
      await db`
        insert into audit_logs (action, entity, metadata)
        values ('payment_webhook_failure', 'payments', ${JSON.stringify({ error: message, signature: signature ?? null })}::jsonb)
      `;
    } catch {
      /* audit failure is non-fatal */
    }
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
