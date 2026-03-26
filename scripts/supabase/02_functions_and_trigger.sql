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
  raw_role text;
  r text;
  fname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  fname := coalesce(new.raw_user_meta_data->>'full_name', uname);
  raw_role := nullif(new.raw_app_meta_data->>'role', '');
  r := coalesce(raw_role, 'caller');

  update public.users
  set
    auth_user_id = new.id,
    full_name = coalesce(public.users.full_name, fname),
    email = coalesce(public.users.email, new.email),
    role = case
      when raw_role is null then public.users.role
      when raw_role = 'caller' and public.users.role in ('admin','manager') then public.users.role
      else raw_role
    end,
    is_active = true
  where username = uname
    and (auth_user_id is null or auth_user_id = new.id);

  if found then
    return new;
  end if;

  update public.users
  set
    auth_user_id = new.id,
    full_name = coalesce(public.users.full_name, fname),
    email = coalesce(public.users.email, new.email),
    role = case
      when raw_role is null then public.users.role
      when raw_role = 'caller' and public.users.role in ('admin','manager') then public.users.role
      else raw_role
    end,
    is_active = true
  where lower(email) = lower(new.email)
    and (auth_user_id is null or auth_user_id = new.id);

  if found then
    return new;
  end if;

  begin
    insert into public.users (auth_user_id, username, full_name, email, role, is_active)
    values (new.id, uname, fname, new.email, r, true)
    on conflict (auth_user_id) do update
      set username = excluded.username,
          full_name = excluded.full_name,
          email = excluded.email,
          role = excluded.role,
          is_active = true;
  exception
    when unique_violation then
      update public.users
      set
        auth_user_id = new.id,
        full_name = coalesce(public.users.full_name, fname),
        email = coalesce(public.users.email, new.email),
        role = case
          when raw_role is null then public.users.role
          when raw_role = 'caller' and public.users.role in ('admin','manager') then public.users.role
          else raw_role
        end,
        is_active = true
      where username = uname and auth_user_id is null;
    when others then
      return new;
  end;

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
