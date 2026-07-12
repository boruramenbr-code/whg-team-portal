import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

/**
 * GET /api/training/path/users
 * Manager+ staff list for the Training Progress board — active staff at
 * the manager's accessible restaurants with position info. Progress
 * detail loads per-person via /api/training/path?user_id=…
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
  let restaurantIds: string[] | null = null; // null = all
  if (me.role !== 'admin') {
    const { data: extras } = await supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id);
    restaurantIds = [me.restaurant_id, ...(extras || []).map((e) => e.restaurant_id)].filter(Boolean) as string[];
  }

  let query = adminClient
    .from('profiles')
    .select('id, full_name, position_slug, onboarding_category, role, restaurant_id, restaurants(name)')
    .neq('status', 'archived')
    .order('full_name');
  if (restaurantIds) query = query.in('restaurant_id', restaurantIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const staff = (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    position_slug: p.position_slug,
    onboarding_category: p.onboarding_category,
    role: p.role,
    restaurant_name: (p.restaurants as unknown as { name: string } | null)?.name || null,
  }));

  return NextResponse.json({ staff });
}
