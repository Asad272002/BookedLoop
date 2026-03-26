do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum (
      'new','assigned','contacted','follow_up','interested',
      'audit_booked','proposal_sent','won','lost','dnc'
    );
  end if;
end $$;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin','caller','manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ensure auth_user_id column exists even if table was created earlier
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'auth_user_id'
  ) then
    alter table public.users add column auth_user_id uuid;
  end if;
end $$;

-- Add FK constraint if missing
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Unique index on auth_user_id (nullable-safe)
create unique index if not exists users_auth_user_id_unique_idx
  on public.users(auth_user_id)
  where auth_user_id is not null;

create index if not exists users_auth_user_id_idx on public.users(auth_user_id);
create index if not exists users_role_idx on public.users(role);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  niche text,
  website text,
  phone text,
  email text,
  street_address text,
  city text,
  state text,
  zip_code text,
  country text,
  timezone text,
  google_maps_url text,
  source text,
  status lead_status not null default 'new',
  assigned_to_user_id uuid references public.users(id),
  lead_score int,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_state_idx on public.businesses(state);
create index if not exists businesses_city_idx on public.businesses(city);
create index if not exists businesses_niche_idx on public.businesses(niche);
create index if not exists businesses_assigned_idx on public.businesses(assigned_to_user_id);

create table if not exists public.business_gaps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  no_website boolean default false,
  outdated_website boolean default false,
  no_booking boolean default false,
  weak_google_profile boolean default false,
  low_reviews boolean default false,
  no_review_system boolean default false,
  weak_social_presence boolean default false,
  no_followup_system boolean default false,
  no_local_seo boolean default false,
  notes text
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_name text,
  role text,
  phone text,
  email text,
  preferred_contact_method text check (preferred_contact_method in ('call','email','sms')),
  notes text
);
create index if not exists contacts_business_idx on public.contacts(business_id);

create table if not exists public.outreach_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  user_id uuid not null references public.users(id),
  channel text not null check (channel in ('call','email','sms')),
  outcome text not null check (outcome in ('no_answer','voicemail','wrong_number','not_interested','callback_later','interested','booked_audit','do_not_contact')),
  summary text,
  call_duration_seconds int,
  follow_up_required boolean default false,
  next_action_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists outreach_business_idx on public.outreach_logs(business_id);
create index if not exists outreach_user_idx on public.outreach_logs(user_id);
create index if not exists outreach_next_action_idx on public.outreach_logs(next_action_at);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  appointment_type text,
  appointment_datetime timestamptz,
  timezone text,
  status text check (status in ('scheduled','completed','cancelled','no_show')),
  calendar_event_id text,
  notes text,
  created_by_user_id uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists appointments_datetime_idx on public.appointments(appointment_datetime);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  proposal_number text unique,
  title text,
  services_summary text,
  total_amount numeric(12,2),
  status text check (status in ('draft','sent','accepted','rejected')),
  sent_at timestamptz,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists proposals_business_idx on public.proposals(business_id);
create index if not exists proposals_status_idx on public.proposals(status);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  proposal_id uuid references public.proposals(id),
  invoice_number text unique,
  invoice_date date,
  due_date date,
  currency text default 'USD',
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  payment_status text check (payment_status in ('draft','sent','paid','overdue','cancelled')) default 'draft',
  payment_method text,
  pdf_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists invoices_business_idx on public.invoices(business_id);
create index if not exists invoices_payment_status_idx on public.invoices(payment_status);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_name text,
  description text,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users(id),
  note_text text,
  created_at timestamptz not null default now()
);
create index if not exists notes_business_idx on public.notes(business_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_status_valid'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_status_valid
      check (status in ('new','assigned','contacted','follow_up','interested','audit_booked','proposal_sent','won','lost','dnc'));
  end if;
end $$;
