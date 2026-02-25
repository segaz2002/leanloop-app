import { supabase } from '@/src/lib/supabase';

export type Profile = {
  id: string;
  protein_goal_g: number;
  steps_goal: number;
};

export async function ensureProfileExists() {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) return null;

  // Upsert a minimal profile row (server trigger also attempts this, but upsert is safe).
  await supabase.from('profiles').upsert({ id: user.id });
  return user.id;
}

export async function fetchMyProfile(): Promise<Profile> {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error('Not authenticated');

  // Profiles are created via trigger + best-effort upsert on auth, but in case the row
  // doesn't exist yet, create it and retry.
  const res = await supabase
    .from('profiles')
    .select('id, protein_goal_g, steps_goal')
    .eq('id', user.id)
    .maybeSingle();

  if (res.error) throw res.error;

  if (!res.data) {
    const ins = await supabase.from('profiles').insert({ id: user.id }).select('id, protein_goal_g, steps_goal').maybeSingle();
    if (ins.error) throw ins.error;
    if (!ins.data) throw new Error('Could not create profile');
    return ins.data as Profile;
  }

  return res.data as Profile;
}

export async function updateMyGoals(args: { protein_goal_g: number; steps_goal: number }) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error('Not authenticated');

  const res = await supabase
    .from('profiles')
    .update({ protein_goal_g: args.protein_goal_g, steps_goal: args.steps_goal })
    .eq('id', user.id)
    .select('id, protein_goal_g, steps_goal')
    .single();

  if (res.error) throw res.error;
  return res.data as Profile;
}
