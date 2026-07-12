import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/menu/positions?restaurant_id=<uuid>
 *
 * Powers the Menu tab's "Explore by Position": every active position
 * with the menu category ids its training track assigns. Single source
 * of truth — the track IS the assignment, so this needs zero upkeep.
 * Positions whose tracks reference no menu (busser, dish crew) return
 * an empty list; the UI says their training lives elsewhere.
 *
 * Open to all staff — deliberate cross-training is the point.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.status === 'archived') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const restaurantId = req.nextUrl.searchParams.get('restaurant_id') || profile.restaurant_id;

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [{ data: positions }, { data: tracks }, { data: modules }] = await Promise.all([
    adminClient.from('positions').select('slug, name, emoji, department, sort_order').eq('active', true),
    adminClient
      .from('training_tracks')
      .select('id, restaurant_id, position_slugs')
      .eq('active', true)
      .eq('level', 'position'),
    adminClient
      .from('track_modules')
      .select('track_id, ref_id')
      .eq('active', true)
      .eq('module_type', 'menu_category')
      .not('ref_id', 'is', null),
  ]);

  const modsByTrack = new Map<string, string[]>();
  for (const m of modules ?? []) {
    const list = modsByTrack.get(m.track_id) || [];
    list.push(m.ref_id as string);
    modsByTrack.set(m.track_id, list);
  }

  const result = (positions ?? [])
    .sort((a, b) => (a.department || '').localeCompare(b.department || '') || a.sort_order - b.sort_order)
    .map((p) => {
      // Restaurant-specific track beats the global skeleton — same rule
      // as path resolution.
      const mine = (tracks ?? []).filter((t) => t.position_slugs.includes(p.slug));
      const specific = mine.filter((t) => t.restaurant_id === restaurantId);
      const chosen = specific.length > 0 ? specific : mine.filter((t) => t.restaurant_id === null);
      const categoryIds = Array.from(new Set(chosen.flatMap((t) => modsByTrack.get(t.id) || [])));
      return {
        slug: p.slug,
        name: p.name,
        emoji: p.emoji,
        department: p.department,
        category_ids: categoryIds,
      };
    });

  return NextResponse.json(
    { positions: result },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}
