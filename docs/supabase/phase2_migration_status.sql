-- LeanLoop migration: add workout status for resume/abandon flow
-- Run this in Supabase SQL Editor AFTER phase2_schema.sql.

alter table public.workouts
  add column if not exists status text not null default 'in_progress';

alter table public.workouts
  add column if not exists abandoned_at timestamptz null;

-- backfill: if completed_at is set, mark completed
update public.workouts
set status = 'completed'
where completed_at is not null;

-- ensure valid values
alter table public.workouts
  add constraint workouts_status_check
  check (status in ('in_progress','completed','abandoned'));
