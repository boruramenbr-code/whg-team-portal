import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];
const PHOTO_TEST_PREFIX = '📸 Menu Photo Test';

/**
 * GET /api/training/path/users
 * Manager+ Pre-Floor board: every active staff member at the manager's
 * accessible restaurants with their ladder progress and Floor-Ready
 * status. Everything is computed in memory from ~7 bulk queries so the
 * board stays fast regardless of headcount.
 *
 * Track resolution mirrors /api/training/path exactly.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();
  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Accessible restaurants: admin = all; others = primary + user_locations.
  let restaurantIds: string[] | null = null;
  if (me.role !== 'admin') {
    const { data: extras } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id);
    restaurantIds = [me.restaurant_id, ...(extras || []).map((e) => e.restaurant_id)].filter(Boolean) as string[];
  }

  let staffQuery = adminClient
    .from('profiles')
    .select('id, full_name, position_slug, onboarding_category, role, restaurant_id, restaurants(name)')
    .neq('status', 'archived')
    .order('full_name');
  if (restaurantIds) staffQuery = staffQuery.in('restaurant_id', restaurantIds);

  const [
    { data: staff },
    { data: tracks },
    { data: modules },
    { data: progress },
    { data: passes },
    { data: photoQuizzes },
    { data: overrides },
  ] = await Promise.all([
    staffQuery,
    adminClient.from('training_tracks').select('id, restaurant_id, level, applies_to, position_slugs').eq('active', true),
    adminClient.from('track_modules').select('id, track_id, module_type, ref_id, completion, required').eq('active', true).eq('required', true),
    adminClient.from('module_progress').select('user_id, module_id'),
    adminClient.from('quiz_attempts').select('user_id, quiz_id').eq('passed', true),
    adminClient.from('quizzes').select('id, restaurant_id').like('title', `${PHOTO_TEST_PREFIX}%`),
    adminClient.from('floor_ready_overrides').select('user_id'),
  ]);

  const modulesByTrack = new Map<string, NonNullable<typeof modules>>();
  for (const m of modules ?? []) {
    const list = modulesByTrack.get(m.track_id) || [];
    list.push(m);
    modulesByTrack.set(m.track_id, list as NonNullable<typeof modules>);
  }
  const progressSet = new Set((progress ?? []).map((p) => `${p.user_id}:${p.module_id}`));
  const passSet = new Set((passes ?? []).map((p) => `${p.user_id}:${p.quiz_id}`));
  const photoQuizzesByRestaurant = new Map<string, string[]>();
  for (const q of photoQuizzes ?? []) {
    if (!q.restaurant_id) continue;
    const list = photoQuizzesByRestaurant.get(q.restaurant_id) || [];
    list.push(q.id);
    photoQuizzesByRestaurant.set(q.restaurant_id, list);
  }
  const overrideSet = new Set((overrides ?? []).map((o) => o.user_id));

  const result = (staff ?? []).map((p) => {
    const category = p.onboarding_category || null;
    const slug = p.position_slug || null;

    // Mirror of the path route's resolution.
    const mine = (tracks ?? []).filter((t) => {
      if (t.restaurant_id && p.restaurant_id && t.restaurant_id !== p.restaurant_id) return false;
      const audience = t.applies_to === 'all' || (category !== null && t.applies_to === category);
      if (t.level === 'foundations' || t.level === 'ongoing') return true;
      if (t.level === 'department') return audience;
      if (t.level === 'position') return !!slug && t.position_slugs.includes(slug);
      if (t.level === 'certification') {
        if (!audience) return false;
        if (t.position_slugs.length > 0 && (!slug || !t.position_slugs.includes(slug))) return false;
        return true;
      }
      return false;
    });
    const positionTracks = mine.filter((t) => t.level === 'position');
    const hasSpecific = positionTracks.some((t) => t.restaurant_id !== null);
    const resolved = mine.filter((t) => t.level !== 'position' || !hasSpecific || t.restaurant_id !== null);

    let total = 0;
    let done = 0;
    const photoIds = p.restaurant_id ? photoQuizzesByRestaurant.get(p.restaurant_id) || [] : [];
    const photoPassed = photoIds.some((qid) => passSet.has(`${p.id}:${qid}`));
    for (const t of resolved) {
      for (const m of modulesByTrack.get(t.id) || []) {
        total++;
        const isDone =
          m.module_type === 'quiz' ? passSet.has(`${p.id}:${m.ref_id}`) :
          m.module_type === 'photo_test' ? photoPassed :
          progressSet.has(`${p.id}:${m.id}`);
        if (isDone) done++;
      }
    }
    const completedAll = total > 0 && done === total;
    const hasOverride = overrideSet.has(p.id);

    return {
      id: p.id,
      full_name: p.full_name,
      position_slug: p.position_slug,
      onboarding_category: p.onboarding_category,
      role: p.role,
      restaurant_name: (p.restaurants as unknown as { name: string } | null)?.name || null,
      required_total: total,
      required_done: done,
      pct: total === 0 ? 0 : Math.round((done / total) * 100),
      floor_ready: completedAll || hasOverride,
      floor_ready_via: completedAll ? 'completed' : hasOverride ? 'override' : null,
    };
  });

  return NextResponse.json({ staff: result });
}
