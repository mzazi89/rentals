-- RentHub — 000005: add the "issuer" column to the Better Auth account table
-- (required by the account model in newer better-auth versions)

alter table "account" add column if not exists "issuer" text;
