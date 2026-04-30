import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
    .select('id, restaurant_id, date, name, name_es, type, notes, notes_es, restaurants(name)')
    .order('date', { ascending: true });

  if (!showAll) {
    const today = new Date().toISOString().split('T')[0];
    const ninety = new Date();
    ninety.setDate(ninety.getDate() + 90);
    const end = ninety.toISOString().split('T')[0];
    query = query.gte('date', today).lte('date', end);
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

  const { restaurant_id, date, name, name_es, type, notes, notes_es } = await req.json();
  if (!date || !name?.trim() || !type) {
    return NextResponse.json({ error: 'date, name, and type are required' }, { status: 400 });
  }
  if (type !== 'closed' && type !== 'all_hands') {
    return NextResponse.json({ error: 'type must be closed or all_hands' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('holidays')
    .insert({
      restaurant_id: restaurant_id || null,
      date,
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
  if (body.date !== undefined) updates.date = body.date;
  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.name_es !== undefined) updates.name_es = body.name_es?.trim() || null;
  if (body.type !== undefined) {
    if (body.type !== 'closed' && body.type !== 'all_hands') {
      return NextResponse.json({ error: 'type must be closed or all_hands' }, { status: 400 });
    }
    updates.type = body.type;
  }
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (body.notes_es !== undefined) updates.notes_es = body.notes_es?.trim() || null;
  updates.updated_at = new Date().toISOString();

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
