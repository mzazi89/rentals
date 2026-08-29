-- RentHub — Neon migration 000001: Better Auth tables
-- (camelCase columns are what the better-auth drizzle adapter expects)

create table if not exists "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  emailVerified boolean not null default false,
  image text,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now(),
  role text not null default 'user'
);

create table if not exists "session" (
  id text primary key,
  expiresAt timestamp not null,
  token text not null unique,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now(),
  ipAddress text,
  userAgent text,
  userId text not null references "user"(id) on delete cascade
);

create index if not exists session_user_idx on "session" (userId);

create table if not exists "account" (
  id text primary key,
  accountId text not null,
  providerId text not null,
  userId text not null references "user"(id) on delete cascade,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt timestamp,
  refreshTokenExpiresAt timestamp,
  scope text,
  password text,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now()
);

create index if not exists account_user_idx on "account" (userId);

create table if not exists "verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  expiresAt timestamp not null,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now()
);
