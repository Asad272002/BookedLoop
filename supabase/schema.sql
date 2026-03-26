create type lead_status as enum (
  'new','assigned','contacted','follow_up','interested',
  'audit_booked','proposal_sent','won','lost','dnc'
);

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin','caller','manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on users (auth_user_id);
create index on users (role);

create table if not exists businesses (
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
  assigned_to_user_id uuid references users(id),
  lead_score int,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on businesses (status);
create index on businesses (state);
create index on businesses (city);
create index on businesses (niche);
create index on businesses (assigned_to_user_id);

create table if not exists business_gaps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
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

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_name text,
  role text,
  phone text,
  email text,
  preferred_contact_method text check (preferred_contact_method in ('call','email','sms')),
  notes text
);
create index on contacts (business_id);

create table if not exists outreach_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references contacts(id),
  user_id uuid not null references users(id),
  channel text not null check (channel in ('call','email','sms')),
  outcome text not null check (outcome in ('no_answer','voicemail','wrong_number','not_interested','callback_later','interested','booked_audit','do_not_contact')),
  summary text,
  call_duration_seconds int,
  follow_up_required boolean default false,
  next_action_at timestamptz,
  created_at timestamptz not null default now()
);
create index on outreach_logs (business_id);
create index on outreach_logs (user_id);
create index on outreach_logs (next_action_at);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references contacts(id),
  appointment_type text,
  appointment_datetime timestamptz,
  timezone text,
  status text check (status in ('scheduled','completed','cancelled','no_show')),
  calendar_event_id text,
  notes text,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now()
);
create index on appointments (status);
create index on appointments (appointment_datetime);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
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
create index on proposals (business_id);
create index on proposals (status);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  proposal_id uuid references proposals(id),
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
create index on invoices (business_id);
create index on invoices (payment_status);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  item_name text,
  description text,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);
create index on invoice_items (invoice_id);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references users(id),
  note_text text,
  created_at timestamptz not null default now()
);
create index on notes (business_id);

alter table businesses
  add constraint businesses_status_valid check (status in ('new','assigned','contacted','follow_up','interested','audit_booked','proposal_sent','won','lost','dnc'));

create or replace function public.bl_current_internal_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.bl_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  r text;
  fname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  fname := coalesce(new.raw_user_meta_data->>'full_name', uname);
  r := coalesce(new.raw_app_meta_data->>'role', 'caller');

  insert into public.users (auth_user_id, username, full_name, email, role, is_active)
  values (new.id, uname, fname, new.email, r, true)
  on conflict (auth_user_id) do update
    set username = excluded.username,
        full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.contacts enable row level security;
alter table public.outreach_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.proposals enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.notes enable row level security;
alter table public.business_gaps enable row level security;

drop policy if exists "users_self_or_admin_read" on public.users;
create policy "users_self_or_admin_read"
on public.users
for select
to authenticated
using (
  auth_user_id = auth.uid() or public.bl_current_role() = 'admin'
);

drop policy if exists "users_admin_write" on public.users;
create policy "users_admin_write"
on public.users
for all
to authenticated
using (public.bl_current_role() = 'admin')
with check (public.bl_current_role() = 'admin');

drop policy if exists "businesses_read_role" on public.businesses;
create policy "businesses_read_role"
on public.businesses
for select
to authenticated
using (
  public.bl_current_role() in ('admin','manager')
  or assigned_to_user_id = public.bl_current_internal_user_id()
);

drop policy if exists "businesses_write_role" on public.businesses;
create policy "businesses_write_role"
on public.businesses
for update
to authenticated
using (
  public.bl_current_role() in ('admin','manager')
  or assigned_to_user_id = public.bl_current_internal_user_id()
)
with check (
  public.bl_current_role() in ('admin','manager')
  or assigned_to_user_id = public.bl_current_internal_user_id()
);

drop policy if exists "contacts_read_role" on public.contacts;
create policy "contacts_read_role"
on public.contacts
for select
to authenticated
using (
  public.bl_current_role() in ('admin','manager')
  or business_id in (
    select id from public.businesses where assigned_to_user_id = public.bl_current_internal_user_id()
  )
);

drop policy if exists "outreach_read_role" on public.outreach_logs;
create policy "outreach_read_role"
on public.outreach_logs
for select
to authenticated
using (
  public.bl_current_role() in ('admin','manager')
  or user_id = public.bl_current_internal_user_id()
);

drop policy if exists "outreach_insert_role" on public.outreach_logs;
create policy "outreach_insert_role"
on public.outreach_logs
for insert
to authenticated
with check (
  public.bl_current_role() in ('admin','manager','caller')
  and user_id = public.bl_current_internal_user_id()
);

drop policy if exists "notes_read_role" on public.notes;
create policy "notes_read_role"
on public.notes
for select
to authenticated
using (
  public.bl_current_role() in ('admin','manager')
  or business_id in (
    select id from public.businesses where assigned_to_user_id = public.bl_current_internal_user_id()
  )
);

drop policy if exists "notes_insert_role" on public.notes;
create policy "notes_insert_role"
on public.notes
for insert
to authenticated
with check (
  user_id = public.bl_current_internal_user_id()
);
