#!/usr/bin/env node
/**
 * Create the first admin account via the app's bootstrap endpoint.
 * Requires the app to be running and BOOTSTRAP_SECRET to be set.
 *
 * Usage:
 *   APP_URL=http://localhost:3000 BOOTSTRAP_SECRET=... node scripts/create-admin.mjs \
 *     --email admin@renthub.co.ke --password 'STRONG_PASSWORD' --name "RentHub Admin"
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  })
);

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.BOOTSTRAP_SECRET;
const email = args.email;
const password = args.password;
const name = args.name ?? "RentHub Admin";

if (!secret || !email || !password) {
  console.error(`
Missing values. Provide BOOTSTRAP_SECRET (env) and --email / --password flags.
Example: node scripts/create-admin.mjs --email admin@x.co --password 'STRONG' --name "Admin"
`);
  process.exit(1);
}

const res = await fetch(`${appUrl}/api/admin/bootstrap`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-bootstrap-secret": secret },
  body: JSON.stringify({ email, password, name }),
});
const data = await res.json();
if (res.ok) {
  console.log(`✔ Admin created: ${data.email}`);
} else {
  console.error(`✖ ${data.error ?? "bootstrap failed"} (${res.status})`);
  process.exit(1);
}
