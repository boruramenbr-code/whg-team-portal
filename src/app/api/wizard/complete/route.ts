import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/wizard/complete
 *
 * Stamps profiles.wizard_completed_at = now() for the current user.
 * Also backfills welcome_dismissed_at + story_acknowledged_at if those
 * are still null — the wizard's steps 2 and 3 ARE the welcome note + Our
 * Story content, so completing the wizard counts as having seen them.
 * This prevents the legacy modals from popping up after the wizard.
 *
 * Idempotent — re-completing is a no-op for already-set timestamps.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  const now = new Date().toISOString();

  // First read so we don't overwrite an earlier wizard completion timestamp
  // or an earlier welcome/story acknowledgment.
  const { data: existing } = await admin
    .from('profiles')
    .select('wizard_completed_at, welcome_dismissed_at, story_acknowledged_at')
    .eq('id', user.id)
    .single();

  const patch: Record<string, string> = {};
  if (!existing?.wizard_completed_at) patch.wizard_completed_at = now;
  if (!existing?.welcome_dismissed_at) patch.welcome_dismissed_at = now;
  if (!existing?.story_acknowledged_at) patch.story_acknowledged_at = now;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, already_completed: true });
  }

  const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
