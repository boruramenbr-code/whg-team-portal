import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

/**
 * Auth helpers shared across API routes.
 *
 * The 2-trip pattern `supabase.auth.getUser()` → `supabase.from('profiles').select(...)`
 * is in every route. Calling it twice adds 100–300ms of latency per route. These
 * helpers fold the pattern into a single helper call and let routes parallelize
 * the auth check against any other independent queries.
 */

export interface AuthedProfile {
  id: string;
  full_name: string;
  role: 'employee' | 'manager' | 'assistant_manager' | 'admin';
  restaurant_id: string | null;
  status: 'active' | 'archived';
  preferred_language: 'en' | 'es' | null;
  email?: string | null;
}

/**
 * Returns the current user's auth + profile row, or null if not authenticated.
 *
 * Pass the profile columns you need via `select` to avoid over-fetching wide
 * profile rows. Default is the minimal set most routes care about.
 */
export async function getAuthedProfile(
  supabase: SupabaseClient = createClient(),
  select = 'id, full_name, role, restaurant_id, status, preferred_language'
): Promise<AuthedProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(select)
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { ...(profile as object), email: user.email } as AuthedProfile;
}

/**
 * Convenience: returns true if the role is manager/assistant_manager/admin.
 */
export function isManager(role: string | null | undefined): boolean {
  return role === 'manager' || role === 'assistant_manager' || role === 'admin';
}
