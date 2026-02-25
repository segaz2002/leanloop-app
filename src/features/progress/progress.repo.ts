import { supabase } from '@/src/lib/supabase';
import { fetchHabitsRange } from '@/src/features/habits/habits.repo';
import { fetchMyProfile } from '@/src/features/profile/profile.repo';
import { gradeWeek, type WeeklyStats } from '@/src/features/progress/progress.logic';

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function fetchWeeklyStats(weeks: number): Promise<{ profile: { protein_goal_g: number; steps_goal: number }; weeks: WeeklyStats[] }> {
  const profile = await fetchMyProfile();

  const today = new Date();
  const thisWeekStart = startOfWeekMonday(today);

  const weekStarts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    weekStarts.push(addDays(thisWeekStart, -7 * i));
  }

  const rangeFrom = toISODate(weekStarts[0]);
  const rangeTo = toISODate(addDays(weekStarts[weekStarts.length - 1], 6));

  // Workouts completed in range
  const wRes = await supabase
    .from('workouts')
    .select('id, completed_at')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .gte('completed_at', `${rangeFrom}T00:00:00.000Z`)
    .lte('completed_at', `${rangeTo}T23:59:59.999Z`);
  if (wRes.error) throw wRes.error;

  const habits = await fetchHabitsRange({ from: rangeFrom, to: rangeTo });

  // Index habits by date
  const habitsByDate = new Map<string, { protein_g: number | null; steps: number | null }>();
  for (const h of habits) habitsByDate.set(h.date, { protein_g: h.protein_g, steps: h.steps });

  const completedDates: string[] = (wRes.data ?? [])
    .map((r: any) => String(r.completed_at).slice(0, 10))
    .filter(Boolean);

  const weeksOut: WeeklyStats[] = weekStarts.map((ws) => {
    const start = toISODate(ws);
    const end = toISODate(addDays(ws, 6));

    // workouts
    const workoutsCompleted = completedDates.filter((d) => d >= start && d <= end).length;

    // habits
    let proteinDaysHit = 0;
    let stepsDaysHit = 0;
    for (let i = 0; i < 7; i++) {
      const day = toISODate(addDays(ws, i));
      const h = habitsByDate.get(day);
      if (h?.protein_g != null && h.protein_g >= profile.protein_goal_g) proteinDaysHit++;
      if (h?.steps != null && h.steps >= profile.steps_goal) stepsDaysHit++;
    }

    const grade = gradeWeek({ workoutsCompleted, proteinDaysHit, stepsDaysHit });
    return { weekStart: start, weekEnd: end, workoutsCompleted, proteinDaysHit, stepsDaysHit, grade };
  });

  return { profile: { protein_goal_g: profile.protein_goal_g, steps_goal: profile.steps_goal }, weeks: weeksOut };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
