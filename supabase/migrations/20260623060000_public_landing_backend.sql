drop policy if exists "shop_settings_read_public" on public.shop_settings;
create policy "shop_settings_read_public"
on public.shop_settings for select
to anon
using (true);

drop policy if exists "services_read_public_active" on public.services;
create policy "services_read_public_active"
on public.services for select
to anon
using (is_active);

create or replace function public.public_queue_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'waiting_count',
      (
        select count(*)
        from public.queue_tickets
        where status in ('waiting', 'skipped')
      ),
    'estimated_wait_minutes',
      (
        select greatest(count(*) * 10, 0)
        from public.queue_tickets
        where status in ('waiting', 'skipped')
      )
  );
$$;

revoke execute on function public.public_queue_summary() from public;
grant execute on function public.public_queue_summary() to anon, authenticated;
