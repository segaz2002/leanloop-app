export type DayCode = 'A' | 'B' | 'C';

export type PlannedExercise = {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
};

export const PROGRAM: Record<DayCode, PlannedExercise[]> = {
  A: [
    { name: 'Goblet Squat / Leg Press', sets: 3, repMin: 8, repMax: 12 },
    { name: 'DB Bench Press / Chest Press', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Seated Cable Row / Chest-Supported Row', sets: 3, repMin: 8, repMax: 12 },
    { name: 'DB Romanian Deadlift', sets: 2, repMin: 8, repMax: 12 },
    { name: 'Dead Bug / Cable Crunch', sets: 2, repMin: 10, repMax: 15 },
  ],
  B: [
    { name: 'Trap Bar Deadlift / DB RDL', sets: 3, repMin: 6, repMax: 10 },
    { name: 'Lat Pulldown / Assisted Pull-up', sets: 3, repMin: 8, repMax: 12 },
    { name: 'DB Shoulder Press / Machine Press', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Split Squat / Reverse Lunge', sets: 2, repMin: 8, repMax: 12 },
    { name: 'Farmer Carry / Plank', sets: 2, repMin: 1, repMax: 1 },
  ],
  C: [
    { name: 'Hack Squat / Split Squat (variant)', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Incline DB Press / Push-ups', sets: 3, repMin: 8, repMax: 12 },
    { name: '1-Arm DB Row / Cable Row', sets: 3, repMin: 8, repMax: 12 },
    { name: 'Hip Thrust / Glute Bridge', sets: 2, repMin: 8, repMax: 12 },
    { name: 'Cable Curl + Triceps Pressdown', sets: 2, repMin: 10, repMax: 15 },
  ],
};
