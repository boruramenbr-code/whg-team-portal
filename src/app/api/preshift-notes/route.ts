import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { todayInCentralTime } from '@/lib/dates';
import { pingLastSeen } from '@/lib/last-seen';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MANAGER_ROLES = ['manager', 'assistant_manager', 'admin'];

interface TaggedItem {
  id: string;
  text: string;
  by: string | null;
  at: string;
}

function computeInitials(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3);
}


/**
 * Normalize and tag incoming items.
 * - Existing items (with an id) keep their original `by` tag.
 * - New items (no id) are tagged with the current user's initials.
 */
function normalizeItems(
  rawItems: unknown,
  currentUserInitials: string
): TaggedItem[] {
  if (!Array.isArray(rawItems)) return [];
  const now = new Date().toISOString();

  return rawItems
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw as Partial<TaggedItem>;
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) return null;

      // Existing item: keep id, by, at
      if (item.id && item.by !== undefined) {
        return {
          id: item.id,
          text,
          by: item.by || null,
          at: item.at || now,
        } satisfies TaggedItem;
      }

      // New item: tag with current user
      return {
        id: randomUUID(),
        text,
        by: currentUserInitials || null,
        at: now,
      } satisfies TaggedItem;
    })
    .filter((i): i is TaggedItem => i !== null);
}

/**
 * GET /api/preshift-notes?date=YYYY-MM-DD&restaurant_id=UUID
 * - Admins can pass restaurant_id to view any restaurant's note.
 * - Everyone else sees their own restaurant's note only.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Adoption tracker: stamp last_seen_at on every authenticated read.
  pingLastSeen(user.id);

  // Profile + extra locations + all restaurants — fire in parallel.
  // We don't yet know if the user is admin, so we speculatively fetch
  // every active restaurant; non-admins simply filter the list down later.
  const [profileRes, extraLocsRes, allRestaurantsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('restaurant_id, role, status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_locations')
      .select('restaurant_id')
      .eq('profile_id', user.id),
    supabase
      .from('restaurants')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  const profile = profileRes.data;
  const extraLocs = extraLocsRes.data;

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.status === 'archived') return NextResponse.json({ error: 'Account inactive' }, { status: 403 });

  const dateParam = req.nextUrl.searchParams.get('date');
  const restaurantIdParam = req.nextUrl.searchParams.get('restaurant_id');
  const targetDate = dateParam || todayInCentralTime();

  const userRestaurantIds = new Set<string>([
    ...(profile.restaurant_id ? [profile.restaurant_id] : []),
    ...((extraLocs || []).map((l) => l.restaurant_id)),
  ]);

  const isAdmin = profile.role === 'admin';

  // Admins can view any restaurant; managers can view their assigned locations
  let targetRestaurantId = profile.restaurant_id;
  if (restaurantIdParam) {
    if (isAdmin) {
      targetRestaurantId = restaurantIdParam;
    } else if (userRestaurantIds.has(restaurantIdParam)) {
      targetRestaurantId = restaurantIdParam;
    }
  }

  // Build the picker list from already-fetched all-restaurants data.
  let availableRestaurants: { id: string; name: string }[] = [];
  const allRestaurants = allRestaurantsRes.data || [];
  if (isAdmin) {
    availableRestaurants = allRestaurants;
  } else if (userRestaurantIds.size > 1) {
    availableRestaurants = allRestaurants.filter((r) => userRestaurantIds.has(r.id));
  }

  // Fetch the note + creator name in a single query via FK join.
  // Saves a separate round-trip to profiles after the note loads.
  const { data: noteJoined } = await supabase
    .from('preshift_notes')
    .select('*, creator:profiles!created_by(full_name)')
    .eq('restaurant_id', targetRestaurantId)
    .eq('shift_date', targetDate)
    .eq('is_active', true)
    .maybeSingle();

  let creatorName: string | null = null;
  let noteSimple: Record<string, unknown> | null = null;
  if (noteJoined) {
    type NoteRow = Record<string, unknown> & { creator?: { full_name?: string | null } | null };
    const { creator, ...rest } = noteJoined as NoteRow;
    creatorName = creator?.full_name || null;
    noteSimple = rest;
  }

  return NextResponse.json(
    {
      note: noteSimple ? { ...noteSimple, creator_name: creatorName } : null,
      active_restaurant_id: targetRestaurantId,
      shift_date: targetDate,
      available_restaurants: availableRestaurants,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * POST /api/preshift-notes
 * Create or update a pre-shift note. Managers+ only.
 * - Admins can pass restaurantId in body to post for any restaurant.
 * - Items keep their original author tags; only new items are tagged with current user.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role, full_name, status')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.status === 'archived') return NextResponse.json({ error: 'Account inactive' }, { status: 403 });

  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can post pre-shift notes' }, { status: 403 });
  }

  const body = await req.json();
  const { message, specials, eightySixed, focusItems, shiftDate, restaurantId } = body;

  const targetDate = shiftDate || todayInCentralTime();
  const targetRestaurantId =
    profile.role === 'admin' && restaurantId ? restaurantId : profile.restaurant_id;

  if (!targetRestaurantId) {
    return NextResponse.json({ error: 'Restaurant is required' }, { status: 400 });
  }

  const initials = computeInitials(profile.full_name);
  const cleanSpecials = normalizeItems(specials, initials);
  const cleanEightySixed = normalizeItems(eightySixed, initials);
  const cleanFocusItems = normalizeItems(focusItems, initials);

  const hasContent =
    message?.trim() ||
    cleanSpecials.length > 0 ||
    cleanEightySixed.length > 0 ||
    cleanFocusItems.length > 0;

  if (!hasContent) {
    return NextResponse.json({ error: 'Note must have at least one field filled out' }, { status: 400 });
  }

  const noteData = {
    restaurant_id: targetRestaurantId,
    created_by: user.id,
    shift_date: targetDate,
    message: message?.trim() || null,
    specials: cleanSpecials,
    eighty_sixed: cleanEightySixed,
    focus_items: cleanFocusItems,
    is_active: true,
  };

  const { data: note, error } = await supabase
    .from('preshift_notes')
    .upsert(noteData, { onConflict: 'restaurant_id,shift_date' })
    .select()
    .single();

  if (error) {
    console.error('Failed to save pre-shift note:', error.message);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }

  return NextResponse.json({ note });
}
