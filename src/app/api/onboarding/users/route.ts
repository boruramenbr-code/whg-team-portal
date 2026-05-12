import { NextRequest, NextResponse } from 'next/server';
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
 * GET /api/onboarding/users
 *
 * Manager-only. Returns the list of "actively onboarding" hires plus a
 * summary of each one's progress so the admin dashboard can show a
 * "who's stuck where" view.
 *
 * Query params:
 *   • restaurantId — filter to one restaurant; "all" or missing = all the
 *     manager has access to.
 *   • status — "in_progress" (default) returns only hires whose progress
 *     is < 100%; "all" returns everyone with onboarding rows.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const restaurantId = url.searchParams.get('restaurantId');
  const statusFilter = url.searchParams.get('status') ?? 'in_progress';

  const admin = getAdminClient();

  // Parallelize auth checks: profile + user_locations + all-restaurants list (admin path).
  // All three are independent of each other.
  const [profileRes, extraLocsRes, allRestaurantsRes] = await Promise.all([
    supabase.from('profiles').select('id, role, restaurant_id').eq('id', user.id).single(),
    // user_locations is keyed by profile_id (not user_id — see migration 012/013).
    admin.from('user_locations').select('restaurant_id').eq('profile_id', user.id),
    admin.from('restaurants').select('id'),
  ]);

  const profile = profileRes.data;
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (!['manager', 'assistant_manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Find restaurants the manager has access to.
  const allowedRestaurantIds: string[] = [];
  if (profile.role === 'admin') {
    allowedRestaurantIds.push(...(allRestaurantsRes.data ?? []).map((r) => (r as { id: string }).id));
  } else {
    if (profile.restaurant_id) allowedRestaurantIds.push(profile.restaurant_id);
    for (const row of extraLocsRes.data ?? []) {
      const rid = (row as { restaurant_id: string }).restaurant_id;
      if (rid && !allowedRestaurantIds.includes(rid)) allowedRestaurantIds.push(rid);
    }
  }

  // Active hires = profiles with welcome_until in the future OR hire_date in the last 90 days.
  // We err on the inclusive side so managers can also drill in to anyone they want.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  let q = admin
    .from('profiles')
    .select('id, full_name, restaurant_id, role, status, hire_date, welcome_until, onboarding_category, restaurants(id, name)')
    .eq('status', 'active')
    .in('restaurant_id', allowedRestaurantIds.length ? allowedRestaurantIds : ['00000000-0000-0000-0000-000000000000']);

  // Filter to those in onboarding window
  q = q.or(`welcome_until.gte.${new Date().toISOString().slice(0, 10)},hire_date.gte.${cutoffIso}`);

  if (restaurantId && restaurantId !== 'all') {
    q = q.eq('restaurant_id', restaurantId);
  }

  q = q.order('hire_date', { ascending: false, nullsFirst: false });

  // Fetch hires and the restaurants list for the filter chips in parallel.
  const [hiresRes, restaurantsRes] = await Promise.all([
    q,
    admin
      .from('restaurants')
      .select('id, name')
      .in('id', allowedRestaurantIds.length ? allowedRestaurantIds : ['00000000-0000-0000-0000-000000000000'])
      .order('name'),
  ]);
  const { data: hires } = hiresRes;
  // Supabase typegen returns embedded "restaurants" join as an array — normalize.
  const hireRows = ((hires ?? []) as unknown as Array<{
    id: string;
    full_name: string;
    restaurant_id: string | null;
    role: string;
    hire_date: string | null;
    welcome_until: string | null;
    onboarding_category: string | null;
    restaurants: { id: string; name: string } | { id: string; name: string }[] | null;
  }>).map((h) => ({
    ...h,
    restaurants: Array.isArray(h.restaurants) ? (h.restaurants[0] ?? null) : h.restaurants,
  }));

  // Compute progress for each in parallel (small set — fine to fan out)
  const results = await Promise.all(
    hireRows.map(async (h) => {
      const data = await getOnboardingForUser(admin, h.id);
      if (!data) return null;
      return {
        user_id: h.id,
        full_name: h.full_name,
        restaurant_id: h.restaurant_id,
        restaurant_name: h.restaurants?.name ?? null,
        onboarding_category: h.onboarding_category,
        hire_date: h.hire_date,
        welcome_until: h.welcome_until,
        progress: data.progress,
      };
    })
  );

  let cleaned = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (statusFilter === 'in_progress') {
    cleaned = cleaned.filter((r) => r.progress.pct_complete < 100);
  }

  return NextResponse.json({
    hires: cleaned,
    available_restaurants: restaurantsRes.data ?? [],
  });
}
