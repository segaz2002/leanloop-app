import { supabase } from '@/src/lib/supabase';

export type WeightEntry = {
  user_id: string;
  date: string; // yyyy-mm-dd
  weight_kg: number | null;
  created_at?: string;
};

export async function upsertWeightForDate(args: { date: string; weight_kg: number | null }) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error('Not authenticated');

  const res = await supabase
    .from('weight_entries')
    .upsert({ user_id: user.id, date: args.date, weight_kg: args.weight_kg })
    .select('user_id, date, weight_kg, created_at')
    .maybeSingle();

  if (res.error) throw res.error;

  return (
    (res.data as WeightEntry | null) ??
    ({ user_id: user.id, date: args.date, weight_kg: args.weight_kg } as WeightEntry)
  );
}

export async function fetchWeightRange(args: { from: string; to: string }) {
  const res = await supabase
    .from('weight_entries')
    .select('user_id, date, weight_kg, created_at')
    .gte('date', args.from)
    .lte('date', args.to)
    .order('date', { ascending: true });

  if (res.error) throw res.error;
  return (res.data ?? []) as WeightEntry[];
}

export async function fetchWeightForDate(date: string) {
  const res = await supabase
    .from('weight_entries')
    .select('user_id, date, weight_kg, created_at')
    .eq('date', date)
    .maybeSingle();

  if (res.error) throw res.error;
  return (res.data as WeightEntry | null) ?? null;
}
