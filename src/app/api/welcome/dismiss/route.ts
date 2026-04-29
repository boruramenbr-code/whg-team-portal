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
 * POST /api/welcome/dismiss
 * Marks the current user as having dismissed the welcome note.
 * Sets profiles.welcome_dismissed_at = now().
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ welcome_dismissed_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to dismiss welcome:', error.message);
    return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/welcome/dismiss
 * Re-shows the welcome note for the current user (clears welcome_dismissed_at).
 * Used when user taps the (i) info icon to reopen.
 */
export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ welcome_dismissed_at: null })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to reset welcome:', error.message);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
