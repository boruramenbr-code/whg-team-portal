import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/preshift-notes?date=YYYY-MM-DD
 * Returns today's (or specified date's) pre-shift note for the user's restaurant.
 * All authenticated users can read.
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
  const targetDate = dateParam || new Date().toISOString().split('T')[0];

  const { data: note, error } = await supabase
    .from('preshift_notes')
    .select('*, profiles!preshift_notes_created_by_fkey(full_name)')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('shift_date', targetDate)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    // If the join fails (FK name mismatch), try without join
    const { data: noteSimple } = await supabase
      .from('preshift_notes')
      .select('*')
      .eq('restaurant_id', profile.restaurant_id)
      .eq('shift_date', targetDate)
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({ note: noteSimple || null });
  }

  return NextResponse.json({ note: note || null });
}

/**
 * POST /api/preshift-notes
 * Create or update today's pre-shift note. Managers+ only.
 * Uses upsert on (restaurant_id, shift_date) unique constraint.
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

  const MANAGER_ROLES = ['manager', 'assistant_manager', 'admin'];
  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can post pre-shift notes' }, { status: 403 });
  }

  const body = await req.json();
  const { message, specials, eightySixed, focusItems, shiftDate } = body;

  const targetDate = shiftDate || new Date().toISOString().split('T')[0];

  // Validate: at least one field must have content
  const hasContent = message?.trim() ||
    (specials?.length > 0 && specials.some((s: string) => s.trim())) ||
    (eightySixed?.length > 0 && eightySixed.some((s: string) => s.trim())) ||
    (focusItems?.length > 0 && focusItems.some((s: string) => s.trim()));

  if (!hasContent) {
    return NextResponse.json({ error: 'Note must have at least one field filled out' }, { status: 400 });
  }

  // Clean arrays — remove empty strings
  const cleanArray = (arr: string[] | undefined) =>
    (arr || []).map((s: string) => s.trim()).filter(Boolean);

  const noteData = {
    restaurant_id: profile.restaurant_id,
    created_by: user.id,
    shift_date: targetDate,
    message: message?.trim() || null,
    specials: cleanArray(specials),
    eighty_sixed: cleanArray(eightySixed),
    focus_items: cleanArray(focusItems),
    is_active: true,
  };

  // Upsert: if a note already exists for this restaurant+date, update it
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
