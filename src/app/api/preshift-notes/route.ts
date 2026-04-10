import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MANAGER_ROLES = ['manager', 'assistant_manager', 'admin'];

/**
 * GET /api/preshift-notes?date=YYYY-MM-DD&restaurant_id=UUID
 * Returns today's (or specified date's) pre-shift note.
 * - Admins can pass restaurant_id to view any restaurant's note.
 * - Everyone else sees their own restaurant's note only.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const dateParam = req.nextUrl.searchParams.get('date');
  const restaurantIdParam = req.nextUrl.searchParams.get('restaurant_id');
  const targetDate = dateParam || new Date().toISOString().split('T')[0];

  // Admins may request any restaurant; others are locked to their own.
  const targetRestaurantId =
    profile.role === 'admin' && restaurantIdParam
      ? restaurantIdParam
      : profile.restaurant_id;

  const { data: noteSimple } = await supabase
    .from('preshift_notes')
    .select('*')
    .eq('restaurant_id', targetRestaurantId)
    .eq('shift_date', targetDate)
    .eq('is_active', true)
    .maybeSingle();

  // Resolve creator name separately so an FK-name mismatch doesn't fail the whole fetch
  let creatorName: string | null = null;
  if (noteSimple?.created_by) {
    const { data: creator } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', noteSimple.created_by)
      .maybeSingle();
    creatorName = creator?.full_name || null;
  }

  return NextResponse.json({
    note: noteSimple ? { ...noteSimple, creator_name: creatorName } : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * POST /api/preshift-notes
 * Create or update a pre-shift note. Managers+ only.
 * - Admins can pass restaurantId in body to post for any restaurant.
 * - Managers/assistant managers are locked to their own restaurant.
 * Uses upsert on (restaurant_id, shift_date).
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can post pre-shift notes' }, { status: 403 });
  }

  const body = await req.json();
  const { message, specials, eightySixed, focusItems, shiftDate, restaurantId } = body;

  const targetDate = shiftDate || new Date().toISOString().split('T')[0];

  // Admins may specify any restaurant; others are locked.
  const targetRestaurantId =
    profile.role === 'admin' && restaurantId ? restaurantId : profile.restaurant_id;

  if (!targetRestaurantId) {
    return NextResponse.json({ error: 'Restaurant is required' }, { status: 400 });
  }

  const hasContent =
    message?.trim() ||
    (specials?.length > 0 && specials.some((s: string) => s.trim())) ||
    (eightySixed?.length > 0 && eightySixed.some((s: string) => s.trim())) ||
    (focusItems?.length > 0 && focusItems.some((s: string) => s.trim()));

  if (!hasContent) {
    return NextResponse.json({ error: 'Note must have at least one field filled out' }, { status: 400 });
  }

  const cleanArray = (arr: string[] | undefined) =>
    (arr || []).map((s: string) => s.trim()).filter(Boolean);

  const noteData = {
    restaurant_id: targetRestaurantId,
    created_by: user.id,
    shift_date: targetDate,
    message: message?.trim() || null,
    specials: cleanArray(specials),
    eighty_sixed: cleanArray(eightySixed),
    focus_items: cleanArray(focusItems),
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
