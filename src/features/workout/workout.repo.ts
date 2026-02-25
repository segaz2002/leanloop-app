import { supabase } from '@/src/lib/supabase';
import { PROGRAM, type DayCode } from '@/src/features/plan/program';

export type Workout = {
  id: string;
  day_code: DayCode;
  started_at: string;
  completed_at: string | null;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  position: number;
  exercise_name: string;
  sets_planned: number;
  rep_min: number;
  rep_max: number;
  substitute_name: string | null;
};

export type WorkoutSet = {
  id: string;
  workout_exercise_id: string;
  set_index: number;
  reps: number;
  weight_kg: number | null;
  created_at: string;
};

export async function startWorkout(day: DayCode) {
  const userRes = await supabase.auth.getUser();
  const userId = userRes.data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const wIns = await supabase
    .from('workouts')
    .insert({ user_id: userId, day_code: day })
    .select('id, day_code, started_at, completed_at')
    .single();

  if (wIns.error) throw wIns.error;
  const workout = wIns.data as Workout;

  const planned = PROGRAM[day];
  const rows = planned.map((ex, idx) => ({
    workout_id: workout.id,
    position: idx + 1,
    exercise_name: ex.name,
    sets_planned: ex.sets,
    rep_min: ex.repMin,
    rep_max: ex.repMax,
  }));

  const exIns = await supabase.from('workout_exercises').insert(rows);
  if (exIns.error) throw exIns.error;

  return workout;
}

export async function fetchWorkout(workoutId: string) {
  const w = await supabase
    .from('workouts')
    .select('id, day_code, started_at, completed_at')
    .eq('id', workoutId)
    .single();
  if (w.error) throw w.error;

  const ex = await supabase
    .from('workout_exercises')
    .select('id, workout_id, position, exercise_name, sets_planned, rep_min, rep_max, substitute_name')
    .eq('workout_id', workoutId)
    .order('position');
  if (ex.error) throw ex.error;

  const sets = await supabase
    .from('workout_sets')
    .select('id, workout_exercise_id, set_index, reps, weight_kg, created_at')
    .in(
      'workout_exercise_id',
      (ex.data ?? []).map((r: any) => r.id),
    )
    .order('created_at', { ascending: true });

  // if no exercises yet, avoid .in([]) weirdness
  const setsData = (sets.error ? [] : sets.data) ?? [];

  return {
    workout: w.data as Workout,
    exercises: (ex.data ?? []) as WorkoutExercise[],
    sets: setsData as WorkoutSet[],
  };
}

export async function addSet(args: { workoutExerciseId: string; setIndex: number; reps: number; weightKg: number | null }) {
  const res = await supabase
    .from('workout_sets')
    .insert({
      workout_exercise_id: args.workoutExerciseId,
      set_index: args.setIndex,
      reps: args.reps,
      weight_kg: args.weightKg,
    })
    .select('id, workout_exercise_id, set_index, reps, weight_kg, created_at')
    .single();

  if (res.error) throw res.error;
  return res.data as WorkoutSet;
}

export async function completeWorkout(workoutId: string) {
  const res = await supabase
    .from('workouts')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', workoutId)
    .select('id')
    .single();
  if (res.error) throw res.error;
}

export async function fetchLastPerformance(exerciseName: string) {
  // Return last logged set for the same exercise name from a completed workout.
  const res = await supabase
    .from('workout_sets')
    .select(
      'id, reps, weight_kg, created_at, workout_exercises!inner(exercise_name, workout_id, workouts!inner(completed_at))',
    )
    .eq('workout_exercises.exercise_name', exerciseName)
    .not('workout_exercises.workouts.completed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  // If RLS blocks join shape, we can replace with two-step query later.
  if (res.error) return null;
  return (res.data?.[0] as any) ?? null;
}
