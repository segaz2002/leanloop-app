-- LeanLoop Phase 2 schema (workout logging)
-- Run this in Supabase SQL Editor.

-- Workouts (one session)
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_code text not null check (day_code in ('A','B','C')),
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  status text not null default 'in_progress',
  abandoned_at timestamptz null,
  constraint workouts_status_check check (status in ('in_progress','completed','abandoned'))
);

-- Exercises for a workout (store names directly to avoid seed dependencies)
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position int not null,
  exercise_name text not null,
  sets_planned int not null default 3,
  rep_min int not null default 8,
  rep_max int not null default 12,
  substitute_name text null
);

-- Logged sets
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_index int not null,
  reps int not null,
  weight_kg numeric null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists workouts_user_started_idx on public.workouts(user_id, started_at desc);
create index if not exists workout_exercises_workout_pos_idx on public.workout_exercises(workout_id, position);
create index if not exists workout_sets_exercise_created_idx on public.workout_sets(workout_exercise_id, created_at desc);

-- RLS
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

-- Workouts: user can manage their own
create policy "workouts_select_own" on public.workouts
for select to authenticated
using (user_id = auth.uid());

create policy "workouts_insert_own" on public.workouts
for insert to authenticated
with check (user_id = auth.uid());

create policy "workouts_update_own" on public.workouts
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "workouts_delete_own" on public.workouts
for delete to authenticated
using (user_id = auth.uid());

-- Workout exercises: accessible only if parent workout is owned by user
create policy "workout_exercises_select_own" on public.workout_exercises
for select to authenticated
using (
  exists(
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_exercises_insert_own" on public.workout_exercises
for insert to authenticated
with check (
  exists(
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_exercises_update_own" on public.workout_exercises
for update to authenticated
using (
  exists(
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and w.user_id = auth.uid()
  )
)
with check (
  exists(
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_exercises_delete_own" on public.workout_exercises
for delete to authenticated
using (
  exists(
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and w.user_id = auth.uid()
  )
);

-- Workout sets: accessible only if grandparent workout is owned by user
create policy "workout_sets_select_own" on public.workout_sets
for select to authenticated
using (
  exists(
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_sets.workout_exercise_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_sets_insert_own" on public.workout_sets
for insert to authenticated
with check (
  exists(
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_sets.workout_exercise_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_sets_update_own" on public.workout_sets
for update to authenticated
using (
  exists(
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_sets.workout_exercise_id
      and w.user_id = auth.uid()
  )
)
with check (
  exists(
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_sets.workout_exercise_id
      and w.user_id = auth.uid()
  )
);

create policy "workout_sets_delete_own" on public.workout_sets
for delete to authenticated
using (
  exists(
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_sets.workout_exercise_id
      and w.user_id = auth.uid()
  )
);
