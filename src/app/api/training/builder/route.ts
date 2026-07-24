import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/training/builder — everything the Track Builder needs:
 * all tracks with their modules, plus the catalogs a block can point at
 * (menu sections, video series, quizzes) and restaurant names for
 * labeling. Admin only — tracks are brand standards.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles').select('role, status').eq('id', user.id).single();
  if (!me || me.status === 'archived' || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [
    { data: tracks },
    { data: modules },
    { data: categories },
    { data: series },
    { data: quizzes },
    { data: restaurants },
  ] = await Promise.all([
    adminClient.from('training_tracks').select('id, title, level, applies_to, position_slugs, restaurant_id, sort_order').eq('active', true).order('sort_order'),
    adminClient.from('track_modules').select('*').eq('active', true).order('sort_order'),
    adminClient.from('menu_categories').select('id, name, restaurant_id, is_knowledge').eq('active', true).order('sort_order'),
    adminClient.from('training_series').select('id, title').eq('active', true).order('sort_order'),
    adminClient.from('quizzes').select('id, title, kind, restaurant_id').eq('active', true).order('created_at', { ascending: false }),
    adminClient.from('restaurants').select('id, name'),
  ]);

  const modulesByTrack = new Map<string, unknown[]>();
  for (const m of modules ?? []) {
    const list = modulesByTrack.get(m.track_id) || [];
    list.push(m);
    modulesByTrack.set(m.track_id, list);
  }

  return NextResponse.json({
    tracks: (tracks ?? []).map((t) => ({ ...t, modules: modulesByTrack.get(t.id) || [] })),
    refs: {
      categories: categories ?? [],
      series: series ?? [],
      quizzes: quizzes ?? [],
    },
    restaurants: restaurants ?? [],
  });
}
