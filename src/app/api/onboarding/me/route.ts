import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getOnboardingForUser } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/onboarding/me
 * Returns the current user's onboarding checklist + their progress on each
 * item, merged with auto-track derivation from policy signatures, Our Story
 * ack, bar card upload, and welcome dismissal.
 *
 * Uses the admin client for the data fetch so we can read across the joined
 * tables (policies, bar_cards) consistently regardless of RLS quirks. The
 * scope is still locked to the authenticated user.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  const data = await getOnboardingForUser(admin, user.id);
  if (!data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json(data);
}
