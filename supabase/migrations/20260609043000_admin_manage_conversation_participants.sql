-- Admins need to inspect and reconcile system-group membership without
-- becoming participants in every system conversation themselves.
create policy "cp_admin_select"
on public.conversation_participants
for select
to authenticated
using (public.is_platform_admin());

create policy "cp_admin_delete"
on public.conversation_participants
for delete
to authenticated
using (public.is_platform_admin());
