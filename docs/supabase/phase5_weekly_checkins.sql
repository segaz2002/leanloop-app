-- Phase 5: Weekly check-ins (v1.2)
-- Captures end-of-week weight + adherence snapshot.

create table if not exists public.weekly_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, -- Monday
  weight_kg numeric null,
  workouts_completed int not null default 0,
  protein_goal_days int not null default 0,
  steps_goal_days int not null default 0,
  note text null,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, week_start)
);

alter table public.weekly_checkins enable row level security;

-- RLS: users can manage only their rows

drop policy if exists "weekly_checkins_select_own" on public.weekly_checkins;
create policy "weekly_checkins_select_own"
  on public.weekly_checkins for select
  using (auth.uid() = user_id);

drop policy if exists "weekly_checkins_insert_own" on public.weekly_checkins;
create policy "weekly_checkins_insert_own"
  on public.weekly_checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "weekly_checkins_update_own" on public.weekly_checkins;
create policy "weekly_checkins_update_own"
  on public.weekly_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weekly_checkins_delete_own" on public.weekly_checkins;
create policy "weekly_checkins_delete_own"
  on public.weekly_checkins for delete
  using (auth.uid() = user_id);
