-- RentHub — 000004: fix Better Auth table column casing
-- The original auth tables used UNQUOTED camelCase column names, which
-- Postgres folds to lowercase (emailverified / createdat / updatedat).
-- Better Auth's drizzle adapter queries exact-case quoted columns
-- ("emailVerified", "createdAt", "updatedAt"), so every auth operation
-- failed. No rows exist in these tables yet, so we recreate them with
-- correctly quoted identifiers and restore the profiles foreign key.

drop table if exists "verification" cascade;
drop table if exists "account" cascade;
drop table if exists "session" cascade;
drop table if exists "user" cascade;

create table "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  "role" text not null default 'user'
);

create table "session" (
  "id" text primary key,
  "expiresAt" timestamp not null,
  "token" text not null unique,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user"("id") on delete cascade
);

create index if not exists session_user_idx on "session" ("userId");

create table "account" (
  "id" text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user"("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create index if not exists account_user_idx on "account" ("userId");

create table "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

-- Restore the profiles → user foreign key (dropped by CASCADE above).
alter table profiles
  add constraint profiles_id_fkey
  foreign key (id) references "user"(id) on delete cascade;
