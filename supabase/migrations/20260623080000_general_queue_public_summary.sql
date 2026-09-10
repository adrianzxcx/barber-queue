create or replace function public.public_queue_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with general_waiting as (
    select
      qt.id,
      qt.joined_at,
      coalesce(s.duration_minutes, 30) as duration_minutes
    from public.queue_tickets qt
    left join public.services s on s.id = qt.service_id
    where qt.status = 'waiting'
      and qt.preferred_barber_id is null
  ),
  active_barbers as (
    select count(*)::int as count
    from public.barber_shifts
    where ended_at is null
      and status in ('available', 'busy')
  )
  select jsonb_build_object(
    'waiting_count',
      (select count(*) from general_waiting),
    'estimated_wait_minutes',
      case
        when (select count from active_barbers) <= 0 then
          coalesce((select sum(duration_minutes) from general_waiting), 0)
        else
          ceiling(
            coalesce((select sum(duration_minutes) from general_waiting), 0)::numeric /
            greatest((select count from active_barbers), 1)
          )::int
      end
  );
$$;

revoke execute on function public.public_queue_summary() from public;
grant execute on function public.public_queue_summary() to anon, authenticated;
