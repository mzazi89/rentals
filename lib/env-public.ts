/**
 * Public (browser-safe) environment accessor.
 * Only NEXT_PUBLIC_ variables are readable here.
 */

/** App URL with safe fallback — handles unset AND empty-string env vars. */
export function getAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return value && /^https?:\/\//.test(value) ? value : "http://localhost:3000";
}

export function getPublicEnv() {
  return {
    appUrl: getAppUrl(),
  };
}
