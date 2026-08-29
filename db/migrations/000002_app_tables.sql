-- RentHub — Neon migration 000002: application tables
-- No RLS (authorization is enforced in the application layer) and no
-- Supabase-specific features. Profile FKs are TEXT because they reference
-- the better-auth "user" table (text primary key).

-- ------------------------------------------------------------------
-- profiles — one row per auth user; role is the source of truth for RBAC
-- ------------------------------------------------------------------
create table if not exists profiles (
  id text primary key references "user"(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role text check (role in ('tenant', 'agent', 'landlord', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on profiles (role);
create index if not exists profiles_status_idx on profiles (status);

-- ------------------------------------------------------------------
-- agents / landlords / tenants — 1:1 with profiles
-- ------------------------------------------------------------------
create table if not exists agents (
  id text primary key references profiles(id) on delete cascade,
  agency_name text,
  agency_phone text,
  agency_address text,
  years_experience int check (years_experience between 0 and 100),
  bio text,
  id_number text,
  id_document_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'info_requested')),
  verification_notes text,
  areas_served text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists landlords (
  id text primary key references profiles(id) on delete cascade,
  company_name text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenants (
  id text primary key references profiles(id) on delete cascade,
  preferred_locations text[] not null default '{}',
  preferred_property_type text,
  min_budget int check (min_budget >= 0),
  max_budget int check (max_budget >= 0),
  occupation text,
  employer text,
  monthly_income numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- reference / catalogue tables
-- ------------------------------------------------------------------
create table if not exists roles (
  name text primary key,
  label text not null,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  category text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('county', 'city', 'neighborhood')),
  parent_id uuid references locations(id) on delete cascade,
  slug text unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists locations_type_idx on locations (type);
create index if not exists locations_parent_idx on locations (parent_id);

-- ------------------------------------------------------------------
-- properties
-- ------------------------------------------------------------------
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references profiles(id),
  agent_id text references profiles(id),
  title text not null,
  slug text not null unique,
  description text,
  property_type_id uuid references property_types(id),
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'available', 'reserved', 'occupied', 'inactive', 'rejected')),
  monthly_rent numeric(12,2) not null default 0 check (monthly_rent >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  bedrooms int check (bedrooms >= 0),
  bathrooms int check (bathrooms >= 0),
  size numeric(8,2),
  furnished boolean not null default false,
  address text,
  neighborhood text,
  city text,
  county text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  approximate_location boolean not null default true,
  availability_date date,
  featured boolean not null default false,
  verified boolean not null default false,
  rejection_reason text,
  views_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_city_idx on properties (city);
create index if not exists properties_county_idx on properties (county);
create index if not exists properties_neighborhood_idx on properties (neighborhood);
create index if not exists properties_rent_idx on properties (monthly_rent);
create index if not exists properties_type_idx on properties (property_type_id);
create index if not exists properties_status_idx on properties (status);
create index if not exists properties_agent_idx on properties (agent_id);
create index if not exists properties_owner_idx on properties (owner_id);
create index if not exists properties_featured_idx on properties (featured) where verified = true;
create index if not exists properties_created_idx on properties (created_at desc);
create index if not exists properties_search_idx on properties (status, city, monthly_rent);

create table if not exists property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  position int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists property_images_property_idx on property_images (property_id, position);
create unique index if not exists property_images_one_primary_idx on property_images (property_id) where is_primary = true;

create table if not exists property_amenities (
  property_id uuid not null references properties(id) on delete cascade,
  amenity_id uuid not null references amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table if not exists favorites (
  user_id text not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index if not exists favorites_user_idx on favorites (user_id);

-- ------------------------------------------------------------------
-- viewings
-- ------------------------------------------------------------------
create table if not exists viewings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id text not null references profiles(id) on delete cascade,
  agent_id text references profiles(id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show')),
  tenant_message text,
  agent_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists viewings_agent_schedule_idx on viewings (agent_id, scheduled_at);
create index if not exists viewings_tenant_schedule_idx on viewings (tenant_id, scheduled_at);
create index if not exists viewings_status_idx on viewings (status);
create unique index if not exists viewings_no_double_book_idx on viewings (agent_id, scheduled_at)
  where status in ('pending', 'confirmed', 'rescheduled');

-- ------------------------------------------------------------------
-- applications
-- ------------------------------------------------------------------
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  applicant_id text not null references profiles(id) on delete cascade,
  agent_id text references profiles(id),
  full_name text not null,
  phone text not null,
  email text not null,
  occupation text,
  employer text,
  monthly_income numeric(12,2),
  number_of_occupants int not null default 1,
  preferred_move_in_date date,
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  reviewed_by text references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_applicant_idx on applications (applicant_id, status);
create index if not exists applications_property_idx on applications (property_id, status);
create unique index if not exists applications_one_active_idx on applications (property_id, applicant_id)
  where status in ('submitted', 'under_review', 'approved');

-- ------------------------------------------------------------------
-- leases
-- ------------------------------------------------------------------
create table if not exists leases (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references profiles(id),
  property_id uuid not null references properties(id),
  landlord_id text references profiles(id),
  agent_id text references profiles(id),
  application_id uuid references applications(id),
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(12,2) not null check (monthly_rent >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  payment_day int not null default 1 check (payment_day between 1 and 28),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'expired', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);
create index if not exists leases_tenant_idx on leases (tenant_id);
create index if not exists leases_property_idx on leases (property_id);
create index if not exists leases_agent_idx on leases (agent_id);
create index if not exists leases_status_idx on leases (status);

-- ------------------------------------------------------------------
-- rent_records
-- ------------------------------------------------------------------
create table if not exists rent_records (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references leases(id) on delete cascade,
  tenant_id text not null references profiles(id),
  property_id uuid not null references properties(id),
  amount_due numeric(12,2) not null check (amount_due >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  due_date date not null,
  payment_date timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rent_records_tenant_idx on rent_records (tenant_id, status);
create index if not exists rent_records_lease_idx on rent_records (lease_id, due_date);
create index if not exists rent_records_status_idx on rent_records (status);
create index if not exists rent_records_due_idx on rent_records (due_date);

-- ------------------------------------------------------------------
-- payments
-- ------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  provider text not null default 'mock',
  tenant_id text not null references profiles(id),
  property_id uuid references properties(id),
  lease_id uuid references leases(id),
  rent_record_id uuid references rent_records(id),
  application_id uuid references applications(id),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'KES',
  payment_type text not null
    check (payment_type in ('application_fee', 'booking_fee', 'deposit', 'rent', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'successful', 'failed', 'refunded')),
  provider_transaction_id text,
  provider_metadata jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_tenant_idx on payments (tenant_id, status);
create index if not exists payments_property_idx on payments (property_id);
create index if not exists payments_status_idx on payments (status);
create index if not exists payments_created_idx on payments (created_at desc);

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  provider text not null,
  method_type text,
  last4 text,
  metadata jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists payment_methods_user_idx on payment_methods (user_id);

-- ------------------------------------------------------------------
-- commissions
-- ------------------------------------------------------------------
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references profiles(id),
  property_id uuid references properties(id),
  tenant_id text references profiles(id),
  transaction_id uuid references payments(id),
  commission_type text check (commission_type in ('application_fee', 'booking_fee', 'deposit', 'rent', 'other')),
  commission_rate numeric(5,2),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commissions_agent_idx on commissions (agent_id, status);
create index if not exists commissions_transaction_idx on commissions (transaction_id);

-- ------------------------------------------------------------------
-- messaging
-- ------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_last_msg_idx on conversations (last_message_at desc);

create table if not exists conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  unread_count int not null default 0,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on conversation_members (user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id text not null references profiles(id),
  body text not null check (char_length(body) between 1 and 4000),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at);
create index if not exists messages_sender_idx on messages (sender_id);

-- ------------------------------------------------------------------
-- notifications & preferences
-- ------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, is_read, created_at desc);

create table if not exists notification_preferences (
  user_id text primary key references profiles(id) on delete cascade,
  notify_viewing boolean not null default true,
  notify_application boolean not null default true,
  notify_payment boolean not null default true,
  notify_rent boolean not null default true,
  notify_message boolean not null default true,
  notify_system boolean not null default true,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- reviews / reports / audit / settings
-- ------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id text not null references profiles(id) on delete cascade,
  agent_id text not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  lease_id uuid references leases(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists reviews_per_lease_idx on reviews (reviewer_id, agent_id, lease_id)
  where lease_id is not null;
create unique index if not exists reviews_general_idx on reviews (reviewer_id, agent_id)
  where lease_id is null;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null references profiles(id),
  reported_user_id text references profiles(id),
  property_id uuid references properties(id) on delete set null,
  reason text not null
    check (reason in ('fake_property', 'scam', 'incorrect_information', 'inappropriate_content', 'agent_misconduct', 'other')),
  description text,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_status_idx on reports (status);
create index if not exists reports_reported_user_idx on reports (reported_user_id);
create index if not exists reports_property_idx on reports (property_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text references profiles(id),
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on audit_logs (actor_id);
create index if not exists audit_logs_entity_idx on audit_logs (entity, entity_id);

create table if not exists platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by text references profiles(id),
  updated_at timestamptz not null default now()
);
