do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_logs'
      and column_name = 'type'
  ) then
    update public.activity_logs
    set type = event_type::text
    where type is null;

    alter table public.activity_logs
      alter column type set default 'system';
  end if;
end $$;
