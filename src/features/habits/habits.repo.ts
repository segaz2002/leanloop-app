import { supabase } from '@/src/lib/supabase';

export type HabitsDaily = {
  user_id: string;
  date: string; // yyyy-mm-dd
  protein_g: number | null;
  steps: number | null;
};

export async function upsertHabitsForDate(args: {
  date: string;
  protein_g: number | null;
  steps: number | null;
}) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error('Not authenticated');

  const res = await supabase
    .from('habits_daily')
    .upsert({ user_id: user.id, date: args.date, protein_g: args.protein_g, steps: args.steps })
    .select('user_id, date, protein_g, steps')
    .maybeSingle();

  if (res.error) throw res.error;

  // Some PostgREST/Supabase setups may not return a single object representation reliably for upsert.
  // In v1, we can proceed even if the response body is empty.
  return (
    (res.data as HabitsDaily | null) ??
    ({ user_id: user.id, date: args.date, protein_g: args.protein_g, steps: args.steps } as HabitsDaily)
  );
}

export async function fetchHabitsRange(args: { from: string; to: string }) {
  const res = await supabase
    .from('habits_daily')
    .select('user_id, date, protein_g, steps')
    .gte('date', args.from)
    .lte('date', args.to)
    .order('date', { ascending: true });

  if (res.error) throw res.error;
  return (res.data ?? []) as HabitsDaily[];
}

export async function fetchHabitsForDate(date: string) {
  const res = await supabase
    .from('habits_daily')
    .select('user_id, date, protein_g, steps')
    .eq('date', date)
    .maybeSingle();

  if (res.error) throw res.error;
  return (res.data as HabitsDaily | null) ?? null;
}
