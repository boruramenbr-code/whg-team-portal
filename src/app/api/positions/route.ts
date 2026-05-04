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
 * GET /api/positions
 *
 * Returns the active position catalog SCOPED to the caller's restaurant.
 *
 * Visibility rule: a position appears for a given restaurant only if a
 * row exists in position_descriptions for (position_id, restaurant_id).
 * Boru staff don't see Sushi Chef and vice versa.
 *
 * Returned `description` is the per-restaurant override.
 *
 * Restaurant switcher:
 *   • Admins can pass ?restaurant_id=<uuid> to view any restaurant.
 *   • Multi-location managers can pass it for any restaurant in their
 *     assigned set (profile.restaurant_id + user_locations).
 *   • Regular staff are locked to their primary restaurant.
 *
 * Response also includes `available_restaurants` so the UI can render a
 * picker — populated only for users with access to more than one restaurant.
 *
 * Pay rates are NOT included — they live in /api/pay-rates (manager-only).
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const queryRestaurant = url.searchParams.get('restaurant_id');

  // Resolve user's role + primary restaurant + extra locations
  const { data: me } = await supabase
    .from('profiles')
    .select('role, restaurant_id, status')
    .eq('id', user.id)
    .single();

  if (!me || me.status === 'archived') {
    return NextResponse.json({ positions: [], restaurant_id: null });
  }

  const isAdmin = me.role === 'admin';

  const { data: extraLocs } = await supabase
    .from('user_locations')
    .select('restaurant_id')
    .eq('profile_id', user.id);

  const userRestaurantIds = new Set<string>([
    ...(me.restaurant_id ? [me.restaurant_id] : []),
    ...((extraLocs || []).map((l) => l.restaurant_id)),
  ]);

  // Build the list of restaurants this user can switch to.
  //   • Admin → all active restaurants
  //   • Multi-location user → their primary + extras
  //   • Single-location user → empty (no picker shown)
  const adminClient = getAdminClient();
  let availableRestaurants: { id: string; name: string }[] = [];
  if (isAdmin) {
    const { data } = await adminClient
      .from('restaurants')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true });
    availableRestaurants = data || [];
  } else if (userRestaurantIds.size > 1) {
    const { data } = await adminClient
      .from('restaurants')
      .select('id, name')
      .in('id', Array.from(userRestaurantIds))
      .eq('is_active', true)
      .order('name', { ascending: true });
    availableRestaurants = data || [];
  }

  // Resolve effective restaurant_id (with access validation)
  let effectiveRestaurantId: string | null = me.restaurant_id || null;

  if (queryRestaurant) {
    const allowed = isAdmin || userRestaurantIds.has(queryRestaurant);
    if (!allowed) {
      return NextResponse.json(
        { error: 'You do not have access to this restaurant' },
        { status: 403 }
      );
    }
    effectiveRestaurantId = queryRestaurant;
  }

  if (!effectiveRestaurantId) {
    // No restaurant context (shouldn't happen for active staff, but handle it)
    return NextResponse.json({
      positions: [],
      restaurant_id: null,
      available_restaurants: availableRestaurants,
    });
  }

  // Fetch positions joined with their per-restaurant description.
  // Inner-join semantics: only positions with a description for this
  // restaurant are returned.
  const { data, error } = await supabase
    .from('positions')
    .select(`
      id, slug, name, emoji, department, sort_order,
      position_descriptions!inner(description, restaurant_id)
    `)
    .eq('active', true)
    .eq('position_descriptions.restaurant_id', effectiveRestaurantId)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    department: string;
    sort_order: number;
    position_descriptions: { description: string; restaurant_id: string }[];
  };

  const positions = (data as unknown as Row[] | null || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    emoji: p.emoji,
    department: p.department,
    sort_order: p.sort_order,
    description: p.position_descriptions?.[0]?.description || null,
  }));

  return NextResponse.json({
    positions,
    restaurant_id: effectiveRestaurantId,
    available_restaurants: availableRestaurants,
  });
}
