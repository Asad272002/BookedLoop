---
name: "supabase-agent"
description: "Helps debug Supabase Auth/RLS/schema issues and generate safe SQL/scripts. Invoke when working on Supabase users, triggers, policies, or Postgres errors."
---

# Supabase Agent

## Safety

- Never paste secrets (database passwords, service role keys, JWTs) into chat, code, issues, or logs.
- If a secret is shared, rotate it immediately in the Supabase dashboard.

## Common Workflows

### 1) Verify schema and constraints

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'users'
order by ordinal_position;
```

### 2) Debug Auth user creation failures (500 / unexpected_failure)

Typical cause: a failing trigger on `auth.users` that writes to `public.users`.

Check triggers:

```sql
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';
```

Inspect the trigger function:

```sql
select pg_get_functiondef('public.handle_new_auth_user()'::regprocedure);
```

If needed, patch the function to be conflict-tolerant (avoid aborting inserts due to unique constraints).

### 3) Link `public.users` to `auth.users`

```sql
update public.users u
set auth_user_id = au.id
from auth.users au
where u.auth_user_id is null
  and lower(u.email) = lower(au.email);
```

### 4) Check RLS quickly

```sql
select relname as table, relrowsecurity as rls_on
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where nspname = 'public'
  and relkind = 'r'
order by relname;
```

### 5) Troubleshoot “works in Auth but not in app”

- Confirm the Auth user exists in `auth.users`.
- Confirm the internal profile exists/updated in `public.users`.
- Confirm role is in `auth.users.raw_app_meta_data->>'role'` and the app reads it consistently.

## Deliverables Patterns

- Prefer idempotent migrations using `do $$ begin ... end $$;` guards.
- Prefer server-side (service role) clients for admin operations; avoid exposing service role keys to the browser.
