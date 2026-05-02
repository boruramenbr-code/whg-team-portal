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

/**
 * GET /api/pay-rates
 *
 * Manager+ only. Returns the full positions × restaurants matrix:
 *   {
 *     min_wage: { federal: '$7.25', louisiana: '$7.25 (no state minimum)' },
 *     positions: [{ id, slug, name, emoji, department, sort_order }, ...],
 *     restaurants: [{ id, name }, ...],
 *     rates: [{ position_id, restaurant_id, pay_rate, notes, effective_date, id }, ...]
 *   }
 *
 * Front-end pivots `rates` into a position × restaurant grid.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!me || me.status === 'archived' || !MANAGER_ROLES.includes(me.role)) {
    return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
  }

  const adminClient = getAdminClient();

  const [positionsRes, restaurantsRes, ratesRes] = await Promise.all([
    adminClient
      .from('positions')
      .select('id, slug, name, emoji, department, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    adminClient
      .from('restaurants')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    adminClient
      .from('position_pay_rates')
      .select('id, position_id, restaurant_id, pay_rate, notes, effective_date'),
  ]);

  return NextResponse.json({
    min_wage: {
      federal: '$7.25',
      louisiana: '$7.25 (no state minimum — federal applies)',
      tipped_minimum: '$2.13',
    },
    positions: positionsRes.data || [],
    restaurants: restaurantsRes.data || [],
    rates: ratesRes.data || [],
  });
}

/**
 * PATCH /api/pay-rates
 *
 * Admin-only. Upserts a single pay rate for a (position, restaurant) pair.
 *
 * Body: { position_id: uuid, restaurant_id: uuid, pay_rate: string, notes?: string }
 *
 * If a rate already exists for the pair, it's updated. Otherwise inserted.
 */
export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only — owner approval required' }, { status: 403 });
  }

  const body = await req.json();
  const { position_id, restaurant_id, pay_rate, notes } = body || {};
  if (!position_id || !restaurant_id || typeof pay_rate !== 'string' || !pay_rate.trim()) {
    return NextResponse.json({ error: 'position_id, restaurant_id, pay_rate are required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from('position_pay_rates')
    .upsert(
      {
        position_id,
        restaurant_id,
        pay_rate: pay_rate.trim(),
        notes: typeof notes === 'string' ? notes.trim() || null : null,
      },
      { onConflict: 'position_id,restaurant_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rate: data });
}

/**
 * DELETE /api/pay-rates?position_id=...&restaurant_id=...
 *
 * Admin-only. Removes a pay rate (e.g., when a position no longer applies
 * at a particular restaurant).
 */
export async function DELETE(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const url = new URL(req.url);
  const position_id = url.searchParams.get('position_id');
  const restaurant_id = url.searchParams.get('restaurant_id');
  if (!position_id || !restaurant_id) {
    return NextResponse.json({ error: 'position_id + restaurant_id required' }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from('position_pay_rates')
    .delete()
    .eq('position_id', position_id)
    .eq('restaurant_id', restaurant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
