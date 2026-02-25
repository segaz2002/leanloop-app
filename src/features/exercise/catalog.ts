export type ExerciseDetail = {
  slug: string;
  title: string;
  options?: string[]; // For slots like "Goblet Squat / Leg Press"
  alsoCalled?: string[];
  cues: string[];
  demoUrl?: string;
  // Local image require() (static). For MVP we use a placeholder.
  image: any;
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const PLACEHOLDER = require('@/assets/images/icon.png');

function slot(title: string, data: Omit<ExerciseDetail, 'slug' | 'title' | 'image'>): ExerciseDetail {
  return {
    slug: slugify(title),
    title,
    image: PLACEHOLDER,
    ...data,
  };
}

// MVP catalog: cover all exercises present in PROGRAM (A/B/C).
// Content is intentionally short and scannable for beginners.
export const EXERCISE_CATALOG: ExerciseDetail[] = [
  slot('Goblet Squat / Leg Press', {
    options: ['Goblet Squat (dumbbell)', 'Leg Press (machine)'],
    alsoCalled: ['Squat machine (varies)', '45° leg press'],
    cues: ['Brace your core, chest tall', 'Knees track over toes', 'Control the way down; stand up strong'],
    demoUrl: 'https://exrx.net/WeightExercises/Quadriceps/DBGobletSquat',
  }),
  slot('DB Bench Press / Chest Press', {
    options: ['Dumbbell Bench Press', 'Machine Chest Press'],
    alsoCalled: ['Chest press machine'],
    cues: ['Shoulders down and back', 'Lower with control, press without bouncing', 'Stop 1–2 reps before failure'],
    demoUrl: 'https://exrx.net/WeightExercises/PectoralSternal/DBBenchPress',
  }),
  slot('Seated Cable Row / Chest-Supported Row', {
    options: ['Seated Cable Row', 'Chest-Supported Row'],
    alsoCalled: ['Cable row', 'Machine row'],
    cues: ['Pull elbows back, don’t shrug', 'Pause briefly at the squeeze', 'Control the return (2–3 sec)'],
    demoUrl: 'https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow',
  }),
  slot('DB Romanian Deadlift', {
    alsoCalled: ['RDL'],
    cues: ['Hinge at hips (soft knees)', 'Keep back flat and weights close', 'Feel stretch in hamstrings; stand tall'],
    demoUrl: 'https://exrx.net/WeightExercises/Hamstrings/DBRomanianDeadlift',
  }),
  slot('Dead Bug / Cable Crunch', {
    options: ['Dead Bug (floor)', 'Cable Crunch (machine/cable)'],
    alsoCalled: ['Core stability'],
    cues: ['Ribs down, low back gently on floor', 'Move slow and controlled', 'Stop before your back arches'],
    demoUrl: 'https://exrx.net/WeightExercises/RectusAbdominis/WtCrunch',
  }),

  slot('Trap Bar Deadlift / DB RDL', {
    options: ['Trap Bar Deadlift', 'Dumbbell Romanian Deadlift'],
    alsoCalled: ['Hex bar deadlift'],
    cues: ['Brace before you lift', 'Push the floor away', 'Keep the weight close; stand tall at the top'],
    demoUrl: 'https://exrx.net/WeightExercises/ErectorSpinae/HexBarDeadlift',
  }),
  slot('Lat Pulldown / Assisted Pull-up', {
    options: ['Lat Pulldown (machine)', 'Assisted Pull-up (machine)'],
    alsoCalled: ['Pulldown machine', 'Assisted pullup'],
    cues: ['Chest up, shoulders down', 'Pull elbows to your sides', 'Control the return; don’t swing'],
    demoUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/CBLatPulldown',
  }),
  slot('DB Shoulder Press / Machine Press', {
    options: ['Dumbbell Shoulder Press', 'Machine Shoulder Press'],
    alsoCalled: ['Overhead press machine'],
    cues: ['Squeeze glutes and brace', 'Press up, keep ribs down', 'Lower with control'],
    demoUrl: 'https://exrx.net/WeightExercises/DeltoidAnterior/DBShoulderPress',
  }),
  slot('Split Squat / Reverse Lunge', {
    options: ['Split Squat', 'Reverse Lunge'],
    alsoCalled: ['Bulgarian split squat (advanced)'],
    cues: ['Front foot flat, knee tracks forward', 'Stay tall, control the bottom', 'Push through mid-foot/heel'],
    demoUrl: 'https://exrx.net/WeightExercises/Quadriceps/DBLunge',
  }),
  slot('Farmer Carry / Plank', {
    options: ['Farmer Carry', 'Plank'],
    alsoCalled: ['Suitcase carry (single hand)'],
    cues: ['Stand tall, ribs down', 'Walk slow and steady (carry)', 'Keep hips level; don’t sag (plank)'],
    demoUrl: 'https://exrx.net/WeightExercises/TrapeziusUpper/DBFarmersWalk',
  }),

  slot('Hack Squat / Split Squat (variant)', {
    options: ['Hack Squat (machine)', 'Split Squat (variant)'],
    alsoCalled: ['Hack squat machine'],
    cues: ['Brace and keep torso stable', 'Knees track over toes', 'Use a controlled tempo'],
  }),
  slot('Incline DB Press / Push-ups', {
    options: ['Incline Dumbbell Press', 'Push-ups'],
    alsoCalled: ['Incline bench press'],
    cues: ['Shoulders down and back', 'Full range you can control', 'Keep body tight (push-up)'],
    demoUrl: 'https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress',
  }),
  slot('1-Arm DB Row / Cable Row', {
    options: ['One-arm Dumbbell Row', 'Seated Cable Row'],
    alsoCalled: ['Single-arm row'],
    cues: ['Pull elbow toward hip', 'Don’t twist your torso', 'Control the lowering phase'],
    demoUrl: 'https://exrx.net/WeightExercises/BackGeneral/DBBentOverRow',
  }),
  slot('Hip Thrust / Glute Bridge', {
    options: ['Hip Thrust', 'Glute Bridge'],
    alsoCalled: ['Glute drive'],
    cues: ['Tuck ribs, brace core', 'Drive through heels', 'Squeeze glutes at the top'],
    demoUrl: 'https://exrx.net/WeightExercises/GluteusMaximus/BBHipThrust',
  }),
  slot('Cable Curl + Triceps Pressdown', {
    options: ['Cable Curl', 'Triceps Pressdown'],
    alsoCalled: ['Rope pressdown'],
    cues: ['Elbows stay close to your sides', 'Use full control—no swinging', 'Stop 1–2 reps before failure'],
    demoUrl: 'https://exrx.net/WeightExercises/Biceps/CBCurl',
  }),
];

export function getExerciseBySlug(slug: string) {
  return EXERCISE_CATALOG.find((e) => e.slug === slug) ?? null;
}

export function getExerciseSlugFromName(name: string) {
  // If we have a catalog entry for this exact title, use it.
  const exact = EXERCISE_CATALOG.find((e) => e.title === name);
  if (exact) return exact.slug;
  return slugify(name);
}
