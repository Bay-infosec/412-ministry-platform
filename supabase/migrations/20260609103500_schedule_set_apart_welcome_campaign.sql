create table if not exists public.scheduled_invite_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_key text not null unique,
  event_id uuid not null references public.events(id) on delete cascade,
  run_at timestamptz not null,
  temporary_password text,
  status text not null default 'queued',
  results jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_invite_campaigns_due_idx
  on public.scheduled_invite_campaigns (run_at)
  where status = 'queued';

alter table public.scheduled_invite_campaigns enable row level security;

insert into public.scheduled_invite_campaigns (campaign_key, event_id, run_at)
select
  'set-apart-2026-unopened-leaders-2026-06-10-0700-pacific',
  id,
  '2026-06-10 14:00:00+00'::timestamptz
from public.events
where name ilike '%Set Apart 2026%'
order by created_at
limit 1
on conflict (campaign_key) do nothing;
