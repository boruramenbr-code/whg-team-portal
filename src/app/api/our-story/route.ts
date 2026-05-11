import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/our-story
 *
 * Returns the Our Story / Mission / Values content for the onboarding modal,
 * plus whether the current user has acknowledged it.
 *
 * Response: { acknowledged: boolean, title: string, body: string } or
 *           { acknowledged: true, title: null, body: null } if not needed.
 *
 * Content is sourced from handbook_sections (title 'Our Story, Mission & Values',
 * language=en, handbook_version=4) so the modal stays in sync with the handbook.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check the user's acknowledgment status first — if already acknowledged,
  // don't bother loading the body. Saves bandwidth on every Home tab load.
  const { data: profile } = await supabase
    .from('profiles')
    .select('story_acknowledged_at, preferred_language')
    .eq('id', user.id)
    .single();

  const acknowledged = !!profile?.story_acknowledged_at;

  if (acknowledged) {
    return NextResponse.json({ acknowledged: true, title: null, body: null });
  }

  // Not acknowledged yet — fetch the content. Use admin client because
  // handbook_sections RLS may filter rows the user can see.
  const lang = profile?.preferred_language === 'es' ? 'es' : 'en';
  const adminClient = getAdminClient();
  const { data: section } = await adminClient
    .from('handbook_sections')
    .select('title, body')
    .eq('language', lang)
    .eq('handbook_version', 4)
    .eq('title', 'Our Story, Mission & Values')
    .eq('active', true)
    .maybeSingle();

  // If somehow the section isn't found (migration 048 not run), don't pop
  // the modal — fail closed so we don't show an empty box.
  if (!section) {
    return NextResponse.json({ acknowledged: true, title: null, body: null });
  }

  return NextResponse.json({
    acknowledged: false,
    title: section.title,
    body: section.body,
  });
}

/**
 * POST /api/our-story/acknowledge — see /api/our-story/acknowledge/route.ts
 */
