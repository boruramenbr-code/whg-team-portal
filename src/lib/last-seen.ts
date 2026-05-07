import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;
function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  _adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return _adminClient;
}

/**
 * Updates profiles.last_seen_at = now() for the given user.
 *
 * Fire-and-forget — call without `await` from API routes that already
 * authenticated the user. Failures are swallowed silently because this
 * is a tracking signal, not user-facing functionality. We never want a
 * tracking glitch to break a page load.
 *
 * Use the service-role admin client so we don't need to widen RLS for
 * a column the user shouldn't be writing directly.
 */
export function pingLastSeen(userId: string): void {
  if (!userId) return;
  const adminClient = getAdminClient();
  // Don't await — let it run in the background. The route returns
  // immediately and the UPDATE completes ~asynchronously on Supabase.
  adminClient
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .then(
      () => undefined,
      () => undefined, // swallow errors
    );
}
