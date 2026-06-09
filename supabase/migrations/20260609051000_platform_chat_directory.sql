create or replace function public.get_platform_directory()
returns table (
  id uuid,
  full_name text,
  nickname text,
  photo_url text,
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.nickname,
    p.photo_url,
    p.last_seen_at
  from public.profiles p
  where auth.uid() is not null
  order by p.full_name;
$$;

revoke all on function public.get_platform_directory() from public;
grant execute on function public.get_platform_directory() to authenticated;
