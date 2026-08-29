import "server-only";

import { getPublicEnv } from "./env-public";
export { getPublicEnv };

/**
 * Server-side environment access. Secrets must never be exposed to the
 * browser (no NEXT_PUBLIC_ prefix).
 */
export function getServerEnv() {
  const pub = getPublicEnv();
  return {
    ...pub,
    databaseUrl: process.env.DATABASE_URL ?? null,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? null,
    betterAuthUrl: process.env.BETTER_AUTH_URL?.trim() || pub.appUrl,
    storageProvider: process.env.STORAGE_PROVIDER ?? "local",
    paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
    paymentPublicKey: process.env.PAYMENT_PUBLIC_KEY ?? "",
    paymentSecretKey: process.env.PAYMENT_SECRET_KEY ?? "",
    paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "",
    mapsApiKey: process.env.MAPS_API_KEY ?? "",
    emailApiKey: process.env.EMAIL_API_KEY ?? "",
    bootstrapSecret: process.env.BOOTSTRAP_SECRET ?? null,
    demoSeedSecret: process.env.DEMO_SEED_SECRET ?? null,
  };
}

/** DATABASE_URL (Neon connection string) is required at runtime. */
export function requireDatabaseUrl(): string {
  const url = getServerEnv().databaseUrl;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local."
    );
  }
  return url;
}
