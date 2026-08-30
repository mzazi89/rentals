-- 000007: Database-backed file storage (fallback when no Vercel Blob token)
-- Serverless filesystems are read-only/ephemeral, so image uploads are stored
-- in Postgres when BLOB_READ_WRITE_TOKEN is not configured. Served by
-- /api/files/[id].

create table if not exists stored_files (
  id uuid primary key,
  bucket text not null,
  folder text not null default '',
  filename text not null,
  content_type text not null default 'image/jpeg',
  size_bytes integer not null default 0,
  data bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists stored_files_created_at_idx on stored_files (created_at desc);
