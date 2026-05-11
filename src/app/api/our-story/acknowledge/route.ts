import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/our-story/acknowledge
 *
 * Stamps profiles.story_acknowledged_at = now() for the current user.
 * Called when staff clicks "I've read this. Let's go." in the modal.
 *
 * Idempotent — re-acknowledging is a no-op (we don't overwrite the
 * original timestamp, preserving the moment of first acknowledgment).
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = getAdminClient();
  // Only set if currently null — preserves original timestamp on repeat calls.
  const { error } = await adminClient
    .from('profiles')
    .update({ story_acknowledged_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('story_acknowledged_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ acknowledged: true });
}
