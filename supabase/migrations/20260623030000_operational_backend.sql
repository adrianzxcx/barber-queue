create extension if not exists pgcrypto;

do $$
begin
  create type public.service_category as enum ('Haircut', 'Beard', 'Shave', 'Treatment', 'Combo');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.barber_shift_status as enum ('available', 'busy', 'unavailable');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.queue_ticket_status as enum ('waiting', 'being_served', 'skipped', 'expired', 'completed', 'canceled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.activity_log_type as enum ('barber', 'customer', 'system');
exception
  when duplicate_object then null;
end $$;

create or replace function public.is_receptionist()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', '') = 'receptionist';
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.shop_settings (
  id boolean primary key default true,
  shop_is_open boolean not null default true,
  skip_expiry_seconds integer not null default 1800 check (skip_expiry_seconds between 10 and 86400),
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_settings_singleton check (id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  category public.service_category not null,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  unique (name)
);

alter table public.services add column if not exists name text;
alter table public.services add column if not exists slug text;
alter table public.services add column if not exists description text not null default '';
alter table public.services add column if not exists category public.service_category;
alter table public.services add column if not exists price text not null default '$0.00';
alter table public.services add column if not exists price_cents integer not null default 0;
alter table public.services add column if not exists duration_minutes integer not null default 30;
alter table public.services add column if not exists is_active boolean not null default true;
alter table public.services add column if not exists sort_order integer not null default 0;
alter table public.services add column if not exists features text[] not null default '{}';
alter table public.services add column if not exists created_at timestamptz not null default now();
alter table public.services add column if not exists updated_at timestamptz not null default now();

do $$
declare
  category_udt text;
begin
  select udt_name
  into category_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'services'
    and column_name = 'category';

  if category_udt = 'service_category' then
    update public.services
    set
      name = coalesce(name, 'SERVICE-' || id::text),
      slug = coalesce(slug, lower(regexp_replace(coalesce(name, 'service-' || id::text), '[^a-zA-Z0-9]+', '-', 'g'))),
      category = (
        case
          when category::text in ('Haircut', 'Beard', 'Shave', 'Treatment', 'Combo') then category::text
          else 'Haircut'
        end
      )::public.service_category
    where name is null
      or slug is null
      or category is null
      or category::text not in ('Haircut', 'Beard', 'Shave', 'Treatment', 'Combo');
  else
    update public.services
    set
      name = coalesce(name, 'SERVICE-' || id::text),
      slug = coalesce(slug, lower(regexp_replace(coalesce(name, 'service-' || id::text), '[^a-zA-Z0-9]+', '-', 'g'))),
      category = case
        when category::text in ('Haircut', 'Beard', 'Shave', 'Treatment', 'Combo') then category::text
        else 'Haircut'
      end
    where name is null
      or slug is null
      or category is null
      or category::text not in ('Haircut', 'Beard', 'Shave', 'Treatment', 'Combo');
  end if;
end $$;

alter table public.services alter column name set not null;
alter table public.services alter column slug set not null;
alter table public.services alter column category set not null;

do $$
declare
  price_type text;
begin
  select data_type
  into price_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'services'
    and column_name = 'price';

  if price_type in ('integer', 'bigint', 'numeric', 'real', 'double precision') then
    alter table public.services alter column price set default 0;
  else
    alter table public.services alter column price set default '$0.00';
  end if;
end $$;

create unique index if not exists services_slug_unique_idx on public.services (slug);
create unique index if not exists services_name_unique_idx on public.services (name);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  specialty text not null default '',
  rank text not null default 'Junior',
  image_url text,
  image_position text not null default '50% 50%',
  rating numeric(2, 1) not null default 4.8 check (rating between 0 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (display_name)
);

alter table public.barbers add column if not exists display_name text;
alter table public.barbers add column if not exists name text;
alter table public.barbers add column if not exists specialty text not null default '';
alter table public.barbers add column if not exists rank text not null default 'Junior';
alter table public.barbers add column if not exists image_url text;
alter table public.barbers add column if not exists image_position text not null default '50% 50%';
alter table public.barbers add column if not exists rating numeric(2, 1) not null default 4.8;
alter table public.barbers add column if not exists is_active boolean not null default true;
alter table public.barbers add column if not exists created_at timestamptz not null default now();
alter table public.barbers add column if not exists updated_at timestamptz not null default now();

update public.barbers
set
  display_name = coalesce(display_name, name, 'Barber ' || id::text),
  name = coalesce(name, display_name, 'Barber ' || id::text)
where display_name is null
  or name is null;

alter table public.barbers alter column display_name set not null;
alter table public.barbers alter column name set default '';

create unique index if not exists barbers_display_name_unique_idx on public.barbers (display_name);

create table if not exists public.barber_shifts (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  status public.barber_shift_status not null default 'unavailable',
  started_at timestamptz,
  ended_at timestamptz,
  current_ticket_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barber_shifts add column if not exists barber_id uuid references public.barbers(id) on delete cascade;
alter table public.barber_shifts add column if not exists status public.barber_shift_status not null default 'unavailable';
alter table public.barber_shifts add column if not exists started_at timestamptz;
alter table public.barber_shifts add column if not exists ended_at timestamptz;
alter table public.barber_shifts add column if not exists current_ticket_id uuid;
alter table public.barber_shifts add column if not exists created_at timestamptz not null default now();
alter table public.barber_shifts add column if not exists updated_at timestamptz not null default now();

create unique index if not exists barber_shifts_one_open_shift_idx
on public.barber_shifts (barber_id)
where ended_at is null;

create table if not exists public.queue_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name_snapshot text not null default 'Customer',
  service_id uuid not null references public.services(id),
  preferred_barber_id uuid references public.barbers(id),
  assigned_barber_id uuid references public.barbers(id),
  status public.queue_ticket_status not null default 'waiting',
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  skipped_at timestamptz,
  expired_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.queue_tickets add column if not exists ticket_number text;
alter table public.queue_tickets add column if not exists customer_id uuid references auth.users(id) on delete cascade;
alter table public.queue_tickets add column if not exists customer_name_snapshot text not null default 'Customer';
alter table public.queue_tickets add column if not exists service_id uuid references public.services(id);
alter table public.queue_tickets add column if not exists preferred_barber_id uuid references public.barbers(id);
alter table public.queue_tickets add column if not exists assigned_barber_id uuid references public.barbers(id);
alter table public.queue_tickets add column if not exists status public.queue_ticket_status not null default 'waiting';
alter table public.queue_tickets add column if not exists joined_at timestamptz not null default now();
alter table public.queue_tickets add column if not exists called_at timestamptz;
alter table public.queue_tickets add column if not exists skipped_at timestamptz;
alter table public.queue_tickets add column if not exists expired_at timestamptz;
alter table public.queue_tickets add column if not exists completed_at timestamptz;
alter table public.queue_tickets add column if not exists canceled_at timestamptz;
alter table public.queue_tickets add column if not exists created_by uuid references auth.users(id);
alter table public.queue_tickets add column if not exists updated_at timestamptz not null default now();

with numbered_tickets as (
  select
    id,
    lpad((row_number() over (order by joined_at, id))::text, 3, '0') as generated_ticket_number
  from public.queue_tickets
  where ticket_number is null
)
update public.queue_tickets qt
set ticket_number = nt.generated_ticket_number
from numbered_tickets nt
where qt.id = nt.id;

alter table public.queue_tickets alter column ticket_number set not null;

create unique index if not exists queue_tickets_one_active_customer_idx
on public.queue_tickets (customer_id)
where status in ('waiting', 'being_served', 'skipped');

create index if not exists queue_tickets_status_joined_idx
on public.queue_tickets (status, joined_at);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role public.app_role,
  event_type public.activity_log_type not null,
  entity_type text not null,
  entity_id uuid,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs add column if not exists actor_id uuid references auth.users(id) on delete set null;
alter table public.activity_logs add column if not exists actor_role public.app_role;
alter table public.activity_logs add column if not exists event_type public.activity_log_type not null default 'system';
alter table public.activity_logs add column if not exists entity_type text not null default 'system';
alter table public.activity_logs add column if not exists entity_id uuid;
alter table public.activity_logs add column if not exists message text not null default '';
alter table public.activity_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.activity_logs add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'barber_shifts_current_ticket_id_fkey'
  ) then
    alter table public.barber_shifts
      add constraint barber_shifts_current_ticket_id_fkey
      foreign key (current_ticket_id) references public.queue_tickets(id)
      on delete set null;
  end if;
end $$;

drop trigger if exists shop_settings_touch_updated_at on public.shop_settings;
create trigger shop_settings_touch_updated_at
  before update on public.shop_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
  before update on public.services
  for each row execute function public.touch_updated_at();

drop trigger if exists barbers_touch_updated_at on public.barbers;
create trigger barbers_touch_updated_at
  before update on public.barbers
  for each row execute function public.touch_updated_at();

drop trigger if exists barber_shifts_touch_updated_at on public.barber_shifts;
create trigger barber_shifts_touch_updated_at
  before update on public.barber_shifts
  for each row execute function public.touch_updated_at();

drop trigger if exists queue_tickets_touch_updated_at on public.queue_tickets;
create trigger queue_tickets_touch_updated_at
  before update on public.queue_tickets
  for each row execute function public.touch_updated_at();

create or replace function public.next_ticket_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  select coalesce(max(ticket_number::integer), 0) + 1
  into next_number
  from public.queue_tickets
  where joined_at::date = current_date
    and ticket_number ~ '^[0-9]+$';

  return lpad(next_number::text, 3, '0');
end;
$$;

create or replace function public.expire_stale_skipped_tickets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expiry_seconds integer;
  changed_count integer;
begin
  select skip_expiry_seconds
  into expiry_seconds
  from public.shop_settings
  where id = true;

  expiry_seconds := coalesce(expiry_seconds, 1800);

  update public.queue_tickets
  set
    status = 'expired',
    expired_at = now(),
    skipped_at = null
  where status = 'skipped'
    and skipped_at is not null
    and skipped_at <= now() - make_interval(secs => expiry_seconds);

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

alter table public.shop_settings enable row level security;
alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.barber_shifts enable row level security;
alter table public.queue_tickets enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "shop_settings_read_authenticated" on public.shop_settings;
create policy "shop_settings_read_authenticated"
on public.shop_settings for select
to authenticated
using (true);

drop policy if exists "shop_settings_update_receptionist" on public.shop_settings;
create policy "shop_settings_update_receptionist"
on public.shop_settings for update
to authenticated
using (public.is_receptionist())
with check (public.is_receptionist());

drop policy if exists "services_read_authenticated" on public.services;
create policy "services_read_authenticated"
on public.services for select
to authenticated
using (is_active or public.is_receptionist());

drop policy if exists "services_manage_receptionist" on public.services;
create policy "services_manage_receptionist"
on public.services for all
to authenticated
using (public.is_receptionist())
with check (public.is_receptionist());

drop policy if exists "barbers_read_authenticated" on public.barbers;
create policy "barbers_read_authenticated"
on public.barbers for select
to authenticated
using (is_active or public.is_receptionist());

drop policy if exists "barbers_manage_receptionist" on public.barbers;
create policy "barbers_manage_receptionist"
on public.barbers for all
to authenticated
using (public.is_receptionist())
with check (public.is_receptionist());

drop policy if exists "barber_shifts_read_authenticated" on public.barber_shifts;
create policy "barber_shifts_read_authenticated"
on public.barber_shifts for select
to authenticated
using (true);

drop policy if exists "barber_shifts_manage_receptionist" on public.barber_shifts;
create policy "barber_shifts_manage_receptionist"
on public.barber_shifts for all
to authenticated
using (public.is_receptionist())
with check (public.is_receptionist());

drop policy if exists "queue_tickets_read_own_or_receptionist" on public.queue_tickets;
create policy "queue_tickets_read_own_or_receptionist"
on public.queue_tickets for select
to authenticated
using (customer_id = auth.uid() or public.is_receptionist() or status in ('waiting', 'being_served'));

drop policy if exists "queue_tickets_insert_own" on public.queue_tickets;
create policy "queue_tickets_insert_own"
on public.queue_tickets for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "queue_tickets_update_own_cancel_or_receptionist" on public.queue_tickets;
create policy "queue_tickets_update_own_cancel_or_receptionist"
on public.queue_tickets for update
to authenticated
using (customer_id = auth.uid() or public.is_receptionist())
with check (customer_id = auth.uid() or public.is_receptionist());

drop policy if exists "activity_logs_read_receptionist" on public.activity_logs;
create policy "activity_logs_read_receptionist"
on public.activity_logs for select
to authenticated
using (public.is_receptionist());

drop policy if exists "activity_logs_insert_authenticated" on public.activity_logs;
create policy "activity_logs_insert_authenticated"
on public.activity_logs for insert
to authenticated
with check (actor_id = auth.uid() or public.is_receptionist());

insert into public.shop_settings (id, shop_is_open, skip_expiry_seconds, sound_enabled)
values (true, true, 1800, true)
on conflict (id) do nothing;

insert into public.services (name, slug, description, category, price_cents, duration_minutes, sort_order, features)
values
  ('SUPREMO CUT', 'supremo-cut', 'Signature precision haircut and style finished with a straight-razor neck shave.', 'Haircut', 3500, 30, 10, array['Custom consultation', 'Straight-razor neck shave', 'Blow-dry & styling cream', 'Hot towel finish']),
  ('BEARD SCULPT', 'beard-sculpt', 'Expert beard shaping, lining, and conditioning with premium beard oil.', 'Beard', 2000, 20, 20, array['Beard trimming & outline', 'Shaping consultation', 'Premium beard oil massage', 'Razor line clean-up']),
  ('LINE UP', 'line-up', 'Quick clean-up of the hairline, sideburns, and neckline.', 'Haircut', 1500, 15, 30, array['Hairline detailing', 'Neckline outline', 'Sideburn trim']),
  ('CLASSIC SHAVE', 'classic-shave', 'Traditional hot towel wet shave using a straight razor and premium shave soap.', 'Shave', 2500, 30, 40, array['Hot towel pre-treatment', 'Pre-shave oil therapy', 'Artisan lather straight-razor shave', 'Post-shave balm massage']),
  ('VIP PACKAGE', 'vip-package', 'The ultimate lounge treatment: signature haircut, beard sculpt, hot towel shave, and scalp treatment.', 'Combo', 6500, 60, 50, array['Supremo Cut', 'Beard Sculpt', 'Classic Hot Towel Shave', 'Tea tree scalp treatment', 'VIP beverage service']),
  ('SCALP TREATMENT', 'scalp-treatment', 'Invigorating scalp wash, massage, and deep conditioning treatment with tea tree oils.', 'Treatment', 3000, 25, 60, array['Deep exfoliating shampoo', 'Tea tree oil massage', 'Scalp hydration steam', 'Blow-dry & conditioning'])
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price_cents = excluded.price_cents,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  features = excluded.features,
  updated_at = now();

insert into public.barbers (display_name, name, specialty, rank, image_position, rating)
values
  ('Kiko T.', 'Kiko T.', 'Skin Fade & Modern Texturing', 'Master', '44% 42%', 4.9),
  ('Marco L.', 'Marco L.', 'Classic Pompadour & Taper', 'Senior', '55% 40%', 4.8),
  ('Uncle Jun', 'Uncle Jun', 'Traditional Hot Towel Razor Shave', 'Artisan', '38% 45%', 5.0),
  ('Dexter M.', 'Dexter M.', 'Buzz Cut & Modern Crop', 'Junior', '62% 42%', 4.6)
on conflict (display_name) do update
set
  name = excluded.name,
  specialty = excluded.specialty,
  rank = excluded.rank,
  image_position = excluded.image_position,
  rating = excluded.rating,
  updated_at = now();

insert into public.barber_shifts (barber_id, status, started_at)
select
  b.id,
  case
    when b.display_name = 'Kiko T.' then 'available'::public.barber_shift_status
    when b.display_name in ('Marco L.', 'Uncle Jun') then 'busy'::public.barber_shift_status
    else 'unavailable'::public.barber_shift_status
  end,
  case when b.display_name = 'Dexter M.' then null else now() end
from public.barbers b
on conflict do nothing;
