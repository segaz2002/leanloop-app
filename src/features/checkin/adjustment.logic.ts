import type { WeeklyStats } from '@/src/features/progress/progress.logic';
import type { GoalMode } from '@/src/features/settings/GoalProvider';

export type AdjustmentInput = {
  thisWeek: WeeklyStats;
  goals: { protein_goal_g: number; steps_goal: number };
  currKg: number | null;   // end-of-week weight from this week's check-in
  prevKg: number | null;   // end-of-week weight from last week's check-in
  goal: GoalMode;
};

export type AdjustmentResult = {
  nextSteps: number;
  nextProtein: number;
  deltaKg: number | null;
  reasons: string[];
};

export function computeAdjustments({
  thisWeek,
  goals,
  currKg,
  prevKg,
  goal,
}: AdjustmentInput): AdjustmentResult {
  const currentSteps = goals.steps_goal;
  const currentProtein = goals.protein_goal_g;

  let nextSteps = currentSteps;
  let nextProtein = currentProtein;
  const reasons: string[] = [];

  const deltaKg = currKg != null && prevKg != null ? currKg - prevKg : null;

  const stepsHit = thisWeek.stepsDaysHit;
  const proteinHit = thisWeek.proteinDaysHit;
  const workouts = thisWeek.workoutsCompleted;

  const adherenceGood = workouts >= 3 || stepsHit >= 3;
  const adherenceLow = workouts <= 1 && stepsHit <= 1;

  if (goal === 'fat_loss') {
    // Target: ~0.3–0.7% BW loss per week.
    // If weight delta is unknown, nudge activity up slightly to build the habit.
    if (deltaKg != null && prevKg != null && prevKg > 0) {
      const pctChange = deltaKg / prevKg;

      if (pctChange < -0.007) {
        // Losing too fast (>0.7% BW/wk) — risk of muscle loss; ease off
        nextSteps = Math.max(3000, currentSteps - 500);
        reasons.push('Weight dropping fast — pulling back slightly to protect muscle.');
      } else if (pctChange >= -0.007 && pctChange <= -0.003) {
        // Ideal fat-loss pace; keep everything the same
        reasons.push('Weight loss is on track — keep the same targets.');
      } else {
        // Not losing enough or gaining; increase activity if adherent
        if (adherenceGood) {
          nextSteps = Math.min(20000, currentSteps + 500);
          reasons.push('Weight not moving down enough — adding 500 steps/day.');
        } else {
          reasons.push('Consistency first — hit your current targets before increasing them.');
        }
      }
    } else {
      // No weight data yet; nudge steps up if they are consistently achieved
      if (stepsHit >= 4 && adherenceGood) {
        nextSteps = Math.min(20000, currentSteps + 500);
        reasons.push('Great adherence — adding 500 steps/day to progress the cut.');
      } else {
        reasons.push('Keep steps goal the same until you have a week of weight data.');
      }
    }

    // Protein: keep high for muscle preservation; only reduce if completely unmanageable
    if (proteinHit <= 1 && currentProtein > 100) {
      nextProtein = Math.max(100, currentProtein - 10);
      reasons.push('Protein goal was very hard to hit — dropping 10g to build consistency.');
    } else if (proteinHit >= 5 && currentProtein < 160) {
      nextProtein = Math.min(160, currentProtein + 5);
      reasons.push('Consistently hitting protein — bumping 5g to support muscle retention.');
    } else {
      reasons.push('Keep protein goal the same.');
    }
  } else if (goal === 'lean_gain') {
    // Target: gaining 0.1–0.3% BW per week (slow, muscle-focused).
    if (deltaKg != null && prevKg != null && prevKg > 0) {
      const pctChange = deltaKg / prevKg;

      if (pctChange > 0.004) {
        // Gaining too fast — risk of excess fat; reduce activity or flag
        nextSteps = Math.min(20000, currentSteps + 1000);
        reasons.push('Gaining a bit fast — adding steps to keep fat gain in check.');
      } else if (pctChange >= 0.001 && pctChange <= 0.004) {
        // Ideal lean-gain pace
        reasons.push('Lean-gain pace is perfect — keep the same targets.');
      } else {
        // Not gaining; increase protein slightly to support growth
        if (currentProtein < 180) {
          nextProtein = Math.min(180, currentProtein + 10);
          reasons.push('Weight not going up — adding 10g protein to support muscle growth.');
        } else {
          reasons.push('Protein is already high. Focus on hitting your targets consistently.');
        }
      }
    } else {
      reasons.push('Keep targets the same until you have a week of weight data.');
    }

    // Steps: keep moderate for lean gain; don't push cardio too hard
    if (stepsHit <= 1 && currentSteps > 5000) {
      nextSteps = Math.max(4000, currentSteps - 500);
      reasons.push('Steps goal was hard — reducing slightly so recovery stays on track.');
    }
  } else {
    // Maintenance: keep weight within a small deadband (±0.25% BW/week).
    if (deltaKg != null && prevKg != null && prevKg > 0) {
      const deadbandKg = prevKg * 0.0025;
      if (Math.abs(deltaKg) <= deadbandKg) {
        reasons.push('Weight is within the maintenance range — keep steps the same.');
      } else if (deltaKg > deadbandKg) {
        if (adherenceGood) {
          nextSteps = Math.min(20000, currentSteps + 1000);
          reasons.push('Weight drifting up — +1000 steps/day.');
        } else {
          reasons.push('Weight drifting up — focus on consistency first (keep steps).');
        }
      } else {
        nextSteps = Math.max(3000, currentSteps - 500);
        reasons.push('Weight drifting down — -500 steps/day to maintain.');
      }
    } else {
      if (stepsHit <= 1 && currentSteps > 3000) {
        nextSteps = Math.max(3000, currentSteps - 500);
        reasons.push('Steps goal was hard to hit — -500 steps/day to make it doable.');
      } else {
        reasons.push('Keep steps goal the same for now.');
      }
    }

    if (proteinHit <= 1 && currentProtein > 80) {
      nextProtein = Math.max(80, currentProtein - 10);
      reasons.push('Protein goal was hard to hit — -10g to build consistency.');
    } else {
      reasons.push('Keep protein goal the same.');
    }
  }

  // Global guard: never increase targets when adherence was very low
  if (adherenceLow) {
    nextSteps = Math.min(nextSteps, currentSteps);
    nextProtein = Math.min(nextProtein, currentProtein);
  }

  return { nextSteps, nextProtein, deltaKg, reasons };
}
