import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MANAGER_ROLES = ['admin', 'manager', 'assistant_manager'];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface BarCardAlertItem {
  profile_id: string | null;
  full_name: string;
  restaurant_id: string;
  restaurant_name: string;
  expiration_date: string | null;
  days: number | null;     // negative = expired N days ago, positive = N days remaining
}

/**
 * GET /api/mission-control
 *
 * Aggregator endpoint for the manager dashboard. Returns alerts + key stats
 * scoped to the user's role:
 *   - admin: data across all restaurants
 *   - manager / asst_manager: data for their primary restaurant + multi-loc assignments
 *
 * Sections returned:
 *   bar_cards.expired   — cards past their expiration
 *   bar_cards.critical  — 0-7 days from expiration
 *   bar_cards.expiring  — 8-30 days from expiration
 *   bar_cards.missing   — staff flagged requires_bar_card with no card on file
 *   owner_message       — current active message
 *   stats               — counts useful at-a-glance
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

  // Build the set of restaurants this user can see
  const { data: extraLocs } = await supabase
    .from('user_locations')
    .select('restaurant_id')
    .eq('profile_id', user.id);

  const isAdmin = me.role === 'admin';
  const allowedRestaurantIds = new Set<string>([
    ...(me.restaurant_id ? [me.restaurant_id] : []),
    ...((extraLocs || []).map((l) => l.restaurant_id)),
  ]);

  const adminClient = getAdminClient();

  // ── Active staff (with bar card requirement + linked cards) ──────────────
  let staffQuery = adminClient
    .from('profiles')
    .select('id, full_name, restaurant_id, requires_bar_card, restaurants(name), bar_cards!profile_id(id, expiration_date, archived)')
    .eq('status', 'active');

  if (!isAdmin) {
    staffQuery = staffQuery.in('restaurant_id', Array.from(allowedRestaurantIds));
  }

  const { data: staff } = await staffQuery;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expired: BarCardAlertItem[] = [];
  const critical: BarCardAlertItem[] = [];
  const expiring: BarCardAlertItem[] = [];
  const missing: BarCardAlertItem[] = [];

  for (const s of staff || []) {
    if (!s.requires_bar_card) continue;

    const restaurantName = (s.restaurants as { name?: string } | null)?.name || '';

    // Most recent non-archived card
    type CardLite = { id: string; expiration_date: string; archived: boolean };
    const activeCards = ((s.bar_cards || []) as CardLite[]).filter((c) => !c.archived);
    const latest: CardLite | null = activeCards.length > 0
      ? activeCards.reduce((a, b) => (a.expiration_date > b.expiration_date ? a : b))
      : null;

    if (!latest) {
      missing.push({
        profile_id: s.id,
        full_name: s.full_name,
        restaurant_id: s.restaurant_id,
        restaurant_name: restaurantName,
        expiration_date: null,
        days: null,
      });
      continue;
    }

    const exp = new Date(latest.expiration_date + 'T00:00:00');
    const days = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const item: BarCardAlertItem = {
      profile_id: s.id,
      full_name: s.full_name,
      restaurant_id: s.restaurant_id,
      restaurant_name: restaurantName,
      expiration_date: latest.expiration_date,
      days,
    };

    if (days < 0) expired.push(item);
    else if (days <= 7) critical.push(item);
    else if (days <= 30) expiring.push(item);
    // valid (>30 days) — not surfaced in alerts
  }

  // Sort: most-expired first, then soonest-expiring, etc.
  expired.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  critical.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  expiring.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  missing.sort((a, b) => a.full_name.localeCompare(b.full_name));

  // ── Latest active owner message ──────────────────────────────────────────
  const todayISO = today.toISOString().split('T')[0];
  const { data: ownerMsg } = await supabase
    .from('owner_messages')
    .select('id, message, start_date, end_date')
    .eq('is_active', true)
    .lte('start_date', todayISO)
    .gte('end_date', todayISO)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Quick stats ───────────────────────────────────────────────────────────
  const activeStaffCount = (staff || []).length;

  // New hires (profiles created in last 14 days, scoped)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  let newHiresQuery = adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', fourteenDaysAgo.toISOString());
  if (!isAdmin) {
    newHiresQuery = newHiresQuery.in('restaurant_id', Array.from(allowedRestaurantIds));
  }
  const { count: newHiresCount } = await newHiresQuery;

  // Holidays in next 7 days
  const sevenFromNow = new Date(today);
  sevenFromNow.setDate(today.getDate() + 7);
  const { data: upcomingHolidays } = await adminClient
    .from('holidays')
    .select('id, date, name, type, restaurant_id')
    .gte('date', todayISO)
    .lte('date', sevenFromNow.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const filteredHolidays = (upcomingHolidays || []).filter((h) => {
    if (isAdmin) return true;
    if (!h.restaurant_id) return true; // company-wide
    return allowedRestaurantIds.has(h.restaurant_id);
  });

  return NextResponse.json(
    {
      bar_cards: {
        expired,
        critical,
        expiring,
        missing,
      },
      owner_message: ownerMsg || null,
      stats: {
        active_staff: activeStaffCount,
        new_hires_two_weeks: newHiresCount ?? 0,
        holidays_next_7_days: filteredHolidays.length,
      },
      holidays_upcoming: filteredHolidays,
      is_admin: isAdmin,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
