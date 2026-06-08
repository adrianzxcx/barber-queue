create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('customer', 'receptionist');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  claim_role public.app_role;
begin
  select role into claim_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if claim_role is not null then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(claim_role));
  else
    claims := jsonb_set(claims, '{app_role}', to_jsonb('customer'::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.user_roles to supabase_auth_admin;

revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "supabase_auth_admin_read_user_roles" on public.user_roles;
create policy "supabase_auth_admin_read_user_roles"
on public.user_roles for select
to supabase_auth_admin
using (true);

create or replace function public.check_email_exists(email_to_check text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  email_exists boolean;
begin
  select exists(
    select 1 from auth.users where email = email_to_check
  ) into email_exists;
  
  return email_exists;
end;
$$;
