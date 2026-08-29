-- RentHub — 000006: owner role, landlord verification, building floors & units

-- 1) Owner role (top-level platform operator; owner = admin powers)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('tenant', 'agent', 'landlord', 'owner', 'admin'));

insert into roles (name, label, permissions) values
  ('owner', 'Owner', '{"full_access":true}'::jsonb)
on conflict (name) do nothing;

-- 2) Landlord verification (owner must verify before buildings go public)
alter table landlords add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'verified', 'rejected', 'info_requested'));
alter table landlords add column if not exists verification_notes text;

-- 3) Building floors (added by the landlord)
create table if not exists building_floors (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists building_floors_property_idx on building_floors (property_id, position);

-- 4) Building units / house numbers (structure by landlord, occupancy by agent)
create table if not exists building_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  floor_id uuid references building_floors(id) on delete cascade,
  unit_number text not null,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'occupied', 'inactive')),
  tenant_id text references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_number)
);
create index if not exists building_units_property_idx on building_units (property_id);
create index if not exists building_units_floor_idx on building_units (floor_id);

-- 5) Platform setting: gate public listings behind verified landlords
insert into platform_settings (key, value, description) values
  ('features.require_landlord_verification', 'true',
   'Landlords need owner verification before their buildings appear in explore')
on conflict (key) do nothing;
