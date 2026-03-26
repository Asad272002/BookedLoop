-- Ensure required columns exist on public.users even if table pre-existed
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'username'
  ) then
    alter table public.users add column username text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'full_name'
  ) then
    alter table public.users add column full_name text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'email'
  ) then
    alter table public.users add column email text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'role'
  ) then
    alter table public.users add column role text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'is_active'
  ) then
    alter table public.users add column is_active boolean default true;
  end if;
end $$;

-- Unique index for username
create unique index if not exists users_username_unique_idx on public.users(username) where username is not null;

-- Role check constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_role_valid' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_role_valid
      check (role in ('admin','caller','manager'));
  end if;
end $$;

-- Backfill users fields from auth.users metadata where possible
update public.users u
set
  username   = coalesce(u.username, au.raw_user_meta_data->>'username', split_part(au.email,'@',1)),
  full_name  = coalesce(u.full_name, au.raw_user_meta_data->>'full_name', u.username),
  email      = coalesce(u.email, au.email),
  role       = coalesce(u.role, au.raw_app_meta_data->>'role', 'caller'),
  is_active  = coalesce(u.is_active, true)
from auth.users au
where u.auth_user_id = au.id;

-- Fallback username from email if still null
update public.users
set username = split_part(email,'@',1)
where username is null and email is not null;

-- Ensure is_active not null
update public.users
set is_active = true
where is_active is null;
