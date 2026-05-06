import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { todayInCentralTime, dateInCentralTime } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Local row shape for the filter callback (Supabase infers a slightly different
// type for the joined `restaurants(name)` field that we don't need at runtime).

/**
 * GET /api/holidays
 * Returns upcoming holidays for the next 90 days that apply to the current
 * user's restaurant (their primary + multi-location assignments + company-wide).
 *
 * Optional query: ?all=true → returns ALL holidays (admin editor view).
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const showAll = req.nextUrl.searchParams.get('all') === 'true';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // "All holidays" view (used by the editor, includes past) requires manager+
  if (showAll && !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Managers and admins only' }, { status: 403 });
  }

  // Multi-location assignments
  const { data: extraLocs } = await supabase
    .from('user_locations')
    .select('restaurant_id')
    .eq('profile_id', user.id);

  const userRestaurantIds = new Set<string>([
    ...(profile.restaurant_id ? [profile.restaurant_id] : []),
    ...((extraLocs || []).map((l) => l.restaurant_id)),
  ]);

  let query = supabase
    .from('holidays')
    .select('id, restaurant_id, start_date, end_date, name, name_es, type, notes, notes_es, restaurants(name)')
    .order('start_date', { ascending: true });

  if (!showAll) {
    // Range overlap: include events whose date range intersects [today, today+90].
    // An event overlaps the window iff its start <= window_end AND its end >= window_start.
    // Use Central Time so events ending today don't disappear in evening UTC.
    const today = todayInCentralTime();
    const end = dateInCentralTime(90);
    query = query.lte('start_date', end).gte('end_date', today);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error('Holidays fetch error:', error.message);
    return NextResponse.json({ holidays: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Filter to ones relevant to this user (admin sees everything; others see
  // company-wide [restaurant_id IS NULL] OR their own restaurants)
  const filtered = (rows || []).filter((r) => {
    if (showAll || profile.role === 'admin') return true;
    if (r.restaurant_id === null) return true;
    return userRestaurantIds.has(r.restaurant_id);
  });

  return NextResponse.json(
    { holidays: filtered },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * POST /api/holidays
 * Admin-only. Body: { restaurant_id (nullable), date, name, name_es, type, notes, notes_es }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers and admins can edit holidays' }, { status: 403 });
  }

  const body = await req.json();
  const { restaurant_id, start_date, end_date, name, name_es, type, notes, notes_es } = body;
  // Backward compat: accept old `date` field for single-day events
  const startDate = start_date || body.date;
  const endDate = end_date || body.date || start_date;

  if (!startDate || !name?.trim() || !type) {
    return NextResponse.json({ error: 'start_date, name, and type are required' }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'end_date must be on or after start_date' }, { status: 400 });
  }
  const VALID_TYPES = ['closed', 'slow', 'normal', 'busy', 'all_hands'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('holidays')
    .insert({
      restaurant_id: restaurant_id || null,
      start_date: startDate,
      end_date: endDate,
      name: name.trim(),
      name_es: name_es?.trim() || null,
      type,
      notes: notes?.trim() || null,
      notes_es: notes_es?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Holiday insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ holiday: data });
}

/**
 * PATCH /api/holidays?id=UUID
 * Admin-only. Body: same fields (any subset).
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers and admins can edit holidays' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.restaurant_id !== undefined) updates.restaurant_id = body.restaurant_id || null;
  if (body.start_date !== undefined) updates.start_date = body.start_date;
  if (body.end_date !== undefined) updates.end_date = body.end_date;
  // Backward compat: if caller still sends `date`, treat as both start/end (single-day)
  if (body.date !== undefined && body.start_date === undefined) updates.start_date = body.date;
  if (body.date !== undefined && body.end_date === undefined) updates.end_date = body.date;
  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.name_es !== undefined) updates.name_es = body.name_es?.trim() || null;
  if (body.type !== undefined) {
    const VALID_TYPES = ['closed', 'slow', 'normal', 'busy', 'all_hands'];
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    updates.type = body.type;
  }
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (body.notes_es !== undefined) updates.notes_es = body.notes_es?.trim() || null;
  updates.updated_at = new Date().toISOString();
  // Validate range if both dates being set or one of them
  if (typeof updates.start_date === 'string' && typeof updates.end_date === 'string'
      && updates.end_date < updates.start_date) {
    return NextResponse.json({ error: 'end_date must be on or after start_date' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('holidays')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });

  return NextResponse.json({ holiday: data });
}

/**
 * DELETE /api/holidays?id=UUID
 * Admin-only. Hard delete.
 */
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'manager', 'assistant_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers and admins can edit holidays' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient.from('holidays').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
