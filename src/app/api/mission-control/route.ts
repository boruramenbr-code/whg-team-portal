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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0];
  const sevenFromNow = new Date(today);
  sevenFromNow.setDate(today.getDate() + 7);
  const sevenFromNowISO = sevenFromNow.toISOString().split('T')[0];
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ── Fire all independent queries in parallel ────────────────────────────
  // Previously these ran serially → 9 round-trips. Now 1 round-trip in wall time.
  const restaurantIds = Array.from(allowedRestaurantIds);

  let staffQ = adminClient
    .from('profiles')
    .select('id, full_name, restaurant_id, requires_bar_card, hire_date, date_of_birth, restaurants(name), bar_cards!profile_id(id, expiration_date, archived)')
    .eq('status', 'active');
  if (!isAdmin) staffQ = staffQ.in('restaurant_id', restaurantIds);

  let restaurantsQ = adminClient.from('restaurants').select('id, name').eq('is_active', true);
  if (!isAdmin) restaurantsQ = restaurantsQ.in('id', restaurantIds);

  let newHiresQ = adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', fourteenDaysAgo.toISOString());
  if (!isAdmin) newHiresQ = newHiresQ.in('restaurant_id', restaurantIds);

  let archivedQ = adminClient
    .from('profiles')
    .select('id, full_name, restaurant_id, updated_at, restaurants(name)')
    .eq('status', 'archived')
    .gte('updated_at', thirtyDaysAgo.toISOString())
    .order('updated_at', { ascending: false });
  if (!isAdmin) archivedQ = archivedQ.in('restaurant_id', restaurantIds);

  let preshiftNotesQ = adminClient
    .from('preshift_notes')
    .select('restaurant_id, eighty_sixed, restaurants(name)')
    .eq('shift_date', todayISO);
  if (!isAdmin) preshiftNotesQ = preshiftNotesQ.in('restaurant_id', restaurantIds);

  const [
    staffRes,
    restaurantsRes,
    newHiresRes,
    archivedRes,
    preshiftRes,
    ownerMsgRes,
    upcomingHolidaysRes,
    activePoliciesRes,
    signaturesRes,
  ] = await Promise.all([
    staffQ,
    restaurantsQ,
    newHiresQ,
    archivedQ,
    preshiftNotesQ,
    supabase
      .from('owner_messages')
      .select('id, message, start_date, end_date, audience')
      .eq('is_active', true)
      .in('audience', ['managers', 'both'])
      .lte('start_date', todayISO)
      .gte('end_date', todayISO)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient
      .from('holidays')
      .select('id, start_date, end_date, name, type, restaurant_id')
      .lte('start_date', sevenFromNowISO)
      .gte('end_date', todayISO)
      .order('start_date', { ascending: true }),
    adminClient.from('policies').select('id, version, role_required').eq('active', true),
    adminClient.from('policy_signatures').select('user_id, policy_id, policy_version'),
  ]);

  const staff = staffRes.data;
  const scopedRestaurants = restaurantsRes.data;
  const newHiresCount = newHiresRes.count;
  const archivedRows = archivedRes.data;
  const todaysNoteRows = preshiftRes.data;
  const ownerMsg = ownerMsgRes.data;
  const upcomingHolidays = upcomingHolidaysRes.data;
  const activePolicies = activePoliciesRes.data;
  const signatures = signaturesRes.data;

  const expired: BarCardAlertItem[] = [];
  const critical: BarCardAlertItem[] = [];
  const expiring: BarCardAlertItem[] = [];
  const upcoming: BarCardAlertItem[] = [];      // 31–90 days, info-level look-ahead
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
    else if (days <= 90) upcoming.push(item);
    // valid (>90 days) — not surfaced in alerts
  }

  // Sort: most-expired first, then soonest-expiring, etc.
  expired.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  critical.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  expiring.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  upcoming.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  missing.sort((a, b) => a.full_name.localeCompare(b.full_name));

  // ── Quick stats ───────────────────────────────────────────────────────────
  const activeStaffCount = (staff || []).length;

  // ── Holidays already filtered to scope ──────────────────────────────────
  const filteredHolidays = (upcomingHolidays || []).filter((h) => {
    if (isAdmin) return true;
    if (!h.restaurant_id) return true; // company-wide
    return allowedRestaurantIds.has(h.restaurant_id);
  });

  // ── Policy signature compliance ──────────────────────────────────────────
  // For each active staff at scoped restaurants, count active policies they
  // haven't signed yet (matching current version). role_required determines
  // applicability:
  //   'all'      → applies to everyone
  //   'employee' → only employees
  //   'manager'  → manager / asst_manager / admin


  // Build signature lookup: user_id -> Set of "policy_id::version"
  const signedByUser = new Map<string, Set<string>>();
  for (const sig of signatures || []) {
    const set = signedByUser.get(sig.user_id) || new Set<string>();
    set.add(`${sig.policy_id}::${sig.policy_version}`);
    signedByUser.set(sig.user_id, set);
  }

  const policyCompliance: { profile_id: string; full_name: string; restaurant_name: string; unsigned_count: number }[] = [];
  for (const s of staff || []) {
    const userRole = (s as { role?: string }).role || 'employee';
    const applicable = (activePolicies || []).filter((p) => {
      if (p.role_required === 'all') return true;
      if (p.role_required === 'employee') return userRole === 'employee';
      if (p.role_required === 'manager') return ['manager', 'assistant_manager', 'admin'].includes(userRole);
      return false;
    });
    const userSigned = signedByUser.get(s.id) || new Set<string>();
    const unsigned = applicable.filter((p) => !userSigned.has(`${p.id}::${p.version}`));
    if (unsigned.length > 0) {
      policyCompliance.push({
        profile_id: s.id,
        full_name: s.full_name,
        restaurant_name: (s.restaurants as { name?: string } | null)?.name || '',
        unsigned_count: unsigned.length,
      });
    }
  }
  policyCompliance.sort((a, b) => b.unsigned_count - a.unsigned_count || a.full_name.localeCompare(b.full_name));

  // ── Today's pre-shift status (per restaurant in scope) ───────────────────
  // Flag any restaurant where today's preshift_note hasn't been posted.
  // Both queries (scopedRestaurants, todaysNoteRows) ran in the parallel batch.
  const restaurantsWithNote = new Set((todaysNoteRows || []).map((n) => n.restaurant_id));

  const missingPreshift = (scopedRestaurants || [])
    .filter((r) => !restaurantsWithNote.has(r.id))
    .map((r) => ({ restaurant_id: r.id, restaurant_name: r.name }));

  // ── Anniversaries this week ──────────────────────────────────────────────
  // Staff whose hire_date anniversary falls in the next 7 days. Excludes
  // anyone with a NULL hire_date (bulk-imported staff who haven't been
  // backfilled). Excludes <1-year tenures.
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);

  type AnniversaryItem = {
    profile_id: string;
    full_name: string;
    restaurant_name: string;
    days_until: number;
    years: number;
    hire_date: string;
  };
  const anniversaries: AnniversaryItem[] = [];

  for (const s of staff || []) {
    const hireDateStr = (s as { hire_date?: string | null }).hire_date;
    if (!hireDateStr) continue;
    const hired = new Date(hireDateStr + 'T00:00:00');
    if (isNaN(hired.getTime())) continue;
    const hiredMonth = hired.getMonth();
    const hiredDay = hired.getDate();

    // Find next anniversary occurrence
    let nextAnniv = new Date(today.getFullYear(), hiredMonth, hiredDay);
    if (nextAnniv < today) {
      nextAnniv = new Date(today.getFullYear() + 1, hiredMonth, hiredDay);
    }
    const days = Math.round((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 6) continue;
    const years = nextAnniv.getFullYear() - hired.getFullYear();
    if (years < 1) continue; // not yet 1 year

    anniversaries.push({
      profile_id: s.id,
      full_name: s.full_name,
      restaurant_name: (s.restaurants as { name?: string } | null)?.name || '',
      days_until: days,
      years,
      hire_date: hireDateStr,
    });
  }
  anniversaries.sort((a, b) => a.days_until - b.days_until);

  // ── Welcome spotlight ending soon (welcome_until in next 7 days) ─────────
  type WelcomeEndingItem = { profile_id: string; full_name: string; restaurant_name: string; days_until: number };
  const welcomeEndingSoon: WelcomeEndingItem[] = [];
  for (const s of staff || []) {
    const wu = (s as { welcome_until?: string | null }).welcome_until;
    if (!wu) continue;
    const wuDate = new Date(wu + 'T00:00:00');
    const days = Math.round((wuDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0 || days > 7) continue;
    welcomeEndingSoon.push({
      profile_id: s.id,
      full_name: s.full_name,
      restaurant_name: (s.restaurants as { name?: string } | null)?.name || '',
      days_until: days,
    });
  }
  welcomeEndingSoon.sort((a, b) => a.days_until - b.days_until);

  // ── Stale 86 items (carried over from prior days, still on today's list) ─
  // Reuses todaysNoteRows already fetched in the parallel batch above.
  type Stale86Item = { restaurant_id: string; restaurant_name: string; items: string[]; count: number };
  const stale86: Stale86Item[] = [];
  for (const note of todaysNoteRows || []) {
    const eightySixed = (note.eighty_sixed as { text: string; at: string }[] | null) || [];
    const staleItems = eightySixed.filter((it) => {
      if (!it.at) return false;
      const itemDate = new Date(it.at);
      return itemDate < today;
    });
    if (staleItems.length > 0) {
      stale86.push({
        restaurant_id: note.restaurant_id,
        restaurant_name: (note.restaurants as { name?: string } | null)?.name || '',
        items: staleItems.slice(0, 5).map((it) => it.text),
        count: staleItems.length,
      });
    }
  }

  // ── Recently archived staff (last 30 days) ───────────────────────────────
  // Reuses archivedRows already fetched in the parallel batch above.
  type ArchivedItem = { profile_id: string; full_name: string; restaurant_name: string; archived_at: string };
  const recentlyArchived: ArchivedItem[] = (archivedRows || []).map((p) => ({
    profile_id: p.id,
    full_name: p.full_name,
    restaurant_name: (p.restaurants as { name?: string } | null)?.name || '',
    archived_at: p.updated_at,
  }));

  // ── Today's recognition (birthdays + anniversaries TODAY) ────────────────
  // Surfaced separately so manager gets a celebratory prompt at the top of
  // the dashboard. Today's anniversaries are removed from the "this week"
  // card to avoid double-display.
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const birthdaysToday = (staff || [])
    .filter((s) => {
      const dob = (s as { date_of_birth?: string | null }).date_of_birth;
      if (!dob) return false;
      const d = new Date(dob + 'T00:00:00');
      return d.getMonth() === todayMonth && d.getDate() === todayDay;
    })
    .map((s) => ({
      profile_id: s.id,
      full_name: s.full_name,
      restaurant_name: (s.restaurants as { name?: string } | null)?.name || '',
    }));

  const anniversariesToday = anniversaries.filter((a) => a.days_until === 0);
  // Filter out today from the weekly card (the new Today's Recognition card surfaces them)
  const anniversariesUpcoming = anniversaries.filter((a) => a.days_until > 0);

  return NextResponse.json(
    {
      bar_cards: {
        expired,
        critical,
        expiring,
        upcoming,
        missing,
      },
      owner_message: ownerMsg || null,
      stats: {
        active_staff: activeStaffCount,
        new_hires_two_weeks: newHiresCount ?? 0,
        holidays_next_7_days: filteredHolidays.length,
      },
      holidays_upcoming: filteredHolidays,
      policy_compliance: policyCompliance,
      missing_preshift: missingPreshift,
      anniversaries: anniversariesUpcoming,
      recognition_today: {
        birthdays: birthdaysToday,
        anniversaries: anniversariesToday,
      },
      welcome_ending_soon: welcomeEndingSoon,
      stale_86: stale86,
      recently_archived: recentlyArchived,
      is_admin: isAdmin,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
