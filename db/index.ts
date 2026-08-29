import "server-only";

import postgres from "postgres";

/**
 * Postgres client (Neon-compatible). Server-only module.
 * All database access goes through this singleton — authorization is
 * enforced in the application layer (there is no RLS in Neon).
 */
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/renthub";

const realDb = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
});

// During `next build`, pages are prerendered — a real database may not be
// reachable (CI, no local Postgres). Return empty results instead of
// failing the build; at runtime (NEXT_PHASE unset) the real client is used
// and ISR/static generation hits the database normally.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const emptyResult = {
  then: (resolve: (value: never[]) => void) => resolve([]),
};

const buildDb = new Proxy(realDb, {
  get(target, prop) {
    if (prop === "unsafe") {
      return () => emptyResult;
    }
    const value = (target as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as () => unknown).bind(target) : value;
  },
  apply() {
    return emptyResult;
  },
});

export const db = isBuildPhase ? buildDb : realDb;

export type Sql = typeof db;
