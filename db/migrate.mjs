#!/usr/bin/env node
/**
 * Run SQL migrations against a Postgres/Neon database in filename order.
 *
 * Usage: DATABASE_URL=postgres://... node db/migrate.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL (Neon connection string) to run migrations.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

// Track applied migrations
await sql`
  create table if not exists _migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`;

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
const applied = new Set(
  (await sql`select name from _migrations`).map((r) => r.name)
);

for (const file of files) {
  if (applied.has(file)) {
    console.log(`· skip  ${file}`);
    continue;
  }
  const body = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`→ run   ${file}`);
  try {
    await sql.unsafe(body);
    await sql`insert into _migrations (name) values (${file})`;
  } catch (err) {
    console.error(`✖ FAILED ${file}:`, err.message);
    await sql.end();
    process.exit(1);
  }
}

console.log("✔ migrations complete");
await sql.end();
