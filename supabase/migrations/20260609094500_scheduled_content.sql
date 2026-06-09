alter table public.announcements
  add column if not exists publish_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists send_email boolean not null default false,
  add column if not exists send_push boolean not null default true,
  add column if not exists email_sent_at timestamptz,
  add column if not exists push_sent_at timestamptz,
  add column if not exists delivery_error text;

alter table public.events
  add column if not exists publish_at timestamptz,
  add column if not exists published_at timestamptz;

create index if not exists announcements_due_idx
  on public.announcements (publish_at)
  where status = 'draft' and publish_at is not null;

create index if not exists events_due_idx
  on public.events (publish_at)
  where status = 'inactive' and publish_at is not null;

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'process-scheduled-content';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end
$$;

select cron.schedule(
  'process-scheduled-content',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://hoxjardsthjuhbxivken.supabase.co/functions/v1/process-scheduled',
      headers := '{
        "Content-Type":"application/json",
        "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhveGphcmRzdGhqdWhieGl2a2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MDcxNDMsImV4cCI6MjA5NjI4MzE0M30.JX3nAJYEjCZ01Pv0aFn_23nn3RsiJ-s-stI-19rCdh4"
      }'::jsonb,
      body := '{}'::jsonb
    );
  $job$
);
