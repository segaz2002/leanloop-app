import { supabase } from '@/src/lib/supabase';

export type WeeklyCheckin = {
  user_id: string;
  week_start: string; // yyyy-mm-dd (Monday)
  weight_kg: number | null;
  workouts_completed: number;
  protein_goal_days: number;
  steps_goal_days: number;
  note: string | null;
  created_at?: string;
};

export async function fetchWeeklyCheckin(weekStart: string) {
  const res = await supabase
    .from('weekly_checkins')
    .select('user_id, week_start, weight_kg, workouts_completed, protein_goal_days, steps_goal_days, note, created_at')
    .eq('week_start', weekStart)
    .maybeSingle();

  if (res.error) throw res.error;
  return (res.data as WeeklyCheckin | null) ?? null;
}

export async function upsertWeeklyCheckin(args: {
  week_start: string;
  weight_kg: number | null;
  workouts_completed: number;
  protein_goal_days: number;
  steps_goal_days: number;
  note: string | null;
}) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error('Not authenticated');

  const res = await supabase
    .from('weekly_checkins')
    .upsert({
      user_id: user.id,
      week_start: args.week_start,
      weight_kg: args.weight_kg,
      workouts_completed: args.workouts_completed,
      protein_goal_days: args.protein_goal_days,
      steps_goal_days: args.steps_goal_days,
      note: args.note,
    })
    .select('user_id, week_start, weight_kg, workouts_completed, protein_goal_days, steps_goal_days, note, created_at')
    .maybeSingle();

  if (res.error) throw res.error;

  return (
    (res.data as WeeklyCheckin | null) ??
    ({
      user_id: user.id,
      week_start: args.week_start,
      weight_kg: args.weight_kg,
      workouts_completed: args.workouts_completed,
      protein_goal_days: args.protein_goal_days,
      steps_goal_days: args.steps_goal_days,
      note: args.note,
    } as WeeklyCheckin)
  );
}
