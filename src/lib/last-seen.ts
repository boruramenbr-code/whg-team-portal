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
 *
 * At most once per person per LAST_SEEN_EVERY_MS on a server instance —
 * Home alone used to write it twice per open, and "seen 3 minutes ago"
 * doesn't need to-the-second accuracy on a free-tier database.
 */
const LAST_SEEN_EVERY_MS = 5 * 60 * 1000;
const lastPinged = new Map<string, number>();

export function pingLastSeen(userId: string): void {
  if (!userId) return;
  const now = Date.now();
  if (now - (lastPinged.get(userId) ?? 0) < LAST_SEEN_EVERY_MS) return;
  lastPinged.set(userId, now);
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
