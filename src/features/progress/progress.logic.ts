export type WeeklyStats = {
  weekStart: string; // yyyy-mm-dd
  weekEnd: string; // yyyy-mm-dd
  workoutsCompleted: number;

  // Habits
  proteinDaysLogged: number; // days with any protein value logged (non-null)
  proteinDaysHit: number; // days protein >= goal
  stepsDaysLogged: number; // days with any steps value logged (non-null)
  stepsDaysHit: number; // days steps >= goal

  grade: 'starter' | 'bronze' | 'silver' | 'gold';
};

export function gradeWeek(args: {
  workoutsCompleted: number;
  proteinDaysHit: number;
  stepsDaysHit: number;
}) {
  // Ethical + beginner-friendly: reward consistency, not perfection.
  // Targets: 3 workouts/week, 4 protein days, 4 steps days.
  const w = Math.min(args.workoutsCompleted / 3, 1);
  const p = Math.min(args.proteinDaysHit / 4, 1);
  const s = Math.min(args.stepsDaysHit / 4, 1);

  const score = 0.5 * w + 0.25 * p + 0.25 * s;

  if (score >= 0.9) return 'gold';
  if (score >= 0.7) return 'silver';
  if (score >= 0.45) return 'bronze';
  return 'starter';
}

export function weekLabel(weekStart: string) {
  return weekStart;
}
