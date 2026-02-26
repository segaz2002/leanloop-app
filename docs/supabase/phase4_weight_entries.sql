-- Phase 4: Weight tracking (v1.2)
-- Stores body weight in kg (display can convert to lb).

create table if not exists public.weight_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric null,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, date)
);

alter table public.weight_entries enable row level security;

-- RLS: users can manage only their rows
-- NOTE: Postgres doesn't support `create policy if not exists` on many hosted versions.
-- Use drop+create so the script is safe to re-run.

drop policy if exists "weight_entries_select_own" on public.weight_entries;
create policy "weight_entries_select_own"
  on public.weight_entries for select
  using (auth.uid() = user_id);

drop policy if exists "weight_entries_insert_own" on public.weight_entries;
create policy "weight_entries_insert_own"
  on public.weight_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "weight_entries_update_own" on public.weight_entries;
create policy "weight_entries_update_own"
  on public.weight_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weight_entries_delete_own" on public.weight_entries;
create policy "weight_entries_delete_own"
  on public.weight_entries for delete
  using (auth.uid() = user_id);
