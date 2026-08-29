import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { handlePaymentSuccess } from "@/lib/payments/service";

/**
 * DEVELOPMENT-ONLY: simulates the payment gateway redirecting back to the app
 * after a "successful" checkout. Only active when PAYMENT_PROVIDER=mock.
 *
 * The payment is never trusted here — the same `handlePaymentSuccess` path a
 * real webhook triggers is used, and the mock provider only reports success
 * after this route marks the payment authorized.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (env.paymentProvider !== "mock") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const reference = request.nextUrl.searchParams.get("reference");
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/dashboard/tenant/payments";

  if (!reference) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  try {
    const { db } = await import("@/db");
    // Mark authorized (mock "gateway confirmation") then run the success path.
    await db`
      update payments set
        provider_transaction_id = ${`MOCK-${reference}`},
        provider_metadata = ${JSON.stringify({ mock_authorized: true, authorized_at: new Date().toISOString() })}::jsonb
      where payment_reference = ${reference}
    `;
    await handlePaymentSuccess(reference);
  } catch (err) {
    console.error("[mock-payment] failed:", err);
  }

  return NextResponse.redirect(new URL(redirect, request.url));
}
