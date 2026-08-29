#!/usr/bin/env node
/**
 * Seed clearly-labelled demo data via the app's /api/demo/seed route.
 * Requires the app to be running. In dev mode no secret is needed;
 * set DEMO_SEED_SECRET to enable it in non-dev environments.
 *
 * Usage:
 *   APP_URL=http://localhost:3000 node scripts/seed-demo.mjs
 */
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.DEMO_SEED_SECRET;

const res = await fetch(`${appUrl}/api/demo/seed`, {
  headers: secret ? { "x-demo-secret": secret } : {},
});
const data = await res.json();
if (res.ok) {
  console.log("✔", data.note ?? "Demo data seeded");
  for (const a of data.accounts ?? []) {
    console.log(`  ${a.role}: ${a.email} / ${a.password}`);
  }
} else {
  console.error(`✖ ${data.error ?? "seed failed"} (${res.status})`);
  process.exit(1);
}
