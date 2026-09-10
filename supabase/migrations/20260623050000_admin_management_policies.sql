drop policy if exists "activity_logs_delete_receptionist" on public.activity_logs;
create policy "activity_logs_delete_receptionist"
on public.activity_logs for delete
to authenticated
using (public.is_receptionist());
