-- LeanLoop Phase 3: Profiles + habits for progress/consistency
-- Run in Supabase SQL Editor.

-- 1) Profiles (store goals + preferences)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  protein_goal_g int not null default 120,
  steps_goal int not null default 8000
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Optional helper: ensure profile row exists for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- 2) Daily habits
create table if not exists public.habits_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  protein_g int null,
  steps int null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create index if not exists habits_daily_user_date_idx on public.habits_daily(user_id, date desc);

alter table public.habits_daily enable row level security;

create policy "habits_daily_select_own" on public.habits_daily
for select to authenticated
using (user_id = auth.uid());

create policy "habits_daily_insert_own" on public.habits_daily
for insert to authenticated
with check (user_id = auth.uid());

create policy "habits_daily_update_own" on public.habits_daily
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "habits_daily_delete_own" on public.habits_daily
for delete to authenticated
using (user_id = auth.uid());

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'habits_daily_updated_at') then
    create trigger habits_daily_updated_at
      before update on public.habits_daily
      for each row execute procedure public.set_updated_at();
  end if;
end $$;
