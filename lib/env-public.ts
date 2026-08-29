/**
 * Public (browser-safe) environment accessor.
 * Only NEXT_PUBLIC_ variables are readable here.
 */
export function getPublicEnv() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    // Optional: Vercel Blob client token (used when STORAGE_PROVIDER=vercel-blob)
    blobReadWriteToken: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN ?? null,
  };
}
