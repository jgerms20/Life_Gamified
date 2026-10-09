-- Life Gamified — cloud journal, agent keys and push notifications.
-- Every table is prefixed lg_ because this shares a Supabase project with
-- other apps. Nothing here touches tables outside the lg_ namespace.

-- One journal (the full game state as JSON) per signed-in user.
-- `version` increments on every save so two writers (you and your agent)
-- can never silently overwrite each other.
create table if not exists public.lg_journals (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb       not null,
  version    integer     not null default 1,
  updated_by text        not null default 'human' check (updated_by in ('human', 'agent', 'system')),
  updated_at timestamptz not null default now()
);

alter table public.lg_journals enable row level security;

create policy "lg_journals: read own"   on public.lg_journals for select to authenticated using ((select auth.uid()) = user_id);
create policy "lg_journals: insert own" on public.lg_journals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lg_journals: update own" on public.lg_journals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.lg_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger lg_journals_touch before update on public.lg_journals
  for each row execute function public.lg_touch_updated_at();

-- API keys your AI agent uses. Only a SHA-256 hash is stored; the key itself
-- is shown once in the app when you create it.
create table if not exists public.lg_agent_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  key_hash     text not null unique,
  prefix       text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists lg_agent_keys_user_idx on public.lg_agent_keys (user_id);

alter table public.lg_agent_keys enable row level security;

create policy "lg_agent_keys: read own"   on public.lg_agent_keys for select to authenticated using ((select auth.uid()) = user_id);
create policy "lg_agent_keys: insert own" on public.lg_agent_keys for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lg_agent_keys: update own" on public.lg_agent_keys for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "lg_agent_keys: delete own" on public.lg_agent_keys for delete to authenticated using ((select auth.uid()) = user_id);

-- Browser push subscriptions (one per device).
create table if not exists public.lg_push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint        text not null unique,
  p256dh          text not null,
  auth            text not null,
  device          text,
  created_at      timestamptz not null default now(),
  last_success_at timestamptz,
  failures        integer not null default 0
);
create index if not exists lg_push_subscriptions_user_idx on public.lg_push_subscriptions (user_id);

alter table public.lg_push_subscriptions enable row level security;

create policy "lg_push: read own"   on public.lg_push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "lg_push: insert own" on public.lg_push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lg_push: update own" on public.lg_push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "lg_push: delete own" on public.lg_push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

-- Which scheduled reminders already went out (so cron never double-sends).
create table if not exists public.lg_notifications_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind    text not null,
  day     text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);
alter table public.lg_notifications_sent enable row level security;
-- No policies: only the service role (Edge Functions) reads or writes it.

-- Server-only settings (cron secret, VAPID keys). RLS on with no policies,
-- so neither anon nor signed-in users can read it.
create table if not exists public.lg_config (
  key        text primary key,
  value      text not null,
  created_at timestamptz not null default now()
);
alter table public.lg_config enable row level security;

insert into public.lg_config (key, value)
values ('cron_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- Live updates: the app listens for journal changes made by your agent.
alter publication supabase_realtime add table public.lg_journals;
