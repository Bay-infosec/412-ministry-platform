create table if not exists public.app_runtime_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_runtime_secrets enable row level security;
revoke all on table public.app_runtime_secrets from anon, authenticated;

-- Runtime values are configured directly in production and are never committed.
