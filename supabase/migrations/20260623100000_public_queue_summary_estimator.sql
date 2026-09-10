create or replace function public.public_queue_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  general_waiting_count int := 0;
  default_duration int := 30;
  active_barber_ids uuid[] := '{}';
  workloads int[] := '{}';
  ticket record;
  eligible_index int;
  min_index int;
  i int;
begin
  select count(*)::int
    into general_waiting_count
  from public.queue_tickets
  where status = 'waiting'
    and preferred_barber_id is null;

  select coalesce(duration_minutes, 30)
    into default_duration
  from public.services
  where is_active = true
  order by sort_order asc
  limit 1;

  default_duration := greatest(coalesce(default_duration, 30), 5);

  select coalesce(array_agg(barber_id order by barber_id), '{}')
    into active_barber_ids
  from public.barber_shifts
  where ended_at is null
    and status in ('available', 'busy');

  if coalesce(array_length(active_barber_ids, 1), 0) = 0 then
    select coalesce(sum(greatest(coalesce(s.duration_minutes, 30), 5)), 0)::int
      into default_duration
    from public.queue_tickets qt
    left join public.services s on s.id = qt.service_id
    where qt.status = 'waiting';

    return jsonb_build_object(
      'waiting_count', general_waiting_count,
      'estimated_wait_minutes', default_duration
    );
  end if;

  workloads := array_fill(0, array[array_length(active_barber_ids, 1)]);

  for ticket in
    select
      qt.assigned_barber_id,
      greatest(coalesce(s.duration_minutes, 30), 5) as duration_minutes
    from public.queue_tickets qt
    left join public.services s on s.id = qt.service_id
    where qt.status = 'being_served'
      and qt.assigned_barber_id = any(active_barber_ids)
  loop
    eligible_index := array_position(active_barber_ids, ticket.assigned_barber_id);
    if eligible_index is not null then
      workloads[eligible_index] := workloads[eligible_index] + ticket.duration_minutes;
    end if;
  end loop;

  for ticket in
    select
      qt.preferred_barber_id,
      greatest(coalesce(s.duration_minutes, 30), 5) as duration_minutes
    from public.queue_tickets qt
    left join public.services s on s.id = qt.service_id
    where qt.status = 'waiting'
    order by qt.joined_at asc
  loop
    if ticket.preferred_barber_id is not null then
      eligible_index := array_position(active_barber_ids, ticket.preferred_barber_id);
      if eligible_index is not null then
        workloads[eligible_index] := workloads[eligible_index] + ticket.duration_minutes;
      end if;
    else
      min_index := 1;
      for i in 2..array_length(workloads, 1) loop
        if workloads[i] < workloads[min_index] then
          min_index := i;
        end if;
      end loop;
      workloads[min_index] := workloads[min_index] + ticket.duration_minutes;
    end if;
  end loop;

  min_index := 1;
  for i in 2..array_length(workloads, 1) loop
    if workloads[i] < workloads[min_index] then
      min_index := i;
    end if;
  end loop;

  return jsonb_build_object(
    'waiting_count', general_waiting_count,
    'estimated_wait_minutes', workloads[min_index]
  );
end;
$$;

revoke execute on function public.public_queue_summary() from public;
grant execute on function public.public_queue_summary() to anon, authenticated;
