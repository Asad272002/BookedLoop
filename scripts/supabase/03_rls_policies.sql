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
  auth_user_id = auth.uid() or exists (
    select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'
  )
);

drop policy if exists "users_admin_write" on public.users;
create policy "users_admin_write"
on public.users
for all
to authenticated
using (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'admin'));

drop policy if exists "businesses_read_role" on public.businesses;
create policy "businesses_read_role"
on public.businesses
for select
to authenticated
using (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or assigned_to_user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
);

drop policy if exists "businesses_write_role" on public.businesses;
create policy "businesses_write_role"
on public.businesses
for update
to authenticated
using (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or assigned_to_user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
)
with check (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or assigned_to_user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
);

drop policy if exists "contacts_read_role" on public.contacts;
create policy "contacts_read_role"
on public.contacts
for select
to authenticated
using (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or business_id in (
    select id from public.businesses where assigned_to_user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
  )
);

drop policy if exists "outreach_read_role" on public.outreach_logs;
create policy "outreach_read_role"
on public.outreach_logs
for select
to authenticated
using (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
);

drop policy if exists "outreach_insert_role" on public.outreach_logs;
create policy "outreach_insert_role"
on public.outreach_logs
for insert
to authenticated
with check (
  user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
);

drop policy if exists "notes_read_role" on public.notes;
create policy "notes_read_role"
on public.notes
for select
to authenticated
using (
  exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role in ('admin','manager'))
  or business_id in (
    select id from public.businesses where assigned_to_user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
  )
);

drop policy if exists "notes_insert_role" on public.notes;
create policy "notes_insert_role"
on public.notes
for insert
to authenticated
with check (
  user_id = (select id from public.users where auth_user_id = auth.uid() limit 1)
);
