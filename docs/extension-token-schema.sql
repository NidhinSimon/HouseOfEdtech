create table if not exists public.extension_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  label text not null default 'Chrome Extension',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

alter table public.extension_tokens enable row level security;

create index if not exists extension_tokens_user_active_idx
  on public.extension_tokens (user_id, created_at desc)
  where revoked_at is null;

create index if not exists extension_tokens_user_revoked_idx
  on public.extension_tokens (user_id, revoked_at)
  where revoked_at is not null;
